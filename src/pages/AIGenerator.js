import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PptxGen from "pptxgenjs";
import { FaSignOutAlt, FaUpload, FaMagic, FaDownload } from "react-icons/fa";
import { generateSlides } from "../api"; // Axios call to your /ai-generator
import "./ai-generator.css";

export default function AIGenerator() {
  const [slides, setSlides] = useState(10);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
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
    setLoading(true);
    setPreview([]); // Reset preview

    try {
      const res = await generateSlides({ topic, slides });
      if (!res.data.success) throw new Error("Failed to generate slides");

      // Add loading state for images
      const slidesWithLoading = res.data.slides.map((s) => ({
        ...s,
        loading: true,
      }));
      setPreview(slidesWithLoading);

      // Simulate async image loading
      const loadedSlides = await Promise.all(
        res.data.slides.map(async (s) => {
          return { ...s, loading: false }; // imageBase64 already returned from backend
        })
      );

      setPreview(loadedSlides);
      alert("Slides generated. Preview below!");
    } catch (err) {
      console.error(err);
      alert("Error generating slides: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!preview || preview.length === 0)
      return alert("No slides to download!");

    const pptx = new PptxGen();
    pptx.defineLayout({ name: "A4", width: 11.69, height: 8.27 });
    pptx.layout = "A4";

    preview.forEach((slide, idx) => {
      const pptSlide = pptx.addSlide();

      // Title
      pptSlide.addText(slide.title || `Slide ${idx + 1}`, {
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

    const blob = await pptx.write("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${topic.replace(/\s+/g, "_")}_AI_Presentation.pptx`;
    link.click();
    URL.revokeObjectURL(url);
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

                  <button
                    className="generateAI-btn"
                    onClick={handleGenerate}
                    disabled={!topic.trim() || loading}
                  >
                    {loading ? "Generating..." : <><FaMagic /> Generate Presentation</>}
                  </button>

                  {preview && (
                    <>
                      <h3>Preview</h3>
                      <div className="preview-box">
                        {preview.map((s, idx) => (
                          <div key={idx} className="slide-preview">
                            <h4>{s.title}</h4>
                            <ul>
                              {s.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <button className="download-btn" onClick={handleDownload}>
                        <FaDownload /> Download PPTX
                      </button>
                    </>
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
