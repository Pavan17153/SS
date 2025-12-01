// src/admin/AdminOrders.js
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./adminOrders.css";
function toMillis(createdAt) {
  if (!createdAt) return 0;
  if (createdAt.toDate) return createdAt.toDate().getTime();
  if (createdAt.seconds) return createdAt.seconds * 1000;
  return Number(createdAt) || 0;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null); // order object
  const [imageModalUrl, setImageModalUrl] = useState(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch orders sorted by createdAt desc
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // total products count from 'products' collection
        const pSnap = await getDocs(collection(db, "products"));
        const pCount = pSnap.size;

        setOrders(ordersData);
        setProductsCount(pCount);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders/products:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error refreshing orders:", err);
    }
    setLoading(false);
  };

  const toggleStatus = async (order) => {
    try {
      const newStatus = order.status === "shipped" ? "paid" : "shipped";
      await updateDoc(doc(db, "orders", order.id), { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Could not update status. Check console.");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Could not delete order. Check console.");
    }
  };

  const deleteAllOrders = async () => {
    if (!window.confirm("DELETE ALL ORDERS permanently? This cannot be undone.")) return;
    try {
      // caution - deletes one by one
      for (const o of orders) {
        await deleteDoc(doc(db, "orders", o.id));
      }
      setOrders([]);
      alert("All orders deleted.");
    } catch (err) {
      console.error("Delete all orders error:", err);
      alert("Could not delete all orders. Check console.");
    }
  };

  // derived stats
  const totalOrders = orders.length;
  const shipped = orders.filter((o) => o.status === "shipped").length;
  const unshipped = totalOrders - shipped;

  // filtering (search + date range)
  const filteredOrders = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : -Infinity;
    const toMs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity;

    return orders.filter((o) => {
      const createdMs = toMillis(o.createdAt);
      if (createdMs < fromMs || createdMs > toMs) return false;
      if (!s) return true;

      if ((o.id || "").toLowerCase().includes(s)) return true;
      if ((o.customerEmail || "").toLowerCase().includes(s)) return true;
      if ((o.customerPhone || "").toLowerCase().includes(s)) return true;

      if (Array.isArray(o.items)) {
        for (const it of o.items) {
          if ((it.name || "").toLowerCase().includes(s)) return true;
          if ((it.category || "").toLowerCase().includes(s)) return true;
          if ((it.subCategory || "").toLowerCase().includes(s)) return true;
        }
      }

      return false;
    });
  }, [orders, search, dateFrom, dateTo]);

  // export CSV for filtered orders
  const exportCSV = () => {
    const rows = [];
    rows.push([
      "Order ID",
      "Customer Email",
      "Phone",
      "Status",
      "Total",
      "Created At",
      "Item Name",
      "Item Category",
      "Item SubCategory",
      "Item Qty",
      "Item Price",
      "Item Image",
    ]);

    filteredOrders.forEach((o) => {
      const created = new Date(toMillis(o.createdAt)).toLocaleString();
      if (Array.isArray(o.items) && o.items.length > 0) {
        o.items.forEach((it) => {
          rows.push([
            o.id,
            o.customerEmail || "",
            o.customerPhone || "",
            o.status || "",
            o.totalPrice || "",
            created,
            it.name || "",
            it.category || "",
            it.subCategory || "",
            it.qty || "",
            it.price || "",
            it.image || "",
          ]);
        });
      } else {
        rows.push([o.id, o.customerEmail || "", o.customerPhone || "", o.status || "", o.totalPrice || "", created, "", "", "", "", "", ""]);
      }
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print shipped orders (Option A: clean printable page)
  const printShippedOrders = () => {
    const shippedOrders = filteredOrders.filter((o) => o.status === "shipped");
    if (shippedOrders.length === 0) {
      alert("No shipped orders in current filter to print.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Shipped Orders - Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color:#111; }
            h1 { margin-top: 0; }
            table { width:100%; border-collapse:collapse; margin-bottom:20px; }
            th, td { border:1px solid #ccc; padding:8px; text-align:left; vertical-align:top; }
            th { background:#333; color:#fff; }
            .item-row td { border-top: none; }
          </style>
        </head>
        <body>
          <h1>Shipped Orders (${shippedOrders.length})</h1>
          ${shippedOrders.map(o => {
            const created = new Date(toMillis(o.createdAt)).toLocaleString();
            return `
              <section style="margin-bottom:22px;">
                <h2 style="margin:0 0 8px 0;">Order: ${o.id} — ₹${o.totalPrice || 0}</h2>
                <div>Customer: ${o.customerEmail || ""} | Phone: ${o.customerPhone || ""} | Created: ${created}</div>
                <table>
                  <thead>
                    <tr><th>Item</th><th>Category</th><th>SubCategory</th><th>Qty</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    ${(o.items || []).map(it => `<tr>
                      <td>${it.name || ""}</td>
                      <td>${it.category || ""}</td>
                      <td>${it.subCategory || ""}</td>
                      <td>${it.qty || 1}</td>
                      <td>₹${it.price || 0}</td>
                    </tr>`).join("")}
                  </tbody>
                </table>
              </section>
            `;
          }).join("")}
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    // give browser a moment to render before print
    setTimeout(() => w.print(), 400);
  };

  // open view modal (no images displayed inside modal per your request)
  const openViewModal = (order) => {
    setSelectedOrder(order);
    setEditMode(false);
    setEditData(null);
  };

  // start editing selected order
  const startEdit = () => {
    if (!selectedOrder) return;
    // clone selectedOrder, ensure billingDetails exists
    const clone = JSON.parse(JSON.stringify(selectedOrder));
    if (!clone.billingDetails) clone.billingDetails = {};
    setEditData(clone);
    setEditMode(true);
  };

  // save edit to firestore
  const saveEdit = async () => {
    if (!editData || !selectedOrder) return;
    try {
      // Keep createdAt, items, payment info untouched unless present in editData
      const toSave = { ...editData };
      // write to Firestore
      await updateDoc(doc(db, "orders", selectedOrder.id), toSave);
      // update local state
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? toSave : o)));
      setSelectedOrder(toSave);
      setEditMode(false);
      alert("Order updated successfully.");
    } catch (err) {
      console.error("Save edit error:", err);
      alert("Could not save changes. Check console.");
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="admin-container">
      <h2 className="title">Admin Orders Dashboard</h2>

      {/* Controls */}
      <div className="controls-row" style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
        <input
          placeholder="Search order id / email / product / category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>Reset</button>

        <button onClick={exportCSV}>Export CSV</button>
        <button onClick={printShippedOrders}>Print (Shipped Only)</button>

        <button onClick={deleteAllOrders} style={{ background: "red", color: "white" }}>Delete All Orders</button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><h3>{totalOrders}</h3><p>Total Orders</p></div>
        <div className="stat-card green"><h3>{shipped}</h3><p>Shipped</p></div>
        <div className="stat-card orange"><h3>{unshipped}</h3><p>Unshipped</p></div>
        <div className="stat-card blue"><h3>{productsCount}</h3><p>Total Products</p></div>
      </div>

      {/* Table */}
      <table className="orders-table">
        <thead>
          <tr>
            <th style={{width:'12%'}}>Order ID</th>
            <th style={{width:'18%'}}>Customer Email</th>
            <th style={{width:'10%'}}>Phone</th>
            <th style={{width:'10%'}}>Status</th>
            <th style={{width:'8%'}}>Total</th>
            <th style={{width:'14%'}}>Created At</th>
            <th style={{width:'20%'}}>Items (category)</th>
            <th style={{width:'4%'}}>View</th>
            <th style={{width:'4%'}}>Delete</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.map((o) => (
            <tr key={o.id} className={o.status === "shipped" ? "shipped-row" : ""}>
              <td style={{wordBreak:'break-all'}}>{o.id}</td>
              <td>{o.customerEmail}</td>
              <td>{o.customerPhone}</td>
              <td>
                <label style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="checkbox" checked={o.status === "shipped"} onChange={() => toggleStatus(o)} />
                  <span style={{textTransform:'capitalize'}}>{o.status || "pending"}</span>
                </label>
              </td>
              <td>₹{o.totalPrice || 0}</td>
              <td>
                {o.createdAt?.toDate
                  ? o.createdAt.toDate().toLocaleString()
                  : o.createdAt?.seconds
                  ? new Date(o.createdAt.seconds * 1000).toLocaleString()
                  : "—"}
              </td>

              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(o.items || []).slice(0, 5).map((it, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="thumb" onClick={() => setImageModalUrl(it.image)} />
                      ) : (
                        <div className="thumb placeholder">No Img</div>
                      )}
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{it.category || "—"} {it.subCategory ? ` / ${it.subCategory}` : ""}</div>
                      </div>
                    </div>
                  ))}
                  {(o.items || []).length > 5 && <div style={{fontSize:12}}>+{(o.items||[]).length-5} more</div>}
                </div>
              </td>

              <td>
                <button className="view-btn" onClick={() => openViewModal(o)}>View</button>
              </td>

              <td>
                <button className="delete-btn" onClick={() => deleteOrder(o.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Modal (no images inside; Edit allowed) */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => { setSelectedOrder(null); setEditMode(false); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setSelectedOrder(null); setEditMode(false); }}>✖</button>

            {!editMode ? (
              <>
                <h2>Order Details</h2>
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                <p><strong>Total:</strong> ₹{selectedOrder.totalPrice}</p>
                <p><strong>Status:</strong> {selectedOrder.status}</p>

                <h3>Billing Details</h3>
                <p>{selectedOrder.billingDetails?.firstName} {selectedOrder.billingDetails?.lastName}</p>
                <p>{selectedOrder.billingDetails?.address1}</p>
                <p>{selectedOrder.billingDetails?.address2}</p>
                <p>{selectedOrder.billingDetails?.city}, {selectedOrder.billingDetails?.state} - {selectedOrder.billingDetails?.pin}</p>
                <p>Phone: {selectedOrder.billingDetails?.phone}</p>
                <p>Email: {selectedOrder.billingDetails?.email}</p>

                <h3>Items</h3>
                <ul>
                  {(selectedOrder.items || []).map((it, i) => (
                    <li key={i}>
                      <strong>{it.name}</strong> — Qty: {it.qty || 1} — ₹{it.price || 0} — Category: {it.category || "—"} {it.subCategory ? ` / ${it.subCategory}` : ""}
                    </li>
                  ))}
                </ul>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="print-btn" onClick={() => {
                    // print only if shipped
                    if (selectedOrder.status !== "shipped") {
                      alert("Only shipped orders can be printed.");
                      return;
                    }
                    // open a print window for selected order
                    const o = selectedOrder;
                    const created = new Date(toMillis(o.createdAt)).toLocaleString();
                    const html = `
                      <html>
                        <head>
                          <title>Order ${o.id}</title>
                          <style>
                            body{ font-family: Arial; padding:20px }
                            h1{ margin:0 0 8px 0 }
                            table{ width:100%; border-collapse:collapse; margin-top:8px }
                            th,td{ border:1px solid #ccc; padding:8px; text-align:left }
                            th{ background:#333; color:#fff }
                          </style>
                        </head>
                        <body>
                          <h1>Order: ${o.id}</h1>
                          <div>Customer: ${o.customerEmail || ""} | Phone: ${o.customerPhone || ""} | Created: ${created}</div>
                          <h3>Billing</h3>
                          <div>${o.billingDetails?.firstName || ""} ${o.billingDetails?.lastName || ""}</div>
                          <div>${o.billingDetails?.address1 || ""} ${o.billingDetails?.address2 || ""}</div>
                          <div>${o.billingDetails?.city || ""}, ${o.billingDetails?.state || ""} - ${o.billingDetails?.pin || ""}</div>
                          <h3>Items</h3>
                          <table>
                            <thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Price</th></tr></thead>
                            <tbody>
                              ${(o.items || []).map(it => `<tr>
                                <td>${it.name || ""}</td>
                                <td>${it.category || ""} ${it.subCategory ? ` / ${it.subCategory}` : ""}</td>
                                <td>${it.qty || 1}</td>
                                <td>₹${it.price || 0}</td>
                              </tr>`).join("")}
                            </tbody>
                          </table>
                        </body>
                      </html>
                    `;
                    const w = window.open("", "_blank");
                    w.document.write(html);
                    w.document.close();
                    setTimeout(() => w.print(), 400);
                  }}>Print</button>

                  <button className="print-btn" style={{ background: "#0047ab" }} onClick={startEdit}>Edit</button>
                </div>
              </>
            ) : (
              <>
                <h2>Edit Billing Details</h2>

                <label>First name</label>
                <input value={editData.billingDetails?.firstName || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, firstName: e.target.value } })} />

                <label>Last name</label>
                <input value={editData.billingDetails?.lastName || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, lastName: e.target.value } })} />

                <label>Address 1</label>
                <input value={editData.billingDetails?.address1 || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, address1: e.target.value } })} />

                <label>Address 2</label>
                <input value={editData.billingDetails?.address2 || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, address2: e.target.value } })} />

                <label>City</label>
                <input value={editData.billingDetails?.city || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, city: e.target.value } })} />

                <label>State</label>
                <input value={editData.billingDetails?.state || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, state: e.target.value } })} />

                <label>PIN</label>
                <input value={editData.billingDetails?.pin || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, pin: e.target.value } })} />

                <label>Phone</label>
                <input value={editData.billingDetails?.phone || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, phone: e.target.value } })} />

                <label>Email</label>
                <input value={editData.billingDetails?.email || ""} onChange={(e) => setEditData({ ...editData, billingDetails: { ...editData.billingDetails, email: e.target.value } })} />

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="print-btn" style={{ background: "green" }} onClick={saveEdit}>Save</button>
                  <button className="print-btn" style={{ background: "red" }} onClick={() => { setEditMode(false); setEditData(null); }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image modal */}
      {imageModalUrl && (
        <div className="image-modal-overlay" onClick={() => setImageModalUrl(null)}>
          <div className="image-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setImageModalUrl(null)}>✖</button>
            <img src={imageModalUrl} alt="product" className="image-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
}
