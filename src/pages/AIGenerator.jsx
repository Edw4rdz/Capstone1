import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./ai-generator.css";
import "font-awesome/css/font-awesome.min.css";

export default function AIGenerator() {
  const [slides, setSlides] = useState(10);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

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
            <h1>AI PowerPoint Generator</h1>
            <p className="ai-subtitle">
              Create professional presentations from any topic using AI
            </p>
          </div>

          {/* Two-column Content */}
          <div className="ai-content">
            {/* Left Column */}
            <div className="ai-left">
              {/* Presentation Topic */}
              <div className="ai-card ai-card-top">
                <h2>What's your presentation about?</h2>
                <label className="ai-section-label">Presentation Topic</label>
                <textarea
                  placeholder="Describe your presentation topic in detail. Include key points, target audience, and any specific requirements..."
                ></textarea>
                <p className="ai-section-label">Quick examples:</p>
                <div className="ai-tags">
                  <span className="ai-tag">Climate Change Solutions</span>
                  <span className="ai-tag">Digital Marketing Strategy 2024</span>
                  <span className="ai-tag">Introduction to Machine Learning</span>
                  <span className="ai-tag">Sustainable Business Practices</span>
                  <span className="ai-tag">Remote Work Best Practices</span>
                </div>
              </div>

              {/* Customize */}
              <div className="ai-card">
                <h2>Customize Your Presentation</h2>
                <div className="ai-slider-section">
                  <label htmlFor="slides">Number of Slides</label>
                  <input
                    type="range"
                    id="slides"
                    min="5"
                    max="20"
                    value={slides}
                    onChange={(e) => setSlides(e.target.value)}
                  />
                  <span id="slide-count">{slides} slides</span>
                </div>
                <div className="ai-style-box">
                  <p className="ai-section-label">Presentation Style</p>
                  <div className="ai-style-card">
                    <strong>Professional</strong>
                    <br />
                    <small>Clean, business-focused design</small>
                  </div>
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
                    <strong>Describe your topic</strong>
                    <br />
                    Tell us what your presentation should cover
                  </li>
                  <li>
                    <strong>AI creates structure</strong>
                    <br />
                    Our AI analyzes and creates an outline
                  </li>
                  <li>
                    <strong>Generate slides</strong>
                    <br />
                    Professional slides are created automatically
                  </li>
                </ol>
              </div>

              {/* Features */}
              <div className="ai-info-box">
                <h3>Features</h3>
                <ul className="ai-features">
                  <li>AI-powered content generation</li>
                  <li>Professional design templates</li>
                  <li>Customizable slide count</li>
                  <li>Multiple presentation styles</li>
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