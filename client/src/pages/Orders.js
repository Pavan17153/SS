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
      setUserEmail(user ? user.email : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userEmail) { setOrders([]); setLoading(false); return; }

      try {
        const q = query(
          collection(db, "orders"),
          where("customerEmail", "==", userEmail),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>Your Orders</h2>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map(order => (
        <div key={order.id} className="card mb-3 p-3" style={{ border: "1px solid #ccc" }}>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Status:</strong> {order.status || "Pending"}</p>
          <p><strong>Total:</strong> ₹{order.totalPrice || 0}</p>
          <p><strong>Payment ID:</strong> {order.paymentId || "Pending"}</p>
          <p>
            <strong>Ordered At:</strong>{" "}
            {order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleString()
              : order.createdAt?.seconds
              ? new Date(order.createdAt.seconds * 1000).toLocaleString()
              : "Unknown"}
          </p>

          {order.billingDetails && (
            <div>
              <strong>Billing Details:</strong>
              <p>{order.billingDetails.firstName} {order.billingDetails.lastName}</p>
              <p>{order.billingDetails.address1}, {order.billingDetails.address2}</p>
              <p>{order.billingDetails.city}, {order.billingDetails.state} - {order.billingDetails.pin}</p>
              <p>Phone: {order.billingDetails.phone}</p>
              <p>Email: {order.billingDetails.email}</p>
            </div>
          )}

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div>
              <strong>Items:</strong>
              <ul>
                {order.items.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>
                    {item.name} × {item.qty || 1}, ₹{item.price || 0}
                    {item.image && <img src={item.image} alt={item.name} style={{ width: 50, marginLeft: 10 }} />}
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
