import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // For logout
import { FaSignOutAlt, FaUpload } from "react-icons/fa"; // Icons
import "./texttoppt.css"; // Keep your existing CSS
import "./Dashboard"; // Sidebar + Global
import { convertText } from "../api";
import PptxGen from "pptxgenjs";

export default function TextToPPT() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [slides, setSlides] = useState(8);
  const [isLoading, setIsLoading] = useState(false);

  // --- ADDED: State for loading message ---
  const [loadingText, setLoadingText] = useState("");
  // --- END ADDED ---

  const [slidePreviews, setSlidePreviews] = useState([]);
  const [convertedSlides, setConvertedSlides] = useState(null); // ✅ Added state
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // ---------------- File Upload Handlers ----------------
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

  // ---------------- PPT Conversion ----------------
  const handleConvert = async () => {
    if (!fileContent.trim()) {
      alert("Please upload a .txt file first!");
      return;
    }

    // --- MODIFIED: Set loading and initial text ---
    setIsLoading(true);
    setLoadingText("Generating slide content..."); // <-- Step 1 Text
    // --- END MODIFIED ---
    setSlidePreviews([]);

    try {
      // Step 1: Generate structured slide content
      const response = await convertText({
        textContent: fileContent,
        slides,
      });

      if (!response.data.success || !Array.isArray(response.data.slides)) {
        const msg = response.data?.error || "Backend returned invalid data";
        console.error("Invalid slide data:", response.data.slides);
        throw new Error("Conversion failed: " + msg); // Use throw for proper catch handling
      }

      // Step 2: Initialize slide previews
      const slideData = response.data.slides.map((slide) => ({
        ...slide,
        loading: true, // Keep loading true initially if needed
      }));
      setSlidePreviews(slideData); // Show previews immediately if desired

      alert(
        "Slides generated. Generating .pptx file, please wait..." // Update alert
      );

      // Step 3: Mark slides as loaded (can happen quickly if no image fetching)
      const loadedSlides = slideData.map((slide) => ({
        ...slide,
        loading: false, // Mark as loaded
        imageBase64: slide.imageBase64 || null,
      }));

      setSlidePreviews(loadedSlides); // Update previews if needed
      setConvertedSlides(loadedSlides); // ✅ Store slides for edit-preview button

      // --- ADDED: Set text for the next step ---
      setLoadingText("Generating .pptx file..."); // <-- Step 2 Text
      // --- END ADDED ---

      // Step 4: Generate PPTX
      const pptx = new PptxGen();
      pptx.defineLayout({ name: "A4", width: 11.69, height: 8.27 });
      pptx.layout = "A4";

      loadedSlides.forEach((slide, index) => {
        const pptSlide = pptx.addSlide();
        // ... (Your existing pptxgenjs code for adding text and images) ...
         // Title
        pptSlide.addText(slide.title || `Slide ${index + 1}`, {
          x: 0.5, y: 0.3, w: 10.5, h: 0.8, fontSize: 28, bold: true, color: "1F497D", align: "center",
        });
        // Bullets
        if (slide.bullets?.length) {
          pptSlide.addText(slide.bullets.map((b) => `• ${b}`).join("\n"), {
            x: 0.5, y: 1.5, w: 5.5, h: 4.5, fontSize: 18, color: "333333", lineSpacing: 28, bullet: true, valign: "top", align: "left",
          });
        }
        // Optional image
        if (slide.imageBase64) {
          pptSlide.addImage({ data: `data:image/png;base64,${slide.imageBase64}`, x: 6.2, y: 1.5, w: 4.5, h: 4.5 });
        } else {
           pptSlide.addText(
             slide.loading ? "🖼 Loading image..." : "🖼 No image generated", // Use loaded state here
            { x: 6.2, y: 3.5, w: 4.5, h: 1, fontSize: 16, color: "FF0000", italic: true, align: "center", valign: "middle" }
          );
        }
      });

      // Step 5: Download PPTX
      const blob = await pptx.write("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName.replace(/\.txt$/i, "")}_converted.pptx`;
      link.click();
      URL.revokeObjectURL(url);

      alert("✅ PPTX generated and downloaded successfully!");
    } catch (err) {
      console.error("Text → PPT conversion failed:", err);
      const msg = err.response?.data?.error || err.message || "Unknown backend error";
      alert("❌ Conversion failed: " + msg);
    } finally {
      // --- MODIFIED: Reset loading and text ---
      setIsLoading(false);
      setLoadingText(""); // <-- Reset text
      // --- END MODIFIED ---
    }
  };

  // ---------------- Logout ----------------
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    setTimeout(() => navigate("/login"), 1200);
  };

  // ---------------- Render UI ----------------
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
          <header className="headert">
            <div className="headert-icon">TXT</div>
            <div>
              <h1>Text to PPT Converter</h1>
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
                    ) : (
                      <h3>
                        Drop your .txt file here or{" "}
                        <button className="browset">
                          <h2>browse</h2>
                        </button>
                      </h3>
                    )}
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

                {/* --- MODIFIED: This button now shows the progress bar --- */}
                <button
                  className="convertt-btn"
                  onClick={handleConvert}
                  disabled={isLoading || !fileContent.trim()}
                >
                  {isLoading ? (
                    <div className="progress-bar-container">
                      <div className="progress-bar-indeterminate"></div>
                      <span className="progress-text">{loadingText}</span>
                    </div>
                  ) : (
                    "Convert to Presentation"
                  )}
                </button>
                {/* --- END MODIFIED --- */}

                {/* ✅ Edit & Preview Button (appears after conversion) */}
                {convertedSlides && (
                  <div className="after-convert-actions">
                    <button
                      className="edit-preview-btn"
                      onClick={() =>
                        navigate("/edit-preview", {
                          state: { slides: convertedSlides, topic: fileName },
                        })
                      }
                    >
                      📝 Edit & Preview Slides
                    </button>
                  </div>
                )}
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