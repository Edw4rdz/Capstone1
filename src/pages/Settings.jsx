import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCog, FaUpload, FaHistory } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./settings.css";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
} from "firebase/auth";

export default function Settings() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [conversionCount, setConversionCount] = useState(12);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ✅ Load user info from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setProfile({
        name: storedUser.name || "",
        email: storedUser.email || "",
        password: "",
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Logout
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setTimeout(() => navigate("/login"), 1000);
  };

  // ✅ Handle input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

const handleSaveProfile = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser?.authUID) {
      alert("User not found. Please log in again.");
      navigate("/login");
      return;
    }

    // Ensure auth.currentUser is present
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("No authenticated user found. Please log in again.");
      navigate("/login");
      return;
    }

    // 1) Update Firestore (name + email mirror)
    const userRef = doc(db, "users", storedUser.authUID);
    await updateDoc(userRef, {
      name: profile.name,
      email: profile.email,
      updatedAt: new Date().toISOString(),
    });

    // 2) Update localStorage copy
    const updatedUser = { ...storedUser, name: profile.name, email: profile.email };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Helper: reauth flow that asks for current password and reauthenticates
    const reauthIfNeeded = async (err) => {
      if (err?.code === "auth/requires-recent-login") {
        const currentPassword = window.prompt(
          "For security, please enter your CURRENT password to continue:"
        );
        if (!currentPassword) throw new Error("Re-authentication cancelled by user.");
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        return true;
      }
      return false;
    };

    // 3) Update email in Firebase Auth if changed
    if (profile.email && profile.email !== currentUser.email) {
      try {
        await updateEmail(currentUser, profile.email);
      } catch (err) {
        // try reauth if required then retry
        const reauthed = await reauthIfNeeded(err);
        if (reauthed) {
          await updateEmail(currentUser, profile.email);
        } else {
          throw err;
        }
      }
    }

    // 4) Update password if provided
    if (profile.password && profile.password.trim() !== "") {
      try {
        await updatePassword(currentUser, profile.password);
        alert("✅ Password updated successfully!");
      } catch (err) {
        const reauthed = await reauthIfNeeded(err);
        if (reauthed) {
          await updatePassword(currentUser, profile.password);
          alert("✅ Password updated successfully after re-auth!");
        } else {
          throw err;
        }
      }
    }

    alert("✅ Profile updated successfully!");
    setProfile((prev) => ({ ...prev, password: "" }));
  } catch (err) {
    console.error("Error updating profile:", err);
    // friendly messages
    if (err.code === "auth/wrong-password" || err.message?.includes("wrong-password")) {
      alert("⚠️ The current password you entered is incorrect.");
    } else if (err.code === "auth/invalid-email") {
      alert("⚠️ The provided email is invalid.");
    } else if (err.code === "auth/email-already-in-use") {
      alert("⚠️ That email is already in use by another account.");
    } else {
      alert("❌ Failed to update profile. See console for details.");
    }
  }
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
            <Link to="/dashboard">
              <i className="fa fa-home"></i> Dashboard
            </Link>
            <Link to="/conversion">
              <i className="fa fa-history"></i> Conversions
            </Link>
            <Link to="/settings" className="active">
              <FaUserCog /> Settings
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
      <main className="settings-main">
        <div className="settings-container">
          <header className="settings-header">
            <div className="header-icon">⚙️</div>
            <div>
              <h1>Settings</h1>
              <p>Manage your profile</p>
            </div>
          </header>

          <div className="settings-grid single">
            {/* 🧍 Basic Settings */}
            <div className="settings-card">
              <h2>Basic Settings</h2>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label>Change Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                  value={profile.password}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group readonly">
                <label>Number of Conversion History</label>
                <div className="readonly-box">
                  <FaHistory className="icon" />
                  <span>{conversionCount} total conversions</span>
                </div>
              </div>

              <button className="save-btn" onClick={handleSaveProfile}>
                Save Basic Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
