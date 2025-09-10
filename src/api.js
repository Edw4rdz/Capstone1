import axios from "axios";

// Base URL of your backend
const API_BASE = "http://localhost:5000";

// Convert PDF to slides via backend
export const convertPDF = ({ base64PDF, slides }) => {
  return axios.post(`${API_BASE}/convert-pdf`, { base64PDF, slides });
};

// User authentication (if needed)
export const loginUser = (credentials) => {
  return axios.post(`${API_BASE}/login`, credentials);
};

export const registerUser = (userData) => {
  return axios.post(`${API_BASE}/register`, userData);
};
