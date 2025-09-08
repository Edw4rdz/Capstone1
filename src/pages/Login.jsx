import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import loginImg from "../assets/loginImg.jpg"; // keep your image here
import "./login.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-page">
      <div className="login-container">
        {/* LEFT SIDE - form */}
        <div className="login-left">
          <h2 className="title">
            Welcome to <span>Slide-IT</span>
          </h2>
          <p className="subtitle">Sign in to start your session</p>

          <form>
            {/* Email */}
            <div className="input-box">
              <i>
                <FaEnvelope />
              </i>
              <input type="email" placeholder="Enter your email" required />
            </div>

            {/* Password */}
            <div className="input-box">
              <i>
                <FaLock />
              </i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
