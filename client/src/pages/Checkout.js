﻿// src/pages/Checkout.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import RazorpayPayment from "./RazorpayPayment"; // adjust path if different
import EmailExistPopup from "./EmailExistPopup";
import LoginPopup from "./LoginPopup";
import "../Checkout.css";
import "./PopupStyles.css";

/* INDIA_STATES and generateRandomPassword as before */
const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"
];

function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let pw = "";
  for (let i = 0; i < length; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

export default function Checkout() {
  const [userEmail, setUserEmail] = useState("");
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem("ssf_cart") || "[]"));

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    country: "India",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pin: "",
    phone: "",
    email: "",
    orderNotes: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);

  // popups
  const [emailExistPopupVisible, setEmailExistPopupVisible] = useState(false);
  const [loginPopupVisible, setLoginPopupVisible] = useState(false);
  const [loginPrefillEmail, setLoginPrefillEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState(null); // { type, text }
  const [proceedToPayment, setProceedToPayment] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  let shipping = 0;
  if (cart.length > 0) {
    if (total <= 1500) shipping = 60;
    else if (total <= 3000) shipping = 120;
    else if (total <= 4500) shipping = 180;
    else shipping = 240;
  }
  const grandTotal = total + shipping;

  // auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setForm(prev => ({ ...prev, email: user.email }));
      } else {
        setUserEmail("");
      }
    });
    return () => unsub();
  }, []);

  // state suggestions
  useEffect(() => {
    const q = (form.state || "").trim().toLowerCase();
    if (!q) return setStateSuggestions([]);
    const matched = INDIA_STATES.filter((s) => s.toLowerCase().startsWith(q)).slice(0, 8);
    setStateSuggestions(matched);
  }, [form.state]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = ["firstName","lastName","address1","address2","city","state","pin","phone","email"];
    for (const key of required) {
      if (!form[key] || String(form[key]).trim() === "") {
        return { ok: false, field: key };
      }
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) return { ok: false, field: "email" };
    const phoneRe = /^\d{7,15}$/;
    if (!phoneRe.test(form.phone.replace(/\D/g, ""))) return { ok: false, field: "phone" };
    if (!agreeTerms) return { ok: false, field: "agreeTerms" };
    if (!cart || cart.length === 0) return { ok: false, field: "cart" };
    return { ok: true };
  };

  // click Pay Now: pre-check email registration
  const handlePayNowClicked = async () => {
    // clear prior info
    setInfoMessage(null);

    const v = validate();
    if (!v.ok) {
      if (v.field === "agreeTerms") setInfoMessage({ type: "error", text: "Please accept terms & conditions." });
      else if (v.field === "cart") setInfoMessage({ type: "error", text: "Your cart is empty." });
      else setInfoMessage({ type: "error", text: `Please fill required field: ${v.field}` });
      return;
    }

    const email = (form.email || "").trim().toLowerCase();
    if (!email) {
      setInfoMessage({ type: "error", text: "Please provide a valid email." });
      return;
    }

    // If already logged in as same email -> go to payment directly
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email) {
      setProceedToPayment(true);
      return;
    }

    setCheckingEmail(true);

    try {
      // fetch sign-in methods to see if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods && methods.length > 0) {
        // email registered -> ask user to login
        setLoginPrefillEmail(email);
        setEmailExistPopupVisible(true);
        setCheckingEmail(false);
        return;
      }

      // email not registered -> create account silently then start payment
      const randomPw = generateRandomPassword(12);
      try {
        await createUserWithEmailAndPassword(auth, email, randomPw);
      } catch (createErr) {
        // If create fails (rare), attempt signIn with same credentials (unlikely) — if that also fails, open login popup
        try {
          await signInWithEmailAndPassword(auth, email, randomPw);
        } catch (signinErr) {
          // Auto account creation & login failed -> ask user to login manually (prefill email)
          setLoginPrefillEmail(email);
          setLoginPopupVisible(true);
          setCheckingEmail(false);
          return;
        }
      }

      // send reset so user can set password (best practice)
      try { await sendPasswordResetEmail(auth, email); } catch (err) { /* ignore */ }

      // now we are signed in as new user -> proceed to payment
      setProceedToPayment(true);
      setCheckingEmail(false);
    } catch (err) {
      console.error("Error checking email:", err);
      setInfoMessage({ type: "error", text: "Error checking email registration. Try again." });
      setCheckingEmail(false);
    }
  };

  // Payment success handler (RazorpayPayment must dispatch 'payment_success' event with detail.paymentId)
  useEffect(() => {
    const handler = async (e) => {
      const paymentId = e.detail?.paymentId;
      if (!paymentId) return;

      setLoadingSave(true);
      try {
        const orderEmail = (form.email || "").trim().toLowerCase();
        const currentUser = auth.currentUser;

        if (!currentUser || !currentUser.email || currentUser.email.toLowerCase() !== orderEmail) {
          setInfoMessage({ type: "error", text: "Session expired or user mismatch. Please login and try again." });
          setLoadingSave(false);
          return;
        }

        // Save order to Firestore
        await saveOrderToFirestore(orderEmail, paymentId);

        setInfoMessage({ type: "success", text: "Order saved successfully. Redirecting to Orders page..." });
        localStorage.removeItem("ssf_cart");
        setTimeout(() => window.location.href = "/orders", 900);
      } catch (err) {
        console.error("Error saving order after payment:", err);
        setInfoMessage({ type: "error", text: "Could not save order. Check console." });
      } finally {
        setLoadingSave(false);
      }
    };

    window.addEventListener("payment_success", handler);
    return () => window.removeEventListener("payment_success", handler);
  }, [form, cart]);

  const saveOrderToFirestore = async (orderEmail, paymentId) => {
    const itemsForDb = cart.map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty || 1,
      image: item.image || "",
      category: item.category || "",
      subCategory: item.subCategory || ""
    }));

    const orderDoc = {
      customerEmail: orderEmail,
      customerPhone: form.phone,
      billingDetails: { ...form },
      items: itemsForDb,
      totalPrice: grandTotal,
      paymentId: paymentId,
      status: "paid",
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, "orders"), orderDoc);
  };

  // open login popup from EmailExist popup
  const openLoginFromExistPopup = (email) => {
    setEmailExistPopupVisible(false);
    setLoginPrefillEmail(email || "");
    setTimeout(() => setLoginPopupVisible(true), 80);
  };

  // after login success
  const handleLoginSuccess = () => {
    setLoginPopupVisible(false);
    setInfoMessage({ type: "success", text: "Logged in. Click Pay Now again to continue." });
    // user will click Pay Now again — now fetchSignInMethodsForEmail will detect registered & proceed
  };

  return (
    <>
      <div style={{ maxWidth: 1150, margin: "10px auto 0", padding: "0 20px" }}>
        {infoMessage && (
          <div className={`popup-msg ${infoMessage.type === "error" ? "error" : "success"}`} style={{ maxWidth: 1150 }}>
            {infoMessage.text}
          </div>
        )}
      </div>

      <div className="checkout-grid" style={{ maxWidth: 1150, margin: "18px auto 40px" }}>
        <div className="checkout-left">
          <h2>Billing Details</h2>

          {userEmail ? (
            <p className="small-muted">Logged in as: {userEmail}</p>
          ) : (
            <p className="small-muted">Returning customer? <a href="/login">Click here to login</a></p>
          )}

          <div className="billing-form">
            <div className="form-row">
              <input type="text" name="firstName" placeholder="First name *" value={form.firstName} onChange={handleInput} />
              <input type="text" name="lastName" placeholder="Last name *" value={form.lastName} onChange={handleInput} />
            </div>

            <input type="text" name="company" placeholder="Company name (optional)" value={form.company} onChange={handleInput} />
            <input type="text" name="country" placeholder="Country *" value={form.country} onChange={handleInput} />
            <input type="text" name="address1" placeholder="Street address *" value={form.address1} onChange={handleInput} />
            <input type="text" name="address2" placeholder="Apartment, suite (optional) *" value={form.address2} onChange={handleInput} />

            <div className="form-row">
              <input type="text" name="city" placeholder="City *" value={form.city} onChange={handleInput} />
              <div style={{ position: "relative", flex: 1 }}>
                <input type="text" name="state" placeholder="State *" value={form.state} onChange={handleInput} autoComplete="off" />
                {stateSuggestions.length > 0 && (
                  <div className="state-suggestions">
                    {stateSuggestions.map((s, idx) => (
                      <div key={idx} className="state-suggestion-item" onClick={() => setForm(prev => ({ ...prev, state: s }))}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <input type="text" name="pin" placeholder="PIN Code *" value={form.pin} onChange={handleInput} />
              <input type="text" name="phone" placeholder="Phone *" value={form.phone} onChange={handleInput} />
            </div>

            <input type="email" name="email" placeholder="Email address *" value={form.email} onChange={handleInput} />
            <textarea name="orderNotes" placeholder="Order notes (optional)" value={form.orderNotes} onChange={handleInput} />

            {!userEmail && (
              <div style={{ marginTop: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={createAccount} onChange={() => setCreateAccount(!createAccount)} />
                  <span>Create account for faster checkout & order tracking</span>
                </label>
                <p style={{ fontSize: 13, color: "#444", marginTop: 6 }}>
                  If you don't create an account explicitly we may create one silently to save this order and send a password reset email.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="checkout-right">
          <h3>Your Order</h3>

          <div className="order-summary">
            {cart.map((item, idx) => (
              <div className="order-item" key={idx}>
                <span>{item.name} × {item.qty || 1}</span>
                <span>₹{item.price * (item.qty || 1)}</span>
              </div>
            ))}

            <hr />
            <div className="order-total-row"><span>Subtotal</span><span>₹{total}</span></div>
            <div className="order-total-row"><span>Shipping</span><span>₹{shipping}</span></div>
            <div className="order-total-row total"><strong>Total</strong><strong>₹{grandTotal}</strong></div>

            <div className="terms order-terms">
              <input type="checkbox" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} />
              <label>I have read and agree to the website terms & conditions *</label>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="place-order-btn"
                onClick={handlePayNowClicked}
                disabled={checkingEmail || loadingSave}
                style={{ flex: 1 }}
              >
                {checkingEmail ? "Checking..." : "Pay Now"}
              </button>
            </div>

            {/* When proceedToPayment true => mount RazorpayPayment with autoStart */}
           <div style={{ marginTop: 10 }}>
  {proceedToPayment && (
    <RazorpayPayment
      cart={cart}
      form={form}
      totalAmount={grandTotal}
      userEmail={userEmail || form.email}
      customerPhone={form.phone}
      agreeTerms={agreeTerms}
      autoStart={true}
    />
  )}
</div>


            {loadingSave && <p style={{ color: "#ff6b81", marginTop: 8 }}>Processing order, please wait...</p>}
          </div>
        </div>
      </div>

      {/* POPUPS */}
      <EmailExistPopup
        visible={emailExistPopupVisible}
        email={loginPrefillEmail}
        onClose={() => setEmailExistPopupVisible(false)}
        onOpenLogin={openLoginFromExistPopup}
      />

      <LoginPopup
        visible={loginPopupVisible}
        onClose={() => setLoginPopupVisible(false)}
        prefillEmail={loginPrefillEmail}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
