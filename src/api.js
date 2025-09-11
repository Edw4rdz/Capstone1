import axios from "axios";

const API_BASE = "http://localhost:5000";

// --- Auth APIs ---
export const registerUser = (data) =>
  axios.post(`${API_BASE}/register`, data);

export const loginUser = (data) =>
  axios.post(`${API_BASE}/login`, data);

// --- Conversion APIs ---
export const convertPDF = (data) =>
  axios.post(`${API_BASE}/convert-pdf`, data);

export const convertWord = (data) =>
  axios.post(`${API_BASE}/convert-word`, data);
