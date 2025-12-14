// src/admin/AdminContact.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../adminContact.css";

export default function AdminContact() {
  const [form, setForm] = useState({
    address: "",
    phone: "",
    email: "",
    hours: "",
    quotes: [""],
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContactData();
  }, []);

  async function loadContactData() {
    const ref = doc(db, "siteSettings", "contactInfo");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setForm(snap.data());
    }
  }

  function handleQuoteChange(index, value) {
    const updated = [...form.quotes];
    updated[index] = value;
    setForm({ ...form, quotes: updated });
  }

  function addQuote() {
    setForm({ ...form, quotes: [...form.quotes, ""] });
  }

  function removeQuote(index) {
    const updated = [...form.quotes];
    updated.splice(index, 1);
    setForm({ ...form, quotes: updated });
  }

  async function handleSave() {
    setSaving(true);

    const ref = doc(db, "siteSettings", "contactInfo");
    await setDoc(ref, form);

    setSaving(false);
    alert("Contact info saved successfully!");
  }

  return (
    <div className="admin-contact-container">
      <h2>Edit Contact Page</h2>

      <label>Address</label>
      <textarea
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <label>Phone</label>
      <input
        type="text"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <label>Email</label>
      <input
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <label>Working Hours</label>
      <input
        type="text"
        value={form.hours}
        onChange={(e) => setForm({ ...form, hours: e.target.value })}
      />

      <label>Quotes / Messages</label>
      {form.quotes.map((quote, index) => (
        <div key={index} className="quote-row">
          <input
            type="text"
            value={quote}
            onChange={(e) =>
              handleQuoteChange(index, e.target.value)
            }
          />
          <button
            className="remove-btn"
            onClick={() => removeQuote(index)}
            disabled={form.quotes.length === 1}
          >
            ❌
          </button>
        </div>
      ))}

      <button className="add-btn" onClick={addQuote}>
        ➕ Add Quote
      </button>

      <button className="save-btn" onClick={handleSave}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
