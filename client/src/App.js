import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// NEW → Sync guest cart with user cart
import AuthCartSync from "./components/AuthCartSync";

// Main Pages
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Orders from "./pages/Orders";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Info Pages
import FAQ from "./pages/Faq";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/Privacy";
import ShippingPolicy from "./pages/Shipping";

export default function App() {
  return (
    <>
      {/* Runs globally to merge guest cart → user cart */}
      <AuthCartSync />

      {/* Navbar */}
      <Navbar />

      {/* Page Wrapper */}
      <div className="container" style={{ paddingTop: "80px" }}>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Category Pages */}
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:category" element={<Products />} />

          {/* Product Detail */}
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Cart / Checkout */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Orders */}
          <Route path="/orders" element={<Orders />} />

          {/* Info */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Policies */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
        </Routes>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
