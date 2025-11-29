import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import "../Cart.css";

export default function Cart() {
  const nav = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem("ssf_cart") || "[]"));
  const [undoItem, setUndoItem] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);

  // TOTAL PRICE
  const total = cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

  // SHIPPING LOGIC
  let shipping = 0;

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

  const saveCart = (updated) => {
    localStorage.setItem("ssf_cart", JSON.stringify(updated));
    setCart(updated);
  };

  const removeItem = (index) => {
    const item = cart[index];
    const updatedCart = cart.filter((_, i) => i !== index);
    setUndoItem({ item, index });
    setUndoVisible(true);
    saveCart(updatedCart);

    setTimeout(() => setUndoVisible(false), 5000);
  };

  const undoDelete = () => {
    if (undoItem) {
      const updatedCart = [...cart];
      updatedCart.splice(undoItem.index, 0, undoItem.item);
      saveCart(updatedCart);
      setUndoVisible(false);
      setUndoItem(null);
    }
  };

  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].qty > 1) {
      updated[index].qty -= 1;
    } else {
      removeItem(index);
      return;
    }
    saveCart(updated);
  };

  const increaseQty = (index) => {
    const updated = [...cart];
    updated[index].qty += 1;
    saveCart(updated);
  };

  const checkout = () => {
    localStorage.setItem("ssf_checkout_total", grandTotal);
    nav("/checkout");
  };

  return (
    <div className="cart-container">

      {/* 🔙 BACK BUTTON */}
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

          {/* LEFT SIDE ITEMS */}
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
