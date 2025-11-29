import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import RazorpayPayment from "./RazorpayPayment";
import "../Checkout.css";

export default function Checkout() {
  const [userEmail, setUserEmail] = useState("");
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("ssf_cart") || "[]")
  );

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
    phone: "",       // <-- PHONE INPUT WILL SAVE TO DATABASE
    email: "",
    orderNotes: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const shipping = cart.length > 0 ? 60 : 0;
  const grandTotal = total + shipping;

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setForm((prev) => ({ ...prev, email: user.email }));
      }
    });
    window.scrollTo(0, 0);
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="checkout-grid">

      {/* LEFT SIDE — BILLING DETAILS */}
      <div className="checkout-left">
        <h2>Billing Details</h2>

        {userEmail ? (
          <p className="small-muted">Logged in as: {userEmail}</p>
        ) : (
          <p className="small-muted">
            Returning customer? <a href="/login">Click here to login</a>
          </p>
        )}

        <div className="billing-form">

          <div className="form-row">
            <input type="text" name="firstName" placeholder="First name *"
              value={form.firstName} onChange={handleInput} />
            <input type="text" name="lastName" placeholder="Last name *"
              value={form.lastName} onChange={handleInput} />
          </div>

          <input type="text" name="company" placeholder="Company name (optional)"
            value={form.company} onChange={handleInput} />

          <input type="text" name="country" placeholder="Country *"
            value={form.country} onChange={handleInput} />

          <input type="text" name="address1" placeholder="Street address *"
            value={form.address1} onChange={handleInput} />

          <input type="text" name="address2" placeholder="Apartment, suite (optional)"
            value={form.address2} onChange={handleInput} />

          <div className="form-row">
            <input type="text" name="city" placeholder="City *"
              value={form.city} onChange={handleInput} />
            <input type="text" name="state" placeholder="State *"
              value={form.state} onChange={handleInput} />
          </div>

          <div className="form-row">
            <input type="text" name="pin" placeholder="PIN Code *"
              value={form.pin} onChange={handleInput} />
            <input type="text" name="phone" placeholder="Phone *"
              value={form.phone} onChange={handleInput} />   {/* PHONE SAVED */}
          </div>

          <input type="email" name="email" placeholder="Email address *"
            value={form.email} onChange={handleInput} />

          <textarea name="orderNotes" placeholder="Order notes (optional)"
            value={form.orderNotes} onChange={handleInput} />
        </div>
      </div>

      {/* RIGHT SIDE — ORDER SUMMARY */}
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

          <div className="order-total-row">
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>

          <div className="order-total-row">
            <span>Shipping</span>
            <span>₹{shipping}</span>
          </div>

          <div className="order-total-row total">
            <strong>Total</strong>
            <strong>₹{grandTotal}</strong>
          </div>

          <p className="privacy">
            Your personal data will be used to process your order and for other
            purposes described in our <a href="/Privacy">privacy policy</a>.
          </p>

          <div className="terms order-terms">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
            />
            <label>I have read and agree to the website terms & conditions *</label>
          </div>

          {/* Razorpay Button */}
          <RazorpayPayment
            cart={cart}
            form={form}
            totalAmount={grandTotal}
            userEmail={userEmail}
            customerPhone={form.phone}   /** <-- ADDED THIS LINE */
            agreeTerms={agreeTerms}
          />

        </div>
      </div>

    </div>
  );
}
