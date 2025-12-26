// src/pages/Orders.js
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "../Orders.css";
import { sendOrderStatusEmail } from "./emailApi";
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

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
    const q = query(
      collection(db, "orders"),
      where("customerEmail", "==", userEmail)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,          // Firestore document ID (used internally)
            orderId: d.orderId,      // SSF-0001 (shown to user)
            ...d,
            status:
              (d.status || "").charAt(0).toUpperCase() +
              (d.status || "").slice(1).toLowerCase(),
          };
        });

        data.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setOrders(data);
        setFilteredOrders(
          statusFilter === "All"
            ? data
            : data.filter((o) => o.status === statusFilter)
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userEmail, statusFilter]);

  const askCancelOrder = (docId) => {
    setCancelPopup({ show: true, orderId: docId });
  };
  const confirmCancel = async () => {
    if (!cancelPopup.orderId) return;

    try {
      const ref = doc(db, "orders", cancelPopup.orderId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) throw new Error("Order does not exist");

      const order = snapshot.data(); // ✅ FIX
      const currentStatus = (order.status || "").toLowerCase();

      if (["shipped", "delivered"].includes(currentStatus)) {
        alert("Cannot cancel an order that is already shipped or delivered.");
        setCancelPopup({ show: false, orderId: null });
        return;
      }

      // 1️⃣ Update Firestore
      await updateDoc(ref, { status: "Cancelled" });

      // 2️⃣ Send cancellation email
      try {
        await sendOrderStatusEmail({
          email: order.customerEmail,   // user's email from Firestore
          orderId: order.orderId,
          paymentId: order.paymentId || null,
          amount: order.totalPrice || 0,
          name: order.billingDetails
            ? `${order.billingDetails.firstName} ${order.billingDetails.lastName}`
            : "Customer",
          items: order.items || [],
          shippingAddress: order.billingDetails || null,
          statusType: "Cancelled",
          estimatedDelivery: order.estimatedDelivery || null,
        });
        console.log("📧 Cancellation email sent successfully");
      } catch (err) {
        console.error("❌ Failed to send cancellation email:", err.message);
      }

      // 3️⃣ Update local React state to reflect cancellation
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
    const cur = (currentStatus || "").toLowerCase();
    return (rank[cur] || 0) >= (rank[step.toLowerCase()] || 0);
  };

  if (!userEmail)
    return <p className="orders-center">Please login to see your orders.</p>;
  if (loading)
    return (
      <p className="orders-center loading">Loading your orders...</p>
    );

  return (
    <>


      {/* CANCEL POPUP */}
      {cancelPopup.show && (
        <div className="cancel-top-overlay">
          <div className="cancel-top-popup">
            <h3>Cancel Order?</h3>
            <p>Are you sure you want to cancel this order?</p>

            <div className="cancel-top-btns">
              <button
                className="cancel-top-btn-no"
                onClick={closeCancelPopup}
              >
                No
              </button>
              <button
                className="cancel-top-btn-yes"
                onClick={confirmCancel}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {successPopup && (
        <div className="success-popup">
          <p>Order Cancelled Successfully</p>
        </div>
      )}

      <div className={darkMode ? "orders-wrapper dark" : "orders-wrapper"}>
        {/* SIDEBAR */}
        <aside className="orders-sidebar">
          <h3>Filters</h3>

          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="orders-filter-select"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Unshipped</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>

          <p className="filter-count">Results: {filteredOrders.length}</p>

          <button
            className="dark-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </aside>

        {/* MOBILE FILTER */}
        <button
          className="mobile-filter-btn"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          {mobileFilterOpen ? "Close Filters ▲" : "Filters ▼"}
        </button>

        {mobileFilterOpen && (
          <div className="mobile-filter-panel">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mobile-filter-select"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Unshipped</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>

            <p className="mobile-filter-count">
              Results: {filteredOrders.length}
            </p>

            <button
              className="mobile-theme-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        )}

        {/* ORDERS */}
        <div className="orders-container">
          <h2 className="orders-heading">Your Orders</h2>

          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card animate-card">
              {/* TOP */}
              <div className="order-top">
                <div>
                  <p>
                    <strong>Order ID:</strong> {order.orderId}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.status}
                  </p>

                  {order.billingDetails && (
                    <p className="address-text">
                      <strong>Shipping Address:</strong>
                      <br />
                      {order.billingDetails.firstName}{" "}
                      {order.billingDetails.lastName}
                      <br />
                      {order.billingDetails.address1},{" "}
                      {order.billingDetails.city}
                      <br />
                      {order.billingDetails.state} -{" "}
                      {order.billingDetails.pin}
                      <br />
                      Phone: {order.billingDetails.phone}
                    </p>
                  )}

                  {order.Note && (
                    <p className="order-note">
                      <strong>Order Note:</strong> {order.Note}
                    </p>
                  )}
                </div>

                <div className="order-date">
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleString()
                    : "Unknown"}
                </div>
              </div>

              {/* ITEMS */}
              <div className="order-items">
                <strong>Items:</strong>
                {(order.items || []).map((item, i) => (
                  <div
                    key={i}
                    className="order-item"
                    onClick={() => setPopupImage(item.image)}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="order-img"
                    />
                    <div>
                      {item.name} × {item.qty || 1}
                      <br />₹{item.price}
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL & PAYMENT */}
              <div className="order-section">
                <strong>Total:</strong> ₹{order.totalPrice}
              </div>
              <div className="order-section">
                <strong>Payment ID:</strong>{" "}
                {order.paymentId || "Pending"}
              </div>

              {/* CANCEL */}
              {order.status === "Cancelled" ? (
                <p className="cancel-msg">
                  Your order has been successfully cancelled. The
                  refund will be processed to your original payment
                  method within 2-3 working days.
                </p>
              ) : (
                <>
                  {["Pending", "Processing", "Unshipped"].includes(
                    order.status
                  ) && (
                      <p className="cancel-msg info">
                        You can cancel your order before it is shipped.
                        No exchanges, returns, or refunds are accepted
                        once the product is shipped.
                      </p>
                    )}

                  {order.status === "Shipped" && (
                    <p className="cancel-msgg info">
                      Your order has been shipped successfully and
                      will reach you soon.
                    </p>
                  )}

                  {order.status === "Delivered" && (
                    <p className="cancel-msgg info">
                      Your order has been delivered. Thank you for
                      shopping with us!
                    </p>
                  )}

                  <button
                    className={`order-cancel-btn ${["Shipped", "Delivered"].includes(order.status)
                      ? "disabled"
                      : ""
                      }`}
                    onClick={() => askCancelOrder(order.id)}
                    disabled={["Shipped", "Delivered"].includes(
                      order.status
                    )}
                  >
                    {["Shipped", "Delivered"].includes(order.status)
                      ? "Cannot Cancel"
                      : "Cancel Order"}
                  </button>
                </>
              )}

              {/* TRACKING */}
              {order.status !== "Cancelled" && (
                <div className="track-box">
                  <h4>Track Status</h4>
                  <div className="track-status-container">
                    {["Ordered", "Processing", "Shipped", "Delivered"].map(
                      (step) => (
                        <div
                          key={step}
                          className={`track-step ${isStepActive(order.status, step)
                            ? "active"
                            : ""
                            }`}
                        >
                          {step}
                        </div>
                      )
                    )}
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
