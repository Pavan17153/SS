import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import "../Cart.css";

export default function Cart() {
  const nav = useNavigate();
  const [cart, setCart] = useState([]);
  const [undoItem, setUndoItem] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [minWarning, setMinWarning] = useState("");
  const [stockWarning, setStockWarning] = useState("");

  useEffect(() => {
    let unsubscribe = null;

    const trackUser = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const cartRef = doc(db, "carts", user.uid);
        unsubscribe = onSnapshot(cartRef, (snap) => {
          setCart(snap.exists() ? snap.data().items || [] : []);
        });
      } else {
        setCart(JSON.parse(localStorage.getItem("ssf_cart") || "[]"));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const saveCart = async (updated) => {
    const user = auth.currentUser;

    if (user) {
      await setDoc(doc(db, "carts", user.uid), { items: updated }, { merge: true });
    } else {
      localStorage.setItem("ssf_cart", JSON.stringify(updated));
    }

    setCart(updated);
  };

  const removeItem = (index) => {
    const item = cart[index];
    const updated = cart.filter((_, i) => i !== index);
    setUndoItem({ item, index });
    setUndoVisible(true);
    saveCart(updated);
    setTimeout(() => setUndoVisible(false), 3000);
  };

  const undoDelete = () => {
    if (undoItem) {
      const updated = [...cart];
      updated.splice(undoItem.index, 0, undoItem.item);
      saveCart(updated);
      setUndoVisible(false);
    }
    setUndoItem(null);
  };

  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].qty <= 1) {
      setMinWarning("Minimum quantity is 1");
      setTimeout(() => setMinWarning(""), 2000);
      return;
    }
    updated[index].qty -= 1;
    saveCart(updated);
  };

  const increaseQty = (index) => {
    const updated = [...cart];
    const item = updated[index];
    const stock = Number(item.stock) || 0;
    if (item.qty >= stock) {
      setStockWarning(`Only ${stock} items available for ${item.name}`);
      setTimeout(() => setStockWarning(""), 2000);
      return;
    }
    item.qty += 1;
    saveCart(updated);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  let shipping = 0;
  if (cart.length > 0) {
    if (total <= 1500) shipping = 60;
    else if (total <= 3000) shipping = 120;
    else if (total <= 4500) shipping = 180;
    else shipping = 240;
  }

  const grandTotal = total + shipping;

  const checkout = () => {
    localStorage.setItem("ssf_checkout_total", grandTotal);
    nav("/checkout");
  };

  return (
    <div className="cart-container">
      <button onClick={() => nav(-1)} style={{ background: "#ff4d6d", color: "white", padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "15px", fontWeight: "600" }}>
        ← Back
      </button>

      <h2 className="cart-title">Cart</h2>

      {minWarning && <p style={{ color: "red" }}>{minWarning}</p>}
      {stockWarning && <p style={{ color: "red" }}>{stockWarning}</p>}

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

                <span className="row-quantity">
                  <button onClick={() => decreaseQty(idx)} className="qty-minus">−</button>
                  {c.qty}
                  <button onClick={() => increaseQty(idx)} className="qty-plus">+</button>
                </span>

                <span className="row-subtotal">₹{c.price * c.qty}</span>
              </div>
            ))}
          </div>

          <div className="cart-right">
            <div className="cart-summary">
              <h3>Basket Totals</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{total}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong>₹{shipping}</strong>
              </div>
              <div className="summary-row">
                <span>Total</span>
                <strong>₹{grandTotal}</strong>
              </div>
              <button className="checkout-btn" onClick={checkout}>Proceed to Checkout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
