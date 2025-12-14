// src/pages/Terms.js
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
            Welcome to <strong>SS Fashion</strong>. By accessing or using our website,
            you agree to comply with and be bound by the following Terms & Conditions.
            Please read them carefully before placing an order.
          </p>
        </div>

        <div className="policy-section">
          <h3>1. Product Information</h3>
          <p>
            We strive to display accurate product descriptions, images, and pricing.
            However, slight variations in color, design, embroidery patterns, or fabric
            texture may occur due to lighting, screen resolution, or handcrafted nature.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Orders & Payments</h3>
          <p>
            All orders must be prepaid through our available payment methods.
            Orders will be processed only after successful payment confirmation.
            SS Fashion reserves the right to cancel any order due to pricing errors,
            stock unavailability, or suspicious activity.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. Custom Stitching & Measurements</h3>
          <p>
            For customized stitching services, customers are responsible for providing
            accurate measurements. SS Fashion will not be liable for fitting issues
            caused by incorrect or incomplete measurement details submitted by the customer.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Shipping & Delivery</h3>
          <p>
            Delivery timelines are estimates and may vary depending on location,
            courier services, or unforeseen circumstances. SS Fashion is not responsible
            for delays caused by logistics partners or force majeure events.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Returns, Refunds & Cancellations</h3>
          <p>
            Returns or refunds are subject to our Return & Refund Policy.
            Customized and stitched products are generally non-returnable unless
            damaged or defective upon delivery.
          </p>
        </div>

        <div className="policy-section">
          <h3>6. User Responsibilities</h3>
          <p>
            You agree not to misuse the website, engage in fraudulent activities,
            or violate any applicable laws while using our services.
          </p>
        </div>

        <div className="policy-section">
          <h3>7. Limitation of Liability</h3>
          <p>
            SS Fashion shall not be liable for any indirect, incidental, or consequential
            damages arising from the use or inability to use our products or services.
          </p>
        </div>

        <div className="policy-section">
          <h3>8. Governing Law</h3>
          <p>
            These Terms & Conditions are governed by and interpreted in accordance
            with the laws of India. Any disputes shall be subject to the jurisdiction
            of Indian courts.
          </p>
        </div>

        <div className="policy-section">
          <h3>9. Updates to Terms</h3>
          <p>
            SS Fashion reserves the right to update or modify these terms at any time
            without prior notice. Continued use of the website constitutes acceptance
            of the revised terms.
          </p>
        </div>

      </div>
    </div>
  );
}
