import React from "react";
import "../Policy.css";

export default function Privacy() {
  return (
    <div className="policy-container">
      <h1 className="policy-title">Privacy Policy</h1>
      <hr />

      <div className="policy-content">

        <div className="policy-section">
          <p>
            SS Fashion values your privacy. This policy explains how we collect and protect your personal information.
          </p>
        </div>

        <div className="policy-section">
          <h3>1. Information Collection</h3>
          <p>
            We collect personal details during account creation, order placement, and any communication with us.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Use of Information</h3>
          <p>
            Your data helps us process orders, improve shopping experience, and provide better customer support.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. Cookies</h3>
          <p>
            Cookies are used for login sessions, preferences, and website analytics.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Security</h3>
          <p>
            We use secure systems and encryption to protect your personal information.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Updates</h3>
          <p>
            We may update this policy from time to time. Please review it regularly.
          </p>
        </div>

      </div>
    </div>
  );
}
