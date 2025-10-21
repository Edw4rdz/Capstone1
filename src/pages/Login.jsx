import React, { useState } from "react";
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import loginImg from "../assets/loginImg.jpg";
import "./login.css";
import { useNavigate } from "react-router-dom";

// 🔥 Firebase imports
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      // 🔥 Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔍 Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      const userData = {
        name: userDoc.exists() ? userDoc.data().name : "Unknown User",
        email: user.email,
        user_id: user.uid,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Firebase login error:", err);
      let errorMessage = "Error logging in. Please try again.";

      if (err.code === "auth/invalid-email") errorMessage = "Invalid email address.";
      else if (err.code === "auth/user-not-found") errorMessage = "No account found with this email.";
      else if (err.code === "auth/wrong-password") errorMessage = "Incorrect password.";
      else if (err.code === "auth/too-many-requests") errorMessage = "Too many failed attempts. Try again later.";

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Google login handler
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 🧾 Save user data in Firestore if new
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          created_at: new Date(),
        });
      }

      const userData = {
        name: user.displayName,
        email: user.email,
        user_id: user.uid,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      alert("Welcome, " + user.displayName + "!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side */}
        <div className="login-left">
          <h2 className="title">
            Welcome to <span>Slide-IT</span>
          </h2>
          <p className="subtitle">Sign in to start your session</p>

          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <i><FaEnvelope /></i>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-box">
              <i><FaLock /></i>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Divider */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* 🌐 Google Login Button */}
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FaGoogle className="google-icon" />
              Continue with Google
            </button>

            <p className="signup-text">
              Don’t have an account? <a href="/signup">Sign up now</a>
            </p>
          </form>
        </div>

        {/* Right side */}
        <div className="login-right">
          <img src={loginImg} alt="Login" />
        </div>
      </div>
    </div>
  );
}
