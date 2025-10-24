import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import PptxGen from "pptxgenjs";
import { motion } from "framer-motion";
import { FaDownload, FaArrowLeft } from "react-icons/fa";
import "./edit-preview.css";

export default function EditPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [editedSlides, setEditedSlides] = useState(location.state?.slides || []);
  const [topic, setTopic] = useState(location.state?.topic || "My_Presentation");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Fetch prebuilt templates with thumbnails
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get("http://localhost:5000/templates/list");
        setTemplates(res.data);
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSlideChange = (id, field, value) => {
    setEditedSlides((slides) =>
      slides.map((s) =>
        s.id === id
          ? { ...s, [field]: field === "bullets" ? value.split("\n") : value }
          : s
      )
    );
  };

  const handleDownload = async () => {
    if (!editedSlides.length) return alert("No slides to download!");

    const pptx = new PptxGen();
    pptx.defineLayout({ name: "A4", width: 11.69, height: 8.27 });
    pptx.layout = "A4";

    editedSlides.forEach((slide, idx) => {
      const s = pptx.addSlide();

      s.addText(slide.title || `Slide ${idx + 1}`, {
        x: 0.5,
        y: 0.3,
        w: 10.5,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: "1F497D",
        align: "center",
      });

      if (slide.bullets?.length) {
        s.addText(slide.bullets.map((b) => `• ${b}`).join("\n"), {
          x: 0.8,
          y: 1.5,
          w: 5.5,
          h: 4.5,
          fontSize: 18,
          color: "333",
          lineSpacing: 28,
          bullet: true,
        });
      }

      if (slide.imageBase64) {
        s.addImage({
          data: `data:image/png;base64,${slide.imageBase64}`,
          x: 6.3,
          y: 1.6,
          w: 4.5,
          h: 4.5,
        });
      }
    });

    const blob = await pptx.write("blob");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${topic.replace(/\s+/g, "_")}_AI_Presentation.pptx`;
    link.click();
  };

  if (!editedSlides) return <div>Loading slides...</div>;

  return (
    <div className="edit-preview-wrapper">
      {/* === Sidebar with Template Gallery === */}
      <motion.aside
        className="sidebar-glass"
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2>🎨 Templates</h2>

        {loadingTemplates ? (
          <p className="loading">Loading templates...</p>
        ) : (
          <div className="template-gallery">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className={`template-item ${
                  selectedTemplate === tpl.id ? "selected" : ""
                }`}
                onClick={() => setSelectedTemplate(tpl.id)}
              >
                <img
                  src={tpl.thumbnail}
                  alt={tpl.name}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <p>{tpl.name}</p>
              </div>
            ))}
          </div>
        )}
      </motion.aside>

      {/* === Main Content === */}
      <div className="main-content">
        <motion.header
          className="header-glass"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Edit & Preview Your Slides</h1>
          <div className="header-actions">
            <button className="btn-back" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </button>
            <button className="btn-download" onClick={handleDownload}>
              <FaDownload /> Download
            </button>
          </div>
        </motion.header>

        {/* === Slide Editor with Live Preview === */}
        <div className="slides-grid">
          {editedSlides.map((s) => (
            <motion.div key={s.id} whileHover={{ scale: 1.02 }} className="slide-editor">
              <div className="edit-section">
                <label>Slide Title</label>
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) => handleSlideChange(s.id, "title", e.target.value)}
                />

                <label>Slide Content</label>
                <textarea
  value={(s.bullets || []).join("\n")}
  onChange={(e) =>
    handleSlideChange(s.id, "bullets", e.target.value)
  }
/>

                <label>Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () =>
                      handleSlideChange(
                        s.id,
                        "imageBase64",
                        reader.result.split(",")[1]
                      );
                    if (file) reader.readAsDataURL(file);
                  }}
                />
              </div>

              {/* Live visual preview */}
              <div className="preview-section">
                <div className="preview-slide">
                  <h3>{s.title || "Slide Title"}</h3>
                  <ul>
  {(s.bullets || []).map((b, i) => (
    <li key={i}>{b}</li>
  ))}
</ul>
                  {s.imageBase64 && (
                    <img
                      src={`data:image/png;base64,${s.imageBase64}`}
                      alt="Slide visual"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
