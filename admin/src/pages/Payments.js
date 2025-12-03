// src/admin/Payments.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "./adminOrders.css"; // reuse styles from AdminOrders

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCancelledPayments = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "cancelledPayments"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPayments(data);
      } catch (err) {
        console.error("Error fetching cancelled payments:", err);
      }
      setLoading(false);
    };

    fetchCancelledPayments();
  }, []);

  const deletePayment = async (id) => {
    if (!window.confirm("Delete this cancelled payment permanently?")) return;
    try {
      await deleteDoc(doc(db, "cancelledPayments", id));
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting payment:", err);
      alert("Could not delete payment.");
    }
  };

  if (loading) return <p>Loading cancelled payments...</p>;

  return (
    <div className="admin-container">
      <h2 className="title">Cancelled Payments</h2>
      {payments.length === 0 ? (
        <p>No cancelled payments available.</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Items</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td style={{ wordBreak: "break-all" }}>{p.orderId}</td>
                <td>{p.paymentId}</td>
                <td>
                  {p.createdAt?.toDate
                    ? p.createdAt.toDate().toLocaleString()
                    : p.createdAt?.seconds
                    ? new Date(p.createdAt.seconds * 1000).toLocaleString()
                    : "—"}
                </td>
                <td>₹{p.totalPrice || 0}</td>
                <td>
                  {p.items?.length > 0 ? (
                    <ul>
                      {p.items.map((it, idx) => (
                        <li key={idx}>
                          {it.name} — Qty: {it.qty || 1} — ₹{it.price || 0}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deletePayment(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
