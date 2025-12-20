// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaChevronRight,
} from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { auth } from "../firebase";
import { cartEvent } from "../pages/cartEvents";
import "../Navbar.css";
import logo from "../images/logo.png";

const Navbar = () => {
  const [dropdown, setDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const navigate = useNavigate();

  const mergeCarts = (guestCart, userCart) => {
    let merged = [...userCart];
    guestCart.forEach((g) => {
      const existIndex = merged.findIndex((u) => u.id === g.id);
      if (existIndex !== -1) merged[existIndex].qty += g.qty;
      else merged.push(g);
    });
    return merged;
  };

  const updateCart = () => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    const cart = JSON.parse(localStorage.getItem(key) || "[]");

    setCartCount(cart.reduce((s, i) => s + (i.qty || 1), 0));
    setCartTotal(cart.reduce((s, i) => s + i.price * (i.qty || 1), 0));
  };

  // 🔥 Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);

        const guestCart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
        const userKey = `ssf_cart_${user.email}`;
        const userCart = JSON.parse(localStorage.getItem(userKey) || "[]");

        const finalCart = mergeCarts(guestCart, userCart);
        localStorage.setItem(userKey, JSON.stringify(finalCart));
        localStorage.removeItem("ssf_cart");

        setTimeout(updateCart, 50);
        cartEvent.dispatchEvent(new Event("cartUpdated"));
      } else {
        setUserEmail(null);
        updateCart();
      }
    });

    return () => unsub();
  }, []);

  // 🔥 Update cart on event
  useEffect(() => {
    updateCart();
    cartEvent.addEventListener("cartUpdated", updateCart);
    return () => cartEvent.removeEventListener("cartUpdated", updateCart);
  }, []);

  // 🔥 Disable body scroll when menu open
  useEffect(() => {
    document.body.classList.toggle("menu-open", mobileMenu);
  }, [mobileMenu]);

  // ⭐ Close menu helper
  const closeMenu = () => {
    setMobileMenu(false);
    setDropdown(false);
    setShowCategories(false);
  };

  const goToCategory = (catId) => {
    closeMenu();
    navigate(`/categories?cat=${catId}`);
  };

  const handleLogout = async () => {
    await auth.signOut();
    cartEvent.dispatchEvent(new Event("cartUpdated"));
    closeMenu();
    navigate("/login");
  };

  const openOrders = () => {
    closeMenu();
    navigate("/orders");
  };

  const openCart = () => {
    closeMenu();
    navigate("/cart");
  };

  return (
    <>
      {/* 🔥 OVERLAY → CLOSE MENU ON OUTSIDE TOUCH */}
      <div
        className={`mobile-menu-overlay ${mobileMenu ? "active" : ""}`}
        onClick={closeMenu}
      ></div>

      <nav className="navbar">
        <div className="navbar-left" onClick={() => navigate("/")}>
          <img src={logo} alt="logo" className="logo" />
          <span className="brand-name">SS Fashion</span>
        </div>

        {/* MOBILE MINI CART */}
        <div className="mobile-cart-mini" onClick={openCart}>
          <span className="mini-cart-price">₹ {cartTotal.toLocaleString("en-IN")}</span>
          <div className="mini-cart-icon">
            <FaShoppingCart />
            {cartCount > 0 && <span className="mini-cart-count">{cartCount}</span>}
          </div>
        </div>

        {/* DESKTOP MENU */}
        <div className="navbar-right">
          <Link to="/" className="nav-link">Home</Link>

          <div className="dropdown">
            <button
              className="nav-link dropdown-title"
              onClick={() => setDropdown((prev) => !prev)}
            >
              Shop Now <FiChevronDown size={16} />
            </button>

            {dropdown && (
              <div className="dropdown-menu show">
                <span onClick={() => goToCategory("new-collection")}>New Collection</span>
                <span onClick={() => goToCategory("maggam-work")}>Maggam Work</span>
                <span onClick={() => goToCategory("computer-work")}>Computer Work</span>
                <span onClick={() => goToCategory("saree")}>Sarees</span>
                <span onClick={() => goToCategory("bridal")}>Bridal Work</span>
                <span onClick={() => goToCategory("simple")}>Simple Blouse</span>
                <span onClick={() => goToCategory("heavy")}>Heavy Blouse</span>
                <span onClick={() => goToCategory("top")}>Tops & Pants</span>
                <span onClick={() => goToCategory("kidswear")}>Kids Wear</span>
              </div>
            )}
          </div>

          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>

          <div className="money-cart" onClick={openCart}>
            <span className="money-text">₹ {cartTotal.toLocaleString("en-IN")}</span>
            <div className="cart-icon-wrapper">
              <FaShoppingCart className="cart-icon" />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </div>
          </div>

          {userEmail ? (
            <>
              <button className="nav-link btn-order" onClick={openOrders}>
                My Orders
              </button>
              <FaSignOutAlt className="icon user-icon" onClick={handleLogout} />
            </>
          ) : (
            <FaUser className="icon user-icon" onClick={() => navigate("/login")} />
          )}
        </div>

        <div className="mobile-menu-btn" onClick={() => setMobileMenu(true)}>
          <FaBars />
        </div>
      </nav>

      {/* SLIDE MOBILE MENU */}
      <div className={`mobile-menu ${mobileMenu ? "active" : ""}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user">
            <FaUserCircle size={40} />
            <div className="mobile-user-info">
              {userEmail ? (
                <>
                  <div className="mobile-user-email">{userEmail}</div>
                  <button className="mobile-cta" onClick={openOrders}>My Orders</button>
                </>
              ) : (
                <>
                  <div className="mobile-user-guest">Welcome</div>
                  <button className="mobile-cta" onClick={() => navigate("/login")}>
                    Login / Signup
                  </button>
                </>
              )}
            </div>
          </div>

          <FaTimes className="close-btn" onClick={closeMenu} />
        </div>

        <div className="mobile-list">

          <div className="mobile-item" onClick={() => { closeMenu(); navigate("/"); }}>
            <span>Home</span>
            <FaChevronRight />
          </div>

          <div className="mobile-section-title" onClick={() => setShowCategories(!showCategories)}>
            Categories
          </div>

          <div className={`mobile-categories-container ${showCategories ? "show" : ""}`}>
            {[
              "maggam-work",
              "computer-work",
              "saree",
              "new-collection",
              "bridal",
              "simple",
              "heavy",
              "top",
              "kidswear"
            ].map((cat) => (
              <div
                key={cat}
                className="mobile-item"
                onClick={() => goToCategory(cat)}
              >
                <span>{cat.replace("-", " ").toUpperCase()}</span>
                <FaChevronRight />
              </div>
            ))}
          </div>

          <div className="mobile-item" onClick={() => { closeMenu(); navigate("/about"); }}>
            <span>About</span>
            <FaChevronRight />
          </div>

          <div className="mobile-item" onClick={() => { closeMenu(); navigate("/contact"); }}>
            <span>Contact</span>
            <FaChevronRight />
          </div>

          <div className="mobile-cart" onClick={openCart}>
            <div>
              <strong>Cart</strong>
              <div className="mobile-cart-sub">
                ₹ {cartTotal.toLocaleString("en-IN")} • {cartCount} items
              </div>
            </div>
            <FaShoppingCart size={20} />
          </div>

          {userEmail ? (
            <div className="mobile-action-row">
              <button className="mobile-logout" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : (
            <div className="mobile-action-row">
              <button className="mobile-login" onClick={() => { closeMenu(); navigate("/login"); }}>
                <FaUser /> Login / Signup
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
