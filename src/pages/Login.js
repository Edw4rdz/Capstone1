import React, { useState } from "react";
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import loginImg from "../assets/loginImg.jpg";
import "./login.css";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

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
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Try to find the user's Firestore doc by authUID (handles numeric doc id layout)
      let userDataFromDb = null;

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("authUID", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        userDataFromDb = { id: docSnap.id, ...docSnap.data() };
      } else {
        // fallback: maybe some accounts were stored at users/{uid}
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userDataFromDb = { id: userDoc.id, ...userDoc.data() };
        }
      }

      // Build a consistent localStorage object
      const localUser = {
        username: userDataFromDb?.username || user.displayName || user.email,
        firstName: userDataFromDb?.firstName || null,
        lastName: userDataFromDb?.lastName || null,
        email: userDataFromDb?.email || user.email,
        user_id: userDataFromDb?.numericId || user.uid,
        authUID: user.uid,
      };

      localStorage.setItem("user", JSON.stringify(localUser));
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

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // If you want to create a Firestore doc for Google users (only if missing)
      // we try to locate a doc by authUID first:
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("authUID", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create a doc at users/{uid} for google users so later sign-in works
        const uidRef = doc(db, "users", user.uid);
        await setDoc(uidRef, {
          name: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString(),
          authUID: user.uid,
        });
      }

      const localUser = {
        username: user.displayName || user.email,
        email: user.email,
        user_id: user.uid,
        authUID: user.uid,
      };

      localStorage.setItem("user", JSON.stringify(localUser));
      alert("Welcome, " + (user.displayName || user.email) + "!");
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

            <div className="divider">
              <span>OR</span>
            </div>

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
