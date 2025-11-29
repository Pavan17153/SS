import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser, FaSignOutAlt } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { auth } from "../firebase";
import "../Navbar.css";

const Navbar = () => {
  const [dropdown, setDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  const updateCart = () => {
    const cart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
    setCartCount(cart.reduce((s, i) => s + (i.qty || 1), 0));
    setCartTotal(cart.reduce((s, i) => s + i.price * (i.qty || 1), 0));
  };

  useEffect(() => {
    updateCart();
    window.addEventListener("storage", updateCart);

    // Track logged-in user
    auth.onAuthStateChanged((user) => {
      if (user) setUserEmail(user.email);
      else setUserEmail(null);
    });

    return () => window.removeEventListener("storage", updateCart);
  }, []);

  const goToCategories = () => navigate("/categories");

  const handleLogout = async () => {
    await auth.signOut();
    setUserEmail(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* LEFT LOGO + BRAND */}
      <div className="navbar-left">
        <img src="/logo.png" alt="logo" className="logo" />
        <span className="brand-name">SS Fashion</span>
      </div>

      {/* RIGHT SIDE MENU */}
      <div className="navbar-right">
        <Link to="/" className="nav-link">Home</Link>

        {/* SHOP NOW DROPDOWN */}
        <div
          className="dropdown"
          onMouseEnter={() => setDropdown(true)}
          onMouseLeave={() => setDropdown(false)}
        >
          <span className="nav-link dropdown-title" onClick={goToCategories}>
            Shop Now <FiChevronDown size={16} className="arrow-icon" />
          </span>

          {dropdown && (
            <div className="dropdown-menu">
              <Link to="/categories">Maggam Work</Link>
              <Link to="/categories/computer-work">Computer Work</Link>
              <Link to="/categories/sarees">Sarees</Link>
              <Link to="/categories/cloths">Cloths</Link>
              <Link to="/categories/dress">Dress</Link>
              <Link to="/categories/stitch-blouse">Stitch Blouse</Link>
            </div>
          )}
        </div>

        <Link to="/about" className="nav-link">About</Link>
        <Link to="/contact" className="nav-link">Contact</Link>

        {/* MONEY + CART */}
        <div className="money-cart" onClick={() => navigate("/cart")}>
          <span className="money-text">₹ {cartTotal.toLocaleString("en-IN")}</span>
          <div className="cart-icon-wrapper">
            <FaShoppingCart className="icon cart-icon" />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </div>
        </div>

        {/* Conditional: Orders & User Icon */}
        {userEmail ? (
          <>
            <button
              className="nav-link btn-order"
              onClick={() => navigate("/orders")}
            >
              My Orders
            </button>

            <div onClick={handleLogout} style={{ cursor: "pointer" }}>
              <FaSignOutAlt className="icon user-icon" title="Logout" />
            </div>
          </>
        ) : (
          <div onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>
            <FaUser className="icon user-icon" title="Login" />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
