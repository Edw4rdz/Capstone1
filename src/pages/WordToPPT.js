import React from "react";
import "./wordtoppt.css"; // ✅ keep your styles
import "./Dashboard";       // Sidebar + Global
import { Link } from "react-router-dom"; // if you're using routing

export default function WordToPPT() {
  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <i className="fa-solid fa-rocket"></i>
          <div>
            <h2>Slide-It</h2>
            <p>Doc to PPT</p>
          </div>
        </div>
        <nav>
          {/* Use <Link> if React Router is installed, or <a> if static */}
          <Link to="/dashboard" className="active">
            <i className="fa-solid fa-house"></i> Dashboard
          </Link>
          <Link to="/conversion">
            <i className="fa-solid fa-clock-rotate-left"></i> Conversions
          </Link>
          <Link to="/settings">
            <i className="fa-solid fa-gear"></i> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="header mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="header-icon">W</div>
              <div>
                <h1>Convert Word to PPT</h1>
                <p>
                  Transform your Word documents into professional PowerPoint
                  presentations
                </p>
              </div>
            </div>
          </div>

          <div className="content">
            {/* Left Column: Upload + Customization */}
            <div className="left">
              <div className="card upload-card">
                <h2>Upload Your Word Document</h2>
                <div className="upload-dropzone">
                  <div className="icon-container">
                    <i className="fa-solid fa-upload"></i>
                  </div>
                  <h3>
                    Drop your Word document here, or{" "}
                    <button className="browse-btn">browse</button>
                  </h3>
                  <p>Supports .docx and .doc files up to 25MB</p>
                  <input
                    type="file"
                    accept=".docx,.doc"
                    className="file-input"
                  />
                </div>

                <div className="tips-card">
                  <h4>For Best Results</h4>
                  <ul>
                    <li>Use headings (H1, H2, H3) to structure content</li>
                    <li>Each heading can become a new slide</li>
                    <li>Include high-quality images if needed</li>
                    <li>Tables and lists will be preserved</li>
                  </ul>
                </div>

                <div className="card customization-card">
                  <h2>Customize Your Presentation</h2>
                  <div className="grid-2">
                    <div>
                      <label>Number of Slides</label>
                      <input type="range" min="5" max="25" defaultValue="12" />
                      <span>12 slides</span>
                    </div>
                    <div>
                      <label>Presentation Style</label>
                      <select>
                        <option>Professional</option>
                        <option>Academic</option>
                        <option>Business</option>
                        <option>Creative</option>
                      </select>
                    </div>
                  </div>

                  <div className="ai-features">
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
            </div>

            {/* Right Column: Features & Guidelines */}
            <div className="right">
              <div className="card features-card">
                <h3>Smart Conversion</h3>
                <ul>
                  <li>Automatic heading detection</li>
                  <li>Preserves formatting and styles</li>
                  <li>Converts tables and lists</li>
                  <li>Imports images and graphics</li>
                  <li>Creates professional layouts</li>
                </ul>
              </div>

              <div className="card structure-card">
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

              <div className="card formats-card">
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
