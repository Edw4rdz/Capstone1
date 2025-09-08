import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import signupImg from "../assets/signupImg.jpg"; 
import "./signup.css"; // gamitin yung CSS mo na tama

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Signup form submitted!");
  };

  return (
    <div className="container">
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
            <div className="title">Sign Up</div>
            <form onSubmit={handleSubmit}>
              <div className="input-box">
                <i><FaUser /></i>
                <input type="text" placeholder="Enter your name" required />
              </div>

              <div className="input-box">
                <i><FaEnvelope /></i>
                <input type="email" placeholder="Enter your email" required />
              </div>

              <div className="input-box">
                <i><FaLock /></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="text show-password">
                <input
                  type="checkbox"
                  onChange={() => setShowPassword(!showPassword)}
                />{" "}
                Show Password
              </div>

              <div className="button">
                <input type="submit" value="Sign Up" />
              </div>

              <div className="sign-up-text">
                Already have an account? <Link to="/login">Login here</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
