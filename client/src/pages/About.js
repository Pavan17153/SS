import React from "react";
import "./About.css";

export default function About() {
  return (
    <div className="about-container">
      <h1 className="about-title">About SS Fashion</h1>

      <p className="about-text">
        SS Fashion is a premium ladies’ fashion brand dedicated to offering
        stylish, high-quality clothing for women across India. We specialize in{" "}
        <strong>sarees, dresses, tops, bottoms, designer blouses, embroidery work</strong>{" "}
        and customized stitching services.
      </p>

      <p className="about-text">
        Our goal is to combine <strong>traditional craftsmanship</strong> with{" "}
        <strong>modern fashion trends</strong>, ensuring that every customer experiences
        both comfort and elegance. Whether you're looking for everyday wear or
        stunning outfits for special occasions, SS Fashion provides a wide range
        of carefully curated collections.
      </p>

      <p className="about-text">
        We are also known for our <strong>handcrafted Maggam work</strong>,
        <strong>bridal designs</strong>, <strong>computer embroidery</strong>,
        <strong>mirror work</strong>, and various custom blouse patterns. With our expert
        tailoring team, customers can upload their own designs and get perfectly
        measured, made-to-order outfits.
      </p>

      <h2 className="about-subtitle">Our Mission</h2>
      <p className="about-text">
        To create fashionable, affordable, and beautifully crafted women's clothing
        that celebrates individuality, confidence, and Indian culture.
      </p>

      <h2 className="about-subtitle">Why Choose SS Fashion?</h2>
      <ul className="about-list">
        <li>High-quality fabrics and fine craftsmanship</li>
        <li>Unique designer blouse & embroidery collections</li>
        <li>Custom stitching based on measurements or uploaded designs</li>
        <li>Affordable pricing with transparent service</li>
        <li>Fast and secure delivery across India</li>
        <li>Dedicated support for customer satisfaction</li>
        <li>Exclusive seasonal collections and festive designs</li>
      </ul>

      <h2 className="about-subtitle">Location</h2>
      <p className="about-text">
        SS Fashion Collections
        <br />
        RBI Layout, JP Nagar,
        <br />
        Bangalore – 560078, India
      </p>
    </div>
  );
}
