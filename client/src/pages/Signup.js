import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import "./Signup.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ========================
  // EMAIL SIGNUP
  // ========================
  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !pw || !confirmPw)
      return setErrorMsg("Please fill all fields.");

    if (!validateEmail(email))
      return setErrorMsg("Please enter a valid email address.");

    if (pw !== confirmPw)
      return setErrorMsg("Passwords do not match.");

    if (pw.length < 6)
      return setErrorMsg("Password must be at least 6 characters.");

    if (!agree)
      return setErrorMsg("Please agree to the Terms & Conditions.");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pw
      );
      await sendEmailVerification(userCredential.user);
      alert(
        `Signup successful! Verification email sent to ${email}. Please verify before logging in.`
      );
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please login.");
      } else {
        setErrorMsg(err.message);
      }
    }
  };

  // ========================
  // GOOGLE SIGNUP (FIXED & STABLE)
  // ========================
  const signupWithGoogle = async () => {
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") return;
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2 className="signup-title">Create Account</h2>

        {errorMsg && (
          <div className="alert alert-danger text-center">{errorMsg}</div>
        )}

        {/* GOOGLE SIGNUP */}
        <button className="google-btn" onClick={signupWithGoogle}>
          <FaGoogle color="#DB4437" />
          Sign up with Google
        </button>

        <div className="text-center my-3">or</div>

        <form onSubmit={submit}>
          {/* EMAIL */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-3 position-relative">
            <label className="form-label fw-semibold">Password</label>
            <input
              type={showPw ? "text" : "password"}
              className="form-control"
              placeholder="Create password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <span className="eye-icon" onClick={() => setShowPw(!showPw)}>
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="mb-3 position-relative">
            <label className="form-label fw-semibold">Confirm Password</label>
            <input
              type={showConfirmPw ? "text" : "password"}
              className="form-control"
              placeholder="Confirm password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
            <span
              className="eye-icon"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
            >
              {showConfirmPw ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* TERMS */}
          <div className="mb-3 terms-box">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the <Link to="/terms">Terms & Conditions</Link>
            </span>
          </div>

          <button className="signup-btn w-100">
            Create your account
          </button>
        </form>

        <hr className="my-4" />

        <p className="text-center mb-0">
          Already have an account?{" "}
          <Link to="/login" className="fw-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
