require("dotenv").config();

module.exports = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  tenantId: process.env.TENANT_ID,
  redirectUri: process.env.REDIRECT_URI,
  postLogoutRedirectUri: process.env.POST_LOGOUT_REDIRECT_URI,
  redisConfig: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  CLIENT_REDIRECT_URI: process.env.CLIENT_REDIRECT_URI,
  GRAPH_MEMEBEROF_ENDPOINT: process.env.GRAPH_API_ENDPOINT + "v1.0/me/memberOf",
  GRAPH_INVITE_ENDPOINT: process.env.GRAPH_INVITE_ENDPOINT,
  GRAPH_ME_ENDPOINT: process.env.GRAPH_API_ENDPOINT + "v1.0/me",
};
