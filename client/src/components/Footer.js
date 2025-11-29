import { Link, useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Real categories
  const categories = [
    "Maggam Work",
    "Bridal Work",
    "Heavy Blouse",
    "Simple Blouse",
    "Thread Work",
    "Mirror Work",
    "Short Hands",
    "New Collection",
    "Computer Work",
    "Mirror Work",
  ];

  // Quick links
  const quickLinks = [
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Shop", path: "/categories" },
    { name: "My Account", path: "/account" },
    { name: "Cart", path: "/cart" },
    { name: "Checkout", path: "/checkout" },
    { name: "FAQ’s", path: "/faq" },
    { name: "Terms & Conditions", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Shipping Policy", path: "/shipping" },
  ];

  return (
    <footer
      style={{
        background: "#1a1a1a",
        color: "#eee",
        padding: "50px 0 20px",
        position: "relative",
        marginTop: "60px",
      }}
    >
      <div className="container">

        <div className="row" style={{ textAlign: "center" }}>

          {/* CATEGORIES */}
          <div className="col-12 col-md-4 mb-4">
  <h5 style={{ color: "#ff4c7d", marginBottom: "15px" }}>
    Collections
  </h5>
  <ul style={{ listStyle: "none", padding: 10, lineHeight: "1.9" }}>
    {categories.map((item, index) => (
      <li key={index}>
        <Link
          to="/categories"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            navigate(`/Categories/${item.toLowerCase().replace(/ /g, "-")}`);
          }}
          style={{
            color: "#bbb",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          {item}
        </Link>
      </li>
    ))}
  </ul>
</div>


        {/* QUICK LINKS */}
<div className="col-12 col-md-4 mb-4">
  <h5 style={{ color: "#ff4c7d", marginBottom: "15px" }}>
    Quick Links
  </h5>
  <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.9" }}>
    {quickLinks.map((link, idx) => (
      <li key={idx}>
        <Link
          to={link.path}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            color: "#bbb",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          {link.name}
        </Link>
      </li>
    ))}
  </ul>
</div>

          {/* Empty column for spacing */}
          <div className="col-12 col-md-4 mb-4"></div>
        </div>

        <hr style={{ borderColor: "#444" }} />

        {/* COPYRIGHT + SOCIAL ICONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "14px",
            color: "#ccc",
            marginTop: "15px",
          }}
        >
          <div>
            © 2025 SS Fashion Limited | All Rights Reserved
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#E1306C", fontSize: "18px" }}
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1877F2", fontSize: "18px" }}
            >
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1DA1F2", fontSize: "18px" }}
            >
              <i className="fa-brands fa-x-twitter"></i>
            </a>
          </div>
        </div>

        {/* SCROLL TO TOP BUTTON */}
        <div
          onClick={scrollToTop}
          style={{
            position: "absolute",
            right: "20px",
            bottom: "20px",
            width: "45px",
            height: "45px",
            background: "#ff4c7d",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          <i
            className="fa-solid fa-arrow-up"
            style={{ color: "white", fontSize: "20px" }}
          ></i>
        </div>
      </div>
    </footer>
  );
}
