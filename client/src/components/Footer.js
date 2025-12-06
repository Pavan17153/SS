import { Link } from "react-router-dom";
import "../footer.css";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Shop Now", path: "/categories" },
    { name: "Cart", path: "/cart" },
    { name: "Orders", path: "/orders" },
    { name: "Checkout", path: "/checkout" },
  ];

  const policyLinks = [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Shipping Policy", path: "/shipping" },
    { name: "FAQ", path: "/faq" },
    { name: "Terms & Conditions", path: "/terms" },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-row">

          {/* QUICK LINKS */}
          <div className="footer-col">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="footer-list">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.path} onClick={scrollToTop} className="footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* POLICY SECTION */}
          <div className="footer-col">
            <h5 className="footer-title">Policies & Support</h5>
            <ul className="footer-list">
              {policyLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.path} onClick={scrollToTop} className="footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <hr className="footer-line" />

        {/* BOTTOM AREA */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © 2025 SS Fashion Limited | All Rights Reserved
          </p>

          <div className="footer-social">

            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-instagram"></i>
            </a>

            {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-facebook"></i>
            </a>

            {/* Twitter */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-x-twitter"></i>
            </a>

            {/* ✅ WhatsApp */}
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </a>

          </div>
        </div>

        {/* SCROLL TO TOP */}
        <div className="scroll-top" onClick={scrollToTop}>
          <i className="fa-solid fa-arrow-up"></i>
        </div>

      </div>
    </footer>
  );
}
