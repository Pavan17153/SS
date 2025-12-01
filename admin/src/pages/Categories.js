// admin/src/pages/ProductAdmin.js
import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./ProductAdmin.css";

// CLOUDINARY CONFIG
const CLOUDINARY_CLOUD = "dshnpehlq";
const CLOUDINARY_UNSIGNED_PRESET = "unsigned_homepage_preset";

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
    images: [],
    image: ""
  });

  const productsRef = collection(db, "products");

  // ----------------------------------------------
  // VERIFY URL (Fix: image sometimes not loading)
  // ----------------------------------------------
  const verifyImageURL = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;

      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      // slow internet fallback
      setTimeout(() => resolve(true), 2000);
    });
  };

  // ----------------------------------------------
  // CLOUDINARY UPLOAD (Stable, Retry, Fix all bugs)
  // ----------------------------------------------
  const uploadToCloudinary = async (file) => {
    const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);

    // force unique file ID (prevents overwrite)
    formData.append("public_id", "img_" + Date.now() + "_" + Math.random());

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(apiUrl, { method: "POST", body: formData });
        if (!res.ok) continue;

        const data = await res.json();
        if (!data.secure_url) continue;

        // verify working link
        const ok = await verifyImageURL(data.secure_url);
        if (!ok) continue;

        return data.secure_url;
      } catch (err) {
        console.log("Cloudinary error attempt:", attempt);
      }
    }

    throw new Error("Upload failed due to slow/unstable internet.");
  };

  // ----------------------------------------------
  // MULTIPLE FILE SELECT
  // ----------------------------------------------
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true);

    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        uploaded.push(url);
      }

      setProduct((p) => {
        const all = [...p.images, ...uploaded];
        return { ...p, images: all, image: all[0] };
      });

      alert("Images uploaded successfully ✔");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    e.target.value = "";
    setLoading(false);
  };

  // ----------------------------------------------
  // REMOVE IMAGE
  // ----------------------------------------------
  const removeImage = (index) => {
    setProduct((p) => {
      const updated = [...p.images];
      updated.splice(index, 1);

      return {
        ...p,
        images: updated,
        image: updated[0] || ""
      };
    });
  };

  // ----------------------------------------------
  // SET PRIMARY IMAGE
  // ----------------------------------------------
  const setAsPrimary = (index) => {
    setProduct((p) => {
      const arr = [...p.images];
      const [selected] = arr.splice(index, 1);
      return { ...p, images: [selected, ...arr], image: selected };
    });
  };

  // ----------------------------------------------
  // SAVE PRODUCT TO FIRESTORE
  // ----------------------------------------------
  const handleSaveProduct = async () => {
    if (!product.name.trim()) return alert("Product name required.");
    if (!product.price) return alert("Price required.");
    if (!product.images.length) return alert("Upload at least 1 image.");

    setLoading(true);

    try {
      const payload = {
        name: product.name,
        title: product.title || product.name,
        category: product.category,
        price: Number(product.price),
        original: Number(product.original || product.price),
        stockQty: Number(product.stockQty || 0),
        description: product.description,
        images: product.images,
        image: product.images[0],
        createdAt: serverTimestamp()
      };

      const doc = await addDoc(productsRef, payload);

      alert("Product saved ✔ (ID: " + doc.id + ")");

      // RESET FORM
      setProduct({
        name: "",
        title: "",
        category: "maggam-work",
        price: "",
        original: "",
        stockQty: "",
        description: "",
        images: [],
        image: ""
      });
    } catch (err) {
      alert("Save failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="admin-form">
      <h2>Add Product</h2>

      <label>Name</label>
      <input
        value={product.name}
        onChange={(e) => setProduct({ ...product, name: e.target.value })}
      />

      <label>Title</label>
      <input
        value={product.title}
        onChange={(e) => setProduct({ ...product, title: e.target.value })}
      />

      <label>Category</label>
      <select
        value={product.category}
        onChange={(e) => setProduct({ ...product, category: e.target.value })}
      >
        <option value="maggam-work">Maggam Work</option>
        <option value="bridal">Bridal</option>
        <option value="simple">Simple Blouse</option>
        <option value="computer-work">Computer Work</option>
        <option value="heavy">Heavy Blouse</option>
        <option value="mirror">Mirror Work</option>
        <option value="thread">Thread Work</option>
        <option value="simple-buti">Simple Buti</option>
        <option value="new-collection">New Collection</option>
        <option value="tops">Tops</option>
        <option value="kidswear">Kids Wear</option>
      </select>

      <label>Price (₹)</label>
      <input
        type="number"
        value={product.price}
        onChange={(e) => setProduct({ ...product, price: e.target.value })}
      />

      <label>Original Price</label>
      <input
        type="number"
        value={product.original}
        onChange={(e) => setProduct({ ...product, original: e.target.value })}
      />

      <label>Stock Quantity</label>
      <input
        type="number"
        value={product.stockQty}
        onChange={(e) => setProduct({ ...product, stockQty: e.target.value })}
      />

      <label>Description</label>
      <textarea
        rows={3}
        value={product.description}
        onChange={(e) => setProduct({ ...product, description: e.target.value })}
      />

      <label>Upload Images</label>
      <input type="file" multiple accept="image/*" onChange={handleFiles} />

      <div className="image-preview-container">
        {product.images.map((url, i) => (
          <div key={i} className="image-preview">
            <img src={url} alt="" className="preview-img" />

            <div className="image-actions">
              <button onClick={() => setAsPrimary(i)}>Main</button>
              <button onClick={() => removeImage(i)}>Delete</button>
            </div>

            <div className="image-label">
              {i === 0 ? "Primary" : `#${i + 1}`}
            </div>
          </div>
        ))}
      </div>

      <button className="save-btn" onClick={handleSaveProduct} disabled={loading}>
        {loading ? "Saving..." : "Save Product"}
      </button>
    </div>
  );
}
