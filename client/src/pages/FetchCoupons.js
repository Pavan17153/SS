// src/components/FetchCoupons.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
} from "firebase/firestore";
import "../FetchCoupons.css";

export default function FetchCoupons({ onApply }) {
    const [coupons, setCoupons] = useState([]);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(auth.currentUser || null);

    // Keep auth current and re-fetch when login state changes
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            setUser(u);
            // reset selection when user changes
            setSelectedCoupon(null);
            fetchCoupons(u);
        });
        // initial fetch
        fetchCoupons(user);
        return () => unsub();
    }, []);

    // =============================================================
    // 1) GET COUPONS USED BY CURRENT USER
    // =============================================================
    const fetchUserUsedCoupons = async (u) => {
        if (!u) return [];
        try {
            const q = query(
                collection(db, "couponUsed"),
                where("usedBy", "==", u.email) // match by email
            );
            const snap = await getDocs(q);
            // Return couponNames this user already used
            return snap.docs.map((d) => d.data().couponName).filter(Boolean);
        } catch (err) {
            console.error("fetchUserUsedCoupons error:", err);
            return [];
        }
    };

    // =============================================================
    // 2) FETCH ACTIVE COUPONS + APPLY FILTERS
    // =============================================================
    const fetchCoupons = async (u = auth.currentUser) => {
        setLoading(true);
        try {
            const usedByUser = await fetchUserUsedCoupons(u);

            // Fetch all active coupons
            const q = query(
                collection(db, "coupons"),
                where("active", "==", true),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            let fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // Filter coupons
            fetched = fetched.filter((c) => {
                const used = c.usedCount || 0;
                const max = c.maxUsers || 0;

                // 1️⃣ hide if global max reached
                if (max > 0 && used >= max) return false;

                // 2️⃣ hide if current user already used this coupon
                if (usedByUser.includes(c.name)) return false;

                return true;
            });

            setCoupons(fetched);
        } catch (err) {
            console.error("Failed to fetch coupons:", err);
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    // =============================================================
    // SELECT COUPON
    // =============================================================
    const handleSelect = (coupon) => {
        setSelectedCoupon(coupon);

        // Store globally for checkout & persist to localStorage
        window.appliedCouponId = coupon.id;
        window.appliedCouponObj = coupon;

        try {
            localStorage.setItem("ssf_appliedCoupon", JSON.stringify(coupon));
        } catch (e) {
            console.warn("Could not persist applied coupon to localStorage", e);
        }

        if (onApply) onApply(coupon);
    };

    // =============================================================
    // UI
    // =============================================================
    return (
        <div className="fetch-coupons-container">
            <h3 className="fc-title">🔥 Apply Best Coupon</h3>

            {loading ? (
                <p className="fc-loading">Loading coupons...</p>
            ) : coupons.length === 0 ? (
                <p className="fc-empty">No coupons available</p>
            ) : (
                <div className="coupon-list">
                    {coupons.map((coupon) => (
                        <div
                            key={coupon.id}
                            className={`coupon-item ${selectedCoupon?.id === coupon.id ? "selected" : ""}`}
                            onClick={() => handleSelect(coupon)}
                        >
                            <div className="coupon-left">
                                <span className="coupon-name">{coupon.name}</span>
                                <span className="coupon-desc">
                                    {coupon.description || "Special Discount"}
                                </span>
                            </div>

                            <div className="coupon-right">
                                <span className="coupon-amount">₹{coupon.amount}</span>
                                {coupon.maxUsers > 0 && (
                                    <span className="coupon-limit">
                                        {coupon.usedCount || 0}/{coupon.maxUsers}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedCoupon && (
                <div className="coupon-applied">
                    <p>
                        Applied: <b>{selectedCoupon.name}</b>{" "}
                        <span className="discount-text">– You saved ₹{selectedCoupon.amount}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
