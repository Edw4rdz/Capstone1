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

// ------------------ AI Generator ------------------ //
export const generateSlides = async ({ topic, slides }) => {
  return await axios.post(`${API_BASE}/ai-generator`, { topic, slides });
};

export const downloadPPTX = async (slides) => {
  const response = await axios.post(
    `${API_BASE}/download-pptx`,
    { slides },
    { responseType: "blob" }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "presentation.pptx");
  document.body.appendChild(link);
  link.click();
  link.remove();
};
