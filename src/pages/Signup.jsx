import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import signupImg from "../assets/signupImg.jpg";
import "./signup.css";

// 🔥 Firebase imports
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, runTransaction } from "firebase/firestore";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Form Validation
  const validateForm = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (!/^[A-Za-z\s]+$/.test(fullName))
      return "Full name should contain only letters and spaces.";

    if (!email.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[cC][oO][mM]$/;
    if (!emailRegex.test(email)) return "Please enter a valid email.";

    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (/\s/.test(password)) return "Password must not contain spaces.";

    return "";
  };

  // ✅ Handle Registration
  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 🔥 Step 1: Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ Firebase user created:", user.uid);

      // 🔢 Step 2: Safely increment the user counter using Firestore transaction
      const counterRef = doc(db, "metadata", "userCounter");

      const newUserId = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          transaction.set(counterRef, { count: 1 });
          return 1;
        }
        const newCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      });

      // 🧾 Step 3: Save user info in Firestore using numeric ID
      const numericDocRef = doc(db, "users", newUserId.toString());
      await setDoc(numericDocRef, {
        name: fullName,
        email: email,
        createdAt: new Date().toISOString(),
        authUID: user.uid,
      });

      // 🔁 Step 4: ALSO write a mirror document keyed by the Firebase Auth UID
      // This allows reads using user.uid (works with your existing security rules)
      const uidDocRef = doc(db, "users", user.uid);
      // We store the same basic fields plus reference to numeric id
      await setDoc(uidDocRef, {
        name: fullName,
        email: email,
        createdAt: new Date().toISOString(),
        numericId: newUserId,
        authUID: user.uid,
      });

      // 💾 Step 5: Store user info locally (cache)
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: fullName,
          email: email,
          user_id: newUserId,
          authUID: user.uid,
        })
      );

      alert(`✅ Account created successfully! (User #${newUserId})`);
      navigate("/dashboard");

    } catch (error) {
      console.error("❌ Firebase Signup Error:", error);
      let errorMessage = "An error occurred. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "permission-denied") {
        errorMessage = "Database permission denied. Check Firestore rules.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UI
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
                  placeholder="Username"
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
