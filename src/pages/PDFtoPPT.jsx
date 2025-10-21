import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import { convertPDF } from "../api"; // axios -> backend
import "./pdftoppt.css";
import "font-awesome/css/font-awesome.min.css";

export default function PDFToPPT() {
  const [slides, setSlides] = useState(15);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [convertedSlides, setConvertedSlides] = useState(null);
const [topic, setTopic] = useState("");


  // 🧩 Select File
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file");
      setFile(null);
    }
  };

  // 🚀 Upload + Convert PDF
// 🚀 Upload + Convert PDF
const handleUpload = async () => {
  if (!file) return alert("Please select a PDF first");
  if (file.size > 25 * 1024 * 1024) return alert("File too large (max 25MB)");

  setIsLoading(true);

  try {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64PDF = reader.result.split(",")[1];

      // 🔗 Call backend API
      const response = await convertPDF({ base64PDF, slides });

      if (response.data.success && response.data.slides) {
        // ✅ Store slides locally instead of redirect
        setConvertedSlides(response.data.slides);
        setTopic(file.name.replace(".pdf", ""));
        alert("Conversion successful! You can now preview or edit it.");
      } else {
        alert("Conversion failed. Please try again.");
      }
    };
  } catch (err) {
    console.error(err);
    alert("Conversion failed. See console for details.");
  } finally {
    setIsLoading(false);
  }
};


  // 🔒 Logout
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="ai-dashboard">
      {/* Sidebar */}
      <aside className="ai-sidebar">
        <div className="ai-logo">
          <i className="fa fa-magic"></i>
          <div className="logo-text">
            <h2>SLIDE-IT</h2>
            <p>Convert & Generate</p>
          </div>
        </div>

        <nav className="ai-nav">
          <div className="top-links">
            <Link to="/dashboard" className="active">
              <i className="fa fa-home"></i> Dashboard
            </Link>
            <Link to="/conversion">
              <i className="fa fa-history"></i> Conversions
            </Link>
            <Link to="/settings">
              <i className="fa fa-cog"></i> Settings
            </Link>
            <Link to="/uploadTemplate" className="upload-btn">
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

      {/* Main Content */}
      <main className="ai-main">
        <div className="ai-container">
          <header className="headerp">
            <div className="headerp-icon">📄</div>
            <div>
              <h1>PDF to PowerPoint Converter</h1>
              <p>Transform your PDFs into editable and AI-enhanced slides</p>
            </div>
          </header>

          <div className="ai-content">
            {/* Left Column */}
            <div className="ai-left">
              {/* Upload Card */}
              <div className="ai-card ai-card-top">
                <h2>Upload Your PDF</h2>
                <div className="uploadp-area">
                  <div className="uploadp-icon">⬆</div>
                  <h3>
                    Drop your PDF here, or{" "}
                    <span
                      className="browsep"
                      onClick={() => fileInputRef.current.click()}
                    >
                      browse
                    </span>
                  </h3>
                  <p>Supports up to 25MB PDF files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {file && <p className="file-name">📑 {file.name}</p>}
                </div>

                <button
  onClick={handleUpload}
  className="uploadp-btn"
  disabled={isLoading}
>
  {isLoading ? "Converting..." : "Convert to PPT"}
</button>

{/* Show after successful conversion */}
{convertedSlides && (
  <div className="after-convert-actions">
    <button
      className="edit-preview-btn"
      onClick={() =>
        navigate("/edit-preview", { state: { slides: convertedSlides, topic } })
      }
    >
      📝 Edit & Preview Slides
    </button>
  </div>
)}


              </div>

              {/* Customization */}
              <div className="ai-card">
                <h2>Customize Output</h2>
                <div className="ai-slider-section">
                  <label htmlFor="slides">Number of Slides</label>
                  <input
                    type="range"
                    id="slides"
                    min="5"
                    max="30"
                    value={slides}
                    onChange={(e) => setSlides(parseInt(e.target.value))}
                  />
                  <span id="slide-count">{slides} slides</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="ai-right">
              <div className="ai-info-box">
                <h3>How it Works</h3>
                <ol>
                  <li>Upload your PDF document.</li>
                  <li>Choose the number of slides.</li>
                  <li>AI automatically creates your presentation.</li>
                  <li>Preview and edit it interactively before download.</li>
                </ol>
              </div>

              <div className="ai-info-box">
                <h3>Tips</h3>
                <ul>
                  <li>Text-based PDFs produce better slides.</li>
                  <li>Scanned images may have limited text extraction.</li>
                  <li>Try 10–20 slides for balanced detail.</li>
                  <li>Edit in the next page before downloading.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
