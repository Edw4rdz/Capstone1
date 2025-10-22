import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import PptxGen from "pptxgenjs"; // <-- Removed: This moves to the new edit page
import { 
  FaSignOutAlt, 
  FaUpload, 
  FaMagic, 
  // FaDownload, // <-- Removed: This moves to the new edit page
  FaEdit // <-- Added: For the new button
} from "react-icons/fa";
import { generateSlides } from "../api"; // Axios call to your /ai-generator
import "./ai-generator.css";

export default function AIGenerator() {
  const [slides, setSlides] = useState(10);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- ADDED: State for loading message ---
  const [loadingText, setLoadingText] = useState("");
  // --- END ADDED ---
  
  const [preview, setPreview] = useState([]); // This state now just holds the data
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1200);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return alert("Please enter a topic first!");

    // --- MODIFIED: Set loading and initial text ---
    setLoading(true);
    setLoadingText("Generating slide content..."); // <-- Step 1 Text
    // --- END MODIFIED ---
    
    setPreview([]); // Reset preview data

    try {
      const res = await generateSlides({ topic, slides });
      if (!res.data.success) throw new Error("Failed to generate slides");

      // --- ADDED: Set text for the next step ---
      setLoadingText("Processing slides and layout..."); // <-- Step 2 Text
      // --- END ADDED ---

      // We just need to add the ID to the data.
      const finalSlides = res.data.slides.map((s, idx) => ({
        ...s,
        id: idx, // Add the unique ID for the edit page
      }));
      // --- END MODIFICATION ---

      setPreview(finalSlides); // Set the slide data
      alert("Slides generated. Click 'Edit & Preview' to continue!");
    } catch (err)
      {
      console.error(err);
      alert("Error generating slides: " + err.message);
    } finally {
      // --- MODIFIED: Reset loading and text ---
      setLoading(false);
      setLoadingText(""); // <-- Reset text
      // --- END MODIFIED ---
    }
  };

  // --- ADDED ---
  /**
   * This new function navigates to the edit page, passing
   * the generated slide data and topic in the navigation state.
   */
  const handleNavigateToEdit = () => {
    if (!preview || preview.length === 0) return alert("Please generate slides first!");
    
    // Navigate to the new page and pass data
    navigate('/edit-preview', { 
      state: { 
        slides: preview, // Pass the slide data
        topic: topic      // Pass the topic for the download filename
      } 
    });
  };
  // --- END ADDED ---

  // --- REMOVED ---
  // The 'handleDownload' function is removed from this file.
  // It now lives in 'EditPreview.js'.
  // --- END REMOVED ---

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
              <p>
                Create professional presentations from any topic using AI
              </p>
            </div>
          </header>
          <div className="ai-content">
            <div className="ai-left">
              <div className="ai-card ai-card-top">
                <h2>What's your presentation about?</h2>
                <label className="ai-section-label">Presentation Topic</label>
                <textarea
                  placeholder="Describe your presentation topic in detail..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                ></textarea>

                {/* --- MODIFIED: This button now shows the progress bar --- */}
                <button
                  className="generateAI-btn"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || loading}
                >
                  {loading ? (
                    <div className="progress-bar-container">
                      <div className="progress-bar-indeterminate"></div>
                      <span className="progress-text">{loadingText}</span>
                    </div>
                  ) : (
                    <><FaMagic /> Generate Presentation</>
                  )}
                </button>
                {/* --- END MODIFIED --- */}

                {/* --- MODIFIED --- */}
                {/* This block replaces the old preview box */}
                {preview.length > 0 && !loading && (
                  <div className="generation-complete-box">
                    <h3>Slides Generated!</h3>
                    <p>Your {preview.length} slides are ready to be edited and downloaded.</p>
                    <button 
                      className="preview-edit-btn" // Use the new CSS class
                      onClick={handleNavigateToEdit}
                    >
                      <FaEdit /> Edit & Preview Slides
                    </button>
                  </div>
                )}
                {/* --- END MODIFICATION --- */}
                
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

            <div className="ai-right">
              <div className="ai-info-box">
                <h3>How it works</h3>
                <ol>
                  <li>
                    <strong>Describe your topic</strong>
                    <br />Tell us what your presentation should cover
                  </li>
                  <li>
                    <strong>AI creates structure</strong>
                    <br />Our AI analyzes and creates an outline
                  </li>
                  <li>
                    <strong>Generate slides</strong>
                    <br />Professional slides are created automatically
                  </li>
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