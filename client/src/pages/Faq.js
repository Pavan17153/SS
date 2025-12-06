// src/pages/Faq.js
import React from "react";
import "../Faq.css";

export default function Faq() {
  return React.createElement(
    "div",
    { className: "faq-container" },
    React.createElement("h1", { className: "faq-title" }, "FAQ’s"),
    React.createElement("hr"),
    React.createElement(
      "div",
      { className: "faq-list" },
      [
        { q: "How can I place an order?", a: "Browse products, choose your preferred items, add them to your cart, and complete the checkout process using your preferred payment method." },
        { q: "What are the available payment options?", a: "We accept UPI, Debit/Credit Cards, Net Banking, and Cash on Delivery (COD) depending on your location." },
        { q: "How long does shipping take?", a: "Orders are delivered within 5–10 business days depending on your location and courier availability." },
        { q: "Can I return or exchange a product?", a: "Yes, returns and exchanges are accepted for eligible items. Please check our Return & Refund Policy for full details." },
        { q: "How do I track my order?", a: "Once shipped, you will receive a tracking link via SMS or email. You can also visit the Orders page to track your item." },
        { q: "What if I receive a damaged product?", a: "If your product arrives damaged or defective, contact our support team within 48 hours with photos, and we will assist immediately." },
        { q: "How can I contact customer support?", a: "You can reach us through the Contact page or email us at support@ssfashion.com." }
      ].map(function (faq, index) {
        return React.createElement(
          "div",
          { className: "faq-item", key: index },
          React.createElement("h3", null, index + 1 + ". " + faq.q),
          React.createElement("p", null, faq.a)
        );
      })
    )
  );
}
