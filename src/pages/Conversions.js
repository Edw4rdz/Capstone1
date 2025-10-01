import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./dashboard.css";
import "./conversion.css";

export default function Conversions() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1200);
  };

  // Fetch history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("userToken"); // or session
        const res = await axios.get("/api/conversions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (err) {
        console.error("Error fetching conversion history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="fa fa-magic logo">
          <div>
            <h2>SLIDE-IT</h2>
            <p>Convert & Generate</p>
          </div>
        </div>

        <nav className="sidebar-links">
          <div className="top-links">
            <Link to="/dashboard"><i className="fa fa-home" /> Dashboard</Link>
            <Link to="/conversion" className="active"><i className="fa fa-history" /> Conversions</Link>
            <Link to="/settings"><i className="fa fa-cog" /> Settings</Link>
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
          <header className="conversion-header">
            <h1>Conversion History</h1>
            <p>Track all your uploaded file, AI processing status, and download completed presentations.</p>
          </header>

          {loading ? (
            <p>Loading conversion history...</p>
          ) : history.length === 0 ? (
            <p className="info-text">No conversions yet. Start uploading files to see them here.</p>
          ) : (
            <div className="conversion-grid">
              {history.map((conv) => (
                <div className="conversion-card" key={conv.id}>
                  <div className="card-header">
                    <span className={`status-badge ${conv.status.toLowerCase()}`}>{conv.status}</span>
                    <p className="file-type">{conv.type}</p>
                  </div>
                  <h3 className="file-name">{conv.fileName}</h3>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${conv.progress}%` }}></div>
                  </div>
                  <p className="progress-text">{conv.progress}% completed</p>
                  <p className="conversion-date">
                    Uploaded on {new Date(conv.uploadedAt).toLocaleString()}
                  </p>
                  {conv.status === "Completed" && conv.downloadUrl && (
                    <a href={conv.downloadUrl} className="download-btn" download>
                      Download PPT
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
   