import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !pw || !confirmPw) return setErrorMsg("Please fill all fields.");
    if (!validateEmail(email)) return setErrorMsg("Please enter a valid email address.");
    if (pw !== confirmPw) return setErrorMsg("Passwords do not match.");
    if (pw.length < 6) return setErrorMsg("Password must be at least 6 characters.");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      await sendEmailVerification(userCredential.user);
      alert(`Signup successful! Verification email sent to ${email}. Please verify before logging in.`);
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please login.");
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/password accounts are not enabled. Enable them in Firebase console.");
      } else {
        setErrorMsg(err.message);
      }
    }
  };

  return (
    <div style={{ maxWidth: 450 }} className="mx-auto mt-4">
      <h2 className="mb-3">Create Account</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

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
          placeholder="Create Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Confirm Password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
        />
        <button className="btn btn-success w-100 mb-3">Signup</button>
      </form>

      <p className="text-center mt-2">
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#ff4d6d", fontWeight: "bold" }}>
          Login
        </Link>
      </p>
    </div>
  );
}
