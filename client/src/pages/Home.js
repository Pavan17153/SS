import React, { useState, useEffect, useRef } from "react";
import "../Home.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_HOME_DATA = {
  title: "Welcome to SS Fashion",
  subtitle: "Where tradition meets modern elegance.",
  sliderImages: [],
  trending: [
    { name: "Top Trending", image: "" },
    { name: "Latest Designs", image: "" },
    { name: "New Arrivals", image: "" },
  ],
  bannerText: "",
};

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(DEFAULT_HOME_DATA);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trendingRef = useRef(null);

  // --------------------------
  // FETCH DATA FROM FIRESTORE
  // --------------------------
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "homepage", "homeContent"));
        if (snap.exists() && mounted) {
          setHomeData({ ...DEFAULT_HOME_DATA, ...snap.data() });
        } else if (mounted) {
          setHomeData(DEFAULT_HOME_DATA);
        }
      } catch (err) {
        console.error("Homepage fetch failed:", err);
        if (mounted) setHomeData(DEFAULT_HOME_DATA);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => (mounted = false);
  }, []);

  const images = Array.isArray(homeData.sliderImages) ? homeData.sliderImages : [];
  const trending = Array.isArray(homeData.trending) ? homeData.trending : [];

  // --------------------------
  // SCROLLING ITEMS (Marquee)
  // --------------------------
  const scrollingItems =
    homeData.bannerText && homeData.bannerText.trim() !== ""
      ? [{ name: homeData.bannerText }]
      : trending.length > 0
        ? trending
        : DEFAULT_HOME_DATA.trending;

  // --------------------------
  // AUTO SLIDER
  // --------------------------
  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % images.length);
    }, 3500); // slower speed
    return () => clearInterval(timer);
  }, [images]);

  // --------------------------
  // TRENDING CARD ANIMATION
  // --------------------------
  useEffect(() => {
    if (!trending.length) return;
    const cards = trendingRef.current?.querySelectorAll(".trend-card");
    if (!cards) return;

    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("animate-visible")
        ),
      { threshold: 0.3 }
    );

    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [trending]);

  if (loading) return <p style={{ textAlign: "center", padding: 30 }}>Loading...</p>;

  return (
    <div className="home-container">

      {/* MOBILE TRENDING BANNER */}
      <div className="mobile-trending-banner">
        <span className="banner-label">
          <span className="flash">⚡</span>
          {"Today Trending"}
        </span>

        <div className="marquee">
          <div className="marquee-content">
            {[...scrollingItems, ...scrollingItems].map((item, i) => (
              <span key={i} className="marquee-item">
                {item.name}
              </span>
            ))}
          </div>
        </div>

        <span className="fade-left"></span>
        <span className="fade-right"></span>
      </div>

      {/* HERO */}
      <div className="hero">
        <h1>{homeData.title || DEFAULT_HOME_DATA.title}</h1>
        <p>{homeData.subtitle || DEFAULT_HOME_DATA.subtitle}</p>
        <button className="shop-btn" onClick={() => navigate("/categories")}>
          Shop Now
        </button>
      </div>

      {/* SLIDER */}
      {images.length > 0 && (
        <div className="slider">
          <FiChevronLeft
            className="arrow left"
            onClick={() => setCurrentIndex((p) => (p - 1 + images.length) % images.length)}
          />

          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              className={`slide-img ${i === currentIndex ? "active" : ""}`}
              alt=""
            />
          ))}

          <FiChevronRight
            className="arrow right"
            onClick={() => setCurrentIndex((p) => (p + 1) % images.length)}
          />
        </div>
      )}

      {/* TRENDING CARDS */}
      <div className="trending">
        <h2>Top Trending Collections</h2>

        <div className="trend-cards" ref={trendingRef}>
          {trending.length > 0
            ? trending.map((t, i) => (
              <div className="trend-card animate-hidden" key={i}>
                {t.image ? <img src={t.image} alt={t.name} /> : null}
                <h4>{t.name}</h4>
              </div>
            ))
            : DEFAULT_HOME_DATA.trending.map((t, i) => (
              <div className="trend-card animate-hidden" key={i}>
                <h4>{t.name}</h4>
              </div>
            ))}
        </div>

        <button className="trending-btn" onClick={() => navigate("/categories")}>
          Shop Now
        </button>
      </div>

      {/* FEATURES */}
      <div className="features-container">
        <div className="feature-box">
          <h3>Awesome Collections</h3>
          <p>Hand picked great collection.</p>
        </div>
        <div className="feature-box">
          <h3>Best Quality</h3>
          <p>You get the best quality you deserve.</p>
        </div>
        <div className="feature-box">
          <h3>Best Offers</h3>
          <p>Great designs at low price.</p>
        </div>
        <div className="feature-box">
          <h3>Secure Payments</h3>
          <p>Your payments are secured by Razorpay.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
