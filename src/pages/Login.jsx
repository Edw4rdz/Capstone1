import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import loginImg from "../assets/loginImg.jpg"; // keep your image here
import "./login.css";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      if (res.data.success) {
        alert("Login successful!");
        // Example: redirect user to dashboard later
        // window.location.href = "/dashboard";
      } else {
        alert("Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging in");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* LEFT SIDE - form */}
        <div className="login-left">
          <h2 className="title">
            Welcome to <span>Slide-IT</span>
          </h2>
          <p className="subtitle">Sign in to start your session</p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="input-box">
              <i>
                <FaEnvelope />
              </i>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="input-box">
              <i>
                <FaLock />
              </i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Show password */}
            <div className="show-password">
              <input
                type="checkbox"
                id="showPassword"
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword"> Show Password</label>
            </div>

            {/* Button */}
            <button type="submit" className="login-btn">
              Login
            </button>

            {/* Signup link */}
            <p className="signup-text">
              Don’t have an account? <a href="/signup">Sign up now</a>
            </p>
          </form>
        </div>

        {/* RIGHT SIDE - image */}
        <div className="login-right">
          <img src={loginImg} alt="Login background" />
        </div>
      </div>
    </div>
  );
}
