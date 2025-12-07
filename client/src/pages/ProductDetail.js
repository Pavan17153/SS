// client/src/pages/ProductDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { FaArrowLeft, FaSearchPlus } from "react-icons/fa";
import "../ProductDetail.css";
import { emitCartUpdate } from "./cartEvents"; // corrected path

const normalizeImg = (val) => {
  if (!val || typeof val !== "string") return null;
  const v = val.trim();
  return v.length ? v : null;
};

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
  const [toastMsg, setToastMsg] = useState("");
  const [stockWarning, setStockWarning] = useState("");

  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

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
          image: d.data().images?.[0] || d.data().image || "/placeholder.jpg",
        });
      }
    });
    setRelated(all.sort(() => 0.5 - Math.random()).slice(0, 4));
  };

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
        price: data.price ?? 0,
        original: data.original ?? data.price ?? 0,
        stockQty: data.stockQty ?? 0,
        description: data.description || "",
        images: finalImages,
        category: data.category || "",
      };

      setProduct(prodData);
      fetchRelatedProducts(prodData.category, snap.id);
    };

    fetchProduct();
  }, [id]);

  if (!product) return <h3>Loading...</h3>;

  const images = product.images.length ? product.images : [getPrimaryImage(product)];

  /** ADD TO CART FIXED: respects logged-in key, merges guest cart if needed, emits cartEvent */
  const addToCart = () => {
    // determine storage key depending on auth state
    const email = auth.currentUser?.email || null;
    const userKey = email ? `ssf_cart_${email}` : "ssf_cart";

    // If user logged in, merge guest cart into user cart first (optional but helpful)
    if (email) {
      const guest = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
      if (guest.length > 0) {
        const userCart = JSON.parse(localStorage.getItem(userKey) || "[]");
        // merge guest into userCart
        guest.forEach((g) => {
          const idx = userCart.findIndex((u) => u.id === g.id);
          if (idx >= 0) userCart[idx].qty = (userCart[idx].qty || 0) + (g.qty || 0);
          else userCart.push(g);
        });
        localStorage.setItem(userKey, JSON.stringify(userCart));
        localStorage.removeItem("ssf_cart"); // clear guest
      }
    }

    // load the right cart
    let cart = JSON.parse(localStorage.getItem(userKey) || "[]");
    const existIndex = cart.findIndex((c) => c.id === product.id);
    const stock = Number(product.stockQty) || 0;
    const currentQty = existIndex >= 0 ? (cart[existIndex].qty || 0) : 0;

    if (currentQty >= stock) {
      setStockWarning(`Only ${stock} items available in stock for ${product.title}.`);
      setTimeout(() => setStockWarning(""), 3000);
      return;
    }

    if (existIndex >= 0) {
      cart[existIndex].qty = (cart[existIndex].qty || 0) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.title,
        price: product.price,
        qty: 1,
        image: images[0],
      });
    }

    localStorage.setItem(userKey, JSON.stringify(cart));

    // notify app via your single event system
    emitCartUpdate();

    // show toast
    setToastMsg("Product added to cart!");
    setTimeout(() => setToastMsg(""), 2000);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const descriptionLines = product.description.split("\n");

  return (
    <div className="detail-container">
      {toastMsg && <div className="toast show">{toastMsg}</div>}


      <button onClick={() => nav(-1)} className="back-btn bounce">
        <FaArrowLeft /> Back
      </button>

      <div className="detail-left">
        <div
          className={`zoom-box ${zoom ? "active" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          style={{
            backgroundImage: `url(${images[mainIndex]})`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundSize: zoom ? "260%" : "100%",
          }}
        >
          <div className="zoom-icon">
            <FaSearchPlus />
          </div>
        </div>

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

      <div className="detail-right fadeInUp">
        <h2 className="detail-title">{product.title}</h2>
        <p className="detail-price">
          <span className="old">₹{product.original}</span>
          <span className="new">₹{product.price}</span>
        </p>

        <div className="detail-desc">
          {descriptionLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>

        <p className="stock">
          <b>{product.stockQty > 0 ? `${product.stockQty} in stock` : "Out of Stock"}</b>
        </p>

        {stockWarning && (
          <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
            {stockWarning}
          </p>
        )}

        {product.stockQty > 0 ? (
          <button className="add-basket-btn pulse" onClick={addToCart}>
            Add to Cart
          </button>
        ) : (
          <button className="add-basket-btn disabled">Out of Stock</button>
        )}
      </div>

      <div className="related-section">
        <h3>Related Products</h3>
        <div className="related-scroll">
          {related.map((r) => (
            <div className="related-card" key={r.id} onClick={() => nav(`/product/${r.id}`)}>
              <img src={r.image} className="related-img" alt="" />
              <p className="related-name">{r.title}</p>
              <p className="related-price">₹{r.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
