import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import "./dashboard.css";
import "font-awesome/css/font-awesome.min.css";

const tools = [
  { title: "AI PowerPoint Generator", desc: "Create professional slides from any topic using AI.", icon: "fa-cogs", colorClass: "plus", path: "/ai-generator" },
  { title: "PDF to PPT", desc: "Convert PDF files into editable PowerPoint presentations.", icon: "fa-file-pdf-o", colorClass: "pdf", path: "/pdftoppt" },
  { title: "Word to PPT", desc: "Convert Word documents into engaging presentations.", icon: "fa-file-word-o", colorClass: "word", path: "/wordtoppt" },
  { title: "Text to PPT", desc: "Turn plain text files into styled slides quickly.", icon: "fa-file-text-o", colorClass: "text", path: "/texttoppt" },
  { title: "Excel to PPT", desc: "Convert Excel data into presentation-ready charts and tables.", icon: "fa-file-excel-o", colorClass: "excel", path: "/exceltoppt" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userName, setUserName] = useState("");

  const loadUserData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log("Parsed User from localStorage:", user); // Enhanced debug log
        if (user && user.name) {
          setUserName(user.name); // Set the actual name
        } else {
          console.warn("No name found in user data:", user);
          setUserName("Unknown User"); // Fallback
          localStorage.removeItem("user"); // Clear invalid data
        }
      } catch (error) {
        console.error("Invalid JSON in localStorage:", error);
        localStorage.removeItem("user"); // Clear invalid data
        setUserName("Unknown User"); // Fallback for parsing errors
      }
    } else {
      console.log("No user data found in localStorage");
      setUserName("Unknown User"); // Default if no data
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

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
            <Link to="/dashboard" className="active"><i className="fa fa-home" /> Dashboard</Link>
            <Link to="/conversion"><i className="fa fa-history" /> Conversions</Link>
            <Link to="/settings"><i className="fa fa-cog" /> Settings</Link>

            {/* Upload Template Button */}
            <Link to="/uploadTemplate" className="upload-btn">
              <FaUpload className="icon" /> Upload Template
            </Link>
          </div>

          {/* Logout always at bottom */}
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
        <div className="content">
          <div className="header">
            <h1><span>✨ Welcome</span> {userName}</h1>
            <p>Choose a tool below to get started</p>
          </div>

          <div className="tools-grid">
            {tools.map((tool, index) => (
              <Link key={index} to={tool.path} className="tool-card-link">
                <div className="tool-card">
                  <div className={`tool-icon ${tool.colorClass}`}>
                    <i className={`fa ${tool.icon}`} />
                  </div> 
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                  <span className="tool-arrow"><i className="fa fa-arrow-right" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}