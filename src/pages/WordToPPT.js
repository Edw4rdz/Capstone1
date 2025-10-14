import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PptxGen from "pptxgenjs";
import { convertWord } from "../api"; // Axios call to backend
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./wordtoppt.css";
import "font-awesome/css/font-awesome.min.css";

export default function WordToPPT() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [file, setFile] = useState(null);
  const [slides, setSlides] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [slidePreviews, setSlidePreviews] = useState([]); // { title, bullets, imageBase64, loading }
  const fileInputRef = useRef(null);

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

  const handleUpload = async () => {
    if (!file) return alert("Please select a Word document first");
    if (file.size > 25 * 1024 * 1024) return alert("File too large (max 25MB)");

    setIsLoading(true);
    setSlidePreviews([]); // reset previews

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Word = reader.result.split(",")[1];

      try {
        // 1️⃣ Call backend API
        const response = await convertWord({ base64Word, slides });
        const slideData = response.data.slides;

        if (!Array.isArray(slideData)) {
          const msg = response.data?.error || "Backend returned invalid data";
          console.error("Invalid slide data:", slideData);
          return alert("Conversion failed: " + msg);
        }

        // 2️⃣ Initialize slide previews with loading state
        const previews = slideData.map((s) => ({ ...s, loading: true }));
        setSlidePreviews(previews);

        alert(
          "Slides generated. Images are loading in the background, please wait..."
        );

        // 3️⃣ Wait for each image to "load" asynchronously
        const loadedSlides = await Promise.all(
          slideData.map(async (slide) => {
            if (slide.imageBase64) {
              return { ...slide, loading: false };
            } else {
              return { ...slide, imageBase64: null, loading: false };
            }
          })
        );

        setSlidePreviews(loadedSlides);

        // 4️⃣ Generate PPTX
        const pptx = new PptxGen();
        pptx.defineLayout({ name: "A4", width: 11.69, height: 8.27 });
        pptx.layout = "A4";

        loadedSlides.forEach((slide, index) => {
          const pptSlide = pptx.addSlide();

          // Title
          pptSlide.addText(slide.title || `Slide ${index + 1}`, {
            x: 0.5,
            y: 0.3,
            w: 10.5,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: "1F497D",
            align: "center",
          });

          // Bullets
          if (slide.bullets?.length) {
            pptSlide.addText(slide.bullets.map((b) => `• ${b}`).join("\n"), {
              x: 0.5,
              y: 1.5,
              w: 5.5,
              h: 4.5,
              fontSize: 18,
              color: "333333",
              lineSpacing: 28,
              bullet: true,
              valign: "top",
              align: "left",
            });
          }

          // Image
          if (slide.imageBase64) {
            pptSlide.addImage({
              data: `data:image/png;base64,${slide.imageBase64}`,
              x: 6.2,
              y: 1.5,
              w: 4.5,
              h: 4.5,
            });
          } else {
            pptSlide.addText(
              slide.loading ? "🖼 Loading image..." : "🖼 No image generated",
              {
                x: 6.2,
                y: 3.5,
                w: 4.5,
                h: 1,
                fontSize: 16,
                color: slide.loading ? "0000FF" : "FF0000",
                italic: true,
                align: "center",
                valign: "middle",
              }
            );
          }
        });

        // 5️⃣ Download PPTX
        const blob = await pptx.write("blob");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${file.name.replace(/\.(docx|doc)$/i, "")}_converted.pptx`;
        link.click();
        URL.revokeObjectURL(url);

        alert("Conversion done! PPTX downloaded.");
      } catch (err) {
        console.error("Backend conversion error:", err);
        const msg = err.response?.data?.error || err.message || "Unknown backend error";
        alert("Conversion failed: " + msg);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      alert("Failed to read Word file. Please try again.");
      setIsLoading(false);
    };
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1200);
  };

  return (
    <div className="ai-dashboard">
      {/* Sidebar identical to PDFToPPT */}
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

      {/* Main content */}
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
            {/* Left Column: upload + customization */}
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
                <button
                  onClick={handleUpload}
                  className="convertw-btn"
                  disabled={isLoading || !file}
                >
                  {isLoading ? "Converting..." : "Convert to PPT"}
                </button>
              </div>

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

            {/* Right Column: instructions */}
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
