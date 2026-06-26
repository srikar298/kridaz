import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Eye, ThumbsUp, ArrowLeft, Search, Clock, Heart } from "lucide-react";
import axios from "axios";
import { Button, Input } from "@kridaz/ui";


const PRI = "var(--primary)";
const BDR = "var(--border)";
const HEADING_STYLE = {
  fontFamily: "'Open Sans', sans-serif",
  fontWeight: 900,
};
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

/**
 * Returns Tailwind color classes for a category badge based on sport type.
 */
const getCategoryStyles = (cat) => {
  switch (cat?.toLowerCase()) {
    case 'cricket': return 'text-[#a3e635] bg-[#a3e635]/10 border-[#a3e635]/20';
    case 'fitness': return 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/20';
    case 'venues': return 'text-[#2dd4bf] bg-[#2dd4bf]/10 border-[#2dd4bf]/20';
    case 'football': return 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20';
    default: return 'text-white/60 bg-white/5 border-white/10';
  }
};

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLike = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/blogs/${id}/like`
      );
      if (res.data.success) {
        setBlogs((prev) =>
          prev.map((b) =>
            (b.id || b._id) === id ? { ...b, likes: res.data.blog.likes } : b
          )
        );
      }
    } catch (err) {
      console.error("Error liking blog:", err);
    }
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/blogs`
        );
        setBlogs(response.data.blogs || []);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
    window.scrollTo(0, 0);
  }, []);

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.category &&
        blog.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-16 w-1/3 bg-white/5 animate-pulse rounded-[8px] mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-white/5 animate-pulse rounded-[8px]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-4 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="max-w-2xl">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.25em] mb-3"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h1 className="text-3xl uppercase leading-tight tracking-tighter" style={HEADING_STYLE}>
              The <span style={{ color: PRI }}>Playbook</span>
              <br />
              <span className="text-white/20 text-2xl" style={SUBHEADING_STYLE}>Stories & Insights</span>
            </h1>
            <p
              className="text-gray-500 text-[10px] uppercase tracking-[0.25em] mt-3 leading-relaxed"
              style={SUBHEADING_STYLE}
            >
              Discover the latest in sports, fitness, and venue management from
              the Kridaz community.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"
              size={18}
            />
            <Input
              type="text"
              placeholder="SEARCH ARTICLES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[8px] py-2.5 pl-10 pr-3 text-xs font-mono focus:outline-none focus:border-primary transition-all placeholder:text-white/10 uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Featured Posts / Grid */}
        {filteredBlogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 opacity-60">
              <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background card stack */}
                <rect x="30" y="40" width="140" height="110" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <rect x="40" y="32" width="120" height="100" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                {/* Main document */}
                <rect x="52" y="24" width="100" height="130" rx="8" fill="#111" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                {/* Header bar */}
                <rect x="62" y="34" width="80" height="8" rx="2" fill="var(--primary)" opacity="0.15" />
                {/* Lines */}
                <line x1="62" y1="54" x2="132" y2="54" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="62" y1="64" x2="120" y2="64" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="62" y1="74" x2="128" y2="74" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="62" y1="84" x2="110" y2="84" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeLinecap="round" />
                {/* Highlighted lines (primary) */}
                <line x1="62" y1="96" x2="132" y2="96" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="62" y1="106" x2="115" y2="106" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="62" y1="118" x2="132" y2="118" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="62" y1="128" x2="122" y2="128" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
                {/* Paper Plane */}
                <path d="M142 32 L158 40 L146 56 L144 48 L134 46 Z" stroke="var(--primary)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                <line x1="146" y1="56" x2="144" y2="48" stroke="var(--primary)" strokeWidth="1.5" />
                {/* Decorative dots */}
                <circle cx="50" cy="40" r="1.5" fill="var(--primary)" opacity="0.5" />
                <circle cx="150" cy="140" r="1.5" fill="var(--primary)" opacity="0.5" />
                <path d="M38 135 L42 135 M40 133 L40 137" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <path d="M165 55 L169 55 M167 53 L167 57" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              </svg>
            </div>
            <h2 className="text-white text-xl uppercase tracking-wide mb-3" style={HEADING_STYLE}>
              No Blogs Yet
            </h2>
            <p className="text-white/50 text-xs leading-relaxed max-w-[250px]">
              Looks like we're just getting started.<br />Check back soon for exciting stories<br />and insights.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog, idx) => (
              <Link
                key={blog.id || blog._id}
                to={`/blogs/${blog.id || blog._id}`}
                className="group flex flex-col bg-[#111111] border border-white/5 rounded-[16px] overflow-hidden hover:bg-[#151515] hover:border-white/10 transition-colors p-2"
              >
                {/* Image */}
                <div className="w-full shrink-0">
                  <img
                    src={blog.imageUrl || blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-40 object-cover rounded-xl"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 pt-2.5 pb-1 px-1 justify-between">
                  <div>
                    {/* Category */}
                    <div className="mb-2.5">
                      <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider border ${getCategoryStyles(blog.category)}`}>
                        {blog.category || "Article"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-[16px] sm:text-[18px] font-bold uppercase text-white leading-snug mb-2 group-hover:text-primary transition-colors"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-[13px] text-white/50 leading-relaxed line-clamp-2">
                      {blog.excerpt || blog.subtitle || "Discover the latest insights and stories from the Kridaz community."}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-medium">
                      <Clock size={12} />
                      {blog.readTime || "3 min read"}
                    </div>
                    <button
                      onClick={(e) => handleLike(e, blog.id || blog._id)}
                      className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-[11px] font-medium"
                    >
                      <Heart size={12} className="transition-colors" />
                      {blog.likes || 0}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
