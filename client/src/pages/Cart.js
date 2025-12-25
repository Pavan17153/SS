// src/components/Cart.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { emitCartUpdate, cartEvent } from "./cartEvents";
import { FaTrash } from "react-icons/fa";
import { auth, db } from "../firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
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

  // Save cart with timestamp
  const saveCart = (updated) => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    localStorage.setItem(key, JSON.stringify(updated));
    // Save timestamp
    localStorage.setItem(`${key}_time`, Date.now());
    setCart(updated);
    emitCartUpdate();
  };

  // Load cart from localStorage
  const loadCart = async () => {
    const filtered = updatedCart.filter(i => i.stockQty > 0);
    if (filtered.length !== updatedCart.length) {
      saveCart(filtered);
      showPopup("Some items were removed because they are out of stock");
    }

    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    const savedTime = parseInt(localStorage.getItem(`${key}_time`) || "0", 10);

    // Remove cart if 2 days passed
    if (savedTime && Date.now() - savedTime > 2 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_time`);
      setCart([]);
      return;
    }

    // Map default values
    // const fixed = stored.map((item) => ({
    //   ...item,
    //   qty: item.qty ? item.qty : 1,
    //   stockQty: item.stockQty !== undefined ? item.stockQty : 5,
    // }));
    const fixed = stored.map((item) => ({
      ...item,
      qty: item.qty ? item.qty : 1,
      stockQty: item.stockQty !== undefined ? item.stockQty : 5,
      category: item.category || "unknown",
    }));

    setCart(fixed);

    // Update stockQty from Firestore
    const updatedCart = await Promise.all(
      fixed.map(async (item) => {
        try {
          const docSnap = await getDoc(doc(db, "products", item.id));
          if (docSnap.exists()) {
            return {
              ...item,
              stockQty: docSnap.data().stockQty || 0,
              category: item.category || docSnap.data().category || "unknown",
            };

          }
          return item;
        } catch {
          return item;
        }
      })
    );

    setCart(updatedCart);
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

  // Fetch active coupons
  const loadCoupons = async () => {
    const email = auth.currentUser?.email;
    const usedCoupons = await fetchUserUsedCoupons(email);

    try {
      const snap = await getDocs(
        query(collection(db, "coupons"), orderBy("createdAt", "desc"))
      );

      const activeCoupons = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.active && !usedCoupons.includes(c.name));

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
  // SHIPPING RULES (Updated for SS Fashion)
  let shipping = 0;
  if (cart.length > 0) {
    if (total >= 1500) shipping = 0; // Free shipping for orders 1500+
    else shipping = 40;              // Flat rate 30 for smaller orders
  }


  // APPLY COUPON
  const applyCoupon = (coupon) => {
    if (total < 700) {
      const need = 700 - total;
      showPopup(`You need to shop ₹${need} more to use this coupon.`);
      return;
    }
    setAppliedCoupon(coupon);
    localStorage.setItem("ssf_appliedCoupon", JSON.stringify(coupon));
    showPopup(`Coupon ${coupon.name} applied for ₹${coupon.amount} off!`);
  };

  // GRAND TOTAL
  const grandTotal = total + shipping - (appliedCoupon ? appliedCoupon.amount : 0);

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
    if (item.qty >= item.stockQty) {
      showPopup(`Only ${item.stockQty} items available in stock`);
      return;
    }
    item.qty += 1;
    saveCart(updated);
  };

  // CHECK STOCK BEFORE PROCEEDING
  // CHECK STOCK BEFORE PROCEEDING - OPTIMIZED
  const proceedCheckout = async () => {
    if (cart.length === 0) {
      showPopup("Your cart is empty");
      return;
    }

    try {
      // Fetch all docs in parallel
      const stockChecks = await Promise.all(
        cart.map(async (item) => {
          const docSnap = await getDoc(doc(db, "products", item.id));
          return { item, docSnap };
        })
      );

      // Validate stock
      for (let { item, docSnap } of stockChecks) {
        if (!docSnap.exists()) {
          showPopup(`"${item.name}" does not exist anymore`);
          return;
        }
        const realStock = docSnap.data().stockQty || 0;
        if (realStock < item.qty) {
          showPopup(`"${item.name}" is out of stock. Only ${realStock} left`);
          return;
        }
      }

      // Save checkout total
      localStorage.setItem("ssf_checkout_total", grandTotal);
      nav("/checkout");
    } catch (err) {
      console.error("Checkout error:", err);
      showPopup("Something went wrong. Please try again.");
    }
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
                      color: c.stockQty > 0 ? "#0a8a24" : "#d00000",
                      fontWeight: "600",
                    }}
                  >
                    {c.stockQty > 0
                      ? `Stock Available: ${c.stockQty}`
                      : "Out of Stock"}
                  </div>
                </div>

                <span className="row-price">₹{c.price}</span>

                <div className="qty-box">
                  <button onClick={() => decreaseQty(idx)}>-</button>
                  <span>{c.qty}</span>
                  <button
                    onClick={() => increaseQty(idx)}
                    disabled={c.qty >= c.stockQty}
                    style={{
                      opacity: c.qty >= c.stockQty ? 0.5 : 1,
                      cursor: c.qty >= c.stockQty ? "not-allowed" : "pointer",
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
              <div className={`summary-row ${shipping === 0 ? "free-shipping" : "flat-shipping"}`}>
                <span>Shipping</span>
                <strong>{shipping === 0 ? "Free" : `₹${shipping}`}</strong>
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

              <button className="checkout-btn" onClick={proceedCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
