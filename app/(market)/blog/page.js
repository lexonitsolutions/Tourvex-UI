"use client";

import { useState } from "react";
import Link from "next/link";

const BLOG_POSTS = [
  {
    id: 1,
    title: "Exploring the Hidden Maldives Paradise",
    excerpt: "Discover a world where turquoise waters meet endless white sands and private overwater villas in the Indian Ocean.",
    date: "28 Dec 2026",
    category: "Destinations",
    image: "/images/blog-1.jpg",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Journey Through Canada's Wild Beauty",
    excerpt: "Discover vast landscapes of towering glacial peaks, turquoise alpine lakes, and endless pine forests across Banff and Jasper.",
    date: "26 Dec 2026",
    category: "Nature & Adventure",
    image: "/images/blog-2.jpg",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Experience the Ultimate Luxury in Modern Dubai",
    excerpt: "A guide to rooftop infinity pools, Michelin-starred dining, private yacht charters, and sunset dune safaris.",
    date: "24 Dec 2026",
    category: "City & Culture",
    image: "/images/blog-3.jpg",
    readTime: "6 min read",
  },
  {
    id: 4,
    title: "The Ultimate Guide to African Safaris",
    excerpt: "Witness the Great Migration, luxury tented camps, and intimate wildlife encounters in the Serengeti and Masai Mara.",
    date: "22 Dec 2026",
    category: "Nature & Adventure",
    image: "/images/blog-4.jpg",
    readTime: "8 min read",
  },
  {
    id: 5,
    title: "Top 7 Secret Spots in the United Arab Emirates",
    excerpt: "Escape the crowds and discover the hidden fjords of Musandam, Hatta kayak dams, and archaeological wonders in Sharjah.",
    date: "20 Dec 2026",
    category: "Destinations",
    image: "/images/blog-5.jpg",
    readTime: "4 min read",
  },
  {
    id: 6,
    title: "Essential Packing & Travel Tips for Desert Safaris",
    excerpt: "What to wear, camera protection tips, and advice for beating the heat on your thrilling desert dune adventure.",
    date: "18 Dec 2026",
    category: "Travel Tips",
    image: "/images/blog-6.jpg",
    readTime: "4 min read",
  },
];

const CATEGORIES = ["All", "Destinations", "Nature & Adventure", "City & Culture", "Travel Tips"];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="blog-page-wrap">
      {/* Header Banner */}
      <header className="pg-hero section-padding" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="row mb-40 justify-content-center">
            <div className="col-md-8 text-center">
              <div className="section-subtitle">Travel Inspiration</div>
              <div className="section-title">
                Stories that inspire your <i>next adventure</i>
              </div>
              <p style={{ maxWidth: 640, margin: "14px auto 0", color: "#6c7a91", fontSize: 16 }}>
                Expert guides, destination highlights, packing checklists, and insider stories from our travel specialists in Dubai and worldwide.
              </p>
            </div>
          </div>
        </div>
        <div className="container-fluid" style={{ maxWidth: 1280 }}>
          <div className="height1" style={{ borderRadius: 20, overflow: "hidden" }}>
            <div className="radius-mask">
              <div
                className="bg-img height2"
                style={{
                  backgroundImage: "url('/images/8.jpg')",
                  minHeight: 360,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Blog Content */}
      <section className="section-padding" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="container">
          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 40,
              paddingBottom: 24,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {/* Category Pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: selectedCategory === cat ? "var(--mk-primary)" : "#e2e8f0",
                    background: selectedCategory === cat ? "var(--mk-primary)" : "#fff",
                    color: selectedCategory === cat ? "#fff" : "#475569",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: "relative", minWidth: 260 }}>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 38px",
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                <i className="fa-light fa-magnifying-glass"></i>
              </span>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="row g-4">
            {filteredPosts.length === 0 ? (
              <div className="col-12 text-center py-5">
                <p style={{ color: "#64748b", fontSize: 16 }}>No articles found matching your search.</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="col-lg-4 col-md-6">
                  <article
                    style={{
                      background: "#fff",
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.07)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div style={{ height: 230, position: "relative", overflow: "hidden" }}>
                      <img
                        src={post.image}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                          background: "rgba(15, 36, 84, 0.85)",
                          backdropFilter: "blur(6px)",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {post.category}
                      </span>
                    </div>
                    <div style={{ padding: "26px 24px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                        <span><i className="ti-time" style={{ marginRight: 4 }}></i>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h4 style={{ fontSize: 19, fontWeight: 700, color: "var(--mk-navy)", margin: "0 0 10px", lineHeight: 1.35 }}>
                        {post.title}
                      </h4>
                      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px", flexGrow: 1 }}>
                        {post.excerpt}
                      </p>
                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                        <Link
                          href="/contact"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--mk-primary)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          Enquire about this trip
                          <i className="fa-thin fa-arrow-up-right"></i>
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
