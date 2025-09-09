import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import axios from "axios";
import signupImg from "../assets/signupImg.jpg";
import "./signup.css";

export default function Signup() {
  // State for form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/register", {
  fullName,
  email,
  password,
});

      if (res.data.success) {
        setMessage("✅ Account created successfully! You can now log in.");
        setFullName("");
        setEmail("");
        setPassword("");
      } else {
        setMessage("⚠️ " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error connecting to server.");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
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

              <form onSubmit={handleSubmit}>
                <div className="input-box">
                  <i><FaUser /></i>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-box">
                  <i><FaEnvelope /></i>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="input-box">
                  <i><FaLock /></i>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="button">
                  <input type="submit" value="Register" />
                </div>
              </form>

              {/* Show messages */}
              {message && <p className="message">{message}</p>}

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
