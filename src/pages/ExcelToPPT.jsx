import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for logout
import { FaSignOutAlt, FaUpload } from "react-icons/fa"; // Added icons for logout and upload
import "./exceltoppt.css"; // keep your CSS
import "./Dashboard"; // Sidebar + Global

export default function ExcelToPPT() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // For logout navigation
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle file selection
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (
      selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selectedFile.type === "application/vnd.ms-excel"
    ) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      alert("Please upload a valid Excel file (.xlsx or .xls)");
      setFile(null);
      setFileName("");
    }
  };

  // Handle drag-drop upload
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setFileName(droppedFile.name);
  };

  const handleDragOver = (e) => e.preventDefault();

  // Download simulated PPT
  const handleDownload = () => {
    if (!file) {
      alert("Upload an Excel file first!");
      return;
    }
    const blob = new Blob(
      [`This is a simulated PPTX converted from ${fileName}`],
      { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.(xlsx|xls)$/i, ".pptx");
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="dashboard">
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
      <main className="main">
        <div className="container">
          {/* Header */}
          <header className="header">
            <div className="header-icon">XLSX</div>
            <div>
              <h1>Convert Excel to PPT</h1>
              <p>
                Transform your Excel data and charts into professional
                PowerPoint presentations
              </p>
            </div>
          </header>

          <div className="content-grid">
            {/* Main Upload and Conversion Area */}
            <div className="main-cards">
              <section className="card">
                <h2>Upload Your Excel File</h2>
                <div
                  className="file-upload"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="upload-area">
                    <i className="fa-solid fa-upload upload-icon"></i>
                    {file ? (
                      <p>
                        <strong>{fileName}</strong> loaded
                      </p>
                    ) : (
                      <p>
                        Drop your Excel file here or{" "}
                        <span className="browse">browse</span>
                      </p>
                    )}
                    <small>Supports .xlsx and .xls up to 50MB</small>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Excel Features */}
                <div className="features-grid">
                  <div className="feature-card charts">
                    <i className="fa-solid fa-chart-column"></i>
                    <h4>Charts &amp; Graphs</h4>
                    <p>Automatically converts Excel charts to PowerPoint</p>
                  </div>
                  <div className="feature-card tables">
                    <i className="fa-solid fa-table"></i>
                    <h4>Data Tables</h4>
                    <p>Preserves table formatting and structure</p>
                  </div>
                </div>

                {/* Download button */}
                {file && (
                  <button className="download-btn" onClick={handleDownload}>
                    Download as PPTX
                  </button>
                )}
              </section>

              {/* Customize Presentation */}
              <section className="card">
                <h2>Customize Your Presentation</h2>
                <div className="checkbox-grid">
                  <label>
                    <input type="checkbox" defaultChecked /> Include Charts
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Preserve Formatting
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Summary Slide
                  </label>
                  <label>
                    <input type="checkbox" /> One Slide Per Sheet
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Include Data Tables
                  </label>
                </div>

                <div className="customize-grid">
                  <div className="input-group">
                    <label>Number of Slides</label>
                    <input type="range" min="3" max="15" defaultValue="8" />
                    <span>8 slides</span>
                  </div>

                  <div className="input-group">
                    <label>Presentation Style</label>
                    <select>
                      <option>Professional</option>
                      <option>Modern</option>
                      <option>Colorful</option>
                      <option>Minimal</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Slide Layout</label>
                    <select>
                      <option>Auto Layout</option>
                      <option>Dashboard Style</option>
                      <option>Individual Charts</option>
                      <option>Data Focused</option>
                    </select>
                  </div>
                </div>

                <button className="convert-btn">Convert to PowerPoint</button>
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="right-sidebar">
              <section className="card">
                <h3>Processing Features</h3>
                <ul>
                  <li>Converts all chart types</li>
                  <li>Preserves table formatting</li>
                  <li>Smart slide layouts</li>
                  <li>Professional design themes</li>
                </ul>
              </section>

              <section className="card">
                <h3>Supported Charts</h3>
                <ul>
                  <li>Bar &amp; Column Charts</li>
                  <li>Line &amp; Area Charts</li>
                  <li>Pie &amp; Doughnut Charts</li>
                  <li>Scatter Plots</li>
                  <li>Combo Charts</li>
                  <li>Pivot Charts</li>
                </ul>
              </section>

              <section className="card">
                <h3>File Requirements</h3>
                <ul>
                  <li>Formats: .xlsx, .xls</li>
                  <li>Max Size: 50MB</li>
                  <li>Well-structured headers recommended</li>
                </ul>
              </section>

              <section className="card">
                <h3>Processing Time</h3>
                <p className="processing-time">1-2 minutes</p>
                <p className="small-text">
                  For typical Excel files with charts
                </p>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}