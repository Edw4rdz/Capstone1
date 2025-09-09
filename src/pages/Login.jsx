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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });

      if (res.data.success) {
        alert("Login successful!");
        navigate("/dashboard");
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
        <div className="login-left">
          <h2 className="title">Welcome to <span>Slide-IT</span></h2>
          <p className="subtitle">Sign in to start your session</p>

          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <i><FaEnvelope /></i>
              <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-box">
              <i><FaLock /></i>
              <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="show-password">
              <input type="checkbox" id="showPassword" onChange={() => setShowPassword(!showPassword)} />
              <label htmlFor="showPassword"> Show Password</label>
            </div>
            <button type="submit" className="login-btn">Login</button>
            <p className="signup-text">Don’t have an account? <a href="/signup">Sign up now</a></p>
          </form>
        </div>

        <div className="login-right">
          <img src={loginImg} alt="Login" />
        </div>
      </div>
    </div>
  );
}
