// client/src/pages/ProductDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowLeft } from "react-icons/fa";
import "../ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
        else setProduct(null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduct();
  }, [id]);

  if (!product) return <h3>Loading or Product Not Found</h3>;

  const addToCart = () => {
    let cart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
    const existing = cart.find((c) => c.id === product.id);
    if (existing) existing.qty += 1;
    else cart.push({ id: product.id, name: product.title || product.name, price: product.price, qty: 1, image: product.image });
    localStorage.setItem("ssf_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    setSuccessMsg("Product added to cart!");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  return (
    <div className="detail-container">
      <button onClick={() => nav("/categories")} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", marginBottom: 10 }}>
        <FaArrowLeft /> Back
      </button>

      <div className="detail-left">
        <img src={product.image} alt={product.title || product.name} className="detail-img" />
      </div>

      <div className="detail-right">
        <h2 className="detail-title">{product.title || product.name}</h2>
        <p className="detail-price"><span className="old">₹{product.original}</span> <span className="new">₹{product.price}</span></p>
        <p className="detail-desc">{product.description}</p>
        <p className="stock">Availability: <b>{product.stockQty > 0 ? `${product.stockQty} in stock` : "Out of Stock"}</b></p>

        {product.stockQty > 0 ? (
          <>
            <button className="add-basket-btn" onClick={addToCart}>Add to Cart</button>
            {successMsg && <p className="success-message">{successMsg}</p>}
          </>
        ) : (
          <button className="add-basket-btn" disabled>Out of Stock</button>
        )}
      </div>
    </div>
  );
}
