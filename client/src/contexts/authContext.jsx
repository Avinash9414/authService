// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import baseUrl from "../utils/api";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invited, setInvited] = useState(null);
  useEffect(() => {
    console.log("running use Effect");
    // Check if user is already logged in (e.g., from a previous session)
    const checkLoggedIn = async () => {
      try {
        const res = await baseUrl.get("/users/profile");
        // console.log("Checking  : ", res);
        setUser(res.data.profile);
      } catch (error) {
        console.log(error.response);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const login = async () => {
    try {
      const response = await baseUrl.get("/auth/signin");
      window.location.href = response.data.redirecturl;
      // console.log(response.data.redirecturl);
      // setUser(response.data.user);s
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const res = await baseUrl.get("/auth/signout");
      window.location.href = res.data.logouturl;
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
      throw error;
    }
  };

  const inviteUser = async (payload) => {
    try {
      const res = await baseUrl.post("/users/invite", payload);
      setInvited("res : ", res.data);
      console.log(res.data);
      alert("User has been invited");
    } catch (error) {
      console.error("Invite failed", error);
      throw error;
    }
  };

  return <AuthContext.Provider value={{ user, login, logout, loading, inviteUser, invited }}>{children}</AuthContext.Provider>;
};

export { AuthProvider, AuthContext };
