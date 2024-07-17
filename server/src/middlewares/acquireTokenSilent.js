const msal = require("@azure/msal-node");

const { getAuthCodeUrl } = require("../controllers/authController");
const { cca } = require("../services/authService");

const acquireTokenSilent = async (req, res, next) => {
  try {
    const account = req.session.authInfo.account;
    let authInfo = req.session.authInfo;
    authInfo = await cca.acquireTokenSilent({ account: account });
    req.session.authInfo = authInfo;
    next();
  } catch (error) {
    if (error instanceof msal.InteractionRequiredAuthError) {
      return getAuthCodeUrl(req, res);
    }
    next(error);
  }
};
module.exports = acquireTokenSilent;
