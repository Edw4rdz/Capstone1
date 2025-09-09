import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ai-generator.css"; // Generator-specific

export default function AIGenerator() {
  const [slides, setSlides] = useState(10);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <i className="fa-solid fa-sliders"></i>
          <div>
            <h2>PPT Tools</h2>
            <p>Convert & Generate</p>
          </div>
        </div>

        <nav>
          <Link to="/" className="active">
            <i className="fa fa-home"></i> Dashboard
          </Link>
          <Link to="/conversion">
            <i className="fa fa-history"></i> Conversions
          </Link>
          <Link to="/settings">
            <i className="fa fa-cog"></i> Settings
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="container">
          {/* Header */}
        <div className="header">
      <h1>AI PowerPoint Generator</h1>
      <p className="subtitle highlight">
       Create professional presentations from any topic using AI
        </p>
        </div>


          <div className="content">
            {/* Left side */}
            <div className="left">
              {/* Presentation Topic */}
              <div className="card card-top">
                <h2>What's your presentation about?</h2>
                <label className="section-label">Presentation Topic</label>
                <textarea
                  placeholder="Describe your presentation topic in detail. Include key points, target audience, and any specific requirements..."
                ></textarea>
                <p className="section-label">Quick examples:</p>
                <div className="tags">
                  <span className="tag">Climate Change Solutions</span>
                  <span className="tag">Digital Marketing Strategy 2024</span>
                  <span className="tag">Introduction to Machine Learning</span>
                  <span className="tag">Sustainable Business Practices</span>
                  <span className="tag">Remote Work Best Practices</span>
                </div>
              </div>

              {/* Customize */}
              <div className="card">
                <h2>Customize Your Presentation</h2>
                <div className="slider-section">
                  <label htmlFor="slides">Number of Slides</label>
                  <input
                    type="range"
                    id="slides"
                    min="5"
                    max="20"
                    value={slides}
                    onChange={(e) => setSlides(e.target.value)}
                  />
                  <span id="slide-count">{slides} slides</span>
                </div>
                <div className="style-box">
                  <p className="section-label">Presentation Style</p>
                  <div className="style-card">
                    <strong>Professional</strong>
                    <br />
                    <small>Clean, business-focused design</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="right">
              {/* How it works */}
              <div className="info-box">
                <h3>How it works</h3>
                <ol>
                  <li>
                    <strong>Describe your topic</strong>
                    <br />
                    Tell us what your presentation should cover
                  </li>
                  <li>
                    <strong>AI creates structure</strong>
                    <br />
                    Our AI analyzes and creates an outline
                  </li>
                  <li>
                    <strong>Generate slides</strong>
                    <br />
                    Professional slides are created automatically
                  </li>
                </ol>
              </div>

              {/* Features */}
              <div className="info-box">
                <h3>Features</h3>
                <ul className="features">
                  <li>AI-powered content generation</li>
                  <li>Professional design templates</li>
                  <li>Customizable slide count</li>
                  <li>Multiple presentation styles</li>
                  <li>Instant download as PPTX</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
