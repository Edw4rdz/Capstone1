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
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password }); // Debug log

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true); // Disable form during request
    try {
      const res = await axios.post("http://localhost:5000/login", { email, password }, {
        // Optional: Add timeout to catch server unavailability
        timeout: 5000,
      });

      if (res.data && res.data.success) {
        alert("Login successful!");
        if (res.data.user && res.data.user.name) {
          const userData = { name: res.data.user.name, email: res.data.user.email };
          localStorage.setItem("user", JSON.stringify(userData));
          console.log("Stored user data:", userData); // Debug log
        } else {
          console.warn("No valid user data returned from server:", res.data.user);
          const fallbackData = { name: "Unknown User", email };
          localStorage.setItem("user", JSON.stringify(fallbackData));
          console.log("Stored fallback data:", fallbackData); // Debug log
        }
        navigate("/dashboard");
      } else {
        alert(res.data?.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", {
        message: err.message,
        response: err.response ? err.response.data : "No response",
        status: err.response ? err.response.status : "Unknown",
      });
      let errorMessage = "Error logging in. Check console for details.";
      if (err.response && err.response.status === 404) {
        errorMessage = "Server endpoint not found. Ensure the backend is running at http://localhost:5000.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Server timed out. Please try again.";
      }
      alert(errorMessage);
    } finally {
      setLoading(false); // Re-enable form
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <h2 className="title">Welcome to <span>Slide-IT</span></h2>
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