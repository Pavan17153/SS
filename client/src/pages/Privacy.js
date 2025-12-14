// src/pages/Privacy.js
import React from "react";
import "../Policy.css";

export default function Privacy() {
  return (
    <div className="policy-container">
      <h1 className="policy-title">Privacy Policy</h1>
      <hr />

      <div className="policy-content">

        <div className="policy-section">
          <p>
            At <strong>SS Fashion</strong>, we respect your privacy and are committed
            to protecting your personal information. This Privacy Policy explains
            how we collect, use, store, and safeguard your data when you use our website.
          </p>
        </div>

        <div className="policy-section">
          <h3>1. Information We Collect</h3>
          <p>
            We collect personal information such as your name, email address,
            phone number, shipping address, and payment details when you create
            an account, place an order, or contact our support team.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Measurement & Custom Stitching Data</h3>
          <p>
            For stitching services, we may collect garment measurements or uploaded
            measurement sheets. This information is used strictly for fulfilling
            your customized orders and is never shared with third parties.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. How We Use Your Information</h3>
          <p>
            Your information is used to process orders, deliver products,
            manage payments, provide customer support, and improve your shopping
            experience on SS Fashion.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Payment Security</h3>
          <p>
            We do not store your card or UPI details on our servers.
            All payments are securely processed through trusted third-party
            payment gateways that comply with industry security standards.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Cookies & Tracking</h3>
          <p>
            SS Fashion uses cookies to maintain login sessions, remember
            preferences, and analyze website traffic. Cookies help us
            enhance performance and personalize your experience.
          </p>
        </div>

        <div className="policy-section">
          <h3>6. Data Protection & Security</h3>
          <p>
            We implement strict security measures, including encryption,
            authentication controls, and secure databases, to protect your
            personal data from unauthorized access or misuse.
          </p>
        </div>

        <div className="policy-section">
          <h3>7. Information Sharing</h3>
          <p>
            We do not sell or rent your personal information.
            Data may be shared only with trusted service providers such as
            delivery partners or payment processors, strictly for order fulfillment.
          </p>
        </div>

        <div className="policy-section">
          <h3>8. Your Rights</h3>
          <p>
            You have the right to access, update, or request deletion of your
            personal data. You may contact us anytime for privacy-related requests.
          </p>
        </div>

        <div className="policy-section">
          <h3>9. Policy Updates</h3>
          <p>
            This Privacy Policy may be updated periodically to reflect changes
            in our practices or legal requirements. Continued use of the website
            indicates acceptance of the updated policy.
          </p>
        </div>

      </div>
    </div>
  );
}
