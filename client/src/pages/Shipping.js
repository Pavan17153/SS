// src/pages/Shipping.js
import React from "react";
import "../Policy.css";

export default function Shipping() {
  return React.createElement(
    "div",
    { className: "policy-container" },
    React.createElement("h1", { className: "policy-title" }, "Shipping Policy"),
    React.createElement("hr"),
    React.createElement(
      "div",
      { className: "policy-content" },
      [
        { h: "1. Delivery Time", t: "Minimum: 5 days, Maximum: 10 days depending on location and courier." },
        { h: "2. Order Processing", t: "Orders are processed within 1–2 business days after confirmation." },
        { h: "3. Shipping & Delivery", t: "Standard shipping is provided for all orders. Tracking details will be sent via email or SMS." },
        { h: "4. Delivery Conditions", t: "Delivery may take longer due to weather, holidays, or logistics delays." },
        { h: "5. Shipping Charges", t: "Shipping charges are shown at checkout. Free shipping may apply during offers." }
      ].map(function (section, index) {
        return React.createElement(
          "div",
          { className: "policy-section", key: index },
          React.createElement("h3", null, section.h),
          React.createElement("p", null, section.t)
        );
      })
    )
  );
}
