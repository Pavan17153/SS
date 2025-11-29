// client/src/pages/Home.js
import React, { useState, useEffect } from "react";
import "../Home.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaStar, FaShieldAlt, FaShoppingBag, FaTags } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "homepage", "homeContent");
      const snap = await getDoc(docRef);
      if (snap.exists()) setHomeData(snap.data());
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !homeData) return <p style={{textAlign:"center", padding:30}}>Loading...</p>;

  // images may already be secure URLs from Cloudinary
  const images = (homeData.sliderImages || []).map(i => i);
  const trending = (homeData.trending || []).map(t => ({...t}));

  const prev = () => setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  const next = () => setCurrentIndex((currentIndex + 1) % images.length);

  return (
    <div className="home-container">
      <div className="hero">
        <h1>{homeData.title}</h1>
        <p>{homeData.subtitle}</p>
        <button className="shop-btn" onClick={() => navigate("/categories")}>Shop Now</button>
      </div>

      <div className="slider">
        <FiChevronLeft className="arrow left" onClick={prev} />
        <img src={images[currentIndex]} alt="slide" className="slide-img" />
        <FiChevronRight className="arrow right" onClick={next} />
      </div>

      <div className="trending">
        <h2>Top Trending Collections</h2>
        <div className="trend-cards">
          {trending.map((t, idx) => (
            <div className="trend-card" key={idx}>
              <img src={t.image} alt={t.name} />
              <h4>{t.name}</h4>
            </div>
          ))}
        </div>
        <button className="trending-btn" onClick={() => navigate("/categories")}>Shop Now</button>
      </div>
    </div>
  );
};

export default Home;
