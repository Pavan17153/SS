// client/src/pages/Categories.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../Categories.css";
import { db } from "../firebase";
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
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("maggam-work");
  const [searchText, setSearchText] = useState("");
  const [priceFilter, setPriceFilter] = useState(5000);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");

  const ITEMS_PER_PAGE = 20;

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
    { id: "tops", label: "Tops" },
    { id: "kidswear", label: "Kids Wear" },
  ];

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

  // Add product to cart
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
        image: getPrimaryImage(product),
      });

    localStorage.setItem("ssf_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    setSuccessMsg(`${product.name} added to cart!`);
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const categoryCount = (catId) =>
    products.filter((p) => p.category === catId).length;

  return (
    <div className="categories-container">
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
              }}
            >
              {cat.label} <span className="count">({categoryCount(cat.id)})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Section */}
      <div className="product-section">
        {successMsg && <p className="success-message">{successMsg}</p>}

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
                    // Auto-retry image after 1.5 seconds (Cloudinary delay fix)
                    setTimeout(() => {
                      e.target.src = getPrimaryImage(p);
                    }, 1500);
                  }}
                  onClick={() => navigate(`/product/${p.id}`)}
                />

                <h5 className="product-name" onClick={() => navigate(`/product/${p.id}`)}>
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
