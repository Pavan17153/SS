// src/pages/Privacy.js
import React from "react";
import "../Policy.css";

export default function Privacy() {
  return React.createElement(
    "div",
    { className: "policy-container" },
    React.createElement("h1", { className: "policy-title" }, "Privacy Policy"),
    React.createElement("hr"),
    React.createElement(
      "div",
      { className: "policy-content" },
      [
        { h: null, t: "SS Fashion values your privacy. This policy explains how we collect and protect your personal information." },
        { h: "1. Information Collection", t: "We collect personal details during account creation, order placement, and any communication with us." },
        { h: "2. Use of Information", t: "Your data helps us process orders, improve shopping experience, and provide better customer support." },
        { h: "3. Cookies", t: "Cookies are used for login sessions, preferences, and website analytics." },
        { h: "4. Security", t: "We use secure systems and encryption to protect your personal information." },
        { h: "5. Updates", t: "We may update this policy from time to time. Please review it regularly." }
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
