import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload, FaMagic, FaEdit } from "react-icons/fa";
import axios from "axios";
import "./ai-generator.css";

export default function AIGenerator() {
  const [slides, setSlides] = useState(10);
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [convertedSlides, setConvertedSlides] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const loggedInUser = JSON.parse(localStorage.getItem("user")) || null;

  // Logout
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1200);
  };

  // Generate slides
  const handleGenerate = async () => {
    if (!topic.trim()) return alert("Please enter a topic first!");
    if (!loggedInUser?.user_id) return alert("User not logged in.");

    setIsLoading(true);
    setLoadingText("Initializing AI generation...");
    setConvertedSlides([]);
    setDownloadUrl(null);

    try {
      // Call backend
      const res = await axios.post("http://localhost:5000/ai-generator", {
        topic,
        slides,
        userId: loggedInUser.user_id,
        fileName: topic,
      });

      if (!res.data.success || !res.data.slides) {
        throw new Error("Failed to generate slides");
      }

      setLoadingText("Generating slide content and images...");

      // Assign unique IDs for Edit & Preview
      const slidesWithId = res.data.slides.map((s, idx) => ({ ...s, id: idx }));

      setConvertedSlides(slidesWithId);
      setDownloadUrl(res.data.downloadUrl);

      setLoadingText("Slides generated successfully!");
    } catch (err) {
      console.error(err);
      alert("AI slide generation failed: " + err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  // Navigate to Edit & Preview page
  const handleNavigateToEdit = () => {
    if (!convertedSlides || convertedSlides.length === 0) {
      return alert("Please generate slides first!");
    }

    navigate("/edit-preview", {
      state: {
        slides: convertedSlides,
        topic,
        downloadUrl,
      },
    });
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
            <Link to="/dashboard" className="active"><i className="fa fa-home"></i> Dashboard</Link>
            <Link to="/conversion"><i className="fa fa-history"></i> Drafts</Link>
            <Link to="/settings"><i className="fa fa-cog"></i> Settings</Link>
            <Link to="/uploadTemplate" className="upload-btn"><FaUpload className="icon" /> Upload Template</Link>
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
          <header className="headera">
            <div className="headera-icon">AI</div>
            <div>
              <h1>AI PowerPoint Generator</h1>
              <p>Create professional presentations from any topic using AI</p>
            </div>
          </header>

          <div className="ai-content">
            {/* Left */}
            <div className="ai-left">
              <div className="ai-card ai-card-top">
                <h2>What's your presentation about?</h2>
                <label className="ai-section-label">Presentation Topic</label>
                <textarea
                  placeholder="Describe your presentation topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                ></textarea>

                <button
                  className="generateAI-btn"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="progress-bar-container">
                      <div className="progress-bar-indeterminate"></div>
                      <span className="progress-text">{loadingText}</span>
                    </div>
                  ) : (
                    <><FaMagic /> Generate Presentation</>
                  )}
                </button>

                {convertedSlides.length > 0 && !isLoading && (
                  <div className="generation-complete-box">
                    <h3>Slides Generated!</h3>
                    <p>Your {convertedSlides.length} slides are ready to edit.</p>
                    <button className="preview-edit-btn" onClick={handleNavigateToEdit}>
                      <FaEdit /> Edit & Preview Slides
                    </button>
                  </div>
                )}
              </div>

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
                    onChange={(e) => setSlides(Number(e.target.value))}
                  />
                  <span id="slide-count">{slides} slides</span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="ai-right">
              <div className="ai-info-box">
                <h3>How it works</h3>
                <ol>
                  <li>Describe your topic.</li>
                  <li>AI generates the slides.</li>
                  <li>Preview and edit before download.</li>
                </ol>
              </div>
              <div className="ai-info-box">
                <h3>Features</h3>
                <ul className="ai-features">
                  <li>AI-powered content generation</li>
                  <li>Preview before download</li>
                  <li>Download as PPTX</li>
                  <li>Customizable slide count</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
