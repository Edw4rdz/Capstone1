import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./uploadTemplate.css";
import "./dashboard.css";

export default function UploadTemplate() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(
    JSON.parse(localStorage.getItem("selectedTemplate")) || null
  );

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get("http://localhost:5000/templates/list");
        setTemplates(res.data);
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file to upload.");
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload-template",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(response.data.message || "Template uploaded successfully!");
      setFile(null);
      setPreview(null);
    } catch (error) {
      setMessage("Error uploading template. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => (window.location.href = "/login"), 1200);
  };

  // 🧩 Select template + persist
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    localStorage.setItem("selectedTemplate", JSON.stringify(tpl));
    alert(`✅ Selected "${tpl.name}" — it will be used in EditPreview.`);
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="fa fa-magic logo">
          <div>
            <h2>SLIDE-IT</h2>
            <p>Convert & Generate</p>
          </div>
        </div>
        <nav className="sidebar-links">
          <div className="top-links">
            <Link to="/dashboard"><i className="fa fa-home" /> Dashboard</Link>
            <Link to="/conversion"><i className="fa fa-history" /> Drafts</Link>
            <Link to="/settings"><i className="fa fa-cog" /> Settings</Link>
            <Link to="/uploadTemplate" className="upload-btn active">
              <FaUpload className="icon" /> Upload Template
            </Link>
          </div>
          <div className="bottom-links">
            <div className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt className="icon" /> Logout
              {loggingOut && <div className="spinner-small"></div>}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="upload-template-page">
          {/* Upload Card */}
          <div className="upload-card">
            <h2>Upload Your Template</h2>
            <p className="subtitle">Upload a custom PPTX design file</p>

            <input type="file" accept=".ppt,.pptx" onChange={handleFileChange} />
            {preview && (
              <div className="preview">
                <p>Preview:</p>
                <iframe src={preview} title="Template Preview" width="100%" height="200px" />
              </div>
            )}
            <button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Template"}
            </button>
            {message && <p className="message">{message}</p>}
          </div>

          {/* Templates */}
          <div className="prebuilt-section">
            <h3>Choose a Pre-Built Template</h3>
            {loadingTemplates ? (
              <p>Loading templates...</p>
            ) : (
              <div className="template-grid">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`template-card ${
                      selectedTemplate?.id === tpl.id ? "selected" : ""
                    }`}
                  >
                    <img src={tpl.thumbnail} alt={tpl.name} />
                    <p>{tpl.name}</p>
                    <button onClick={() => handleSelectTemplate(tpl)}>Use</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
