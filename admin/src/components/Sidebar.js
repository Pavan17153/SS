// src/components/Sidebar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../Sidebar.css";

import AdminNotificationsBell from "../pages/AdminNotificationsBell"; // 🔔 ADD

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully");
      navigate("/login");
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-container">

        {/* 🔝 TOP HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2 className="admin-logo">Admin Panel</h2>
        </div>

        {/* 📌 MENU */}
        <ul className="admin-nav-menu">
          <li><Link to="/">🏠 Home</Link></li>
          <li><Link to="/categories">📂 Categories</Link></li>
          <li><Link to="/product-list">📦 All Products</Link></li>
          <li><Link to="/orders">🧾 Orders</Link></li>
          <li><Link to="/payments">💳 Payments</Link></li>
          <li><Link to="/coupons">🏷️ Coupons</Link></li>

          <li className="divider"></li>
          <li><Link to="/contact">✉️ Contact</Link></li>
          <li><Link to="/terms">📜 Terms</Link></li>
          <li>
            <Link to="/revenue">📊 Revenue Analytics</Link>
          </li>

          {/* 🔔 NOTIFICATION BELL (GLOBAL & PERMANENT) */}
          <AdminNotificationsBell />

          <li className="divider"></li>

          {/* 🚪 LOGOUT */}
          <li
            className="logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
