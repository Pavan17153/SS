// Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { auth } from "../firebase";
import { cartEvent } from "../pages/cartEvents";
import "../Navbar.css";

const Navbar = () => {
  const [dropdown, setDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [userEmail, setUserEmail] = useState(null);

  const [mobileMenu, setMobileMenu] = useState(false); 

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

        updateCart();
        cartEvent.dispatchEvent(new Event("cartUpdated"));
      } else {
        setUserEmail(null);
        setCartCount(0);
        setCartTotal(0);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    updateCart();
    cartEvent.addEventListener("cartUpdated", updateCart);
    return () => cartEvent.removeEventListener("cartUpdated", updateCart);
  }, []);

  const goToCategory = (catId) => {
    setMobileMenu(false);
    navigate(`/categories?cat=${catId}`);
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.setItem("ssf_cart", "[]");
    cartEvent.dispatchEvent(new Event("cartUpdated"));
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">

        <div className="navbar-left">
          <img src="/logo.png" alt="logo" className="logo" />
          <span className="brand-name">SS Fashion</span>
        </div>

        {/* ⭐ DESKTOP MENU FIXED */}
        <div className="navbar-right">

          <Link to="/" className="nav-link">Home</Link>

          {/* ⭐ FIX: Added onClick toggle for desktop */}
          <div
            className="dropdown"
            onMouseEnter={() => setDropdown(true)}
            onMouseLeave={() => setDropdown(false)}
            onClick={() => setDropdown((p) => !p)}
          >
            <span className="nav-link dropdown-title">
              Shop Now <FiChevronDown size={16} />
            </span>

            {dropdown && (
              <div className="dropdown-menu">
                <span onClick={() => goToCategory("maggam-work")}>Maggam Work</span>
                <span onClick={() => goToCategory("computer-work")}>Computer Work</span>
                <span onClick={() => goToCategory("saree")}>Sarees</span>
                <span onClick={() => goToCategory("cloths")}>Cloths</span>
                <span onClick={() => goToCategory("dress")}>Dress</span>
                <span onClick={() => goToCategory("stitch-blouse")}>Stitch Blouse</span>
                <span onClick={() => goToCategory("tops")}>Tops & Pants</span>
                <span onClick={() => goToCategory("kidswear")}>Kids Wear</span>
              </div>
            )}
          </div>

          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>

          <div className="money-cart" onClick={() => navigate("/cart")}>
            <span className="money-text">₹ {cartTotal.toLocaleString("en-IN")}</span>
            <div className="cart-icon-wrapper">
              <FaShoppingCart className="icon cart-icon" />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </div>
          </div>

          {userEmail ? (
            <>
              <button className="nav-link btn-order" onClick={() => navigate("/orders")}>
                My Orders
              </button>
              <FaSignOutAlt className="icon user-icon" onClick={handleLogout} />
            </>
          ) : (
            <FaUser className="icon user-icon" onClick={() => navigate("/login")} />
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="mobile-menu-btn" onClick={() => setMobileMenu(true)}>
          <FaBars />
        </div>
      </nav>

      {/* MOBILE MENU SIDEBAR */}
      <div className={`mobile-menu ${mobileMenu ? "active" : ""}`}>
        <FaTimes className="close-btn" onClick={() => setMobileMenu(false)} />

        <Link to="/" onClick={() => setMobileMenu(false)} className="mobile-link">Home</Link>
        <span className="mobile-link" onClick={() => goToCategory("maggam-work")}>Maggam Work</span>
        <span className="mobile-link" onClick={() => goToCategory("computer-work")}>Computer Work</span>
        <span className="mobile-link" onClick={() => goToCategory("saree")}>Sarees</span>
        <span className="mobile-link" onClick={() => goToCategory("cloths")}>Cloths</span>
        <span className="mobile-link" onClick={() => goToCategory("dress")}>Dress</span>
        <span className="mobile-link" onClick={() => goToCategory("stitch-blouse")}>Stitch Blouse</span>
        <span className="mobile-link" onClick={() => goToCategory("tops")}>Tops & Pants</span>
        <span className="mobile-link" onClick={() => goToCategory("kidswear")}>Kids Wear</span>

        <Link to="/about" onClick={() => setMobileMenu(false)} className="mobile-link">About</Link>
        <Link to="/contact" onClick={() => setMobileMenu(false)} className="mobile-link">Contact</Link>

        <div className="mobile-cart" onClick={() => navigate("/cart")}>
          <span>Cart</span>
          <span>₹ {cartTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </>
  );
};

export default Navbar;
