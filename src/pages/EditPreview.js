// src/components/EditPreview.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PptxGen from 'pptxgenjs';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import './ai-generator.css'; // Reuse the same CSS file for styles
import './edit-preview.css'; // Add a new CSS file for page-specific layout

export default function EditPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the data passed from the AIGenerator page
  const initialState = location.state?.slides;
  const topic = location.state?.topic || "My_Presentation";

  // This page now has its OWN state for the slides
  const [editedSlides, setEditedSlides] = useState(initialState);

  // If a user lands on this page directly without data, send them back
  useEffect(() => {
    if (!initialState) {
      alert("No slide data found. Redirecting to generator.");
      navigate('/ai-generator'); // Adjust this to your generator's route
    }
  }, [initialState, navigate]);

  // This function is MOVED here from ai-generator.js
  const handleSlideChange = (slideId, field, value) => {
    setEditedSlides(currentSlides =>
      currentSlides.map(slide => {
        if (slide.id === slideId) {
          if (field === 'bullets') {
            return { ...slide, bullets: value.split('\n') };
          }
          return { ...slide, [field]: value };
        }
        return slide;
      })
    );
  };

  // This function is MOVED here from ai-generator.js
  const handleDownload = async () => {
    if (!editedSlides || editedSlides.length === 0)
      return alert("No slides to download!");

    const pptx = new PptxGen();
    pptx.defineLayout({ name: "A4", width: 11.69, height: 8.27 });
    pptx.layout = "A4";

    // IMPORTANT: Read from 'editedSlides' state
    editedSlides.forEach((slide, idx) => {
      const pptSlide = pptx.addSlide();
      
      // ... (The *exact same* PptxGen logic as before) ...
      // Title
      pptSlide.addText(slide.title || `Slide ${idx + 1}`, {
        x: 0.5, y: 0.3, w: 10.5, h: 0.8, fontSize: 28, bold: true, color: "1F497D", align: "center",
      });
      // Bullets
      if (slide.bullets?.length) {
        pptSlide.addText(slide.bullets.map((b) => `• ${b}`).join("\n"), {
          x: 0.5, y: 1.5, w: 5.5, h: 4.5, fontSize: 18, color: "333333", lineSpacing: 28, bullet: true, valign: "top", align: "left",
        });
      }
      // Image
      if (slide.imageBase64) {
        pptSlide.addImage({ data: `data:image/png;base64,${slide.imageBase64}`, x: 6.2, y: 1.5, w: 4.5, h: 4.5 });
      } else {
        pptSlide.addText("🖼 No image generated", { x: 6.2, y: 3.5, w: 4.5, h: 1, fontSize: 16, color: "FF0000", italic: true, align: "center", valign: "middle" });
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

  // If state is not yet loaded, show loading
  if (!editedSlides) {
    return <div>Loading slides...</div>;
  }

  return (
    <div className="edit-preview-page">
      <header className="edit-preview-header">
        <h1>Edit Your Presentation</h1>
        <div className="header-actions">
          <button className="back-btn" onClick={() => navigate(-1)}>
             <FaArrowLeft /> Back to Generator
          </button>
          <button className="download-btn-main" onClick={handleDownload}>
            <FaDownload /> Download PPTX
          </button>
        </div>
      </header>

      <main className="edit-preview-content">
        <div className="preview-box-full">
          {editedSlides.map((s) => (
            <div key={s.id} className="slide-preview">
              <label className="ai-section-label">Slide Title</label>
              <input
                type="text"
                className="slide-edit-title"
                value={s.title}
                onChange={(e) => handleSlideChange(s.id, 'title', e.target.value)}
              />
              <label className="ai-section-label">Slide Content (one bullet per line)</label>
              <textarea
                className="slide-edit-bullets"
                value={s.bullets.join('\n')}
                onChange={(e) => handleSlideChange(s.id, 'bullets', e.target.value)}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}