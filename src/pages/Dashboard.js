import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUpload } from "react-icons/fa";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed
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
  const [userName, setUserName] = useState("Loading...");

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName("Unknown User");
        navigate("/login");
        return;
      }

      // Try cache first (support both "username" and legacy "name")
      try {
        const cachedRaw = localStorage.getItem("user");
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached.username) {
            setUserName(cached.username);
            return;
          }
          if (cached.name) {
            setUserName(cached.name);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      setUserName("Loading...");

      // Query Firestore for the doc where authUID == user.uid
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("authUID", "==", user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          const username = data.username || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.email) || user.email || "User";
          setUserName(username);

          // cache
          localStorage.setItem("user", JSON.stringify({
            username,
            email: data.email || user.email,
            user_id: data.numericId || docSnap.id,
            authUID: user.uid,
          }));
          return;
        }

        // fallback
        const fallback = user.displayName || user.email || "User";
        setUserName(fallback);
        localStorage.setItem("user", JSON.stringify({
          username: fallback,
          email: user.email,
          user_id: user.uid,
          authUID: user.uid,
        }));
      } catch (err) {
        console.error("Error fetching user info for dashboard:", err);
        setUserName(user.displayName || user.email || "User");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    setLoggingOut(true);
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
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
            <Link to="/conversion"><i className="fa fa-history" /> Drafts</Link>
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
