import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
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
    phone: "",
    email: "",
    orderNotes: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  let shipping =0;

  if (cart.length > 0) {
    if (total <= 1500) {
      shipping = 60;
    } else if (total > 1500 && total <= 3000) {
      shipping = 120;
    } else if (total > 3000 && total <= 4500) {
      shipping = 180;
    } else {
      shipping = 240; // for 4500–6000
    }
  }
  const grandTotal = total + shipping;

  // Get logged in user's email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setForm((prev) => ({ ...prev, email: user.email }));
      } else {
        setUserEmail("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for payment success
  useEffect(() => {
    const handler = async (e) => {
      const paymentId = e.detail?.paymentId;

      if (!paymentId) return;

      if (!userEmail) {
        alert("User not logged in. Cannot save order.");
        return;
      }

      try {
        // Save order to Firestore
        await addDoc(collection(db, "orders"), {
          customerEmail: userEmail,
          customerPhone: form.phone,
          billingDetails: { ...form },
          items: cart.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
            image: item.image || "",
          })),
          totalPrice: grandTotal,
          paymentId: paymentId,
          status: "paid",
          createdAt: Timestamp.now(),
        });

        alert("Order Saved Successfully!");
        localStorage.removeItem("ssf_cart");
        // redirect to orders page (or success page)
        window.location.href = "/orders";
      } catch (err) {
        console.error("Error saving order:", err);
        alert("Error saving order to database. Check console.");
      }
    };

    window.addEventListener("payment_success", handler);
    return () => window.removeEventListener("payment_success", handler);
  }, [cart, form, userEmail, grandTotal]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="checkout-grid">
      {/* LEFT: Billing Form */}
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
            <input type="text" name="firstName" placeholder="First name *" value={form.firstName} onChange={handleInput} />
            <input type="text" name="lastName" placeholder="Last name *" value={form.lastName} onChange={handleInput} />
          </div>

          <input type="text" name="company" placeholder="Company name (optional)" value={form.company} onChange={handleInput} />
          <input type="text" name="country" placeholder="Country *" value={form.country} onChange={handleInput} />
          <input type="text" name="address1" placeholder="Street address *" value={form.address1} onChange={handleInput} />
          <input type="text" name="address2" placeholder="Apartment, suite (optional)" value={form.address2} onChange={handleInput} />

          <div className="form-row">
            <input type="text" name="city" placeholder="City *" value={form.city} onChange={handleInput} />
            <input type="text" name="state" placeholder="State *" value={form.state} onChange={handleInput} />
          </div>

          <div className="form-row">
            <input type="text" name="pin" placeholder="PIN Code *" value={form.pin} onChange={handleInput} />
            <input type="text" name="phone" placeholder="Phone *" value={form.phone} onChange={handleInput} />
          </div>

          <input type="email" name="email" placeholder="Email address *" value={form.email} onChange={handleInput} />
          <textarea name="orderNotes" placeholder="Order notes (optional)" value={form.orderNotes} onChange={handleInput} />
        </div>
      </div>

      {/* RIGHT: Order Summary + Payment */}
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

          <RazorpayPayment
            cart={cart}
            form={form}
            totalAmount={grandTotal}
            userEmail={userEmail}
            customerPhone={form.phone}
            agreeTerms={agreeTerms}
          />
        </div>
      </div>
    </div>
  );
}
