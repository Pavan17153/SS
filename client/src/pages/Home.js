import React, { useState, useEffect, useRef } from "react";
import "../Home.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trendingRef = useRef(null);

  /* FETCH DATA */
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "homepage", "homeContent");
        const snap = await getDoc(docRef);
        if (snap.exists() && mounted) setHomeData(snap.data());
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const images = Array.isArray(homeData?.sliderImages) ? homeData.sliderImages : [];
  const trending = Array.isArray(homeData?.trending) ? homeData.trending : [];

  /* AUTO SLIDER */
  useEffect(() => {
    if (!images.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  /* TRENDING ANIMATION */
  useEffect(() => {
    if (!trending.length) return;

    const cards = trendingRef.current?.querySelectorAll(".trend-card");
    if (!cards || !cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-visible");
          }
        });
      },
      { threshold: 0.3 }
    );

    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [trending]);

  const prev = () =>
    setCurrentIndex((prev) => (images.length ? (prev - 1 + images.length) % images.length : 0));

  const next = () =>
    setCurrentIndex((prev) => (images.length ? (prev + 1) % images.length : 0));

  return (
    <div className="home-container">
      {/* SHOW LOADING */}
      {loading || !homeData ? (
        <p style={{ textAlign: "center", padding: 30 }}>Loading...</p>
      ) : (
        <>
          <div className="hero">
            <h1>{homeData.title}</h1>
            <p>{homeData.subtitle}</p>
            <button className="shop-btn" onClick={() => navigate("/categories")}>
              Shop Now
            </button>
          </div>

          <div className="slider" aria-roledescription="carousel">
            <FiChevronLeft className="arrow left" onClick={prev} aria-label="Previous slide" />
            {/* Render all images but only the active one has .active so it fades in */}
            {images.length ? (
              images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`slide ${idx + 1}`}
                  className={`slide-img ${idx === currentIndex ? "active" : ""}`}
                  // for better performance, let browser know offscreen images still load
                  loading={idx === currentIndex ? "eager" : "lazy"}
                />
              ))
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: 12, background: "#f2f2f2" }} />
            )}
            <FiChevronRight className="arrow right" onClick={next} aria-label="Next slide" />
          </div>

          <div className="trending">
            <h2>Top Trending Collections</h2>

            <div className="trend-cards" ref={trendingRef}>
              {trending.map((t, idx) => (
                <div className="trend-card animate-hidden" key={idx}>
                  <img src={t.image} alt={t.name} />
                  <h4>{t.name}</h4>
                </div>
              ))}
            </div>

            <button
              className="trending-btn"
              onClick={() => navigate("/categories")}
            >
              Shop Now
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
