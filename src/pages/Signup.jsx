import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import axios from "axios"; 
import signupImg from "../assets/signupImg.jpg"; 
import "./signup.css";

export default function Signup() {
  // States for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/register", {
        name,
        email,
        password,
      });
      alert("User registered!");
    } catch (err) {
      console.error(err);
      alert("Error registering user");
    }
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
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-box">
                <i><FaEnvelope /></i>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-box">
                <i><FaLock /></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
