// src/pages/Categories.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Categories.css";
import { db, auth } from "../firebase";
import { emitCartUpdate } from "./cartEvents";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

const getPrimaryImage = (p) => {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const img = p.images[0];
    if (img && typeof img === "string" && img.trim() !== "") return img;
  }
  if (p.image && typeof p.image === "string" && p.image.trim() !== "")
    return p.image;
  return "/placeholder.jpg";
};
// ⭐ AMAZON-STYLE SEARCH HIGHLIGHT
const highlightText = (text, search) => {
  if (!search || !text) return text;

  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  return text.split(regex).map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// ==========================
// DOM-Based Popup (works on mobile + desktop)
// ==========================
export const showPopup = (msg, type = "success") => {
  const popup = document.createElement("div");
  popup.className = `popup-toast ${type}`;
  popup.innerText = msg;

  document.body.appendChild(popup);

  // Trigger animation
  setTimeout(() => popup.classList.add("show"), 50);

  // Hide after 3s
  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.remove(), 500);
  }, 3000);
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // ⭐ ADD THIS

  const [selectedCategory, setSelectedCategory] = useState("maggam-work");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(
    JSON.parse(localStorage.getItem("ssf_search_history") || "[]")
  );

  const [priceFilter, setPriceFilter] = useState(5000);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(-1);


  // ⭐ MOBILE DROPDOWN STATE
  const [mobileDropdown, setMobileDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ⭐ SORT STATE
  const [sortBy, setSortBy] = useState("default"); // default, in-stock, out-stock, low-high, high-low

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

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Read category from URL
  useEffect(() => {
    const urlCat = new URLSearchParams(location.search).get("cat");
    if (urlCat) {
      setSelectedCategory(urlCat);
      setCurrentPage(1);
    }
  }, [location.search]);

  // FETCH PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true); // ⭐ START LOADING

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
        showPopup("Failed to load products", "error");
      } finally {
        setLoading(false); // ⭐ STOP LOADING
      }
    };

    fetchProducts();
  }, []);
  // ⚡ DEBOUNCE SEARCH (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // 🔍 AUTO SUGGESTIONS (SEPARATE EFFECT)
  useEffect(() => {
    if (!debouncedSearch) {
      setSuggestions([]);
      return;
    }

    const key = debouncedSearch.toLowerCase();

    const matched = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(key) ||
          p.title.toLowerCase().includes(key)
      )
      .slice(0, 6);

    setSuggestions(matched);
  }, [debouncedSearch, products]);

  const saveSearchHistory = (term) => {
    if (!term) return;

    let history = [...searchHistory];
    history = history.filter((h) => h !== term);
    history.unshift(term);

    if (history.length > 5) history.pop();

    setSearchHistory(history);
    localStorage.setItem("ssf_search_history", JSON.stringify(history));
  };
  const handleKeyNavigation = (e) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      const selected = suggestions[activeIndex];
      setSearchText(selected.name);
      saveSearchHistory(selected.name);
      navigate(`/product/${selected.id}`);
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  // FILTERED PRODUCTS WITH SORT
  const filteredProducts = useMemo(() => {
    let arr = products;

    // ✅ SEARCH ACROSS ALL CATEGORIES
    if (debouncedSearch !== "") {
      const key = debouncedSearch.toLowerCase();

      arr = arr
        .map((p) => {
          let score = 0;

          if (p.name.toLowerCase().includes(key)) score += 5;
          if (p.title.toLowerCase().includes(key)) score += 4;
          if (p.description.toLowerCase().includes(key)) score += 2;
          if (p.category.toLowerCase().includes(key)) score += 1;

          return { ...p, _score: score };
        })
        .filter((p) => p._score > 0)
        .sort((a, b) => b._score - a._score);
    } else {
      arr = arr.filter((p) => p.category === selectedCategory);
    }

    // ✅ PRICE FILTER
    arr = arr.filter((p) => Number(p.price) <= priceFilter);

    // APPLY SORT
    if (sortBy === "in-stock") arr = arr.filter((p) => p.stockQty > 0);
    else if (sortBy === "out-stock") arr = arr.filter((p) => p.stockQty <= 0);
    else if (sortBy === "low-high") arr = arr.sort((a, b) => a.price - b.price);
    else if (sortBy === "high-low") arr = arr.sort((a, b) => b.price - a.price);

    return arr;
  }, [products, selectedCategory, debouncedSearch, priceFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const changePage = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  const addToCart = (product) => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";

    let cart = JSON.parse(localStorage.getItem(key) || "[]");
    const stockQty = Number(product.stockQty) || 0;

    const existingIndex = cart.findIndex((c) => c.productId === product.id);

    if (existingIndex !== -1) {
      const existingItem = cart[existingIndex];

      if ((existingItem.qty || 1) >= stockQty) {
        showPopup(`${product.name} has only ${stockQty} in stock`, "error");
        return;
      }

      cart[existingIndex] = {
        ...existingItem,
        qty: (existingItem.qty || 1) + 1,
        stock: stockQty,
      };
    } else {
      cart.push({
        productId: product.id,
        id: product.id,
        name: product.name,
        category: product.category,//////////////////////////////////////////////////
        price: product.price,
        qty: 1,
        image: getPrimaryImage(product),
        stock: product.stockQty || 0,
      });
    }

    localStorage.setItem(key, JSON.stringify(cart));
    emitCartUpdate();
    showPopup(`${product.name} added to cart`, "success");
  };

  const categoryCount = (catId) =>
    products.filter((p) => p.category === catId).length;

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handler = (e) => {
      if (e.target.classList.contains("mobile-overlay")) {
        setMobileDropdown(false);
        document.body.style.overflow = "auto";
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // LOCK BODY SCROLL WHEN OPEN
  useEffect(() => {
    document.body.style.overflow = mobileDropdown ? "hidden" : "auto";
  }, [mobileDropdown]);

  /* SCROLL ANIMATION WITH STAGGER */
  useEffect(() => {
    const cards = document.querySelectorAll(".product-card");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.index || 0);

          const staggerBase = (idx % 6) * 80;
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${staggerBase}ms`;
            entry.target.classList.add("fade-in-up");
          } else {
            entry.target.style.transitionDelay = `0ms`;
            entry.target.classList.remove("fade-in-up");
          }
        });
      },
      { threshold: 0.12 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [paginatedProducts, loading]);

  // ⭐ AMAZON STYLE SKELETON CARD
  const SkeletonCard = () => (
    <div className="product-card skeleton">
      <div className="skeleton-img shimmer"></div>
      <div className="skeleton-line shimmer"></div>
      <div className="skeleton-line small shimmer"></div>
      <div className="skeleton-price shimmer"></div>
      <div className="skeleton-btn shimmer"></div>
      <div className="skeleton-btn shimmer"></div>
    </div>
  );

  return (
    <div className="categories-container">
      {/* ⭐ MOBILE TOP ROW: CATEGORY + SORT */}
      {isMobile && (
        <div className="mobile-top-row">
          <div className="mobile-category-btn" onClick={() => setMobileDropdown(true)}>
            ☰ Categories
          </div>

          <select
            className="mobile-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Sort By</option>
            <option value="in-stock">In Stock</option>
            <option value="out-stock">Out of Stock</option>
            <option value="low-high">Price: Low → High</option>
            <option value="high-low">Price: High → Low</option>
          </select>
        </div>
      )}

      {/* ⭐ MOBILE OVERLAY + SLIDE PANEL */}
      {isMobile && mobileDropdown && (
        <div className="mobile-overlay">
          <div className="mobile-category-panel">
            <h4 className="mobile-cat-title">All Categories</h4>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="mobile-cat-option"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setMobileDropdown(false);
                  navigate(`/categories?cat=${cat.id}`);
                }}
              >
                {cat.label} ({categoryCount(cat.id)})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR + SORT */}
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

        {/* Desktop Sort */}
        <select
          className="desktop-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="default">Sort By</option>
          <option value="in-stock">In Stock</option>
          <option value="out-stock">Out of Stock</option>
          <option value="low-high">Price: Low → High</option>
          <option value="high-low">Price: High → Low</option>
        </select>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="product-section">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>

          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setShowSuggestions(true);
              setCurrentPage(1);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyNavigation}
          />

          {/* 🔍 AUTO SUGGEST DROPDOWN */}
          {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
            <div className="search-suggestions">
              {debouncedSearch === "" &&
                searchHistory.map((h, i) => (
                  <div
                    key={i}
                    className="suggestion-item history"
                    onClick={() => {
                      setSearchText(h);
                      saveSearchHistory(h);
                    }}
                  >
                    🕘 {h}
                  </div>
                ))}

              {suggestions.map((s, i) => (
                <div
                  key={s.id}
                  className={`suggestion-item ${i === activeIndex ? "active" : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    setSearchText(s.name);
                    saveSearchHistory(s.name);
                    navigate(`/product/${s.id}`);
                  }}
                >
                  🔍 {highlightText(s.name, debouncedSearch)}
                </div>
              ))}

            </div>
          )}
        </div>


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
          {debouncedSearch
            ? `Showing ${filteredProducts.length} results for "${debouncedSearch}"`
            : selectedCategory.replace("-", " ").toUpperCase()}
        </h4>


        <div className="product-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : paginatedProducts.length > 0 ? (
            paginatedProducts.map((p, i) => (
              <div key={p.id} className="product-card" data-index={i}>
                <img
                  src={getPrimaryImage(p)}
                  alt={p.name}
                  className="product-img"
                  onClick={() => navigate(`/product/${p.id}`)}
                  onError={(e) => (e.target.src = "/placeholder.jpg")}
                />

                <h5 className="product-name" onClick={() => navigate(`/product/${p.id}`)}>
                  {highlightText(p.name, searchText)}
                </h5>

                <div className="price-row">
                  <span className="original-price">₹{p.original}</span>
                  <span className="final-price">₹{p.price}</span>
                </div>

                <p className={p.stockQty > 0 ? "in-stock" : "out-stock"}>
                  {p.stockQty > 0 ? `${p.stockQty} in stock` : "Out of Stock"}
                </p>

                <button className="view-btn" onClick={() => navigate(`/product/${p.id}`)}>
                  View Details
                </button>

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
