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

  // ✅ Handle Logout
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1200);
  };

  // ✅ Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
          navigate("/login");
          return;
        }

        const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
        const res = await axios.get(`${API_BASE}/api/conversions`, {
          params: { userId: user.user_id },
        });
        setHistory(res.data);
      } catch (err) {
        console.error("Error fetching conversion history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

  // ✅ Delete Conversion
 // ✅ Delete Conversion
const handleDelete = async (id) => {
  if (!window.confirm("Delete this conversion permanently?")) return;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.user_id) {
      alert("User not found. Please log in again.");
      navigate("/login");
      return;
    }

    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
   
    await axios.delete(`${API_BASE}/api/conversions/${id}`, {
      params: { userId: user.user_id },
    });
    setHistory((prev) => prev.filter((c) => c.id !== id));
    alert("Conversion deleted successfully!");
  } catch (err) {
    console.error("Error deleting conversion:", err);
    alert(`Failed to delete conversion: ${err.response?.data?.error || err.message}`);
  }
};

  // ✅ Edit Conversion
  const handleEdit = (conv) => {
    navigate("/edit-preview", {
      state: { slides: conv.slides || [], topic: conv.fileName },
    });
  };

  // ✅ Preview Slides
  const renderSlidePreview = (slides) => {
    if (!slides || slides.length === 0) return <p>No slide data available.</p>;
    return (
      <div className="slide-preview">
        <h4>Slide Preview ({slides.length} slides)</h4>
        <ul>
          {slides.map((slide, index) => (
            <li key={index}>
              <strong>{slide.title || "Untitled"}</strong>
              <ul>
                {slide.bullets?.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              {slide.imageBase64 && (
                <img
                  src={`data:image/png;base64,${slide.imageBase64}`}
                  alt={slide.title || "Slide image"}
                  style={{ maxWidth: "100px", maxHeight: "100px" }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

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
            <Link to="/conversion" className="active"><i className="fa fa-history" /> Drafts</Link>
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
            <p>Track all your uploaded files, AI processing status, and download completed presentations.</p>
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
                    Uploaded on {new Date(conv.uploadedAt?.seconds * 1000).toLocaleString()}
                  </p>

                  {/* ✅ Slide Preview */}
                  {renderSlidePreview(conv.slides)}

                  {/* ✅ Download Button */}
                  {conv.status === "Completed" && conv.downloadUrl && (
                    <a href={conv.downloadUrl} className="download-btn" download>
                      Download PPT
                    </a>
                  )}

                  {/* ✅ Edit & Delete Buttons */}
                  <div className="conversion-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(conv)}
                      disabled={!conv.slides || conv.slides.length === 0}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(conv.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}