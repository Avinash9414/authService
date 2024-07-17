const msal = require("@azure/msal-node");
const axios = require("axios");
const config = require("../configs/authConfig");
const fetch = require("../utils/fetch");
const { cca, cryptoProvider, msalConfig } = require("../configs/msalConfig");
const {
  getAuthorityMetadata,
  getCloudDiscoveryMetadata,
} = require("../utils/getMetadata");

const generatePkceCodes = async () => {
  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
  const pkceCodes = { verifier, challenge };
  return pkceCodes;
};

const authService = {
  async getAuthCodeUrl(req) {
    try {
      if (
        !msalConfig.auth.cloudDiscoveryMetadata ||
        !msalConfig.auth.authorityMetadata
      ) {
        const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
          getCloudDiscoveryMetadata(msalConfig.auth.authority),
          getAuthorityMetadata(msalConfig.auth.authority),
        ]);

        msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(
          cloudDiscoveryMetadata
        );
        msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
      }
      const pkceCodes = await generatePkceCodes();
      req.session.pkceCodes = pkceCodes;
      const authCodeUrlParams = {
        scopes: [config.scopes] || [],
        redirectUri: config.redirectUri,
        codeChallenge: pkceCodes.challenge,
        codeChallengeMethod: "S256",
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
        scopes: [config.scopes] || [],
        redirectUri: config.redirectUri,
        codeVerifier: req.session.pkceCodes.verifier,
      };
      return await cca.acquireTokenByCode(tokenRequest, req.body);
    } catch (error) {
      throw new Error(`Error acquiring token by code: ${error.message}`);
    }
  },

  async getUserProfile(req) {
    try {
      let authInfo = req.session.authInfo;

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

  async getUserGroupsAndRoles(req) {
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

  async authorize(req) {
    try {
      const { requiredGroups, requiredRoles } = req.body;
      const { groups, roles } = await this.getUserGroupsAndRoles(req);
      const isAuthorized =
        requiredGroups.some((group) => groups.includes(group)) &&
        requiredRoles.some((role) => roles.includes(role));

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
      const requiredGroups = config.REQUIRED_GROUPS_TO_INVITE.split(",");
      const requiredRoles = config.REQUIRED_ROLES_TO_INVITE.split(",");
      console.log(requiredGroups, requiredRoles);
      req.body = { ...req.body, requiredGroups, requiredRoles };
      const response = await this.authorize(req);
      if (!response) {
        throw new Error("User is not authorized");
      }
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
        // groupId,
      } = req.body;
      const data = {
        invitedUserEmailAddress,
        inviteRedirectUrl,
        sendInvitationMessage,
      };
      const groupId = "7f57a86c-977a-4bbd-8d1c-b98996ef9443";

      // Send invitation to the guest user
      const inviteResponse = await axios.post(
        config.GRAPH_INVITE_ENDPOINT,
        data,
        options
      );
      const invitedUserId = inviteResponse.data.invitedUser.id; // Get the invited user ID
      // Prepare the data for adding the user to a group
      const addToGroupData = {
        "@odata.id": `https://graph.microsoft.com/v1.0/users/${invitedUserId}`,
      };

      // Add the guest user to the specified group
      const groupEndpoint = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/$ref`;
      await axios.post(groupEndpoint, addToGroupData, options);

      return { data: inviteResponse.data };
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
