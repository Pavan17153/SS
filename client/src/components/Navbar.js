import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser, FaSignOutAlt } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import "../Navbar.css";

const Navbar = () => {
  const [dropdown, setDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeCart = null;

    const trackUser = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        const cartRef = doc(db, "carts", user.uid);

        // Firestore realtime listener
        unsubscribeCart = onSnapshot(cartRef, (snap) => {
          const items = snap.exists() ? snap.data().items || [] : [];
          setCartCount(items.reduce((s, i) => s + i.qty, 0));
          setCartTotal(items.reduce((s, i) => s + i.price * i.qty, 0));
        });
      } else {
        setUserEmail(null);
        // Fallback to localStorage for guest
        const cart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
        setCartCount(cart.reduce((s, i) => s + (i.qty || 1), 0));
        setCartTotal(cart.reduce((s, i) => s + i.price * (i.qty || 1), 0));

        if (unsubscribeCart) unsubscribeCart();
      }
    });

    return () => {
      trackUser();
      if (unsubscribeCart) unsubscribeCart();
    };
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/logo.png" alt="logo" className="logo" />
        <span className="brand-name">SS Fashion</span>
      </div>

      <div className="navbar-right">
        <Link to="/" className="nav-link">Home</Link>

        <div
          className="dropdown"
          onMouseEnter={() => setDropdown(true)}
          onMouseLeave={() => setDropdown(false)}
        >
          <span className="nav-link dropdown-title">
            Shop Now <FiChevronDown size={16} />
          </span>
          {dropdown && (
            <div className="dropdown-menu">
              <Link to="/categories">All Categories</Link>
              <Link to="/categories">Maggam Work</Link>
              <Link to="/categories">Computer Work</Link>
              <Link to="/categories">Sarees</Link>
              <Link to="/categories">Cloths</Link>
              <Link to="/categories">Dress</Link>
              <Link to="/categories">Stitch Blouse</Link>
              <Link to="/categories">Tops & Pants</Link>
              <Link to="/categories">Kids Wear</Link>
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
