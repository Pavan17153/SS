// client/src/pages/Categories.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../Categories.css";
import { db } from "../firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState("");

  const categories = [
    { id: "maggam-work", label: "Maggam Work" },
    { id: "bridal", label: "Bridal Work" },
    { id: "simple", label: "Simple Blouse" },
    { id: "computer-work", label: "Computer Work" },
    { id: "heavy", label: "Heavy Blouse" },
    { id: "mirror", label: "Mirror Work" },
    { id: "thread", label: "Thread Work" },
    { id: "simple-buti", label: "Simple Buti" },
    { id: "new-collection", label: "New Collection" },
  ];

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("maggam-work");
  const [searchText, setSearchText] = useState("");
  const [priceFilter, setPriceFilter] = useState(5000);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const col = collection(db, "products");
        const q = query(col, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(arr);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    fetchProducts();
  }, []);

  const categoryCount = (catId) =>
    products.filter((p) => p.category === catId).length;

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.category === selectedCategory)
      .filter((p) =>
        p.name?.toLowerCase().includes(searchText.toLowerCase())
      )
      .filter((p) => p.price <= priceFilter);
  }, [products, selectedCategory, searchText, priceFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const changePage = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  const addToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
    const exists = cart.find((c) => c.id === product.id);

    if (exists) exists.qty += 1;
    else
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        image: product.image,
      });

    localStorage.setItem("ssf_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    setSuccessMsg(`${product.name} added to cart!`);
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  return (
    <div className="categories-container">
      {/* Sidebar */}
      <div className="category-sidebar">
        <h5 className="sidebar-title">Categories</h5>

        <ul className="category-list">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`category-item ${
                selectedCategory === cat.id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
            >
              {cat.label}
              <span className="count">({categoryCount(cat.id)})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Section */}
      <div className="product-section">
        {successMsg && <p className="success-message">{successMsg}</p>}

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

        <div className="price-filter">
          <label>Max Price: ₹{priceFilter}</label>
          <input
            type="range"
            min="100"
            max="5000"
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

        {/* === PRODUCTS GRID === */}
        <div className="product-grid">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((p) => (
              <div key={p.id} className="product-card">
                <img
                  src={p.image}
                  alt={p.name}
                  className="product-img"
                  onClick={() => navigate(`/product/${p.id}`)}
                />

                <h5
                  className="product-name"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  {p.name}
                </h5>

                <p className="product-price">₹{p.price}</p>

                {/* ✅ FIXED STOCK UI */}
                <p
                  className={
                    p.stockQty > 0 ? "in-stock" : "out-stock"
                  }
                >
                  {p.stockQty > 0
                    ? `${p.stockQty} in stock`
                    : "Out of Stock"}
                </p>

                {/* ✅ FIXED ADD TO CART DISABLE */}
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
            <button onClick={() => changePage(currentPage - 1)}>
              ←
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <span
                key={i}
                className={`page-number ${
                  currentPage === i + 1 ? "active-page" : ""
                }`}
                onClick={() => changePage(i + 1)}
              >
                {i + 1}
              </span>
            ))}

            <button onClick={() => changePage(currentPage + 1)}>
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
