const msal = require("@azure/msal-node");
const axios = require("axios");
const config = require("../configs/authConfig");
const redisCache = require("../utils/redisCache");
const fetch = require("../utils/fetch");

const msalConfig = {
  auth: {
    clientId: config.clientId,
    authority: `https://login.microsoftonline.com/${config.tenantId}`,
    clientSecret: config.clientSecret,
  },
  cache: {
    cachePlugin: {
      beforeCacheAccess: async (cacheContext) => {
        const cache = await redisCache.get("msal-cache");
        cacheContext.tokenCache.deserialize(cache);
      },
      afterCacheAccess: async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
          await redisCache.set(
            "msal-cache",
            cacheContext.tokenCache.serialize()
          );
        }
      },
    },
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

const cryptoProvider = new msal.CryptoProvider();

const generatePkceCodes = async () => {
  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
  return { verifier, challenge };
};

const authService = {
  async getAuthCodeUrl(req) {
    try {
      // const pkceCodes = await generatePkceCodes();
      // req.session.pkceCodes = pkceCodes;
      const authCodeUrlParams = {
        scopes: ["user.read"],
        redirectUri: config.redirectUri,
        // codeChallenge: pkceCodes.challenge,
        // codeChallengeMethod: "S256",
        responseMode: msal.ResponseMode.FORM_POST,
      };
      return await cca.getAuthCodeUrl(authCodeUrlParams);
    } catch (error) {
      throw new Error(`Error generating auth code URL: ${error.message}`);
    }
  },

  async acquireTokenByCode(req) {
    try {
      const tokenRequest = {
        code: req.body.code,
        scopes: ["user.read"],
        redirectUri: config.redirectUri,
        // codeVerifier: req.session.pkceCodes.verifier,
      };
      return await cca.acquireTokenByCode(tokenRequest, req.body);
    } catch (error) {
      throw new Error(`Error acquiring token by code: ${error.message}`);
    }
  },
  async getUserGroupsAndRoles(authInfo) {
    try {
      const graphMemberOfResponse = await fetch(
        config.GRAPH_MEMEBEROF_ENDPOINT,
        req.session.authInfo.accessToken
      );
      const groups = [];
      const roles = [];

      graphMemberOfResponse.value.forEach((member) => {
        if (member["@odata.type"] === "#microsoft.graph.group") {
          groups.push(member.displayName);
        } else if (member["@odata.type"] === "#microsoft.graph.directoryRole") {
          roles.push(member.displayName);
        }
      });
      return { groups, roles };
    } catch (error) {
      throw new Error(`Error getting user groups and roles: ${error.message}`);
    }
  },

  async getUserProfile(req) {
    try {
      // const account = req.session.authInfo.account;
      let authInfo = req.session.authInfo;

      // try {
      //   authInfo = await cca.acquireTokenSilent({ account: account });
      //   req.session.authInfo = authInfo;
      // } catch (error) {
      //   throw new Error(`Error acquiring token silently: ${error.message}`);
      // }

      const graphMeResponse = await fetch(
        config.GRAPH_ME_ENDPOINT,
        authInfo.accessToken
      );
      const graphMemberOfResponse = await fetch(
        config.GRAPH_MEMEBEROF_ENDPOINT,
        authInfo.accessToken
      );

      const groups = [];
      const roles = [];

      graphMemberOfResponse.value.forEach((member) => {
        if (member["@odata.type"] === "#microsoft.graph.group") {
          groups.push(member.displayName);
        } else if (member["@odata.type"] === "#microsoft.graph.directoryRole") {
          roles.push(member.displayName);
        }
      });

      const userDetails = {
        id: graphMeResponse.id,
        mail: graphMeResponse.mail,
        upn: graphMeResponse.userPrincipalName,
        displayName: graphMeResponse.displayName,
        groups: groups,
        roles: roles,
      };
      return userDetails;
    } catch (error) {
      throw new Error(`Error getting user profile: ${error.message}`);
    }
  },

  async authorize(req) {
    try {
      const { requiredGroups, requiredRoles } = req.body;
      const authInfo = req.session.authInfo;
      const { groups, roles } = await this.getUserGroupsAndRoles(authInfo);

      const isAuthorized =
        requiredGroups.every((group) => groups.includes(group)) &&
        requiredRoles.every((role) => roles.includes(role));

      if (!isAuthorized) {
        throw new Error("User is not authorized");
      }
      return isAuthorized;
    } catch (error) {
      throw new Error(`Authorization error: ${error.message}`);
    }
  },

  async invite(req) {
    try {
      const options = {
        headers: {
          Authorization: `Bearer ${req.session.authInfo.accessToken}`,
          "Content-type": "application/json",
        },
      };
      const {
        invitedUserEmailAddress,
        inviteRedirectUrl,
        sendInvitationMessage,
      } = req.body;
      const data = {
        inviteRedirectUrl,
        invitedUserEmailAddress,
        sendInvitationMessage,
      };
      const response = await axios.post(
        config.GRAPH_INVITE_ENDPOINT,
        data,
        options
      );
      console.log(response.data);
      return { data: response.data };
    } catch (err) {
      throw new Error(`Error inviting user: ${err.message}`);
    }
  },

  async logout(req) {
    try {
      const accessToken = req.session.authInfo.accessToken;
      const url = `https://graph.microsoft.com/v1.0/me/revokeSignInSessions`;
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const account = req.session.authInfo.account;
      await cca.getTokenCache().removeAccount(account);

      let logoutUri = `${msalConfig.auth.authority}/oauth2/v2.0/`;

      if (config.postLogoutRedirectUri) {
        logoutUri += `logout?post_logout_redirect_uri=${config.postLogoutRedirectUri}`;
      }
      req.session.destroy((err) => {
        if (err) {
          throw new Error(`Error during logout: ${err.message}`);
        }
      });
      return logoutUri;
    } catch (error) {
      throw new Error(`Error logging out: ${error.message}`);
    }
  },
};

module.exports = { authService, cca };
