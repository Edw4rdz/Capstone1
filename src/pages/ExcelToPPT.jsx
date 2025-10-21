import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./exceltoppt.css";
import "./Dashboard";
import { convertExcel } from "../api";

export default function ExcelToPPT() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [slidesCount, setSlidesCount] = useState(8);
  const [convertedSlides, setConvertedSlides] = useState(null);
  const [topic, setTopic] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle file selection
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (
      selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selectedFile.type === "application/vnd.ms-excel"
    ) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      alert("Please upload a valid Excel file (.xlsx or .xls)");
      setFile(null);
      setFileName("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    setFile(droppedFile);
    setFileName(droppedFile.name);
  };

  const handleDragOver = (e) => e.preventDefault();

  // 🚀 Convert Excel → Slide Data (for edit/preview)
  const handleConvert = async () => {
    if (!file) {
      alert("Please upload an Excel file first!");
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Excel = e.target.result.split(",")[1];
        const { data } = await convertExcel({
          base64Excel,
          slides: slidesCount,
        });

        if (!data.success || !Array.isArray(data.slides)) {
          alert("Conversion failed: " + (data.error || "Invalid response"));
          return;
        }

        setConvertedSlides(data.slides);
        setTopic(file.name.replace(/\.(xlsx|xls)/i, ""));
        alert("✅ Conversion successful! You can now preview or edit.");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Conversion error:", err);
      alert("❌ Excel conversion failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔒 Logout
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1200);
  };

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
          {/* Header */}
          <header className="header">
            <div className="header-icon">XLSX</div>
            <div>
              <h1>Excel to PPT Converter</h1>
              <p>
                Transform your Excel data and charts into professional
                PowerPoint presentations
              </p>
            </div>
          </header>

          <div className="content-grid">
            <div className="main-cards">
              <section className="card">
                <h2>Upload Your Excel File</h2>
                <div
                  className="file-upload"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="uploade-area">
                    <div className="uploade-icon">⬆</div>
                    {file ? (
                      <p>
                        <strong>{fileName}</strong> loaded
                      </p>
                    ) : (
                      <p>
                        Drop your Excel file here or{" "}
                        <span className="browse">browse</span>
                      </p>
                    )}
                    <p>Supports .xlsx and .xls up to 25MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="features-grid">
                  <div className="feature-card charts">
                    <h4>Charts & Graphs</h4>
                    <p>Automatically converts Excel charts to PowerPoint</p>
                  </div>
                  <div className="feature-card tables">
                    <h4>Data Tables</h4>
                    <p>Preserves table formatting and structure</p>
                  </div>
                </div>

                {/* Single Convert + Edit/Preview Button */}
                <button
                  className="convert-btn"
                  onClick={() => {
                    if (convertedSlides) {
                      navigate("/edit-preview", {
                        state: { slides: convertedSlides, topic },
                      });
                    } else {
                      handleConvert();
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Converting..."
                    : convertedSlides
                    ? "Edit & Preview Slides"
                    : "Convert to PowerPoint"}
                </button>
              </section>

              {/* Customize */}
              <section className="card">
                <h2>Customize Your Presentation</h2>
                <div className="checkbox-grid">
                  <label>
                    <input type="checkbox" defaultChecked /> Include Charts
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Preserve Formatting
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Summary Slide
                  </label>
                  <label>
                    <input type="checkbox" /> One Slide Per Sheet
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Include Data Tables
                  </label>
                </div>

                <div className="customize-grid">
                  <div className="input-group">
                    <label>Number of Slides</label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={slidesCount}
                      onChange={(e) => setSlidesCount(parseInt(e.target.value))}
                    />
                    <span>{slidesCount} slides</span>
                  </div>

                  <div className="input-group">
                    <label>Presentation Style</label>
                    <select>
                      <option>Professional</option>
                      <option>Modern</option>
                      <option>Colorful</option>
                      <option>Minimal</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Slide Layout</label>
                    <select>
                      <option>Auto Layout</option>
                      <option>Dashboard Style</option>
                      <option>Individual Charts</option>
                      <option>Data Focused</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="right-sidebar">
              <section className="card">
                <h3>Processing Features</h3>
                <ul>
                  <li>Converts all chart types</li>
                  <li>Preserves table formatting</li>
                  <li>Smart slide layouts</li>
                  <li>Professional design themes</li>
                </ul>
              </section>

              <section className="card">
                <h3>Supported Charts</h3>
                <ul>
                  <li>Bar & Column Charts</li>
                  <li>Line & Area Charts</li>
                  <li>Pie & Doughnut Charts</li>
                  <li>Scatter Plots</li>
                  <li>Combo Charts</li>
                  <li>Pivot Charts</li>
                </ul>
              </section>

              <section className="card">
                <h3>File Requirements</h3>
                <ul>
                  <li>Formats: .xlsx, .xls</li>
                  <li>Max Size: 50MB</li>
                  <li>Well-structured headers recommended</li>
                </ul>
              </section>

              <section className="card">
                <h3>Processing Time</h3>
                <p className="processing-time">1–2 minutes</p>
                <p className="small-text">
                  For typical Excel files with charts
                </p>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
