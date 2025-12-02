import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "../Orders.css";

function toMillis(createdAt) {
  if (!createdAt) return 0;
  if (createdAt.toDate) return createdAt.toDate().getTime();
  if (createdAt.seconds) return createdAt.seconds * 1000;
  return Number(createdAt) || 0;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const [popupImage, setPopupImage] = useState("");
  const [cancelPopup, setCancelPopup] = useState({ show: false, orderId: null });
  const [successPopup, setSuccessPopup] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserEmail(user ? user.email : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userEmail) {
      setOrders([]);
      setFilteredOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "orders"), where("customerEmail", "==", userEmail));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            status: d.status?.charAt(0).toUpperCase() + d.status?.slice(1).toLowerCase(),
          };
        });

        data.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setOrders(data);
        setFilteredOrders(statusFilter === "All" ? data : data.filter((o) => o.status === statusFilter));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userEmail, statusFilter]);

  const askCancelOrder = (orderId) => {
    setCancelPopup({ show: true, orderId });
  };

  const confirmCancel = async () => {
    if (!cancelPopup.orderId) return;

    try {
      const ref = doc(db, "orders", cancelPopup.orderId);

      // Check if the order exists
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) throw new Error("Order does not exist");

      // Only allow cancel if not shipped or delivered
      const currentStatus = snapshot.data().status?.toLowerCase() || "";
      if (["shipped", "delivered"].includes(currentStatus)) {
        alert("Cannot cancel an order that is already shipped or delivered.");
        setCancelPopup({ show: false, orderId: null });
        return;
      }

      // Update Firestore
      await updateDoc(ref, { status: "Cancelled" }); // <-- works with Firestore rules now

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelPopup.orderId ? { ...o, status: "Cancelled" } : o
        )
      );
      setFilteredOrders((prev) =>
        prev.map((o) =>
          o.id === cancelPopup.orderId ? { ...o, status: "Cancelled" } : o
        )
      );

      setCancelPopup({ show: false, orderId: null });
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order.");
    }
  };

  const closeCancelPopup = () => {
    setCancelPopup({ show: false, orderId: null });
  };

  const isStepActive = (currentStatus, step) => {
    const rank = { ordered: 1, processing: 2, shipped: 3, delivered: 4 };
    return rank[currentStatus.toLowerCase()] >= rank[step.toLowerCase()];
  };

  if (!userEmail) return <p className="orders-center">Please login to see your orders.</p>;
  if (loading) return <p className="orders-center loading">Loading your orders...</p>;

  return (
    <>
      {popupImage && (
        <div className="img-popup-overlay" onClick={() => setPopupImage("")}>
          <img src={popupImage} className="img-popup" alt="Preview" />
        </div>
      )}

      {cancelPopup.show && (
        <div className="cancel-popup-overlay">
          <div className="cancel-popup-box">
            <h3>Cancel Order?</h3>
            <p>Are you sure you want to cancel this order?</p>

            <div className="popup-buttons">
              <button className="popup-cancel" onClick={closeCancelPopup}>No</button>
              <button className="popup-confirm" onClick={confirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {successPopup && (
        <div className="success-popup">
          <p>Order Cancelled Successfully</p>
        </div>
      )}

      <div className={darkMode ? "orders-wrapper dark" : "orders-wrapper"}>
        <aside className="orders-sidebar">
          <h3>Filters</h3>

          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="orders-filter-select">
            <option>All</option>
            <option>Unshipped</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>

          <p className="filter-count">Results: {filteredOrders.length}</p>

          <button className="dark-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </aside>

        <div className="orders-container">
          <h2 className="orders-heading">Your Orders</h2>

          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card animate-card">
              <div className="order-top">
                <div>
                  <p><strong>Order ID:</strong> {order.id}</p>
                  <p><strong>Status:</strong> {order.status}</p>

                  {order.status === "Cancelled" && (
                    <span className="cancel-tag">Cancelled</span>
                  )}

                  {order.address && (
                    <p className="address-text">
                      <strong>Shipping Address:</strong><br />
                      {order.address.name}<br />
                      {order.address.street}, {order.address.city}<br />
                      {order.address.state} - {order.address.zip}<br />
                      Phone: {order.address.phone}
                    </p>
                  )}
                </div>

                <div className="order-date">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "Unknown"}
                </div>
              </div>

              <div className="order-items">
                <strong>Items:</strong>
                {order.items.map((item, i) => (
                  <div key={i} className="order-item" onClick={() => setPopupImage(item.image)}>
                    <img src={item.image} alt={item.name} className="order-img" />
                    <div>
                      {item.name} × {item.qty || 1}<br />
                      ₹{item.price}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-section">
                <strong>Total:</strong> ₹{order.totalPrice}
              </div>

              <div className="order-section">
                <strong>Payment ID:</strong> {order.paymentId || "Pending"}
              </div>

              {["Pending", "Processing", "Unshipped"].includes(order.status) ? (
                <button className="order-cancel-btn" onClick={() => askCancelOrder(order.id)}>
                  Cancel Order
                </button>
              ) : (
                <button className="order-cancel-btn disabled" disabled>
                  Cannot Cancel
                </button>
              )}

              {order.status === "Cancelled" ? (
                <p className="cancel-msg">Order was Cancelled</p>
              ) : (
                <div className="track-box">
                  <h4>Track Status</h4>
                  <div className="track-status-container">
                    {["Ordered", "Processing", "Shipped", "Delivered"].map((step) => (
                      <div
                        key={step}
                        className={`track-step ${isStepActive(order.status, step) ? "active" : ""}`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </>
  );
}
