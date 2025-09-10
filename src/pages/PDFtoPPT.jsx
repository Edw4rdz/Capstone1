import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./pdftoppt.css";
import "font-awesome/css/font-awesome.min.css";

export default function PDFToPPT() {
  const [slides, setSlides] = useState(15);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file");
      setFile(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a PDF first");
      return;
    }

    alert(`Selected PDF: ${file.name}\nSlides: ${slides}`);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    setTimeout(() => {
      navigate("/login");
    }, 1200);
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

          {/* Logout at bottom */}
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
          {/* Header */}
          <div className="ai-header">
            <h1>PDF to PPT Converter</h1>
            <p className="ai-subtitle">
              Transform your PDF documents into editable PowerPoint presentations
            </p>
          </div>

          {/* Two-column Content */}
          <div className="ai-content">
            {/* Left Column */}
            <div className="ai-left">
              {/* File Upload Card */}
              <div className="ai-card ai-card-top">
                <h2>Upload Your PDF</h2>
                <div className="uploadp-area">
                  <div className="upload-icon">⬆</div>
                  <h3>
                    Drop your PDF here, or{" "}
                    <span
                      className="browse"
                      onClick={() => fileInputRef.current.click()}
                    >
                      browse
                    </span>
                  </h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {file && <p className="file-name">📑 {file.name}</p>}
                </div>
                <button onClick={handleUpload} className="upload-btn">
                  Convert to PPT
                </button>
              </div>

              {/* Upload Requirements */}
              <div className="ai-card">
                <h4>Upload Requirements</h4>
                <ul>
                  <li>PDF files only</li>
                  <li>Maximum file size: 50MB</li>
                  <li>Text-based PDFs work best</li>
                  <li>Scanned PDFs may have limited text extraction</li>
                </ul>
              </div>

              {/* Customize Card */}
              <div className="ai-card">
                <h2>Customize Your Presentation</h2>
                <div className="ai-slider-section">
                  <label htmlFor="slides">Number of Slides</label>
                  <input
                    type="range"
                    id="slides"
                    min="5"
                    max="30"
                    value={slides}
                    onChange={(e) => setSlides(e.target.value)}
                  />
                  <span id="slide-count">{slides} slides</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="ai-right">
              {/* How it Works */}
              <div className="ai-info-box">
                <h3>How it works</h3>
                <ol>
                  <li>
                    <strong>Upload PDF</strong>
                    <br />
                    Select the PDF file you want to convert
                  </li>
                  <li>
                    <strong>Customize slides</strong>
                    <br />
                    Choose number of slides and presentation style
                  </li>
                  <li>
                    <strong>Download PPT</strong>
                    <br />
                    Get your editable PowerPoint presentation
                  </li>
                </ol>
              </div>

              {/* Features */}
              <div className="ai-info-box">
                <h3>Features</h3>
                <ul className="ai-features">
                  <li>Text-based PDFs convert best</li>
                  <li>Scanned PDFs may have limited editable content</li>
                  <li>Choose slide count and style</li>
                  <li>Instant download as PPTX</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}