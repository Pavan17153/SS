// src/components/Cart.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { emitCartUpdate, cartEvent } from "./cartEvents";   // ✅ FIXED IMPORT
import { FaTrash } from "react-icons/fa";
import { auth } from "../firebase";
import "../Cart.css";

export default function Cart() {
  const nav = useNavigate();
  const [cart, setCart] = useState([]);
  const [undoItem, setUndoItem] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);

  // Load correct cart
  const loadCart = () => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setCart(stored);
  };

  useEffect(() => {
    loadCart();

    // Listen for login/logout
    const unsub = auth.onAuthStateChanged(() => loadCart());

    // Listen for unified cart update event
    const handler = () => loadCart();
    cartEvent.addEventListener("cartUpdated", handler);

    return () => {
      unsub();
      cartEvent.removeEventListener("cartUpdated", handler);
    };
  }, []);

  // TOTALS
  const total = cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

  // SHIPPING RULES
  let shipping = 0;
  if (cart.length > 0) {
    if (total <= 1500) shipping = 60;
    else if (total <= 3000) shipping = 120;
    else if (total <= 4500) shipping = 180;
    else shipping = 240;
  }

  const grandTotal = total + shipping;

  // SAVE CART + NOTIFY NAVBAR
  const saveCart = (updated) => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    localStorage.setItem(key, JSON.stringify(updated));
    setCart(updated);
    emitCartUpdate();  // 🔥 Notify navbar
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

  // UNDO
  const undoDelete = () => {
    if (!undoItem) return;
    const updated = [...cart];
    updated.splice(undoItem.index, 0, undoItem.item);
    saveCart(updated);
    setUndoItem(null);
    setUndoVisible(false);
  };

  // DECREASE QTY
  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].qty > 1) {
      updated[index].qty -= 1;
      saveCart(updated);
    } else {
      removeItem(index);
    }
  };

  // INCREASE QTY
  const increaseQty = (index) => {
    const updated = [...cart];
    updated[index].qty += 1;
    saveCart(updated);
  };

  // CHECKOUT
  const checkout = () => {
    localStorage.setItem("ssf_checkout_total", grandTotal);
    nav("/checkout");
  };

  return (
    <div className="cart-container">

      {/* BACK BUTTON */}
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
          fontWeight: "600"
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
                <FaTrash className="delete-icon" onClick={() => removeItem(idx)} />
                <img src={c.image} alt="" className="cart-img" />
                <span className="row-product">{c.name}</span>
                <span className="row-price">₹{c.price}</span>

                <div className="qty-box">
                  <button onClick={() => decreaseQty(idx)}>-</button>
                  <span>{c.qty}</span>
                  <button onClick={() => increaseQty(idx)}>+</button>
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
