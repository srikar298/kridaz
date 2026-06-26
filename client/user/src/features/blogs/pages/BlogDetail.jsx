import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@kridaz/ui";
import SafeHtml from "../../shared/components/SafeHtml";

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
      {/* ΓöÇΓöÇ HERO ΓöÇΓöÇ */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={blog.imageUrl || blog.featuredImage}
          alt={blog.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-10 left-6 z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border text-sm font-bold text-white/60 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm"
            style={{ borderColor: BDR, backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={10} />
            <span>Blog</span>
            <ChevronRight size={10} />
            <span style={{ color: PRI }}>{blog.category || "Article"}</span>
          </div>

          {/* Category badge */}
          {blog.category && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: `${PRI}18`, color: PRI }}
            >
              <Tag size={10} /> {blog.category}
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none mb-4">
            {blog.title}
          </h1>
          {blog.subtitle && (
            <p className="text-gray-400 text-lg max-w-2xl">{blog.subtitle}</p>
          )}
        </div>
      </div>

      {/* ΓöÇΓöÇ META BAR ΓöÇΓöÇ */}
      <div
        className="border-b"
        style={{ borderColor: BDR, backgroundColor: "#050505" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-5 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <User size={13} style={{ color: PRI }} />
            {blog.author || "Kridaz Team"}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Calendar size={13} style={{ color: PRI }} />
            {blog.date}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Clock size={13} style={{ color: PRI }} />
            {blog.readTime || "5 mins read"}
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye size={13} style={{ color: PRI }} />
              {blog.views} views
            </div>
            <Button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-all group"
             aria-label="Like">
              <ThumbsUp
                size={13}
                className="group-hover:scale-110 transition-transform"
                style={{ color: PRI }}
              />
              {blog.likes} likes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-14">
        <SafeHtml
          className="text-gray-400 text-lg leading-relaxed space-y-6 [&_h2]:text-white [&_h2]:text-3xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-white [&_h3]:text-2xl [&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-6 [&_p]:leading-relaxed [&_strong]:text-white [&_strong]:font-bold [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_hr]:border-white/10 [&_hr]:my-10 [&_img]:rounded-[8px] [&_img]:w-full [&_img]:object-cover"
          html={blog.content}
        />
      </div>

      {/* ΓöÇΓöÇ FOOTER CTA ΓöÇΓöÇ */}
      <div className="max-w-4xl mx-auto px-6 pt-20">
        <div
          className="rounded-[8px] border p-10 text-center"
          style={{ borderColor: BDR, backgroundColor: "var(--background)" }}
        >
          <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
            Ready to play?
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Book a premium sports venue in your city ΓÇö instantly.
          </p>
          <Link
            to="/venues"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[8px] font-bold text-sm uppercase tracking-widest text-black hover:brightness-110 transition-all"
            style={{ backgroundColor: PRI }}
          >
            Explore Venues <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
