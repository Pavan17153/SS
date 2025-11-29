// pages/Orders.js
import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userEmail) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore query: filter by customerEmail and order by createdAt descending
        const q = query(
          collection(db, "orders"),
          where("customerEmail", "==", userEmail),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(ordersData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userEmail]);

  if (!userEmail) return <p>Please login to see your orders.</p>;
  if (loading) return <p>Loading your orders...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: "20px" }}>
      <h2 className="mb-4">Your Orders</h2>

      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((order) => (
        <div key={order.id} className="card mb-3 p-3">
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Status:</strong> {order.status || "Pending"}
          </p>
          <p>
            <strong>Total:</strong> ₹ {order.totalPrice || 0}
          </p>
          <p>
            <strong>Payment ID:</strong> {order.paymentId || "Pending"}
          </p>
          <p>
            <strong>Ordered At:</strong>{" "}
            {order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleString()
              : "Unknown"}
          </p>

          {order.billingDetails && (
            <div>
              <strong>Billing Details:</strong>
              <p>
                {order.billingDetails.firstName || ""}{" "}
                {order.billingDetails.lastName || ""}
              </p>
              <p>{order.billingDetails.address1 || ""}</p>
              {order.billingDetails.phone && <p>Phone: {order.billingDetails.phone}</p>}
            </div>
          )}

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div>
              <strong>Items:</strong>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} - Qty: {item.qty || 1}, Price: ₹{item.price || 0}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
