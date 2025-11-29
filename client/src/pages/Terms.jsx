import React from "react";
import "../Policy.css";

export default function Terms() {
  return (
    <div className="policy-container">
      <h1 className="policy-title">Terms & Conditions</h1>
      <hr />

      <div className="policy-content">

        <div className="policy-section">
          <p>
            By using SS Fashion, you agree to follow the terms mentioned below.
          </p>
        </div>

        <div className="policy-section">
          <h3>1. Product Information</h3>
          <p>
            We ensure accurate product details. Slight variations in color or design may occur.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Payment & Usage</h3>
          <p>
            All payments must be completed before we process your order. Products must be used only for personal purposes.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. Liability</h3>
          <p>
            SS Fashion is not responsible for damages caused by incorrect use of products.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Dispute Resolution</h3>
          <p>
            Any disputes will be handled under Indian law.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Updates</h3>
          <p>
            These terms may change anytime without notice. Please check regularly.
          </p>
        </div>

      </div>
    </div>
  );
}
