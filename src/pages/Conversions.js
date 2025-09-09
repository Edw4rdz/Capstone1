import React from "react";
import "./Dashboard"; // Sidebar + Global
import { Link } from "react-router-dom";

export default function Conversions() {
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <i className="fa-solid fa-sliders"></i>
          <div>
            <h2>PPT Tools</h2>
            <p>Convert &amp; Generate</p>
          </div>
        </div>
        <nav>
          <Link to="/dashboard">
            <i className="fa-solid fa-house"></i> Dashboard
          </Link>
          <Link to="/conversion" className="active">
            <i className="fa-solid fa-clock-rotate-left"></i> Conversions
          </Link>
          <Link to="/settings">
            <i className="fa-solid fa-gear"></i> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="text-center py-16">
            <div className="icon-circle mb-6">
              <i className="fa-solid fa-download"></i>
            </div>

            <h1 className="title">Conversions</h1>
            <p className="subtitle">
              This page will display your conversion history, progress tracking,
              slide previews, and download options.
            </p>

            <div className="card conversion-card">
              <div className="grid gap-6">
                <div className="conversion-item">
                  <i className="fa-solid fa-file-lines"></i>
                  <div className="conversion-text">
                    <h3>Upload Progress</h3>
                    <p>Track file upload status</p>
                  </div>
                </div>

                <div className="conversion-item">
                  <i className="fa-solid fa-clock"></i>
                  <div className="conversion-text">
                    <h3>Processing Status</h3>
                    <p>Monitor AI conversion progress</p>
                  </div>
                </div>

                <div className="conversion-item">
                  <i className="fa-solid fa-download"></i>
                  <div className="conversion-text">
                    <h3>Download Center</h3>
                    <p>Access completed presentations</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="info-text">
              Continue prompting to have this page fully implemented with
              conversion tracking and download functionality.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
