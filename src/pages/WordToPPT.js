import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import { convertWord } from "../api";
import "./wordtoppt.css";
import "font-awesome/css/font-awesome.min.css";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function WordToPPT() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [slides, setSlides] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [convertedSlides, setConvertedSlides] = useState(null);
  const [topic, setTopic] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [conversionId, setConversionId] = useState(null);
  const fileInputRef = useRef(null);

  const loggedInUser = JSON.parse(localStorage.getItem("user")) || null;

  // 📂 Select File
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "application/msword")
    ) {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid Word file (.docx or .doc)");
      setFile(null);
    }
  };

  // 🚀 Upload + Convert Word
  const handleUpload = async () => {
    if (!file) return alert("Please select a Word document first");
    if (file.size > 25 * 1024 * 1024) return alert("File too large (max 25MB)");

    setIsLoading(true);
    setLoadingText("Reading Word file...");
    setProgress(0);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      setLoadingText("Starting conversion...");
      const base64Word = reader.result.split(",")[1];
      const userId = loggedInUser?.user_id;
      const fileName = file.name;

      try {
        const response = await convertWord({ base64Word, slides, userId, fileName });

        if (response.data.success) {
          const convId = response.data.conversionId;
          setConversionId(convId);
          setTopic(file.name.replace(".docx", "").replace(".doc", ""));

          // Poll Firestore for progress
          const conversionDocRef = doc(db, "conversions", userId, "user_conversions", convId);
          const unsubscribe = onSnapshot(conversionDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProgress(data.progress || 0);
              setLoadingText(`Processing: ${data.status || "Processing"} (${data.progress || 0}%)`);

              if (data.status === "Completed") {
                setConvertedSlides(data.slides || []);
                setIsLoading(false);
                setLoadingText("Conversion completed!");
                unsubscribe();
              } else if (data.status === "Failed") {
                setIsLoading(false);
                setLoadingText("Conversion failed.");
                unsubscribe();
              }
            }
          });
        } else {
          alert("Conversion failed. Please try again.");
          setIsLoading(false);
          setLoadingText("");
        }
      } catch (err) {
        console.error(err);
        alert("Conversion failed. See console for details.");
        setIsLoading(false);
        setLoadingText("");
      }
    };

    reader.onerror = () => {
      alert("Failed to read Word file. Please try again.");
      setIsLoading(false);
      setLoadingText("");
    };
  };

  // 🔒 Logout
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1000);
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
              <i className="fa fa-history"></i> Drafts
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
      <main className="mainw">
        <div className="containerw">
          <header className="header">
            <div className="headerw-icon">DOCX</div>
            <div>
              <h1>Word to PPT Converter</h1>
              <p>Transform your Word documents into editable PowerPoint presentations</p>
            </div>
          </header>

          <div className="contentw-grid">
            {/* Left Column */}
            <div className="ai-left">
              <div className="ai-card ai-card-top">
                <h2>Upload Your Word Document</h2>
                <div className="uploadw-area">
                  <div className="uploadw-icon">⬆</div>
                  <h3>
                    Drop your Word document here, or{" "}
                    <span className="browsew" onClick={() => fileInputRef.current.click()}>
                      browse
                    </span>
                  </h3>
                  <p>Supports .docx and .doc files up to 25MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".docx,.doc"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {file && <p className="file-name">📑 {file.name}</p>}
                </div>

                {/* Progress Button */}
                <button
                  onClick={handleUpload}
                  className="convertw-btn"
                  disabled={isLoading || !file}
                >
                  {isLoading ? (
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                      <span className="progress-text">{loadingText}</span>
                    </div>
                  ) : (
                    "Convert to PPT"
                  )}
                </button>

                {/* Preview/Edit */}
                {convertedSlides && (
                  <div className="after-convert-actions">
                    <button
                      className="edit-preview-btn"
                      onClick={() => navigate("/edit-preview", { state: { slides: convertedSlides, topic } })}
                    >
                      📝 Edit & Preview Slides
                    </button>
                  </div>
                )}
              </div>

              {/* Customization */}
              <div className="ai-card">
                <h2>Customize Your Presentation</h2>
                <div className="ai-slider-section">
                  <label htmlFor="slides">Number of Slides</label>
                  <input
                    type="range"
                    id="slides"
                    min="5"
                    max="25"
                    value={slides}
                    onChange={(e) => setSlides(parseInt(e.target.value))}
                  />
                  <span id="slide-count">{slides} slides</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
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
