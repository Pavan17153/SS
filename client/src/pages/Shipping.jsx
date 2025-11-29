import React from "react";
import "../Policy.css";

export default function Shipping() {
  return (
    <div className="policy-container">
      <h1 className="policy-title">Shipping Policy</h1>
      <hr />

      <div className="policy-content">

        <div className="policy-section">
          <h3>1. Delivery Time</h3>
          <p>Minimum: 5 days, Maximum: 10 days depending on location and courier.</p>
        </div>

        <div className="policy-section">
          <h3>2. Order Processing</h3>
          <p>
            Orders are processed within 1–2 business days after confirmation.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. Shipping & Delivery</h3>
          <p>
            Standard shipping is provided for all orders. Tracking details will be sent via email or SMS.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Delivery Conditions</h3>
          <p>
            Delivery may take longer due to weather, holidays, or logistics delays.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Shipping Charges</h3>
          <p>
            Shipping charges are shown at checkout. Free shipping may apply during offers.
          </p>
        </div>

      </div>
    </div>
  );
}
