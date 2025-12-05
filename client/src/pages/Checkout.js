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
import RazorpayPayment from "./RazorpayPayment";
import EmailExistPopup from "./EmailExistPopup";
import LoginPopup from "./LoginPopup";
import "../Checkout.css";
import "./PopupStyles.css";

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

  const loadCorrectCart = () => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    return JSON.parse(localStorage.getItem(key) || "[]");
  };

  const [cart, setCart] = useState(loadCorrectCart());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      setCart(loadCorrectCart());
    });
    return () => unsub();
  }, []);

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

  const [emailExistPopupVisible, setEmailExistPopupVisible] = useState(false);
  const [loginPopupVisible, setLoginPopupVisible] = useState(false);
  const [loginPrefillEmail, setLoginPrefillEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState(null);
  const [proceedToPayment, setProceedToPayment] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [accountCreatedEmail, setAccountCreatedEmail] = useState("");

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  let shipping = 0;
  if (cart.length > 0) {
    if (total <= 1500) shipping = 60;
    else if (total <= 3000) shipping = 120;
    else if (total <= 4500) shipping = 180;
    else shipping = 240;
  }

  const grandTotal = total + shipping;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setForm(prev => ({ ...prev, email: user.email }));
        setCart(loadCorrectCart());
      } else {
        setUserEmail("");
        setCart(loadCorrectCart());
      }
    });
    return () => unsub();
  }, []);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return { ok: false, field: "email" };
    if (!/^\d{7,15}$/.test(form.phone.replace(/\D/g, ""))) return { ok: false, field: "phone" };
    if (!agreeTerms) return { ok: false, field: "agreeTerms" };
    if (!cart || cart.length === 0) return { ok: false, field: "cart" };
    return { ok: true };
  };

  // ⭐ NEW — auto-hide popup message after 7 seconds
  useEffect(() => {
    if (!infoMessage) return;
    const timer = setTimeout(() => setInfoMessage(null), 7000);
    return () => clearTimeout(timer);
  }, [infoMessage]);

  const handlePayNowClicked = async () => {
    setInfoMessage(null);

    const v = validate();
    if (!v.ok) {
      if (v.field === "agreeTerms") setInfoMessage({ type: "error", text: "Please accept terms & conditions." });
      else if (v.field === "cart") setInfoMessage({ type: "error", text: "Your cart is empty." });
      else setInfoMessage({ type: "error", text: `Please fill required field: ${v.field}` });
      return;
    }

    const email = form.email.trim().toLowerCase();
    if (!email) return setInfoMessage({ type: "error", text: "Please provide a valid email." });

    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email.toLowerCase() === email) {
      setProceedToPayment(true);
      return;
    }

    setCheckingEmail(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        setLoginPrefillEmail(email);
        setEmailExistPopupVisible(true);
        setCheckingEmail(false);
        return;
      }

      const randomPw = generateRandomPassword(12);
      try {
        await createUserWithEmailAndPassword(auth, email, randomPw);
        setAccountCreatedEmail(email);
      } catch {
        try {
          await signInWithEmailAndPassword(auth, email, randomPw);
        } catch {
          setLoginPrefillEmail(email);
          setLoginPopupVisible(true);
          setCheckingEmail(false);
          return;
        }
      }

      try { await sendPasswordResetEmail(auth, email); } catch {}

      setProceedToPayment(true);
      setCheckingEmail(false);

    } catch (err) {
      setInfoMessage({ type: "error", text: "Error checking email registration. Try again." });
      setCheckingEmail(false);
    }
  };

  useEffect(() => {
    const handler = async (e) => {
      const paymentId = e.detail?.paymentId;
      if (!paymentId) return;

      setLoadingSave(true);
      try {
        const orderEmail = form.email.trim().toLowerCase();
        const currentUser = auth.currentUser;

        if (!currentUser || currentUser.email.toLowerCase() !== orderEmail) {
          setInfoMessage({ type: "error", text: "Session expired. Please login again." });
          setLoadingSave(false);
          return;
        }

        await saveOrderToFirestore(orderEmail, paymentId);

        const email = auth.currentUser?.email;
        if (email) {
          localStorage.removeItem(`ssf_cart_${email}`);
        } else {
          localStorage.removeItem("ssf_cart");
        }
        setCart([]);

        if (accountCreatedEmail) {
          setInfoMessage({
            type: "success",
            text: `Account created for email: ${accountCreatedEmail}. Please check your inbox (and spam folder) to reset your password.`
          });
          setAccountCreatedEmail("");
          setTimeout(() => window.location.href = "/orders", 7000);
        } else {
          setInfoMessage({ type: "success", text: "Order saved! Redirecting…" });
          setTimeout(() => window.location.href = "/orders", 900);
        }

      } catch {
        setInfoMessage({ type: "error", text: "Could not save order." });
      } finally {
        setLoadingSave(false);
      }
    };

    window.addEventListener("payment_success", handler);
    return () => window.removeEventListener("payment_success", handler);
  }, [form, cart, accountCreatedEmail]);

  const saveOrderToFirestore = async (orderEmail, paymentId) => {
    const itemsForDb = cart.map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty || 1,
      image: item.image || "",
      category: item.category || "",
      subCategory: item.subCategory || ""
    }));

    await addDoc(collection(db, "orders"), {
      customerEmail: orderEmail,
      customerPhone: form.phone,
      billingDetails: { ...form },
      items: itemsForDb,
      totalPrice: grandTotal,
      paymentId,
      status: "paid",
      createdAt: Timestamp.now(),
    });
  };

  const openLoginFromExistPopup = (email) => {
    setEmailExistPopupVisible(false);
    setLoginPrefillEmail(email);
    setTimeout(() => setLoginPopupVisible(true), 80);
  };

  const handleLoginSuccess = () => {
    setLoginPopupVisible(false);
    setCart(loadCorrectCart());
    setInfoMessage({ type: "success", text: "Logged in. Click Pay Now again." });
  };

  return (
    <>
      <div style={{ maxWidth: 1150, margin: "10px auto" }}>
        {infoMessage && (
          <div className={`popup-msg ${infoMessage.type}`} style={{ maxWidth: 1150 }}>
            {infoMessage.text}
          </div>
        )}
      </div>

      <div className="checkout-grid" style={{ maxWidth: 1150, margin: "18px auto 40px" }}>
        
        {/* LEFT */}
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
                  If you don't create an account explicitly we may create one silently to save this order.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
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

            <button
              className="place-order-btn"
              onClick={handlePayNowClicked}
              disabled={checkingEmail || loadingSave}
              style={{ marginTop: 12 }}
            >
              {checkingEmail ? "Checking..." : "Pay Now"}
            </button>

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

            {loadingSave && (
              <p style={{ color: "#ff6b81", marginTop: 8 }}>Processing order, please wait...</p>
            )}
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
