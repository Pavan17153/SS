// src/components/LoginPopup.js
import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import "./PopupStyles.css";

export default function LoginPopup({
  visible,
  onClose,
  prefillEmail,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [sendingReset, setSendingReset] = useState(false);
  const [loading, setLoading] = useState(false);

  // Basic encoding function for storing password
  const encode = (str) => btoa(str);
  const decode = (str) => atob(str);

  useEffect(() => {
    if (visible) {
      // Load saved credentials
      const savedData = localStorage.getItem("ssfashion-login");

      if (savedData) {
        try {
          const { savedEmail, savedPassword } = JSON.parse(savedData);
          setEmail(savedEmail || "");
          setPassword(savedPassword ? decode(savedPassword) : "");
          setRememberMe(true);
        } catch (e) {
          console.warn("Error reading saved login:", e);
        }
      } else {
        setEmail(prefillEmail || "");
        setPassword("");
        setRememberMe(false);
      }

      setMsg({ text: "", type: "" });
    }
  }, [prefillEmail, visible]);

  if (!visible) return null;

  const submit = async (e) => {
    e?.preventDefault();
    setMsg({ text: "", type: "" });

    if (!email || !password) {
      setMsg({
        text: "Please enter email & password.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // SAVE CREDENTIALS IF REMEMBER ME IS CHECKED
      if (rememberMe) {
        localStorage.setItem(
          "ssfashion-login",
          JSON.stringify({
            savedEmail: email.trim().toLowerCase(),
            savedPassword: encode(password),
          })
        );
      } else {
        localStorage.removeItem("ssfashion-login");
      }

      setMsg({ text: "Login successful!", type: "success" });

      setTimeout(() => {
        onLoginSuccess && onLoginSuccess();
        onClose && onClose();
      }, 600);
    } catch (err) {
      let text = "Login failed.";

      if (err.code === "auth/user-not-found")
        text = "Email not registered. Please signup first.";
      else if (err.code === "auth/wrong-password")
        text = "Incorrect password.";
      else if (err.code === "auth/invalid-email")
        text = "Invalid email.";

      setMsg({ text, type: "error" });
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) {
      setMsg({
        text: "Enter your email to send reset link.",
        type: "error",
      });
      return;
    }

    setSendingReset(true);
    setMsg({ text: "", type: "" });

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setMsg({
        text: "Reset link sent. Check your inbox.",
        type: "success",
      });
    } catch (err) {
      let text = "Cannot send reset email.";

      if (err.code === "auth/user-not-found")
        text = "Email not registered.";

      setMsg({ text, type: "error" });
    }

    setSendingReset(false);
  };

  return (
    <div className="dark-modal-overlay" onClick={onClose}>
      <div
        className="dark-modal-box dark-animate"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ✖
        </button>

        <h3 className="popup-title">Login to Continue</h3>

        {/* MESSAGE INSIDE POPUP */}
        {msg.text && (
          <div
            className={`popup-msg ${
              msg.type === "error" ? "error" : "success"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="login-popup-form">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            className="form-field"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            className="form-field"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* REMEMBER ME CHECKBOX */}
          <label className="remember-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="remember-checkbox"
            />
            Remember Me
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            className="link-btn"
            onClick={handleForgot}
            disabled={sendingReset}
          >
            {sendingReset ? "Sending..." : "Forgot Password?"}
          </button>
        </form>

        <p className="signup-note">
          Don’t have an account? Sign up from the Signup page.
        </p>
      </div>
    </div>
  );
}
