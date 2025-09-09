import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./texttoppt.css"; // keep your existing CSS
import "./Dashboard"; // Sidebar + Global

export default function TextToPPT() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [slides, setSlides] = useState(8);

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

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <i className="fa-solid fa-sliders"></i>
          <div>
            <h2>PPT Tools</h2>
            <p>Convert &amp; Generate</p>
          </div>
        </div>
        <nav>
          <Link to="/" className="active">
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
          {/* ✅ Fixed header: no red plus */}
          <header className="header">
            <div className="header-icon">TXT</div>
            <div>
              <h1>Convert Text to PPT</h1>
              <p>
                Transform your plain text into engaging PowerPoint presentations
              </p>
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
                >
                  <div className="upload-area">
                    <div className="upload-icon">⬆</div>
                    {fileContent ? (
                      <p>
                        <strong>{fileName}</strong> loaded
                      </p>
                    ) : (
                      <p>
                        Drop your .txt file here or{" "}
                        <span className="browse">browse</span>
                      </p>
                    )}
                    <small>Supports .txt files only</small>
                  </div>
                </div>

                <div className="info-row">
                  <span>{fileContent.length} characters</span>
                  <span>Estimated slides: {slides}</span>
                </div>
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
                    <strong>Structure:</strong> Use clear paragraphs with distinct
                    topics
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
