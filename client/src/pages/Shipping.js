// src/pages/Shipping.js
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
          <p>
            Orders are typically delivered within <strong>5–10 business days</strong>,
            depending on your delivery location and courier partner availability.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Order Processing</h3>
          <p>
            All orders are processed within <strong>1–2 business days </strong>
            after payment confirmation. Orders placed on weekends or holidays
            are processed on the next working day.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. Shipping & Tracking</h3>
          <p>
            We provide reliable standard shipping for all orders. Once shipped,
            tracking details will be shared via registered email or SMS.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Delivery Conditions</h3>
          <p>
            Delivery timelines may vary due to unforeseen circumstances such as
            weather conditions, public holidays, courier delays, or remote-area
            locations.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Shipping Charges</h3>
          <p>
            Shipping charges, if applicable, are clearly displayed during checkout.
            Free shipping may be available during special promotions or offers.
          </p>
        </div>

      </div>
    </div>
  );
}
