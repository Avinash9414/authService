const msal = require("@azure/msal-node");

const { getAuthCodeUrl } = require("../controllers/authController");
const { cca, authService } = require("../services/authService");

const acquireTokenSilent = async (req, res, next) => {
  try {
    const account = req.session.authInfo.account;
    const authInfo = await cca.acquireTokenSilent({ account: account });
    req.session.authInfo = authInfo;
    next();
  } catch (error) {
    if (error instanceof msal.InteractionRequiredAuthError) {
      const authCodeUrl = await authService.getAuthCodeUrl(req);
      res.status(400).json({ redirecturl: authCodeUrl, login: "required" });
    }
    next(error);
  }
};
module.exports = acquireTokenSilent;
