// client/Contact.js
import React, { useEffect, useState } from "react";
import "../Contact.css";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Contact() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const ref = doc(db, "siteSettings", "contactInfo");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setInfo(snap.data());
      }
    } catch (err) {
      console.error("Error fetching contact info:", err);
    }
  }

  if (!info) return <p className="loading-text">Loading...</p>;

  return (
    <div className="contact-container">
      <h2 className="contact-title">Contact Us</h2>

      {/* Quotes */}
      <div className="contact-quote-box">
        {info.quotes?.map((q, index) => (
          <p className="contact-quote" key={index}>
            {q}
          </p>
        ))}
      </div>

      <div className="contact-card">
        <h4>📍 Address</h4>
        <p>{info.address}</p>

        <h4>📞 Phone</h4>
        <p>{info.phone}</p>

        <h4>📧 Email</h4>
        <p>{info.email}</p>

        <h4>🕒 Working Hours</h4>
        <p>{info.hours}</p>
      </div>
    </div>
  );
}
