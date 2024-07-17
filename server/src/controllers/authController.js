const { CLIENT_REDIRECT_URI } = require("../configs/authConfig");
const { authService } = require("../services/authService");

const authController = {
  getAuthCodeUrl: async (req, res) => {
    try {
      const authCodeUrl = await authService.getAuthCodeUrl(req);
      res.status(200).json({ redirecturl: authCodeUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  acquireTokenByCode: async (req, res) => {
    try {
      const response = await authService.acquireTokenByCode(req);
      req.session.authInfo = response;
      res.redirect(CLIENT_REDIRECT_URI);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUserProfile: async (req, res) => {
    try {
      const response = await authService.getUserProfile(req);
      res.json({ profile: response });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  authorize: () => {
    return async (req, res) => {
      try {
        const response = await authService.authorize(req);
        if (response) {
          res.status(200).json({ message: "Authorized" });
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      } catch (error) {
        res.status(403).json({ message: error.message });
      }
    };
  },
  invite: async (req, res) => {
    try {
      const data = await authService.invite(req);
      res.status(200).json({ message: "Invitation sent", data: data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const logoutUri = await authService.logout(req);
      res.status(200).json({ logouturl: logoutUri });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = authController;
