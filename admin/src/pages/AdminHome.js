// admin/src/pages/AdminHome.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../AdminHome.css";

// CLOUDINARY CONFIG
const CLOUDINARY_CLOUD = "dshnpehlq"; 
const CLOUDINARY_UNSIGNED_PRESET = "unsigned_homepage_preset";

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState({
    title: "",
    subtitle: "",
    sliderImages: [],
    trending: []
  });

  const refDoc = doc(db, "homepage", "homeContent");

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(refDoc);
        if (snap.exists()) {
          setContent(snap.data());
        } else {
          await setDoc(
            refDoc,
            {
              title: "Welcome to SS Fashion",
              subtitle: "Where tradition meets modern elegance.",
              sliderImages: [],
              trending: []
            },
            { merge: true }
          );
          setContent({
            title: "Welcome to SS Fashion",
            subtitle: "Where tradition meets modern elegance.",
            sliderImages: [],
            trending: []
          });
        }
      } catch (e) {
        console.error(e);
        alert("Failed loading homepage data");
      }
      setLoading(false);
    };

    load();
  }, []);

  // ---------------------------
  // CLOUDINARY UPLOAD FUNCTION
  // ---------------------------
  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);

    const res = await fetch(url, {
      method: "POST",
      body: fd
    });

    if (!res.ok) throw new Error("Cloudinary Upload Failed");

    const data = await res.json();
    return data.secure_url; // PUBLIC URL
  };

  // ---------------------------
  // IMAGE HANDLER
  // ---------------------------
  const handleUpload = async (e, type, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const secureUrl = await uploadToCloudinary(file);

      if (type === "slider") {
        const arr = [...content.sliderImages];
        arr[index] = secureUrl;
        setContent({ ...content, sliderImages: arr });
      } else {
        const arr = [...content.trending];
        arr[index] = { ...arr[index], image: secureUrl };
        setContent({ ...content, trending: arr });
      }

      alert("Image Uploaded Successfully!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  // Add new slider slot
  const addSliderImage = () => {
    setContent({
      ...content,
      sliderImages: [...content.sliderImages, ""]
    });
  };

  // Add trending item
  const addTrendingItem = () => {
    setContent({
      ...content,
      trending: [...content.trending, { name: "", image: "" }]
    });
  };

  // SAVE TO FIRESTORE
  const saveChanges = async () => {
    try {
      await setDoc(refDoc, content, { merge: true });
      alert("Home Page Updated!");
    } catch (err) {
      alert("Saving Failed: " + err.message);
    }
  };

  if (loading) return <h3 style={{ padding: 20 }}>Loading...</h3>;

  return (
    <div className="admin-home" style={{ padding: 20, maxWidth: 900 }}>
      <h2>Admin — Update Home Page</h2>

      <label>Title</label>
      <input
        value={content.title}
        onChange={(e) => setContent({ ...content, title: e.target.value })}
        className="input-box"
      />

      <label>Subtitle</label>
      <input
        value={content.subtitle}
        onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
        className="input-box"
      />

      {/* SLIDER IMAGES */}
      <h3 style={{ marginTop: 20 }}>Slider Images</h3>

      {content.sliderImages.map((img, index) => (
        <div
          key={index}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}
        >
          <img
            src={img || "/placeholder.jpg"}
            alt=""
            style={{
              width: 150,
              height: 90,
              borderRadius: 8,
              objectFit: "cover",
              border: "1px solid #ddd"
            }}
          />

          <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "slider", index)} />

          <button
            onClick={() => {
              const arr = [...content.sliderImages];
              arr.splice(index, 1);
              setContent({ ...content, sliderImages: arr });
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <button className="add-btn" onClick={addSliderImage}>
        + Add Slider Image
      </button>

      {/* TRENDING ITEMS */}
      <h3 style={{ marginTop: 30 }}>Trending Collections</h3>

      {content.trending.map((t, index) => (
        <div
          key={index}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}
        >
          <input
            placeholder="Name"
            value={t.name}
            onChange={(e) => {
              const arr = [...content.trending];
              arr[index] = { ...arr[index], name: e.target.value };
              setContent({ ...content, trending: arr });
            }}
            className="input-box"
            style={{ width: 150 }}
          />

          <img
            src={t.image || "/placeholder.jpg"}
            alt=""
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              objectFit: "cover",
              border: "1px solid #ddd"
            }}
          />

          <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "trending", index)} />

          <button
            onClick={() => {
              const arr = [...content.trending];
              arr.splice(index, 1);
              setContent({ ...content, trending: arr });
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <button className="add-btn" onClick={addTrendingItem}>
        + Add Trending Item
      </button>

      <div style={{ marginTop: 30 }}>
        <button className="save-btn" onClick={saveChanges}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
