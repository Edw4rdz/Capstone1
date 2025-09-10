import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload, FaMagic } from "react-icons/fa";
import "./ai-generator.css";
import "font-awesome/css/font-awesome.min.css";

export default function AIGenerator() {
  const [slides, setSlides] = useState(10);
  const [topic, setTopic] = useState("");   // ✅ store user topic
  const [loading, setLoading] = useState(false);
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

  // ✅ Trigger when user clicks "Generate Presentation"
  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first!");
      return;
    }

    setLoading(true);
    try {
      // Example API call (replace with your backend endpoint)
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slides }),
      });

      const data = await response.json();
      console.log("🎉 Generated Presentation:", data);

      // For now just alert success
      alert("✅ Presentation generated successfully!");
    } catch (error) {
      console.error("❌ Error generating presentation:", error);
      alert("Something went wrong while generating your presentation.");
    } finally {
      setLoading(false);
    }
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
                  placeholder="Describe your presentation topic in detail..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)} // ✅ bind state
                ></textarea>

                {/* Generate Button */}
                <button
                  className="generateAI-btn"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || loading}
                >
                  {loading ? "Generating..." : <><FaMagic /> Generate Presentation</>}
                </button>

                <p className="ai-section-label">Quick examples:</p>
                <div className="ai-tags">
                  <span className="ai-tag" onClick={() => setTopic("Climate Change Solutions")}>
                    Climate Change Solutions
                  </span>
                  <span className="ai-tag" onClick={() => setTopic("Digital Marketing Strategy 2024")}>
                    Digital Marketing Strategy 2024
                  </span>
                  <span className="ai-tag" onClick={() => setTopic("Introduction to Machine Learning")}>
                    Introduction to Machine Learning
                  </span>
                  <span className="ai-tag" onClick={() => setTopic("Sustainable Business Practices")}>
                    Sustainable Business Practices
                  </span>
                  <span className="ai-tag" onClick={() => setTopic("Remote Work Best Practices")}>
                    Remote Work Best Practices
                  </span>
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
