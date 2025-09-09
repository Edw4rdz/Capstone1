import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./pdftoppt.css";

export default function PDFToPPT() {
  const [slides, setSlides] = useState(15);

  return (
    <div className="pdftoppt-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <i className="fa fa-sliders"></i>
          <div>
            <h2>PPT Tools</h2>
            <p>Convert & Generate</p>
          </div>
        </div>
        <nav>
          <Link to="/" className="active">
            <i className="fa fa-home"></i> Dashboard
          </Link>
          <Link to="/conversion">
            <i className="fa fa-history"></i> Conversions
          </Link>
          <Link to="/settings">
            <i className="fa fa-cog"></i> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="header-icon">📄</div>
            <div>
              <h1>PDF to PPT Converter</h1>
              <p>Transform your PDF documents into editable PowerPoint presentations</p>
            </div>
          </div>

          {/* Content Two-Column */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="left">
              {/* Upload Card */}
              <div className="card file-upload">
                <h2>Upload Your PDF</h2>
                <div className="upload-area">
                  <div className="upload-icon">⬆</div>
                  <h3>
                    Drop your PDF here, or <span className="browse">browse</span>
                  </h3>
                  <p>Supports PDF files up to 50MB</p>
                  <input type="file" className="file-input" accept=".pdf" />
                </div>
                <div className="requirements">
                  <h4>Upload Requirements</h4>
                  <ul>
                    <li>PDF files only</li>
                    <li>Maximum file size: 50MB</li>
                    <li>Text-based PDFs work best</li>
                    <li>Scanned PDFs may have limited text extraction</li>
                  </ul>
                </div>
              </div>

              {/* Customize Card */}
              <div className="card customize-card">
                <h2>Customize Your Presentation</h2>
                <div className="slider-section">
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
                <div className="style-box">
                  <p className="section-label">Presentation Style</p>
                  <div className="style-card">
                    <strong>Professional</strong>
                    <br />
                    <small>Clean, business-focused design</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right right-sidebar">
              {/* How it Works */}
              <div className="card info-box">
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
              <div className="card info-box">
                <h3>Features</h3>
                <ul className="features">
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
