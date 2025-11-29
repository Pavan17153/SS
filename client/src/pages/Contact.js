import React, { useEffect } from "react";
import "../Contact.css";

export default function Contact() {

  useEffect(() => {
    window.scrollTo(0, 0); // Move page to top when opened
  }, []);

  return (
    <div className="contact-container">

      <h2 className="contact-title">Contact Us</h2>

      {/* Motivational / Inquiry Questions Section */}
      <div className="contact-quote-box">
        <p className="contact-quote">
          Have a question about our products?  
        </p>
        <p className="contact-quote">
          Need help choosing the right design or blouse stitching pattern?
        </p>
        <p className="contact-quote">
          Looking for custom embroidery work or bulk orders?
        </p>
        <p className="contact-quote">
          We are here to assist you with anything you need. Reach out using the details below!
        </p>
      </div>

      <div className="contact-card">
        <h4>📍 Address</h4>
        <p>RBI Layout, JP Nagar, Bangalore - 560078</p>

        <h4>📞 Phone</h4>
        <p>+91 6300941733</p>

        <h4>📧 Email</h4>
        <p>support@radhacollections.in</p>

        <h4>🕒 Working Hours</h4>
        <p>Monday - Saturday: 10:00 AM to 7:00 PM</p>
      </div>
    </div>
  );
}
