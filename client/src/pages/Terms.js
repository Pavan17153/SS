// src/pages/Terms.js
import React from "react";
import "../Policy.css";

export default function Terms() {
  return React.createElement(
    "div",
    { className: "policy-container" },
    React.createElement("h1", { className: "policy-title" }, "Terms & Conditions"),
    React.createElement("hr"),
    React.createElement(
      "div",
      { className: "policy-content" },
      [
        { h: null, t: "By using SS Fashion, you agree to follow the terms mentioned below." },
        { h: "1. Product Information", t: "We ensure accurate product details. Slight variations in color or design may occur." },
        { h: "2. Payment & Usage", t: "All payments must be completed before we process your order. Products must be used only for personal purposes." },
        { h: "3. Liability", t: "SS Fashion is not responsible for damages caused by incorrect use of products." },
        { h: "4. Dispute Resolution", t: "Any disputes will be handled under Indian law." },
        { h: "5. Updates", t: "These terms may change anytime without notice. Please check regularly." }
      ].map(function (section, index) {
        return React.createElement(
          "div",
          { className: "policy-section", key: index },
          section.h ? React.createElement("h3", null, section.h) : null,
          React.createElement("p", null, section.t)
        );
      })
    )
  );
}
