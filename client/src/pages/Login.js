import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // LOGIN
  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !pw) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        pw
      );

      if (!userCredential.user.emailVerified) {
        setErrorMsg("Email not verified. Please verify before login.");
        return;
      }

      rememberMe
        ? localStorage.setItem("rememberEmail", email)
        : localStorage.removeItem("rememberEmail");

      setSuccessMsg("Login successful!");
      navigate("/");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // FORGOT PASSWORD
  const forgotPassword = async () => {
    if (!email) return setErrorMsg("Enter email first.");

    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    setSuccessMsg("Password reset link sent to your email.");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* BRAND */}
        <div className="brand-logo">🛍️ SS Fashion</div>

        <h2 className="auth-title">Sign in</h2>
        <p className="auth-subtitle">Welcome back</p>

        {errorMsg && <p className="auth-error">{errorMsg}</p>}
        {successMsg && <p className="auth-success">{successMsg}</p>}

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="password-wrap">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <span
              className="toggle-eye"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="remember-row">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <button type="button" className="forgot-btn" onClick={forgotPassword}>
              Forgot password?
            </button>
          </div>

          <button className="auth-btn">Login</button>
        </form>

        <div className="divider">New to SS Fashion?</div>

        <Link to="/signup" className="signup-btn">
          Create your SS Fashion account
        </Link>
      </div>
    </div>
  );
}
