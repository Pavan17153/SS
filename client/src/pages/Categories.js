// src/pages/Categories.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Categories.css";
import { db, auth } from "../firebase"; // import auth here
import { emitCartUpdate } from "./cartEvents"; // fixed path
import { collection, query, orderBy, getDocs } from "firebase/firestore";

// Function to safely get primary image
const getPrimaryImage = (p) => {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const img = p.images[0];
    if (img && typeof img === "string" && img.trim() !== "") return img;
  }
  if (p.image && typeof p.image === "string" && p.image.trim() !== "") return p.image;
  return "/placeholder.jpg";
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("maggam-work");
  const [searchText, setSearchText] = useState("");
  const [priceFilter, setPriceFilter] = useState(5000);
  const [currentPage, setCurrentPage] = useState(1);

  // NEW — popup message state
  const [popupMsg, setPopupMsg] = useState("");

  const ITEMS_PER_PAGE = 20;

  const categories = [
    { id: "maggam-work", label: "Maggam Work" },
    { id: "bridal", label: "Bridal Work" },
    { id: "simple", label: "Simple Blouse" },
    { id: "saree", label: "Sarees" },
    { id: "computer-work", label: "Computer Work" },
    { id: "heavy", label: "Heavy Blouse" },
    { id: "mirror", label: "Mirror Work" },
    { id: "thread", label: "Thread Work" },
    { id: "simple-buti", label: "Simple Buti" },
    { id: "new-collection", label: "New Collection" },
    { id: "tops", label: "Tops" },
    { id: "kidswear", label: "Kids Wear" },
  ];

  // Read category from URL on first load
  useEffect(() => {
    const urlCat = new URLSearchParams(location.search).get("cat");
    if (urlCat) {
      setSelectedCategory(urlCat);
      setCurrentPage(1);
    }
  }, [location.search]);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const col = collection(db, "products");
        const q = query(col, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const arr = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            name: data.name || data.title || "",
            title: data.title || data.name || "",
            category: (data.category || "").trim(),
            price: Number(data.price) || 0,
            original: Number(data.original) || Number(data.price) || 0,
            stockQty: data.stockQty ?? 0,
            description: data.description || "",
            images: Array.isArray(data.images)
              ? data.images.filter((img) => img && img.trim())
              : data.images
                ? [data.images].filter((img) => img && img.trim())
                : [],
            image: data.image || "",
            createdAt: data.createdAt || null,
          };
        });

        setProducts(arr);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.category === selectedCategory)
      .filter((p) => (p.name || "").toLowerCase().includes(searchText.toLowerCase()))
      .filter((p) => Number(p.price) <= priceFilter);
  }, [products, selectedCategory, searchText, priceFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const changePage = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  // Perfect Add to Cart (Works same for logged-in / guest)
  const addToCart = (product) => {
    // pick key depending on auth state
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";

    let cart = JSON.parse(localStorage.getItem(key) || "[]");
    const stockQty = Number(product.stockQty) || 0;

    const existingIndex = cart.findIndex((c) => c.id === product.id);

    if (existingIndex !== -1) {
      const existingItem = cart[existingIndex];

      if ((existingItem.qty || 1) >= stockQty) {
        showPopup(`Only ${stockQty} available`);
        return;
      }

      cart[existingIndex] = {
        ...existingItem,
        qty: (existingItem.qty || 1) + 1,
        stock: stockQty,
      };
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        image: getPrimaryImage(product),
        stock: stockQty,
      });
    }

    localStorage.setItem(key, JSON.stringify(cart));
    emitCartUpdate(); // Immediately refresh UI across app

    showPopup(`${product.name} added to cart`);
  };

  // Beautiful Meesho-style popup
  const showPopup = (msg) => {
    setPopupMsg(msg);
    setTimeout(() => {
      setPopupMsg("");
    }, 1800);
  };

  const categoryCount = (catId) =>
    products.filter((p) => p.category === catId).length;

  return (
    <div className="categories-container">

      {/* POPUP MESSAGE */}
      {popupMsg && (
        <div className="popup-toast">
          {popupMsg}
        </div>
      )}

      {/* Sidebar */}
      <div className="category-sidebar">
        <h5 className="sidebar-title">Categories</h5>
        <ul className="category-list">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`category-item ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
                navigate(`/categories?cat=${cat.id}`);
              }}
            >
              {cat.label} <span className="count">({categoryCount(cat.id)})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Section */}
      <div className="product-section">

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search products..."
          className="search-input"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* Price Filter */}
        <div className="price-filter">
          <label>Max Price: ₹{priceFilter}</label>
          <input
            type="range"
            min="100"
            max="10000"
            step="50"
            value={priceFilter}
            onChange={(e) => {
              setPriceFilter(Number(e.target.value));
              setCurrentPage(1);
            }}
          />
        </div>

        <h4 className="product-title">
          {selectedCategory.replace("-", " ").toUpperCase()}
        </h4>

        {/* Product Grid */}
        <div className="product-grid">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((p) => (
              <div key={p.id} className="product-card">
                <img
                  src={getPrimaryImage(p)}
                  alt={p.name}
                  className="product-img"
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                  }}
                  onClick={() => navigate(`/product/${p.id}`)}
                />

                <h5
                  className="product-name"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  {p.name}
                </h5>

                <p className="product-price">₹{p.price}</p>

                <p className={p.stockQty > 0 ? "in-stock" : "out-stock"}>
                  {p.stockQty > 0 ? `${p.stockQty} in stock` : "Out of Stock"}
                </p>

                <button
                  className="add-btn"
                  disabled={p.stockQty <= 0}
                  onClick={() => addToCart(p)}
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p>No products found</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => changePage(currentPage - 1)}>←</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <span
                key={i}
                className={`page-number ${currentPage === i + 1 ? "active-page" : ""}`}
                onClick={() => changePage(i + 1)}
              >
                {i + 1}
              </span>
            ))}
            <button onClick={() => changePage(currentPage + 1)}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}
