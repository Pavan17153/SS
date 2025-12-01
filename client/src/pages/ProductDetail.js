// client/src/pages/ProductDetail.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowLeft, FaSearchPlus } from "react-icons/fa";
import "../ProductDetail.css";

// Normalize image URLs safely
const normalizeImg = (val) => {
  if (!val) return null;
  if (typeof val !== "string") return null;
  const v = val.trim();
  if (v.length === 0) return null;
  return v;
};

// Get primary image
const getPrimaryImage = (p) => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (p.image) return p.image;
  return "/placeholder.jpg";
};

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainIndex, setMainIndex] = useState(0);
  const [related, setRelated] = useState([]);

  const [successMsg, setSuccessMsg] = useState("");

  // ZOOM
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Fetch Main Product
  useEffect(() => {
    const fetchProduct = async () => {
      const ref = doc(db, "products", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const data = snap.data();

      const imagesNormalized = Array.isArray(data.images)
        ? data.images.map(normalizeImg).filter(Boolean)
        : data.images
        ? [normalizeImg(data.images)].filter(Boolean)
        : [];

      const primary = normalizeImg(data.image);
      const finalImages =
        imagesNormalized.length > 0 ? imagesNormalized : primary ? [primary] : [];

      const prodData = {
        id: snap.id,
        title: data.title || data.name,
        name: data.name || data.title,
        price: data.price ?? 0,
        original: data.original ?? data.price ?? 0,
        stockQty: data.stockQty ?? 0,
        description: data.description || "",
        images: finalImages,
        image: primary,
        category: data.category || "",
      };

      setProduct(prodData);
      fetchRelatedProducts(prodData.category, snap.id);
    };

    // Fetch Related Products
    const fetchRelatedProducts = async (category, currentId) => {
      if (!category) return;

      const q = query(collection(db, "products"), where("category", "==", category));
      const snap = await getDocs(q);

      const all = [];
      snap.forEach((d) => {
        if (d.id !== currentId) {
          all.push({
            id: d.id,
            ...d.data(),
            image:
              d.data().images?.[0] ||
              d.data().image ||
              "/placeholder.jpg",
          });
        }
      });

      const shuffled = all.sort(() => 0.5 - Math.random());
      setRelated(shuffled.slice(0, 4));
    };

    fetchProduct();
  }, [id]);

  if (!product) return <h3>Loading...</h3>;

  const images = product.images.length ? product.images : [getPrimaryImage(product)];

  // Add to cart
  const addToCart = () => {
    let cart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
    const exist = cart.find((c) => c.id === product.id);

    if (exist) exist.qty += 1;
    else {
      cart.push({
        id: product.id,
        name: product.title,
        price: product.price,
        qty: 1,
        image: images[0],
      });
    }

    localStorage.setItem("ssf_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    setSuccessMsg("Product added to cart!");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  // Zoom logic
  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="detail-container">
      
      {/* BACK BUTTON */}
      <button onClick={() => nav(-1)} className="back-btn">
        <FaArrowLeft /> Back
      </button>

      {/* LEFT SIDE */}
      <div className="detail-left">

        {/* MAIN IMAGE + ZOOM */}
        <div
          className={`zoom-container ${zoom ? "zoom-active" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          style={{
            backgroundImage: zoom ? `url(${images[mainIndex]})` : "none",
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
          }}
        >
          <img
            src={images[mainIndex]}
            alt="main"
            className="detail-img"
          />

          <div className="zoom-icon">
            <FaSearchPlus />
          </div>
        </div>

        {/* THUMBNAILS */}
        {images.length > 1 && (
          <div className="thumbnail-row">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                className={`thumb ${i === mainIndex ? "active" : ""}`}
                onClick={() => setMainIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="detail-right">
        <h2 className="detail-title">{product.title}</h2>

        <p className="detail-price">
          <span className="old">₹{product.original}</span>
          <span className="new">₹{product.price}</span>
        </p>

        <p className="detail-desc">{product.description}</p>

        <p className="stock">
          <b>{product.stockQty > 0 ? `${product.stockQty} in stock` : "Out of Stock"}</b>
        </p>

        {product.stockQty > 0 ? (
          <>
            <button className="add-basket-btn" onClick={addToCart}>
              Add to Cart
            </button>
            {successMsg && <p className="success-message">{successMsg}</p>}
          </>
        ) : (
          <button className="add-basket-btn" disabled>
            Out of Stock
          </button>
        )}
      </div>

      {/* RELATED PRODUCTS */}
      <div className="related-section">
        <h3>Related Products</h3>

        <div className="related-scroll">
          {related.map((r) => (
            <div
              className="related-card"
              key={r.id}
              onClick={() => nav(`/product/${r.id}`)}
            >
              <img src={r.image} className="related-img" alt="" />
              <p className="related-name">{r.title}</p>
              <p className="related-price">₹{r.price}</p>

              {r.stockQty > 0 && <span className="in-stock">In Stock</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
