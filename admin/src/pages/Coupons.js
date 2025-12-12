// src/pages/AdminCouponsPage.js
import React, { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    where,
    deleteDoc,
    onSnapshot,
    getDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "../adminCoupons.css";

export default function AdminCouponsPage() {
    const [couponName, setCouponName] = useState("");
    const [couponAmount, setCouponAmount] = useState("");
    const [maxUsers, setMaxUsers] = useState("");
    const [coupons, setCoupons] = useState([]);
    const [usedList, setUsedList] = useState([]);

    // EDIT STATE
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editMaxUsers, setEditMaxUsers] = useState("");
    const [loading, setLoading] = useState(false);

    // -------------------------
    // SAVE NEW COUPON
    // -------------------------
    const saveCoupon = async () => {
        if (!couponName.trim() || !couponAmount) {
            alert("Coupon name and amount are required");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "coupons"), {
                name: couponName.trim(),
                amount: Number(couponAmount),
                maxUsers: maxUsers ? Number(maxUsers) : null,
                usedCount: 0,
                active: true,
                createdAt: serverTimestamp(),
            });

            setCouponName("");
            setCouponAmount("");
            setMaxUsers("");
        } catch (err) {
            console.error("saveCoupon error:", err);
            alert("Could not create coupon. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // REAL-TIME LISTENERS
    // -------------------------
    useEffect(() => {
        const couponsQuery = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
        const unsubscribeCoupons = onSnapshot(couponsQuery, (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const adjusted = items.map((c) => {
                if (c.maxUsers != null && typeof c.usedCount === "number" && c.usedCount >= c.maxUsers) {
                    return { ...c, active: false };
                }
                return c;
            });
            setCoupons(adjusted);
        });

        const usedQuery = query(collection(db, "couponUsed"), orderBy("createdAt", "desc"));
        const unsubscribeUsed = onSnapshot(usedQuery, (snap) => {
            setUsedList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const unsubAuth = auth.onAuthStateChanged(() => { });

        return () => {
            unsubscribeCoupons();
            unsubscribeUsed();
            unsubAuth();
        };
    }, []);

    // -------------------------
    // STATS
    // -------------------------
    const totalCoupons = coupons.length;
    const totalAmount = coupons.reduce((a, b) => a + (b.amount || 0), 0);
    const totalUsed = usedList.length;

    const activeCoupon = coupons.find((c) => c.active) || null;

    // -------------------------
    // EDIT HANDLERS
    // -------------------------
    const openEdit = (c) => {
        setEditingCouponId(c.id);
        setEditName(c.name || "");
        setEditAmount((c.amount || "").toString());
        setEditMaxUsers(c.maxUsers != null ? String(c.maxUsers) : "");
    };

    const closeEdit = () => {
        setEditingCouponId(null);
        setEditName("");
        setEditAmount("");
        setEditMaxUsers("");
    };

    const saveEdit = async () => {
        if (!editingCouponId) return;
        if (!editName.trim() || !editAmount) return alert("Name and amount are required");

        setLoading(true);
        try {
            const couponRef = doc(db, "coupons", editingCouponId);
            const payload = {
                name: editName.trim(),
                amount: Number(editAmount),
                maxUsers: editMaxUsers !== "" ? Number(editMaxUsers) : null,
            };

            const current = coupons.find((x) => x.id === editingCouponId);
            if (payload.maxUsers != null && current?.usedCount != null && current.usedCount >= payload.maxUsers) {
                payload.active = false;
            }

            await updateDoc(couponRef, payload);
            closeEdit();
        } catch (err) {
            console.error("saveEdit error:", err);
            alert("Could not save changes.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // SET ACTIVE COUPON
    // -------------------------
    const setActiveCoupon = async (c) => {
        const user = auth.currentUser;
        if (!user || user.email !== "pellurupavankumar0@gmail.com") {
            alert("Only admin can set active coupon.");
            return;
        }

        if (c.maxUsers != null && c.usedCount != null && c.usedCount >= c.maxUsers) {
            alert("This coupon already reached its max uses and cannot be activated.");
            return;
        }

        setLoading(true);
        try {
            const updates = coupons.map(async (cc) => {
                const ref = doc(db, "coupons", cc.id);
                if (cc.id === c.id) {
                    await updateDoc(ref, { active: true, usedCount: 0 });
                } else {
                    if (cc.active) await updateDoc(ref, { active: false });
                }
            });
            await Promise.all(updates);
        } catch (err) {
            console.error("setActiveCoupon error:", err);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // TOGGLE ACTIVE
    // -------------------------
    const toggleActive = async (c) => {
        const user = auth.currentUser;
        if (!user || user.email !== "pellurupavankumar0@gmail.com") {
            alert("Only admin can change coupon active status.");
            return;
        }

        if (!c.active && c.maxUsers != null && c.usedCount != null && c.usedCount >= c.maxUsers) {
            alert("Cannot activate — coupon already reached its max usage.");
            return;
        }

        setLoading(true);
        try {
            const ref = doc(db, "coupons", c.id);
            await updateDoc(ref, { active: !c.active });
        } catch (err) {
            console.error("toggleActive error:", err);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // DELETE COUPON
    // -------------------------
    const deleteCoupon = async (c) => {
        const user = auth.currentUser;
        if (!user || user.email !== "pellurupavankumar0@gmail.com") {
            alert("Only admin can delete coupons.");
            return;
        }
        if (!window.confirm(`Delete coupon "${c.name}"? This cannot be undone.`)) return;

        setLoading(true);
        try {
            const ref = doc(db, "coupons", c.id);
            await deleteDoc(ref);
        } catch (err) {
            console.error("deleteCoupon error:", err);
            alert("Could not delete coupon. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // RECOUNT USED COUNT
    // -------------------------
    const recountUsedCount = async (c) => {
        setLoading(true);
        try {
            const q = query(collection(db, "couponUsed"), where("couponId", "==", c.id));
            const snap = await getDocs(q);
            const count = snap.size;

            const ref = doc(db, "coupons", c.id);
            const updates = { usedCount: count };
            if (c.maxUsers != null && count >= c.maxUsers) updates.active = false;

            await updateDoc(ref, updates);
        } catch (err) {
            console.error("recountUsedCount error:", err);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // DELETE ALL USED CLIENTS
    // -------------------------
    const deleteAllUsed = async () => {
        const user = auth.currentUser;
        if (!user || user.email !== "pellurupavankumar0@gmail.com") {
            alert("Only admin can delete all used coupon clients.");
            return;
        }

        if (!window.confirm("Delete all used coupon clients? This cannot be undone.")) return;

        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "couponUsed"));
            const deletes = snap.docs.map((d) => deleteDoc(doc(db, "couponUsed", d.id)));
            await Promise.all(deletes);
            alert("All used coupon clients deleted successfully.");
        } catch (err) {
            console.error("deleteAllUsed error:", err);
            alert("Could not delete all used clients. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // UI helpers
    // -------------------------
    const remainingUses = (c) => {
        if (c.maxUsers == null) return "Unlimited";
        const used = c.usedCount || 0;
        const remaining = c.maxUsers - used;
        return remaining > 0 ? remaining : 0;
    };

    return (
        <div className="coupon-container">
            <h1 className="heading">Admin Coupons</h1>

            {/* TOP STAT BOXES */}
            <div className="stats-row">
                <div className="stat-box">Total Coupons<br /><b>{totalCoupons}</b></div>
                <div className="stat-box">Total Coupon Amount<br /><b>₹{totalAmount}</b></div>
                <div className="stat-box">Total Used<br /><b>{totalUsed}</b></div>
                <div className="stat-box">Current Coupon<br /><b>{activeCoupon?.name || "None"}</b></div>
                <div className="stat-box">Current Used Count<br /><b>{activeCoupon?.usedCount || 0}</b></div>
            </div>

            {/* CREATE NEW COUPON */}
            <div className="form-section">
                <h2>Create New Coupon</h2>

                <input value={couponName} onChange={(e) => setCouponName(e.target.value)} placeholder="Coupon Name / Code" />
                <input value={couponAmount} onChange={(e) => setCouponAmount(e.target.value)} placeholder="Coupon Amount (₹)" type="number" />
                <input value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} placeholder="Max Users (optional)" type="number" />
                <button className="primary" onClick={saveCoupon} disabled={loading}>Create Coupon</button>
            </div>

            {/* LIST OF COUPONS + EDIT */}
            <div className="table-section">
                <h2>Coupons</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Name / Code</th>
                            <th>Amount</th>
                            <th>Max Users</th>
                            <th>Used Count</th>
                            <th>Remaining</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {coupons.map((c) => (
                            <tr key={c.id}>
                                <td>{editingCouponId === c.id ? <input value={editName} onChange={(e) => setEditName(e.target.value)} /> : c.name}</td>
                                <td>{editingCouponId === c.id ? <input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} type="number" /> : `₹${c.amount || 0}`}</td>
                                <td>{editingCouponId === c.id ? <input value={editMaxUsers} onChange={(e) => setEditMaxUsers(e.target.value)} type="number" /> : (c.maxUsers != null ? c.maxUsers : "Unlimited")}</td>
                                <td>{c.usedCount || 0}</td>
                                <td>{remainingUses(c)}</td>
                                <td>{c.active ? "Yes" : "No"}</td>

                                <td style={{ display: "flex", gap: 8 }}>
                                    {editingCouponId === c.id ? (
                                        <>
                                            <button onClick={saveEdit}>Save</button>
                                            <button onClick={closeEdit}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => openEdit(c)}>Edit</button>
                                            <button onClick={() => setActiveCoupon(c)} disabled={c.active || (c.maxUsers != null && (c.usedCount || 0) >= c.maxUsers)}>Set Active</button>
                                            <button onClick={() => toggleActive(c)}>{c.active ? "Deactivate" : "Activate"}</button>
                                            <button onClick={() => recountUsedCount(c)}>Recount</button>
                                            <button onClick={() => deleteCoupon(c)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TABLE OF USED CLIENTS */}
            <div className="table-section" style={{ marginTop: 20 }}>
                <h2>Used Coupon Clients</h2>
                <button className="primary" onClick={deleteAllUsed} disabled={loading} style={{ marginBottom: 10 }}>Delete All</button>

                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Payment ID</th>
                            <th>Amount Paid</th>
                            <th>Item</th>
                            <th>Coupon</th>
                            <th>Used By</th>
                            <th>Date & Time</th>
                        </tr>
                    </thead>

                    <tbody>
                        {usedList.map((u) => (
                            <tr key={u.id}>
                                <td>{u.orderId}</td>
                                <td>{u.paymentId}</td>
                                <td>₹{u.totalAmount}</td>
                                <td style={{ maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.item}</td>
                                <td>{u.couponName || "-"}</td>
                                <td>{u.usedBy || "-"}</td>
                                <td>{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
