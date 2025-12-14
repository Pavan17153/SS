// src/pages/Faq.js
import React from "react";
import "../Faq.css";

export default function Faq() {
  const faqs = [
    {
      q: "How can I place an order on SS Fashion?",
      a: "You can browse our collections, select products or stitching services, add them to your cart, and complete checkout using a secure payment method."
    },
    {
      q: "Do you provide custom stitching services?",
      a: "Yes. We offer custom stitching for blouses, dresses, saree fall & pico, and embroidery work. You can enter measurements or upload a measurement sheet during order placement."
    },
    {
      q: "What payment options are available?",
      a: "We accept UPI, Debit Cards, Credit Cards, Net Banking, and Cash on Delivery (COD), depending on your location and order value."
    },
    {
      q: "How long does delivery take?",
      a: "Orders are usually delivered within 5–10 business days. Custom stitching orders may require additional processing time."
    },
    {
      q: "How can I track my order?",
      a: "Once your order is shipped, tracking details will be shared via SMS or email. You can also view order status from your Orders page."
    },
    {
      q: "Can I cancel or modify my order?",
      a: "Orders can be modified or cancelled before processing. Once stitching or shipping has started, changes may not be possible."
    },
    {
      q: "What is your return and exchange policy?",
      a: "Ready-made products may be eligible for return or exchange as per our policy. Custom-stitched items are non-returnable unless damaged or defective."
    },
    {
      q: "What should I do if I receive a damaged product?",
      a: "Please contact our support team within 48 hours of delivery with photos of the issue. We will review and assist you promptly."
    },
    {
      q: "Is my payment information safe?",
      a: "Yes. All payments are securely processed through trusted payment gateways. SS Fashion does not store your card or UPI details."
    },
    {
      q: "How can I contact customer support?",
      a: "You can reach us via the Contact page or email us at support@ssfashion.com. Our team will respond as quickly as possible."
    }
  ];

  return (
    <div className="faq-container">
      <h1 className="faq-title">Frequently Asked Questions</h1>
      <hr />

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div className="faq-item" key={index}>
            <h3>{index + 1}. {faq.q}</h3>
            <p>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
