// src/components/EmailExistPopup.js
import React from "react";
import "./PopupStyles.css";

export default function EmailExistPopup({ visible, onClose, email, onOpenLogin }) {
  if (!visible) return null;
  return (
    <div className="dark-modal-overlay" onClick={onClose}>
      <div className="dark-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✖</button>
        <h3>Account exists</h3>

        <p style={{ color: "#ddd" }}>
          The email <strong style={{ color: "#fff" }}>{email}</strong> is already registered.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            className="primary-btn"
            onClick={() => {
              onOpenLogin && onOpenLogin(email);
            }}
          >
            Login
          </button>
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
