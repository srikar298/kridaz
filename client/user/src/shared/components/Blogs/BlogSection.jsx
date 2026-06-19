import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Eye, ThumbsUp, Share2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import axios from "axios";

const PRI = "#BFF367";

const BlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLike = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axiosInstance.post(`/api/user/blogs/${id}/like`);
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
    const controller = new AbortController();
    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get(`/api/user/blogs`, {
          signal: controller.signal,
        });
        setBlogs(response.data.blogs || []);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error fetching blogs:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="pt-6 lg:pt-10 pb-6 lg:pb-10 px-6 max-w-screen-2xl mx-auto">
        <div className="h-12 w-64 bg-white/5 animate-pulse rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-white/5 animate-pulse rounded-[8px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <section className="pt-2 lg:pt-4 pb-6 lg:pb-10 px-4 lg:px-12 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="font-display text-5xl md:text-7xl uppercase leading-none tracking-tight">
            BLOGS AND <span style={{ color: PRI }}>ARTICLES</span>
          </h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mt-3">
            INSIGHTS, STORIES, AND DEEP DIVES FROM THE SPORTS WORLD
          </p>
        </div>
        <Link
          to="/blogs"
          className="group flex items-center gap-2 text-white font-bold text-sm tracking-widest uppercase hover:text-primary transition-colors"
        >
          VIEW ALL{" "}
          <ChevronRight
            size={18}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      {/* Mobile: horizontal scroll | Desktop: grid */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth no-scrollbar md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-5">
        {blogs.slice(0, 5).map((blog, idx) => (
          <Link
            key={blog.id || blog._id}
            to={`/blogs/${blog.id || blog._id}`}
            className="group relative rounded-[8px] overflow-hidden border border-white/5 bg-zinc-900 flex flex-col snap-start shrink-0 w-[75vw] aspect-[3/4] md:w-auto md:shrink md:aspect-[3/4]"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={blog.imageUrl || blog.featuredImage}
                alt={blog.title}
                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col h-full p-6">
              {/* Number Overlay */}
              <div className="font-display text-6xl text-white/10 leading-none select-none">
                {String(idx + 1).padStart(2, "0")}
              </div>

              {/* Top Meta */}
              <div className="mt-auto mb-4 flex flex-col items-end text-right">
                <span className="text-[10px] font-bold text-white/60 tracking-wider mb-1">
                  {blog.date}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: PRI }}
                >
                  {blog.readTime}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl md:text-3xl text-white leading-[0.9] uppercase mb-6 group-hover:text-primary transition-colors">
                {blog.title}
              </h3>

              {/* Footer Stats */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-white/40">
                    <Eye size={14} style={{ color: PRI }} />
                    {blog.views}
                  </div>
                  <button
                    onClick={(e) => handleLike(e, blog.id || blog._id)}
                    className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors group/btn"
                  >
                    <ThumbsUp
                      size={14}
                      style={{ color: PRI }}
                      className="group-hover/btn:scale-110 transition-transform"
                    />
                    {blog.likes}
                  </button>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-all">
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
              <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-1000 ease-out" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogSection;
