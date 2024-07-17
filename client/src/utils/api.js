// utils/api/axiosInstance.js
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const baseUrl = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  withCredentials: true, // Send cookies when making requests
});

export default baseUrl;
