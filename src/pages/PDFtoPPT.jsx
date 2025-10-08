import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PptxGen from "pptxgenjs"; // v3.x
import { convertPDF } from "../api"; // axios call to backend
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./pdftoppt.css";
import "font-awesome/css/font-awesome.min.css";

export default function PDFToPPT() {
  const [slides, setSlides] = useState(15);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [slidePreviews, setSlidePreviews] = useState([]); // { title, bullets, imageBase64, loading }


  // File selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file");
      setFile(null);
    }
  };

  // ---------------- Upload PDF to backend and generate PPT ----------------
const handleUpload = async () => {
  if (!file) return alert("Please select a PDF first");
  if (file.size > 20 * 1024 * 1024)
    return alert("File too large (max 20MB)");

  setIsLoading(true);
  setSlidePreviews([]); // reset previews

  try {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64PDF = reader.result.split(",")[1];

      // 1️⃣ Call backend API
      const response = await convertPDF({ base64PDF, slides });
      const slideData = response.data.slides;

      // 2️⃣ Initialize previews with loading state
      const previews = slideData.map((s) => ({ ...s, loading: true }));
      setSlidePreviews(previews);

      alert(
        "Slides generated. Images are loading in the background, please wait..."
      );

      // 3️⃣ Wait for each image to load asynchronously
      const loadedSlides = await Promise.all(
        slideData.map(async (slide) => {
          if (slide.imageBase64) {
            return { ...slide, loading: false };
          } else {
            // optional: retry or fallback image
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

  // 🏷 Title (top)
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

  // 📋 Bullet points (left side)
  if (slide.bullets?.length) {
    pptSlide.addText(slide.bullets.map(b => `• ${b}`).join("\n"), {
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

  // 🖼 Image (right side)
  if (slide.imageBase64) {
    pptSlide.addImage({
      data: `data:image/png;base64,${slide.imageBase64}`,
      x: 6.2, // move image to right side
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
      link.download = `${file.name.replace(".pdf", "")}_converted.pptx`;
      link.click();
      URL.revokeObjectURL(url);

      alert("Conversion done! PPTX downloaded.");
    };

    reader.onerror = () => {
      throw new Error("Could not read PDF file.");
    };
  } catch (err) {
    console.error(err);
    alert("Conversion failed. Check console for details.");
  } finally {
    setIsLoading(false);
  }
};



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
          <header className="headerp">
            <div className="headerp-icon">PDF</div>
            <div>
            <h1>PDF to PPT Converter</h1>
            <p>
              Transform your PDF documents into editable PowerPoint presentations
            </p>
          </div>
          </header>

          {/* Two-column Content */}
          <div className="ai-content">
            {/* Left Column */}
            <div className="ai-left">
              {/* File Upload Card */}
              <div className="ai-card ai-card-top">
                <h2>Upload Your PDF</h2>
                <div className="uploadp-area">
                  <div className="uploadp-icon">⬆</div>
                  <h3>
                    Drop your PDF here, or{" "}
                    <span
                      className="browsep"
                      onClick={() => fileInputRef.current.click()}
                    >
                      browse
                    </span>
                  </h3>
                  <p>Supports .pdf files up to 25MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {file && <p className="file-name">📑 {file.name}</p>}
                </div>
                <button
                  onClick={handleUpload}
                  className="uploadp-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Converting..." : "Convert to PPT"}
                </button>
              </div>

              {/* Upload Requirements */}
              <div className="ai-card">
                <h4>Upload Requirements</h4>
                <ul>
                  <li>PDF files only</li>
                  <li>Maximum file size: 50MB</li>
                  <li>Text-based PDFs work best</li>
                  <li>Scanned PDFs may have limited text extraction</li>
                </ul>
              </div>

              {/* Customize Card */}
              <div className="ai-card">
                <h2>Customize Your Presentation</h2>
                <div className="ai-slider-section">
                  <label htmlFor="slides">Number of Slides</label>
                  <input
                    type="range"
                    id="slides"
                    min="5"
                    max="30"
                    value={slides}
                    onChange={(e) => setSlides(parseInt(e.target.value))}
                  />
                  <span id="slide-count">{slides} slides</span>
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
                    <strong>Upload PDF</strong> - Select the PDF file you want
                    to convert
                  </li>
                  <li>
                    <strong>Customize slides</strong> - Choose number of slides
                    and presentation style
                  </li>
                  <li>
                    <strong>Download PPT</strong> - Get your editable PowerPoint
                    presentation
                  </li>
                </ol>
              </div>

              {/* Features */}
              <div className="ai-info-box">
                <h3>Features</h3>
                <ol className="ai-features">
                  <li>Text-based PDFs convert best</li>
                  <li>Scanned PDFs may have limited editable content</li>
                  <li>Choose slide count and style</li>
                  <li>Instant download as PPTX</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
