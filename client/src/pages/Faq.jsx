import React from "react";
import "../Faq.css"; // Import CSS file

export default function Faq() {
  return (
    <div className="faq-container">
      <h1 className="faq-title">FAQ’s</h1>
      <hr />

      <div className="faq-list">

        <div className="faq-item">
          <h3>1. How can I place an order?</h3>
          <p>
            Browse products, choose your preferred items, add them to your cart, and complete the checkout process using your preferred payment method.
          </p>
        </div>

        <div className="faq-item">
          <h3>2. What are the available payment options?</h3>
          <p>
            We accept UPI, Debit/Credit Cards, Net Banking, and Cash on Delivery (COD) depending on your location.
          </p>
        </div>

        <div className="faq-item">
          <h3>3. How long does shipping take?</h3>
          <p>
            Orders are delivered within <b>5–10 business days</b> depending on your location and courier availability.
          </p>
        </div>

        <div className="faq-item">
          <h3>4. Can I return or exchange a product?</h3>
          <p>
            Yes, returns and exchanges are accepted for eligible items. Please check our Return & Refund Policy for full details.
          </p>
        </div>

        <div className="faq-item">
          <h3>5. How do I track my order?</h3>
          <p>
            Once shipped, you will receive a tracking link via SMS or email. You can also visit the Orders page to track your item.
          </p>
        </div>

        <div className="faq-item">
          <h3>6. What if I receive a damaged product?</h3>
          <p>
            If your product arrives damaged or defective, contact our support team within 48 hours with photos, and we will assist immediately.
          </p>
        </div>

        <div className="faq-item">
          <h3>7. How can I contact customer support?</h3>
          <p>
            You can reach us through the Contact page or email us at <b>support@ssfashion.com</b>.
          </p>
        </div>

      </div>
    </div>
  );
}
