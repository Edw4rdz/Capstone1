import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for logout
import { FaSignOutAlt, FaUpload } from "react-icons/fa"; // Added icons for logout and upload
import "./wordtoppt.css";
import "font-awesome/css/font-awesome.min.css"; // Ensure Font Awesome is imported

export default function WordToPPT() {
  const navigate = useNavigate(); // For logout navigation
  const [loggingOut, setLoggingOut] = useState(false);
  const [file, setFile] = useState(null); // Added state for file

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

  // Placeholder handler for the convert button
  const handleUpload = () => {
    if (!file) {
      alert("Please select a Word document first");
      return;
    }
    alert(`Selected Word document: ${file.name}`);
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
          <div className="ai-header">
            <h1>Convert Word to PPT</h1>
            <p className="ai-subtitle">
              Transform your Word documents into professional PowerPoint
              presentations
            </p>
          </div>

          <div className="ai-content">
            {/* Left Column: Upload + Customization */}
            <div className="ai-left">
              <div className="ai-card ai-card-top">
                <h2>Upload Your Word Document</h2>
                <div className="uploadw-area">
                  <div className="uploadw-icon">⬆</div>
                  <h3>
                    Drop your Word document here, or{" "}
                    <button className="browse">browse</button>
                  </h3>
                  <p>Supports .docx and .doc files up to 25MB</p>
                  <input
                    type="file"
                    accept=".docx,.doc"
                    className="file-input"
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];
                      if (selectedFile && (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || selectedFile.type === "application/msword")) {
                        setFile(selectedFile);
                      } else {
                        alert("Please upload a valid Word file (.docx or .doc)");
                        setFile(null);
                      }
                    }}
                  />
                </div>
                <button onClick={handleUpload} className="convertw-btn">
                  Convert to PPT
                </button>
              </div>

              <div className="ai-card">
                <h4>For Best Results</h4>
                <ul>
                  <li>Use headings (H1, H2, H3) to structure content</li>
                  <li>Each heading can become a new slide</li>
                  <li>Include high-quality images if needed</li>
                  <li>Tables and lists will be preserved</li>
                </ul>
              </div>

              <div className="ai-card">
                <h2>Customize Your Presentation</h2>
                <div className="ai-slider-section">
                  <label>Number of Slides</label>
                  <input type="range" min="5" max="25" defaultValue="12" />
                  <span>12 slides</span>
                </div>
                <div className="ai-style-box">
                  <label>Presentation Style</label>
                  <select>
                    <option>Professional</option>
                    <option>Academic</option>
                    <option>Business</option>
                    <option>Creative</option>
                  </select>
                </div>

                <div className="ai-info-box">
                  <h3>Smart Document Analysis</h3>
                  <ul>
                    <li>Smart Heading Detection</li>
                    <li>Auto Slide Transitions</li>
                    <li>Content Optimization</li>
                    <li>Style Preservation+</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Features & Guidelines */}
            <div className="ai-right">
              <div className="ai-info-box">
                <h3>Smart Conversion</h3>
                <ul>
                  <li>Automatic heading detection</li>
                  <li>Preserves formatting and styles</li>
                  <li>Converts tables and lists</li>
                  <li>Imports images and graphics</li>
                  <li>Creates professional layouts</li>
                </ul>
              </div>

              <div className="ai-info-box">
                <h3>Document Structure Tips</h3>
                <div>
                  <h4>Headings</h4>
                  <p>Use H1 for main topics, H2 for subtopics</p>
                </div>
                <div>
                  <h4>Content</h4>
                  <p>Keep paragraphs concise for better slides</p>
                </div>
                <div>
                  <h4>Images</h4>
                  <p>Use high-resolution images (300 DPI+)</p>
                </div>
                <div>
                  <h4>Tables</h4>
                  <p>Simple tables convert better</p>
                </div>
              </div>

              <div className="ai-info-box">
                <h3>Supported Formats</h3>
                <ul>
                  <li>Microsoft Word (.docx)</li>
                  <li>Word 97-2003 (.doc)</li>
                  <li>Up to 25MB file size</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}