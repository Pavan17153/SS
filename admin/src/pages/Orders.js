import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Orders(){
  const [orders,setOrders]=useState([]);
  useEffect(()=>{ (async ()=>{ const snap = await getDocs(collection(db,"orders")); setOrders(snap.docs.map(d=>({id:d.id,...d.data()}))); })(); },[]);
  return (<div><h3>Orders & Payment History</h3>{orders.length===0 ? <p>No orders yet</p> : <table border="1" cellPadding="6"><thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Created</th></tr></thead><tbody>{orders.map(o=> <tr key={o.id}><td>{o.id}</td><td>{o.customerEmail}</td><td>₹{o.totalPrice}</td><td>{o.status}</td><td>{o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000).toLocaleString() : "-"}</td></tr>)}</tbody></table>}</div>);
}
