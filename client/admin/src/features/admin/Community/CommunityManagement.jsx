import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Trash2,
  MessageSquare,
  Clock,
  User as UserIcon,
  Search,
  Filter,
  Loader2,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

const CommunityManagement = () => {
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' or 'stories'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "posts"
          ? "/api/user/community"
          : "/api/user/stories/admin/all";
      const response = await axiosInstance.get(endpoint);
      setItems(
        activeTab === "posts" ? response.data.posts : response.data.stories
      );
    } catch (error) {
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${activeTab.slice(0, -1)}?`
      )
    )
      return;
    try {
      const endpoint =
        activeTab === "posts"
          ? `/api/user/community/${id}`
          : `/api/user/stories/admin/${id}`;
      await axiosInstance.delete(endpoint);
      toast.success("Deleted successfully");
      setItems(items.filter((item) => item._id !== id));
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const filteredItems = items.filter((item) => {
    const text =
      activeTab === "posts" ? item.title + item.content : item.content || "";
    const user = item.user?.username || item.user?.name || "";
    return (
      text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#050505] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Community <span className="text-[#55DEE8]">Moderation</span>
          </h1>
          <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em] mt-1">
            Manage posts and stories across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-[8px] p-1 flex">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-6 py-2.5 rounded-[8px] text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "posts" ? "bg-[#55DEE8] text-black" : "text-white/40 hover:text-white"}`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("stories")}
              className={`px-6 py-2.5 rounded-[8px] text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "stories" ? "bg-[#55DEE8] text-black" : "text-white/40 hover:text-white"}`}
            >
              Stories
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
            size={18}
          />
          <input
            type="text"
            placeholder={`SEARCH ${activeTab.toUpperCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[8px] h-12 pl-12 pr-4 text-white text-xs font-bold tracking-widest outline-none focus:border-[#55DEE8]/50 transition-all placeholder:text-white/10"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/40 hover:text-white px-6 h-12 rounded-[8px] text-xs font-bold uppercase tracking-widest transition-all">
            <Filter size={16} /> Filter
          </button>
          <button
            onClick={fetchItems}
            className="p-3 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-[8px] transition-all"
          >
            <Clock size={18} />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 size={40} className="text-[#55DEE8] animate-spin" />
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
            Auditing Content...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-24 text-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare size={32} className="text-white/10" />
          </div>
          <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em]">
            No {activeTab} found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-white/[0.03] border border-white/5 rounded-[8px] overflow-hidden flex flex-col group hover:border-white/10 transition-all"
            >
              {/* Media Preview */}
              <div className="relative aspect-video bg-black overflow-hidden">
                {activeTab === "posts" ? (
                  item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                      <MessageSquare size={40} className="text-white/5" />
                    </div>
                  )
                ) : item.mediaUrl ? (
                  <img
                    src={item.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[#55DEE8]/5 to-transparent">
                    <p className="text-sm font-medium text-white/40 text-center leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-[6px] flex items-center gap-2">
                    <Clock size={10} className="text-[#55DEE8]" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <Link
                    to={`/profile/${item.user?._id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#55DEE8]/10 flex items-center justify-center border border-[#55DEE8]/20">
                      <UserIcon size={14} className="text-[#55DEE8]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white uppercase tracking-widest hover:text-[#55DEE8] transition-colors">
                        {item.user?.name || "System"}
                      </p>
                      <p className="text-[9px] text-[#55DEE8] font-bold uppercase tracking-widest">
                        @{item.user?.username || "admin"}
                      </p>
                    </div>
                  </Link>

                  {activeTab === "posts" && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-white/40 leading-relaxed line-clamp-3">
                        {item.content}
                      </p>
                    </div>
                  )}

                  {activeTab === "stories" && item.mediaUrl && (
                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 italic">
                      &quot;{item.content || "No caption"}&quot;
                    </p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                        Views
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.views?.length || 0}
                      </span>
                    </div>
                    {activeTab === "stories" && (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                          Expires
                        </span>
                        <span className="text-xs font-bold text-red-500/60 uppercase">
                          {Math.ceil(
                            (new Date(item.expiresAt) - new Date()) /
                              (1000 * 60 * 60 * 24)
                          )}
                          d left
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="w-10 h-10 rounded-[8px] bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityManagement;
