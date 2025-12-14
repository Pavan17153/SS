import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css";

const ADMIN_WHITELIST = [
  "pellurupavankumar0@gmail.com",
  "admin@ssfashion.com",
  "ssfashion.admin@gmail.com",
];

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("adminEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  // Auto logout after timeout
  useEffect(() => {
    let timer;
    if (auth.currentUser) {
      timer = setTimeout(async () => {
        await signOut(auth);
        alert("Session expired. Please login again.");
        navigate("/login");
      }, SESSION_TIMEOUT);
    }
    return () => clearTimeout(timer);
  }, [navigate]);

  const loginAdmin = async () => {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (!ADMIN_WHITELIST.includes(email.toLowerCase())) {
      setError("Access denied. Unauthorized admin email.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (remember) {
        localStorage.setItem("adminEmail", email);
      } else {
        localStorage.removeItem("adminEmail");
      }

      setSuccess("Login successful");
      navigate("/", { replace: true });
    } catch {
      setError("Invalid admin credentials");
    }
  };

  const forgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Enter email to reset password");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent to your email");
    } catch {
      setError("Failed to send reset email");
    }
  };

  return (
    <div className="admin-login-page">
      <header className="amazon-header">
        <h1>SS Fashion</h1>
        <span>Admin Console</span>
      </header>

      <div className="admin-login-card">
        <h2>Sign in</h2>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <label>Email</label>
        <input
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="login-options">
          <label className="remember-box">
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember(!remember)}
            />
            <span>Keep me signed in</span>
          </label>

          <button className="forgot-btn" onClick={forgotPassword}>
            Forgot password?
          </button>
        </div>

        <button className="login-btn" onClick={loginAdmin}>
          Login
        </button>

        <p className="login-footer">
          By continuing, you agree to{" "}
          <Link to="/adminterms">SS Fashion Admin Terms & Policies</Link>.
        </p>
      </div>
    </div>
  );
}
