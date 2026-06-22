import React from "react";
import {
  Users,
  Landmark,
  CreditCard,
  Activity,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Share2,
  Trophy,
  BookOpen,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useDashboardData from "@hooks/admin/useDashboardData";
import DashboardSkeleton from "./AdminDashboardSkeleton";import { Button } from "@kridaz/ui";


export default function AdminDashboard() {
  const { data: dashboardData, loading, error } = useDashboardData();
  const navigate = useNavigate();

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="font-bold text-xl uppercase tracking-wider text-red-500">
          Telemetry Link Failure
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-8 px-10 py-4 bg-white/5 border border-red-500/50 text-red-500 font-bold uppercase rounded-[8px] hover:bg-red-500/10 transition-all flex items-center gap-3"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect
        </Button>
      </div>
    );
  }

  const {
    totalUsers = 0,
    totalTurfs = 0,
    pendingTurfs = 0,
    totalBookings = 0,
    totalPayouts = 0,
    openTickets = 0,
    pendingDisputes = 0,
    totalCommunityPosts = 0,
    totalHostedGames = 0,
    publishedBlogs = 0,
    totalUserWalletBalance = 0,
    recentAuditLogs = [],
    bookingHistory = [],
  } = dashboardData || {};

  // Extremely defensive formatting to prevent any UI crashes due to malformed or null API payloads
  const safeTotalUsers = Number(totalUsers) || 0;
  const safeTotalTurfs = Number(totalTurfs) || 0;
  const safePendingTurfs = Number(pendingTurfs) || 0;
  const safeTotalBookings = Number(totalBookings) || 0;
  const safeTotalPayouts = Number(totalPayouts) || 0;
  const safeOpenTickets = Number(openTickets) || 0;
  const safePendingDisputes = Number(pendingDisputes) || 0;
  const safeTotalCommunityPosts = Number(totalCommunityPosts) || 0;
  const safeTotalHostedGames = Number(totalHostedGames) || 0;
  const safePublishedBlogs = Number(publishedBlogs) || 0;
  const safeTotalUserWalletBalance = Number(totalUserWalletBalance) || 0;

  const safeBookingHistory = Array.isArray(bookingHistory)
    ? bookingHistory
    : [];
  const safeRecentAuditLogs = Array.isArray(recentAuditLogs)
    ? recentAuditLogs
    : [];

  const chartData = safeBookingHistory.map((item) => {
    const d = item?.date ? new Date(item.date) : null;
    const isValid = d && !isNaN(d.getTime());
    return {
      name: isValid
        ? d.toLocaleDateString(undefined, { weekday: "short" })
        : "N/A",
      amount: Number(item?.amount) || 0,
    };
  });

  const COLORS = ["var(--primary)", "var(--success)", "#3B82F6", "#6366F1"];

  return (
    <div className="p-4 lg:p-10 space-y-8 lg:space-y-12 animate-fade-in pt-2 pb-24 lg:pb-12 bg-background relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />

      {/* High-Level Command Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5 relative z-10">
        <StatsCard
          title="Total Users"
          value={safeTotalUsers}
          icon={Users}
          onClick={() => navigate("/admin/users")}
        />
        <StatsCard
          title="Active Venues"
          value={safeTotalTurfs}
          icon={Landmark}
          onClick={() => navigate("/admin/turfs")}
        />
        <StatsCard
          title="Pending Approvals"
          value={safePendingTurfs}
          icon={Clock}
          trend={safePendingTurfs > 0 ? "Action Required" : "Cleared"}
          trendNegative={safePendingTurfs > 0}
          onClick={() => navigate("/admin/turfs")}
        />
        <StatsCard
          title="Marketplace Volume"
          value={safeTotalBookings}
          icon={Activity}
        />
        <StatsCard
          title="Total Payouts"
          value={safeTotalPayouts}
          prefix="Rs "
          icon={CreditCard}
          onClick={() => navigate("/admin/withdrawals")}
        />
        <StatsCard
          title="Support Load"
          value={safeOpenTickets}
          icon={MessageSquare}
          trend={
            safeOpenTickets > 10
              ? "High"
              : safeOpenTickets > 0
                ? "Active"
                : "Clear"
          }
          trendNegative={safeOpenTickets > 10}
          onClick={() => navigate("/admin/support")}
        />
      </div>

      {/* Analytics Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">
        {/* Main Throughput Chart */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Marketplace Throughput"
            subtitle="30-Day Financial Performance Telemetry"
            action={
              <div className="flex items-center gap-2 bg-border p-1 rounded-[6px]">
                <span className="px-3 py-1 bg-primary text-black text-[10px] font-bold uppercase rounded-[4px]">
                  Live
                </span>
              </div>
            }
          >
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--foreground)05"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{
                      color: "var(--primary)",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Governance & Moderation Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <ChartCard
            title="Moderation Queue"
            subtitle="Pending Content Approvals"
          >
            <div className="space-y-4 mt-2">
              <ModerationItem
                icon={BookOpen}
                label="Blogs"
                count={safePublishedBlogs}
                onClick={() => navigate("/admin/blogs")}
              />
              <ModerationItem
                icon={Share2}
                label="Community Posts"
                count={safeTotalCommunityPosts}
                onClick={() => navigate("/admin/community")}
              />
              <ModerationItem
                icon={Trophy}
                label="Hosted Games"
                count={safeTotalHostedGames}
                onClick={() => navigate("/admin/games")}
              />
              <ModerationItem
                icon={ShieldAlert}
                label="Active Disputes"
                count={safePendingDisputes}
                color="text-red-500"
                onClick={() => navigate("/admin/disputes")}
              />
            </div>
            <Button
              onClick={() => navigate("/admin/marketing")}
              className="w-full mt-6 py-3 bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 text-white hover:text-primary rounded-[8px] transition-all font-bold uppercase text-[10px] tracking-widest group"
            >
              Open CMS Hub{" "}
              <ChevronRight className="w-3 h-3 inline ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </ChartCard>

          {/* Governance Feed */}
          <div className="p-6 bg-background rounded-[8px] border border-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px]" />
            <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Governance Stream
            </h2>
            <div className="space-y-4 pr-2">
              {safeRecentAuditLogs.map((log, i) => {
                const d = log?.createdAt ? new Date(log.createdAt) : null;
                const isValidDate = d && !isNaN(d.getTime());
                return (
                  <div
                    key={i}
                    onClick={() => navigate("/admin/audit")}
                    className="border-l border-border pl-4 py-1 relative cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="absolute top-0 left-[-4.5px] w-2 h-2 rounded-full bg-primary/50" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tight">
                      {log?.action || "SYSTEM"}
                    </p>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      {log?.details?.email || log?.module || ""}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-gray-500 font-medium">
                        By {log?.admin?.name || "System"}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {isValidDate
                          ? d.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatsCard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend = null,
  trendNegative = false,
  onClick = null,
}) => (
  <div
    onClick={onClick}
    className={`bg-background border border-border rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-primary/30 transition-all duration-500 min-h-[140px] shadow-2xl ${onClick ? "cursor-pointer" : ""}`}
  >
    <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
    <div className="flex items-center justify-between mb-5 relative z-10">
      <div className="w-10 h-10 bg-primary/10 rounded-[6px] text-primary flex items-center justify-center border border-primary/20 shadow-sm">
        <Icon size={20} />
      </div>
      <div
        className={`px-2 py-0.5 rounded-[6px] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${trend === "Stable" || trend === "Optimal" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : trendNegative ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"}`}
      >
        {trend}
      </div>
    </div>
    <div className="space-y-2 relative z-10">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[1px]">
        {title}
      </h3>
      <div className="text-2xl font-bold text-white tracking-tighter flex items-baseline gap-1">
        {prefix && (
          <span className="text-sm text-white/40 font-normal">{prefix}</span>
        )}
        <CountUp
          end={value}
          duration={2.5}
          separator=","
          decimals={value % 1 === 0 ? 0 : 1}
        />
        {suffix && (
          <span className="text-sm text-white/40 font-normal">{suffix}</span>
        )}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, action = null }) => (
  <div className="bg-background p-6 lg:p-8 rounded-[8px] border border-border shadow-2xl relative overflow-hidden group flex flex-col h-full">
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10 shrink-0">
      <div>
        <h2 className="text-[14px] font-bold text-white uppercase tracking-wider leading-none mb-2">
          {title}
        </h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {subtitle}
        </p>
      </div>
      {action && <div className="z-20">{action}</div>}
    </div>
    <div className="flex-1 relative z-10">{children}</div>
  </div>
);

const ModerationItem = ({
  icon: Icon,
  label,
  count,
  color = "text-white",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-[8px] hover:border-primary/30 transition-all ${onClick ? "cursor-pointer hover:bg-primary/5" : ""}`}
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
        {label}
      </span>
    </div>
    <span className={`text-sm font-black ${color}`}>{count}</span>
  </div>
);
