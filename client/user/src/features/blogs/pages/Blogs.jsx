import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Eye, ThumbsUp, ArrowLeft, Search } from "lucide-react";
import axios from "axios";

const PRI = "#BFF367";
const BDR = "#2A2A2A";
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.3em] mb-6"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.85] tracking-tighter">
              The <span style={{ color: PRI }}>Playbook</span> <br />
              <span className="text-white/20 italic">Stories & Insights</span>
            </h1>
            <p
              className="text-gray-500 text-xs uppercase tracking-[0.3em] mt-6 leading-relaxed"
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
            <input
              type="text"
              placeholder="SEARCH ARTICLES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-sm font-mono focus:outline-none focus:border-primary transition-all placeholder:text-white/10 uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Featured Posts / Grid */}
        {filteredBlogs.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-white/20 font-display text-4xl uppercase italic">
              No articles found
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-6 text-primary font-bold uppercase tracking-widest text-xs hover:underline"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog, idx) => (
              <Link
                key={blog.id || blog._id}
                to={`/blogs/${blog.id || blog._id}`}
                className="group relative aspect-[4/5] rounded-[8px] overflow-hidden border border-white/5 bg-zinc-900 flex flex-col"
              >
                {/* Image Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={blog.imageUrl || blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col h-full p-8">
                  {/* Category & Date */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/60">
                      {blog.category || "Article"}
                    </span>
                    <span className="text-[10px] font-bold text-white/40 tracking-wider">
                      {blog.date}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mt-auto">
                    <h3 className="font-display text-3xl md:text-4xl text-white leading-[0.9] uppercase italic mb-6 group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>

                    {/* Meta Stats */}
                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                          <Eye size={14} style={{ color: PRI }} />
                          {blog.views}
                        </div>
                        <button
                          onClick={(e) => handleLike(e, blog.id || blog._id)}
                          className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white transition-colors group/btn"
                        >
                          <ThumbsUp
                            size={14}
                            style={{ color: PRI }}
                            className="group-hover/btn:scale-110 transition-transform"
                          />
                          {blog.likes}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        Read More <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accent Border */}
                <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-[8px] transition-all duration-500 pointer-events-none" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
