import React from "react";
import { useGetCreatorAnalyticsQuery } from "@redux/api/reelsApi";
import {
  ChevronLeft,
  TrendingUp,
  Play,
  ThumbsUp,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlobalBackButton from "@/shared/components/GlobalBackButton";

const ReelAnalytics = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetCreatorAnalyticsQuery();

  if (isLoading)
    return <div className="p-8 text-center">Loading Analytics...</div>;

  const stats = data?.totalStats || {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center gap-4 mb-8">
        <GlobalBackButton />
        <h1 className="text-2xl font-bold">Creator Dashboard</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          icon={<Play size={20} />}
          label="Total Views"
          value={stats.views}
          color="blue"
        />
        <StatCard
          icon={<ThumbsUp size={20} />}
          label="Likes"
          value={stats.likes}
          color="var(--primary)"
        />
        <StatCard
          icon={<MessageCircle size={20} />}
          label="Comments"
          value={stats.comments}
          color="green"
        />
        <StatCard
          icon={<Share2 size={20} />}
          label="Shares"
          value={stats.shares}
          color="purple"
        />
      </div>

      <div className="bg-white/5 rounded-[8px] p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Recent Reels</h2>
          <TrendingUp size={20} className="text-primary" />
        </div>

        <div className="flex flex-col gap-4">
          {data?.reels?.map((reel) => (
            <div
              key={reel.id}
              className="flex items-center gap-4 p-3 bg-white/5 rounded-[8px]"
            >
              <div className="w-12 h-16 bg-gray-800 rounded-lg shrink-0 overflow-hidden">
                <img
                  src={reel.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {reel.caption || "No caption"}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(reel.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Play size={12} />
                {reel.stats?.views || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400",
    red: "bg-red-500/10 text-red-400",
    green: "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="bg-white/5 p-4 rounded-[8px] border border-white/5">
      <div
        className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-3 ${colors[color]}`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-black">{value.toLocaleString()}</p>
    </div>
  );
};

export default ReelAnalytics;
