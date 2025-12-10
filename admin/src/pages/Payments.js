// src/admin/Payments.js

import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./adminOrders.css"; // reuse styles

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalMoneyCredited, setTotalMoneyCredited] = useState(0);
  const [totalCancelledAmount, setTotalCancelledAmount] = useState(0); // pending cancel
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [totalTD, setTotalTD] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get ALL orders → TOTAL MONEY CREDITED
        const ordersSnap = await getDocs(collection(db, "orders"));
        const ordersData = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(ordersData);

        const credited = ordersData.reduce(
          (acc, o) => acc + (o.totalPrice || 0),
          0
        );
        setTotalMoneyCredited(credited);

        // Get all cancelledPayments
        const snap = await getDocs(collection(db, "cancelledPayments"));
        const paymentsData = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          tdGiven: d.data().tdGiven || 0,
        }));

        setPayments(paymentsData);

        // Recalculate totals based on fresh data
        recalcTotals(paymentsData, ordersData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // -----------------------------
  // RECALC TOTALS (BASED ON YOUR EXAMPLE)
  // -----------------------------
  const recalcTotals = (paymentsData = payments, ordersData = orders) => {
    // Total cancelled ever (all cancelledPayments, independent of TD)
    const totalCancelledEver = paymentsData.reduce(
      (acc, p) => acc + (p.totalPrice || 0),
      0
    );

    // Total TD (amount already processed as Transaction Done)
    const tdAmount = paymentsData.reduce(
      (acc, p) => acc + (p.tdGiven || 0),
      0
    );

    // Total credited (from all orders)
    const credited = ordersData.reduce(
      (acc, o) => acc + (o.totalPrice || 0),
      0
    );

    // Pending cancelled = total cancelled - already TD processed
    const pendingCancelled = totalCancelledEver - tdAmount;

    setTotalCancelledAmount(pendingCancelled);      // this is "Total Cancelled Amount" box
    setTotalTD(tdAmount);                          // "Transaction Done Amount" box
    setBalanceAmount(credited - totalCancelledEver); // Balance = credited - ALL cancelled
  };

  // -----------------------------
  // DELETE CANCELLED PAYMENT
  // -----------------------------
  const deletePayment = async (id) => {
    if (!window.confirm("Delete this cancelled payment permanently?")) return;
    try {
      await deleteDoc(doc(db, "cancelledPayments", id));
      const updated = payments.filter((p) => p.id !== id);
      setPayments(updated);
      recalcTotals(updated, orders);
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Could not delete payment.");
    }
  };

  // -----------------------------
  // HANDLE TD (TRANSACTION DONE)
  // -----------------------------
  const handleTDClick = async (payment) => {
    if (payment.tdGiven) return; // Already TD done for this payment

    const tdAmount = payment.totalPrice || 0;

    try {
      // Update Firestore
      await updateDoc(doc(db, "cancelledPayments", payment.id), {
        tdGiven: tdAmount,
      });

      // Update local state
      const updated = payments.map((p) =>
        p.id === payment.id ? { ...p, tdGiven: tdAmount } : p
      );
      setPayments(updated);

      // Recalculate totals using updated payments
      recalcTotals(updated, orders);
    } catch (err) {
      console.error("TD update error:", err);
      alert("Could not update TD.");
    }
  };

  if (loading) return <p>Loading cancelled payments...</p>;

  return (
    <div className="admin-container">
      <h2 className="title">Cancelled Payments</h2>

      {/* Stats Row */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <h3>₹{totalMoneyCredited}</h3>
          <p>Total Money Credited</p>
        </div>

        <div className="stat-card green">
          <h3>₹{totalCancelledAmount}</h3>
          <p>Total Cancelled Amount</p>
        </div>

        <div className="stat-card blue">
          <h3>₹{balanceAmount}</h3>
          <p>Balance Amount</p>
        </div>

        <div className="stat-card orange">
          <h3>₹{totalTD}</h3>
          <p>Transaction Done Amount</p>
        </div>
      </div>

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
              <th>TD</th>
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
                    className="status-btn"
                    style={{
                      background: p.tdGiven ? "gray" : "green",
                      color: "#fff",
                      cursor: p.tdGiven ? "not-allowed" : "pointer",
                    }}
                    disabled={p.tdGiven}
                    onClick={() => handleTDClick(p)}
                  >
                    {p.tdGiven ? "TD Done" : "TD"}
                  </button>
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
