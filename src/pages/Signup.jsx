import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import axios from "axios";
import signupImg from "../assets/signupImg.jpg";
import "./signup.css";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
   if (!fullName.trim()) return "Full name is required.";

  // ❌ Prevent digits or special characters (only letters and spaces allowed)
  if (!/^[A-Za-z\s]+$/.test(fullName))
    return "Full name should contain only letters and spaces.";

  if (!email.trim()) return "Email is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[cC][oO][mM]$/;
  if (!emailRegex.test(email)) return "Please re-enter your email.";

  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";

  // 🚫 Prevent spaces in password
  if (/\s/.test(password)) return "Password must not contain spaces.";

  return "";
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/register", {
        name: fullName,
        email,
        password,
      });

      const data = response.data;

      if (data.success) {
        alert(data.message || "✅ Account created successfully!");
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          localStorage.setItem("user", JSON.stringify({ name: fullName, email }));
        }
        navigate("/dashboard");
      } else {
        setError(data.message || "❌ Signup failed: Unknown error");
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
      let errorMessage = "An error occurred. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Server endpoint not found. Ensure the backend is running at http://localhost:5000.";
      } else if (error.response?.status === 401) {
        errorMessage = error.response.data?.message || "Unauthorized. Check your credentials.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Server timed out. Please try again.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid input.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="cover">
          <img src={signupImg} alt="Signup background" />
          <div className="text">
            <span className="text-1">Create Account</span>
            <span className="text-2">Join Slide-IT today</span>
          </div>
        </div>

        <div className="forms">
          <div className="form-content">
            <div className="signup-form">
              <h2 className="title">Sign Up</h2>

              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

              <div className="input-box">
                <i><FaUser /></i>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-box">
                <i><FaEnvelope /></i>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-box">
                <i><FaLock /></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              <div className="button">
                <input
                  type="button"
                  value={loading ? "Registering..." : "Register"}
                  onClick={handleRegister}
                  disabled={loading}
                />
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
