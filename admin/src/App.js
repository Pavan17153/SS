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

// NEWLY ADDED PAGES
import ProductAdmin from "./pages/Products";
import ProductList from "./pages/ProductList";

// -------- LAYOUT (Hide Sidebar on Login page) ----------
function Layout({ children }) {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="admin-layout">
      {!hideSidebar && <Sidebar />}
      <div className="content">{children}</div>
    </div>
  );
}

// -------- PROTECTED ROUTE ----------
function ProtectedRoute({ user, element }) {
  return user ? element : <Navigate to="/login" />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <h3 style={{ padding: 30 }}>Checking Login...</h3>;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Login */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={<ProtectedRoute user={user} element={<Dashboard />} />}
          />

          <Route
            path="/categories"
            element={<ProtectedRoute user={user} element={<Categories />} />}
          />

          <Route
            path="/orders"
            element={<ProtectedRoute user={user} element={<Orders />} />}
          />

          <Route
            path="/payments"
            element={<ProtectedRoute user={user} element={<Payments />} />}
          />

          <Route
            path="/contact"
            element={<ProtectedRoute user={user} element={<Contact />} />}
          />

          <Route
            path="/about"
            element={<ProtectedRoute user={user} element={<About />} />}
          />

          <Route
            path="/privacy"
            element={<ProtectedRoute user={user} element={<Privacy />} />}
          />

          <Route
            path="/shipping"
            element={<ProtectedRoute user={user} element={<Shipping />} />}
          />

          <Route
            path="/terms"
            element={<ProtectedRoute user={user} element={<Terms />} />}
          />

          <Route
            path="/faq"
            element={<ProtectedRoute user={user} element={<Faq />} />}
          />

          {/* ---------- PRODUCT ROUTES ---------- */}
          <Route
            path="/add-product"
            element={<ProtectedRoute user={user} element={<ProductAdmin />} />}
          />

          <Route
            path="/product-list"
            element={<ProtectedRoute user={user} element={<ProductList />} />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
