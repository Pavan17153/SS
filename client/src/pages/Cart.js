// src/components/Cart.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { emitCartUpdate, cartEvent } from "./cartEvents";
import { FaTrash } from "react-icons/fa";
import { auth, db } from "../firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import "../Cart.css";

export default function Cart() {
  const nav = useNavigate();
  const [cart, setCart] = useState([]);
  const [undoItem, setUndoItem] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [user, setUser] = useState(auth.currentUser || null);

  // Show popup message
  const showPopup = (msg) => {
    setPopupMsg(msg);
    setTimeout(() => setPopupMsg(""), 2000);
  };

  // Load cart from localStorage
  const loadCart = () => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    const fixed = stored.map((item) => ({
      ...item,
      qty: item.qty ? item.qty : 1,
      stock: item.stock ? item.stock : 5,
    }));
    setCart(fixed);
  };

  // Load applied coupon from localStorage
  const loadAppliedCoupon = () => {
    const stored = localStorage.getItem("ssf_appliedCoupon");
    if (stored) setAppliedCoupon(JSON.parse(stored));
  };

  // Fetch coupons used by current user
  const fetchUserUsedCoupons = async (email) => {
    if (!email) return [];
    try {
      const q = query(collection(db, "couponUsed"), where("usedBy", "==", email));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data().couponName).filter(Boolean);
    } catch (err) {
      console.error("fetchUserUsedCoupons error:", err);
      return [];
    }
  };

  // Fetch active coupons and filter those already used by user
  const loadCoupons = async () => {
    const email = auth.currentUser?.email;
    const usedCoupons = await fetchUserUsedCoupons(email);

    try {
      const snap = await getDocs(
        query(collection(db, "coupons"), orderBy("createdAt", "desc"))
      );

      const activeCoupons = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.active && !usedCoupons.includes(c.name)); // filter out already used

      setCoupons(activeCoupons);
    } catch (err) {
      console.error("loadCoupons error:", err);
      setCoupons([]);
    }
  };

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      loadCart();
      loadCoupons();
      loadAppliedCoupon();
    });

    const handler = () => loadCart();
    cartEvent.addEventListener("cartUpdated", handler);

    return () => {
      unsubAuth();
      cartEvent.removeEventListener("cartUpdated", handler);
    };
  }, []);

  // TOTALS
  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  // SHIPPING RULES
  let shipping = 0;
  if (cart.length > 0) {
    if (total <= 1500) shipping = 60;
    else if (total <= 3000) shipping = 120;
    else if (total <= 4500) shipping = 180;
    else shipping = 240;
  }

  // APPLY COUPON  ( FIXED 🔥🔥 )
  const applyCoupon = (coupon) => {

    // ---- NEW VALIDATION ADDED ----
    if (total < 700) {
      const need = 700 - total;
      showPopup(`You need to shop ₹${need} more to use this coupon.`);
      return;
    }
    // ---- END FIX ----

    setAppliedCoupon(coupon);
    localStorage.setItem("ssf_appliedCoupon", JSON.stringify(coupon));
    showPopup(`Coupon ${coupon.name} applied for ₹${coupon.amount} off!`);
  };

  // GRAND TOTAL WITH COUPON
  const grandTotal =
    total + shipping - (appliedCoupon ? appliedCoupon.amount : 0);

  // SAVE CART
  const saveCart = (updated) => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    localStorage.setItem(key, JSON.stringify(updated));
    setCart(updated);
    emitCartUpdate();
  };

  // REMOVE ITEM
  const removeItem = (index) => {
    const item = cart[index];
    const updated = cart.filter((_, i) => i !== index);
    setUndoItem({ item, index });
    setUndoVisible(true);
    saveCart(updated);
    setTimeout(() => setUndoVisible(false), 5000);
  };

  const undoDelete = () => {
    if (!undoItem) return;
    const updated = [...cart];
    updated.splice(undoItem.index, 0, undoItem.item);
    saveCart(updated);
    setUndoItem(null);
    setUndoVisible(false);
  };

  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].qty > 1) updated[index].qty -= 1;
    else removeItem(index);
    saveCart(updated);
  };

  const increaseQty = (index) => {
    const updated = [...cart];
    const item = updated[index];
    if (item.qty >= item.stock) {
      showPopup(`Only ${item.stock} items available in stock`);
      return;
    }
    item.qty += 1;
    saveCart(updated);
  };

  const checkout = () => {
    localStorage.setItem("ssf_checkout_total", grandTotal);
    nav("/checkout");
  };

  return (
    <div className="cart-container">
      {popupMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#ff4d4d",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "600",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {popupMsg}
        </div>
      )}

      <button
        onClick={() => nav("/categories")}
        style={{
          background: "#ff4d6d",
          color: "white",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          marginBottom: "15px",
          fontWeight: "600",
        }}
      >
        ← Back
      </button>

      <h2 className="cart-title">Cart</h2>

      {undoVisible && undoItem && (
        <div className="undo-message">
          <span>{undoItem.item.name} removed.</span>
          <button onClick={undoDelete}>Undo?</button>
        </div>
      )}

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <div className="cart-grid">

          {/* LEFT ITEMS */}
          <div className="cart-left">
            <div className="cart-table-header">
              <span>Remove</span>
              <span>Thumbnail</span>
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Subtotal</span>
            </div>

            {cart.map((c, idx) => (
              <div className="cart-row" key={idx}>
                <FaTrash
                  className="delete-icon"
                  onClick={() => removeItem(idx)}
                />
                <img src={c.image} alt="" className="cart-img" />

                <div>
                  <span className="row-product">{c.name}</span>

                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "3px",
                      color: c.stock > 0 ? "#0a8a24" : "#d00000",
                      fontWeight: "600",
                    }}
                  >
                    {c.stock > 0
                      ? `Stock Available: ${c.stock}`
                      : "Out of Stock"}
                  </div>
                </div>

                <span className="row-price">₹{c.price}</span>

                <div className="qty-box">
                  <button onClick={() => decreaseQty(idx)}>-</button>
                  <span>{c.qty}</span>
                  <button
                    onClick={() => increaseQty(idx)}
                    disabled={c.qty >= c.stock}
                    style={{
                      opacity: c.qty >= c.stock ? 0.5 : 1,
                      cursor: c.qty >= c.stock ? "not-allowed" : "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <span className="row-subtotal">₹{c.price * c.qty}</span>
              </div>
            ))}
          </div>

          {/* RIGHT SUMMARY */}
          <div className="cart-right">
            <div className="cart-summary">
              <h3>Basket Totals</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{total}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong>Flat rate: ₹{shipping}</strong>
              </div>

              {/* COUPON BOX */}
              {coupons.length > 0 && !appliedCoupon && (
                <div className="coupon-box">
                  <h4>Available Coupons</h4>
                  {coupons.map((c) => (
                    <button key={c.id} onClick={() => applyCoupon(c)}>
                      {c.name} - ₹{c.amount} Off
                    </button>
                  ))}
                </div>
              )}

              {appliedCoupon && (
                <div className="applied-coupon">
                  Coupon <b>{appliedCoupon.name}</b> applied: ₹
                  {appliedCoupon.amount} off
                </div>
              )}

              <div className="summary-row">
                <span>Total</span>
                <strong>₹{grandTotal}</strong>
              </div>

              <button className="checkout-btn" onClick={checkout}>
                Proceed to Checkout
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
