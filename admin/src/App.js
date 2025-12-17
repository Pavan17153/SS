// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Sidebar from "./components/Sidebar";

// Pages
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Shipping from "./pages/Shipping";
import Terms from "./pages/Terms";
import Faq from "./pages/Faq";
import AdminTerms from "./pages/AdminTerms";

// Product Pages
import ProductAdmin from "./pages/Products";
import ProductList from "./pages/ProductList";

import AdminRevenueAnalytics from "./pages/AdminRevenueAnalytics";
// Coupons
import Coupons from "./pages/Coupons";

/* ------------------ Layout ------------------ */
function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="admin-layout">
      {!hideSidebar && <Sidebar />}
      <div className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/add-product" element={<ProductAdmin />} />
          <Route path="/product-list" element={<ProductList />} />
          <Route path="/revenue" element={<AdminRevenueAnalytics />} />
        </Routes>
      </div>
    </div>
  );
}

/* ------------------ Protected Route ------------------ */
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/* ------------------ Public Route ------------------ */
function PublicRoute({ user, children }) {
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/* ------------------ App Component ------------------ */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <h3 style={{ padding: 30 }}>Checking Login...</h3>;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* -------- PUBLIC ROUTES -------- */}
        <Route
          path="/login"
          element={
            <PublicRoute user={user}>
              <AdminLogin />
            </PublicRoute>
          }
        />

        <Route path="/adminterms" element={<AdminTerms />} />

        {/* -------- PROTECTED ROUTES -------- */}
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user}>
              <Layout />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
