import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import loginImg from "../assets/loginImg.jpg";
import "./login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const res = await axios.post("http://localhost:5000/login", { email, password }, { timeout: 5000 });

      if (res.data?.success) {
        // Save user data to localStorage
        const userData = {
          name: res.data.user.name || "Unknown User",
          email: res.data.user.email || email,
          user_id: res.data.user.user_id || null,
        };
        localStorage.setItem("user", JSON.stringify(userData));

        alert("Login successful!");
        navigate("/dashboard");
      } else {
        alert(res.data?.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);

      let errorMessage = "Error logging in. Please try again.";
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Server endpoint not found. Make sure backend is running.";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Server timed out. Please try again.";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
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
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="show-password">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                disabled={loading}
              />
              <label htmlFor="showPassword"> Show Password</label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="signup-text">
              Don’t have an account? <a href="/signup">Sign up now</a>
            </p>
          </form>
        </div>

        <div className="login-right">
          <img src={loginImg} alt="Login" />
        </div>
      </div>
    </div>
  );
}
