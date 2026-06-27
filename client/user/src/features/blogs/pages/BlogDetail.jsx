import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@kridaz/ui";
import SafeHtml from "../../../shared/components/SafeHtml";

import {
  ArrowLeft,
  Eye,
  ThumbsUp,
  Clock,
  User,
  Tag,
  Calendar,
  ChevronRight,
} from "lucide-react";

const PRI = "var(--primary)";
const BDR = "var(--border)";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const handleLike = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/blogs/${id}/like`
      );
      if (res.data.success) {
        setBlog((prev) => ({ ...prev, likes: res.data.blog.likes }));
      }
    } catch (err) {
      console.error("Error liking blog:", err);
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/blogs/${id}`
        );
        setBlog(res.data.blog);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="space-y-6 w-full max-w-3xl px-6 pt-4">
          <div className="h-10 w-2/3 bg-white/5 animate-pulse rounded-[8px]" />
          <div className="h-6 w-1/3 bg-white/5 animate-pulse rounded-[8px]" />
          <div className="h-96 w-full bg-white/5 animate-pulse rounded-[8px]" />
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-6">
        <p className="text-7xl font-black text-white/5 mb-4">404</p>
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-2 text-white">
          Article Not Found
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          This article may have been moved or removed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] text-black font-bold text-sm uppercase tracking-widest"
          style={{ backgroundColor: PRI }}
        >
          <ArrowLeft size={14} /> Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* ┌── TOP NAVIGATION & TAG ──┐ */}
      <div className="max-w-4xl mx-auto px-6 pt-4 pb-6 flex justify-between items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border text-sm font-bold text-white/60 hover:text-white hover:border-white/30 transition-all"
          style={{ borderColor: BDR, backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <ArrowLeft size={14} /> Back
        </Link>

        {blog.category && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: `${PRI}18`, color: PRI }}
          >
            <Tag size={10} /> {blog.category}
          </div>
        )}
      </div>

      {/* ┌── HERO IMAGE ──┐ */}
      <div className="max-w-4xl mx-auto px-6 mb-2">
        <div className="w-full overflow-hidden rounded-[16px] bg-white/5 flex items-center justify-center">
          <img
            src={blog.imageUrl || blog.featuredImage}
            alt={blog.title}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
      </div>

      {/* ┌── META BAR ──┐ */}
      <div
        className="border-b border-t mb-6"
        style={{ borderColor: BDR, backgroundColor: "#050505" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
          <div className="flex items-center gap-2.5 sm:gap-4 flex-nowrap overflow-x-auto scrollbar-hide max-w-full">
            <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-gray-500 font-medium whitespace-nowrap">
              <User size={11} style={{ color: PRI }} className="shrink-0" />
              {blog.author || "Kridaz Team"}
            </div>
            <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-gray-500 font-medium whitespace-nowrap">
              <Calendar size={11} style={{ color: PRI }} className="shrink-0" />
              {blog.date}
            </div>
            <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-gray-500 font-medium whitespace-nowrap">
              <Clock size={11} style={{ color: PRI }} className="shrink-0" />
              {blog.readTime || "5 mins read"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Eye size={12} style={{ color: PRI }} />
              {blog.views} views
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white transition-all group bg-transparent border-none p-0 outline-none"
             aria-label="Like">
              <ThumbsUp
                size={12}
                className="group-hover:scale-110 transition-transform"
                style={{ color: PRI }}
              />
              {blog.likes} likes
            </button>
          </div>
        </div>
      </div>

      {/* ┌── TITLE CONTENT ──┐ */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <h2 
          className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-4"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          {blog.title}
        </h2>
        {blog.subtitle && (
          <p className="text-gray-400 text-lg max-w-2xl">{blog.subtitle}</p>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-4">
        <SafeHtml
          className="text-gray-400 text-[15px] leading-relaxed text-justify whitespace-pre-wrap [&_h2]:text-primary [&_h2]:text-2xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:text-primary [&_h3]:text-xl [&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-tight [&_h3]:mt-6 [&_h3]:mb-2 [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&_p]:leading-relaxed [&_strong]:text-white [&_strong]:font-bold [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_hr]:border-white/10 [&_hr]:my-8 [&_img]:rounded-[8px] [&_img]:w-full [&_img]:object-cover"
          html={blog.content}
        />
      </div>


    </div>
  );
}
