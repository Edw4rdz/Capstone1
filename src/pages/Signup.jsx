import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import axios from "axios";
import signupImg from "../assets/signupImg.jpg";
import "./signup.css";

export default function Signup() {
  return (
    <div className="signup-page">
      <div className="signup-container">   {/* must match CSS */}
        
        {/* LEFT SIDE IMAGE */}
        <div className="cover">
          <img src={signupImg} alt="Signup background" />
          <div className="text">
            <span className="text-1">Create Account</span>
            <span className="text-2">Join Slide-IT today</span>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="forms">
          <div className="form-content">
            <div className="signup-form">
              <h2 className="title">Sign Up</h2>

              <div className="input-box">
                <i><FaUser /></i>
                <input type="text" placeholder="Full Name" />
              </div>

              <div className="input-box">
                <i><FaEnvelope /></i>
                <input type="email" placeholder="Email Address" />
              </div>

              <div className="input-box">
                <i><FaLock /></i>
                <input type="password" placeholder="Password" />
              </div>

              <div className="button">
                <input type="button" value="Register" />
              </div>

              <p className="sign-up-text">
                Already have an account? <Link to="/login">Login now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
