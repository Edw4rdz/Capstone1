import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for logout
import { FaSignOutAlt, FaUpload } from "react-icons/fa"; // Added icons for logout and upload
import "./texttoppt.css"; // keep your existing CSS
import "./Dashboard"; // Sidebar + Global

export default function TextToPPT() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [slides, setSlides] = useState(8);
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // For logout navigation
  const [loggingOut, setLoggingOut] = useState(false);

  // File upload handlers
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setFileContent(e.target.result);
    reader.readAsText(file);
    setFileName(file.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setFileContent(e.target.result);
    reader.readAsText(file);
    setFileName(file.name);
  };

  const handleDragOver = (e) => e.preventDefault();

  // ✅ Download text file
  const handleDownload = () => {
    if (!fileContent) {
      alert("No content to download!");
      return;
    }
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "converted.txt";
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
          {/* ✅ Header */}
          <header className="header">
            <div className="header-icon">TXT</div>
            <div>
              <h1>Convert Text to PPT</h1>
              <p>Transform your plain text into engaging PowerPoint presentations</p>
            </div>
          </header>

          <div className="content-grid">
            <div className="main-cards">
              {/* File Upload Card */}
              <section className="card">
                <h2>Upload Your Text File</h2>

                <div
                  className="file-upload"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="uploadt-area">
                    <div className="uploadt-icon">⬆</div>
                    {fileContent ? (
                      <p>
                        <strong>{fileName}</strong> loaded
                      </p>
                    ) : 
                      <h3>
                        Drop your .txt file here or{" "}
                        <button className="browse">browse</button>
                      </h3>
                    }
                    <p>Supports .txt files up to 25MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="info-row">
                  <span>{fileContent.length} characters</span>
                  <span>Estimated slides: {slides}</span>
                </div>

                {/* ✅ Download button */}
                {fileContent && (
                  <button className="download-btn" onClick={handleDownload}>
                    Download TXT
                  </button>
                )}
              </section>

              {/* Customize Presentation Card */}
              <section className="card customize-card">
                <h2>Customize Your Presentation</h2>

                <div className="checkbox-grid">
                  <label>
                    <input type="checkbox" defaultChecked /> Add Title Slide
                  </label>
                  <label>
                    <input type="checkbox" /> Add Summary Slide
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Include Transitions
                  </label>
                </div>

                <div className="customize-grid">
                  <div className="input-group">
                    <label>Number of Slides</label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={slides}
                      onChange={(e) => setSlides(e.target.value)}
                    />
                    <span>{slides} slides</span>
                  </div>
                  <div className="input-group">
                    <label>Presentation Style</label>
                    <select>
                      <option>Professional</option>
                      <option>Creative</option>
                      <option>Minimal</option>
                      <option>Modern</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Content Split Method</label>
                    <select>
                      <option>By Paragraphs</option>
                      <option>By Sentences</option>
                      <option>By Topics</option>
                      <option>Manual Split</option>
                    </select>
                  </div>
                </div>

                <button className="convert-btn">Convert to Presentation</button>
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="right-sidebar">
              <section className="card">
                <h3>AI-Powered Features</h3>
                <ul>
                  <li>Smart content structuring</li>
                  <li>Automatic bullet point creation</li>
                  <li>Key phrase highlighting</li>
                  <li>Professional slide layouts</li>
                  <li>Topic-based slide separation</li>
                </ul>
              </section>

              <section className="card">
                <h3>Content Guidelines</h3>
                <ul>
                  <li>
                    <strong>Structure:</strong> Use clear paragraphs with distinct topics
                  </li>
                  <li>
                    <strong>Length:</strong> 500-5000 words work best
                  </li>
                  <li>
                    <strong>Formatting:</strong> Separate topics with blank lines
                  </li>
                  <li>
                    <strong>Content Type:</strong> Reports, articles, notes, research
                  </li>
                </ul>
              </section>

              <section className="card">
                <h3>Perfect For</h3>
                <ul>
                  <li>Research papers &amp; reports</li>
                  <li>Meeting notes &amp; summaries</li>
                  <li>Article content</li>
                  <li>Educational content</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}