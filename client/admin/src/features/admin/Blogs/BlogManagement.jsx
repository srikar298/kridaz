import { useState, useEffect, useRef } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  X,
  Eye,
  ThumbsUp,
  UploadCloud,
  ImageIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";

// ── Image Upload Zone ─────────────────────────────────────────────────────────
const ImageUploadZone = ({ value, onChange, onFileSelect }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      return toast.error("Please select a valid image file");
    }
    if (file.size > 8 * 1024 * 1024) {
      return toast.error("Image must be under 8 MB");
    }
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleInputChange = (e) => {
    processFile(e.target.files[0]);
    // reset so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center w-full h-36 rounded-[8px] border-2 border-dashed cursor-pointer transition-all ${dragging ? "border-[#84CC16] bg-[#84CC16]/10 scale-[1.01]" : value ? "border-[#84CC16]/40 bg-[#84CC16]/5 hover:border-[#84CC16]/60" : "border-white/10 bg-white/2 hover:bg-white/5 hover:border-white/20"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
        {value ? (
          <>
            <CheckCircle2 size={28} className="text-[#84CC16] mb-2" />
            <p className="text-[11px] font-bold text-[#84CC16] uppercase tracking-widest">
              Image Ready
            </p>
            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
              Click to replace
            </p>
          </>
        ) : (
          <>
            <UploadCloud
              size={32}
              className={`mb-2 transition-colors ${dragging ? "text-[#84CC16]" : "text-gray-500"}`}
            />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {dragging ? "Drop to Upload" : "Click or Drag & Drop"}
            </p>
            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
              JPG · PNG · WEBP · max 8 MB
            </p>
          </>
        )}
      </div>

      {/* Live preview */}
      {value && (
        <div className="relative aspect-video w-full rounded-[8px] overflow-hidden border border-white/10 group/preview">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-all flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                onFileSelect(null);
              }}
              className="opacity-0 group-hover/preview:opacity-100 transition-opacity w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    readTime: "5 mins read",
    date: new Date()
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase(),
    category: "Sports",
    author: "Kridaz Team",
    order: 0,
    status: "published",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/blogs/admin");
      setBlogs(res.data.blogs || []);
    } catch {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  // ── Handle file selection — generate local preview URL ──────────────────
  const handleFileSelect = (file) => {
    setImageFile(file);
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
    } else {
      setImagePreview(
        editingItem?.imageUrl || editingItem?.featuredImage || ""
      );
    }
  };

  const handleOpenModal = (item = null) => {
    setImageFile(null);
    if (item) {
      setEditingItem(item);
      setImagePreview(item.imageUrl || item.featuredImage || "");
      setFormData({
        title: item.title,
        subtitle: item.subtitle || "",
        content: item.content,
        readTime: item.readTime,
        date: item.date,
        category: item.category,
        author: item.author,
        order: item.order,
        status: item.status,
      });
    } else {
      setEditingItem(null);
      setImagePreview("");
      setFormData({
        title: "",
        subtitle: "",
        content: "",
        readTime: "5 mins read",
        date: new Date()
          .toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          .toUpperCase(),
        category: "Sports",
        author: "Kridaz Team",
        order: blogs.length + 1,
        status: "published",
      });
    }
    setIsModalOpen(true);
  };

  // ── Submit — use multipart/form-data when a file is selected ────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isCreate = !editingItem;
    if (isCreate && !imageFile) {
      return toast.error("Please upload an article image");
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      if (imageFile) {
        data.append("image", imageFile);
      } else if (editingItem?.imageUrl) {
        // editing without changing image — send existing URL as plain field
        data.append("imageUrl", editingItem.imageUrl);
      }

      const config = { withCredentials: true };

      if (editingItem) {
        await axiosInstance.put(
          `/api/admin/blogs/admin/${editingItem.id || editingItem._id}`,
          data,
          config
        );
        toast.success("Blog updated successfully");
      } else {
        await axiosInstance.post("/api/admin/blogs/admin", data);
        toast.success("Blog created successfully");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save blog");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await axiosInstance.delete(`/api/admin/blogs/admin/${id}`, {
        withCredentials: true,
      });
      toast.success("Blog deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete blog");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-bebas">
            BLOG & ARTICLE HUB
          </h1>
          <p className="text-sm text-gray-400">
            Manage insights, stories, and deep dives from the sports world.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-lime-500 text-black px-4 py-2 rounded-[6px] font-bold hover:bg-lime-400 transition-colors"
        >
          <Plus size={18} />
          Create New Article
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog, index) => (
          <div
            key={blog.id || blog._id}
            className="group relative flex flex-col rounded-[8px] border border-white/10 bg-[#1A1A1A] overflow-hidden transition-all hover:border-lime-500/50"
          >
            <div className="aspect-[4/3] w-full bg-black overflow-hidden relative">
              <img
                src={blog.imageUrl || blog.featuredImage}
                alt={blog.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute top-4 left-4 font-display-heavy text-4xl text-white/10 italic">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-white/60">
                  {blog.date}
                </span>
                <span className="text-[10px] font-bold text-lime-500 uppercase tracking-wider">
                  {blog.readTime}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                <h3 className="font-display-heavy text-xl text-white leading-tight uppercase group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Eye size={14} className="text-lime-500/50" />
                  {blog.views}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <ThumbsUp size={14} className="text-lime-500/50" />
                  {blog.likes}
                </div>
                <div className="ml-auto px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {blog.category}
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleOpenModal(blog)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(blog.id || blog._id)}
                  className="w-11 h-11 flex items-center justify-center rounded-[8px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {blogs.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[8px] bg-black/20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <FileText size={32} className="text-gray-600" />
            </div>
            <h3 className="text-white font-bold text-xl tracking-tight uppercase">
              No Articles Found
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Start by creating your first business article.
            </p>
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[8px] overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
                  {editingItem ? "Edit Article" : "Create Article"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">
                    System Ready
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Headline */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all font-bold placeholder:text-white/10"
                    placeholder="ENTER ARTICLE HEADLINE..."
                  />
                </div>

                {/* Subtitle */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Lead / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all placeholder:text-white/10"
                    placeholder="Short summary for the card..."
                  />
                </div>

                {/* ── Image Upload ─────────────────────────────────────── */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 flex items-center gap-2">
                    <ImageIcon size={12} />
                    Article Image{" "}
                    {!editingItem && <span className="text-red-500">*</span>}
                  </label>
                  <ImageUploadZone
                    value={imagePreview}
                    onChange={setImagePreview}
                    onFileSelect={handleFileSelect}
                  />
                  <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">
                    Uploaded securely to Cloudinary · JPG · PNG · WEBP
                  </p>
                </div>

                {/* Category */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all appearance-none"
                  >
                    <option value="Sports">SPORTS</option>
                    <option value="Football">FOOTBALL</option>
                    <option value="Cricket">CRICKET</option>
                    <option value="Tennis">TENNIS</option>
                    <option value="Badminton">BADMINTON</option>
                    <option value="Insights">INSIGHTS</option>
                  </select>
                </div>

                {/* Read Time */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) =>
                      setFormData({ ...formData, readTime: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                    placeholder="e.g. 5 MINS READ"
                  />
                </div>

                {/* Date */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Date String
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                    placeholder="e.g. 4 MAY 2026"
                  />
                </div>

                {/* Order */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                  />
                </div>

                {/* Content */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    Article Content (Markdown/HTML)
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] px-6 py-4 text-white focus:outline-none focus:border-lime-500 transition-all resize-none custom-scrollbar"
                    placeholder="Write your article content here..."
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-8 border-t border-white/10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-[8px] border border-white/10 text-white font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 rounded-[8px] bg-lime-500 text-black font-bold hover:bg-lime-400 transition-all shadow-[0_0_30px_rgba(132,204,22,0.4)] uppercase tracking-widest text-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    "Save Article"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
