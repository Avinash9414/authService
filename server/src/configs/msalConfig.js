const msal = require("@azure/msal-node");
const redisCache = require("../utils/redisCache");
const config = require("../configs/authConfig");

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

module.exports = { cca, cryptoProvider, msalConfig };
