import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully");
      navigate("/adminlogin"); // redirect to admin login
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-container">

        <h2 className="admin-logo">Admin Panel</h2>

        <ul className="admin-nav-menu">
          <li><Link to="/">🏠 Home</Link></li>
          <li><Link to="/categories">📂 Categories</Link></li>
          <li><Link to="/product-list">📦 All Products</Link></li>
          <li><Link to="/orders">🧾 Orders</Link></li>
          <li><Link to="/payments">💳 Payments</Link></li>
          <li><Link to="/coupons">🏷️ Coupons</Link></li>
          <li className="divider"></li>

          <li><Link to="/contact">✉️ Contact</Link></li>
          <li><Link to="/about">ℹ️ About</Link></li>
          <li><Link to="/privacy">🔒 Privacy</Link></li>
          <li><Link to="/shipping">🚚 Shipping</Link></li>
          <li><Link to="/terms">📜 Terms</Link></li>
          <li><Link to="/faq">❓ FAQ</Link></li>

          {/* LOGOUT */}
          <li className="divider"></li>
          <li
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              color: "#d93025",
              fontWeight: "600"
            }}
          >
            🚪 Logout
          </li>
        </ul>

      </div>
    </nav>
  );
};

export default Sidebar;
