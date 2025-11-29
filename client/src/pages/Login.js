import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  const [successMsg, setSuccessMsg] = useState(""); 

  const navigate = useNavigate();

  // ---------------------------
  // LOGIN FUNCTION
  // ---------------------------
  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !pw) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pw);

      if (!userCredential.user.emailVerified) {
        setErrorMsg("Email not verified. Check your inbox and verify before logging in.");
        return;
      }

      setSuccessMsg("Login successful!");
      navigate("/");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setErrorMsg("Email not found. Please signup first.");
      } else if (err.code === "auth/wrong-password") {
        setErrorMsg("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Invalid email address.");
      } else {
        setErrorMsg(err.message);
      }
    }
  };

  // ---------------------------
  // FORGOT PASSWORD FUNCTION
  // ---------------------------
  const forgotPassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email first.");
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMsg("Password reset link sent to your email.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setErrorMsg("Email not registered. Please signup first.");
      } else {
        setErrorMsg(err.message);
      }
    }
  };

  return (
    <div style={{ maxWidth: 450 }} className="mx-auto mt-4">
      <h2 className="mb-3">Login</h2>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}

      <form onSubmit={submit}>
        <input
          className="form-control mb-3"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Enter Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button className="btn btn-primary w-100 mb-3">Login</button>
      </form>

      <p className="text-center">
        <button
          onClick={forgotPassword}
          style={{
            border: "none",
            background: "none",
            color: "#007bff",
            cursor: "pointer",
          }}
        >
          Forgot Password?
        </button>
      </p>

      <p className="text-center mt-2">
        Don't have an account?{" "}
        <Link to="/signup" style={{ color: "#ff4d6d", fontWeight: "bold" }}>
          Create Account
        </Link>
      </p>
    </div>
  );
}
