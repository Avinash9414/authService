const axios = require("axios");

async function getCloudDiscoveryMetadata(authority) {
  const endpoint =
    "https://login.microsoftonline.com/common/discovery/instance";

  try {
    const response = await axios.get(endpoint, {
      params: {
        "api-version": "1.1",
        authorization_endpoint: `${authority}/oauth2/v2.0/authorize`,
      },
    });

    return await response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves oidc metadata from the openid endpoint
 * @returns
 */
async function getAuthorityMetadata(authority) {
  const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

  try {
    const response = await axios.get(endpoint);
    return await response.data;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getAuthorityMetadata, getCloudDiscoveryMetadata };
