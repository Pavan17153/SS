import React from "react";
import { Link } from "react-router-dom";
import "../Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li><Link to="/">🏠 Home</Link></li>
          <li><Link to="/categories">📂 Categories</Link></li>
          <li><Link to="/orders">🧾 Orders</Link></li>
          <li><Link to="/payments">💳 Payments</Link></li>
          <li><Link to="/contact">✉️ Contact</Link></li>
          <li><Link to="/about">ℹ️ About</Link></li>
          <li><Link to="/privacy">🔒 Privacy</Link></li>
          <li><Link to="/shipping">🚚 Shipping</Link></li>
          <li><Link to="/terms">📜 Terms & Conditions</Link></li>
          <li><Link to="/faq">❓ FAQ</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
