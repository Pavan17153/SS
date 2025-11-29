// admin/src/pages/ProductAdmin.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // admin firebase (exports db)
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../ProductAdmin.css";

/**
 * Put your Cloudinary values here
 */
const CLOUDINARY_CLOUD = "dshnpehlq"; // replace with your cloud name
const CLOUDINARY_UNSIGNED_PRESET = "unsigned_homepage_preset"; // replace with your unsigned preset name

export default function ProductAdmin() {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    name: "",
    title: "",
    category: "maggam-work",
    price: "",
    original: "",
    stockQty: "",
    description: "",
    image: "" // will store secure_url after upload
  });

  const productsRef = collection(db, "products");

  // Upload file to Cloudinary (unsigned)
  const uploadToCloudinary = async (file) => {
    if (!file) return null;
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);

    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error("Cloudinary upload failed: " + txt);
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      setProduct((p) => ({ ...p, image: url }));
      alert("Image uploaded to Cloudinary.");
    } catch (err) {
      alert("Image upload failed: " + err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    // Basic validation
    if (!product.name || !product.price || !product.image) {
      alert("Please provide at least: name, price and image.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: product.name,
        title: product.title || product.name,
        category: product.category,
        price: Number(product.price),
        original: product.original ? Number(product.original) : Number(product.price),
        stockQty: Number(product.stockQty || 0),
        description: product.description || "",
        image: product.image, // Cloudinary secure URL
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(productsRef, payload);
      alert("Product saved (id: " + docRef.id + ")");
      // clear form or keep it
      setProduct({
        name: "",
        title: "",
        category: "maggam-work",
        price: "",
        original: "",
        stockQty: "",
        description: "",
        image: ""
      });
    } catch (err) {
      alert("Save failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 800 }}>
      <h2>Admin — Add Product</h2>

      <label>Name</label>
      <input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />

      <label>Title</label>
      <input value={product.title} onChange={(e) => setProduct({ ...product, title: e.target.value })} />

      <label>Category</label>
      <select value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })}>
        <option value="maggam-work">Maggam Work</option>
        <option value="bridal">Bridal</option>
        <option value="simple">Simple Blouse</option>
        <option value="computer-work">Computer Work</option>
        <option value="heavy">Heavy Blouse</option>
        <option value="mirror">Mirror Work</option>
        <option value="thread">Thread Work</option>
        <option value="simple-buti">Simple Buti</option>
        <option value="new-collection">New Collection</option>
      </select>

      <label>Price (₹)</label>
      <input type="number" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} />

      <label>Original Price (optional)</label>
      <input type="number" value={product.original} onChange={(e) => setProduct({ ...product, original: e.target.value })} />

      <label>Stock Quantity</label>
      <input type="number" value={product.stockQty} onChange={(e) => setProduct({ ...product, stockQty: e.target.value })} />

      <label>Description</label>
      <textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} rows={4} />

      <label>Image (select file from PC)</label>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input type="file" accept="image/*" onChange={handleFile} />
        {product.image && <img src={product.image} alt="preview" style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 6 }} />}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleSave} disabled={loading} className="save-btn">
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </div>
  );
}
