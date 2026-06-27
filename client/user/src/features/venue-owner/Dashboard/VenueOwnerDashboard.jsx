import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Star,
  TrendingUp,
  Activity,
  MapPin,
  Users2,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  BarChart2,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { useSelector } from "react-redux";
import useVenueOwnerDashboard from "@hooks/venue-owner/useVenueOwnerDashboard";
import DashboardSkeleton from "./DashboardSkeleton";
import OccupancyHeatmap from "./OccupancyHeatmap";
import PeakHoursChart from "./PeakHoursChart";
import { Button, Select } from "@kridaz/ui";


const VenueOwnerDashboard = () => {
  const [selectedVenue, setSelectedVenue] = useState("");
  const { dashboardData, loading, error } =
    useVenueOwnerDashboard(selectedVenue);
  const { role, user } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "var(--primary)" : "var(--primary)";
  const dashboardTitle = isScorer ? "SCORER Dashboard" : "Dashboard Overview";

  const [timeFilter, setTimeFilter] = useState("Month");
  const [revenueFilter, setRevenueFilter] = useState("Month");
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-red-500">
          Connection Interrupted
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-red-500/50 text-red-500 font-bold uppercase rounded-[16px] hover:bg-red-500/10 transition-all"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const finalData = dashboardData || {};

  const {
    totalBookings = 0,
    totalReviews = 0,
    averageRating = 0,
    totalRevenue = 0,
    totalTurfs = 0,
    bookingsPerTurfDay = [],
    bookingsPerTurfWeek = [],
    bookingsPerTurfMonth = [],
    revenueOverTimeRaw = [],
    revenueByVenue = [],
    occupancyHeatmap = [],
    venueHealth = {},
    recentBookings = [],
    utilization = 0,
    activeUsers = 0,
  } = finalData;

  // Only use real data ΓÇô no hardcoded fallbacks
  const pieDataMap = {
    Day: bookingsPerTurfDay,
    Week: bookingsPerTurfWeek,
    Month: bookingsPerTurfMonth,
  };

  const revenueDataMap = {
    Day: (finalData.revenueTrendDay || []).map((i) => ({
      date: `${String(i.id || i._id).padStart(2, "0")}:00`,
      revenue: i.revenue,
    })),
    Week: (finalData.revenueTrendWeek || []).map((i) => ({
      date: new Date(i.id || i._id).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      revenue: i.revenue,
    })),
    Month: (finalData.revenueTrendMonth || []).map((i) => ({
      date: new Date(i.id || i._id).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }),
      revenue: i.revenue,
    })),
  };

  const COLORS = [
    themeColor,
    "var(--success)",
    "#3B82F6",
    "#6366F1",
    "#F59E0B",
    "var(--destructive)",
  ];

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const currentPieData = pieDataMap[timeFilter] || [];
  const currentRevenueData = revenueDataMap[revenueFilter] || [];

  return (
    <div className="h-full custom-scrollbar bg-background">
      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-4 h-full relative">
        <div className="space-y-8 lg:space-y-10 relative z-10">
          {/* Facility Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-sm sm:text-base lg:text-2xl font-black text-white uppercase tracking-wide leading-tight">
              {dashboardTitle}
            </h1>
            {finalData.turfsList && finalData.turfsList.length > 0 && (
              <Select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="bg-card border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-[8px] px-2 py-1.5 outline-none focus:border-primary/50 transition-colors max-w-full"
              >
                <option value="">All Facilities</option>
                {finalData.turfsList.map((turf) => (
                  <option key={turf.id} value={turf.id}>
                    {turf.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Stats Grid – 3 Cards */}
          <div className="grid grid-cols-3 gap-y-6 gap-x-2 lg:gap-x-8 py-6 md:py-8 border-y border-white/[0.08] relative mt-6">
            <StatsCard
              title="Total Bookings"
              value={totalBookings}
              icon={Calendar}
              themeColor={themeColor}
            />
            <StatsCard
              title="Total Revenue"
              value={totalRevenue}
              prefix="Rs "
              icon={TrendingUp}
              themeColor={themeColor}
            />
            <StatsCard
              title="Utilization Rate"
              value={utilization}
              suffix="%"
              icon={Activity}
              themeColor={themeColor}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mb-6 lg:mb-8">
            <div className="lg:col-span-8 space-y-8">
              <OccupancyHeatmap />
            </div>

            <div className="lg:col-span-4">
              <div className="space-y-6 lg:space-y-8 h-full flex flex-col">
                {/* Live Feed */}
                <div className="bg-card p-4 lg:p-6 rounded-[16px] lg:rounded-[16px] border border-white/10 shadow-sm hover:shadow-[0px_8px_24px_rgba(85,222,232,0.10)] transition-shadow flex-1">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h2 className="text-[13px] lg:text-[16px] font-bold text-white tracking-wider font-inter">
                      Live Feed
                    </h2>
                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-[16px] text-[10px] font-medium tracking-widest animate-pulse border"
                      style={{
                        backgroundColor: `${themeColor}1A`,
                        color: themeColor,
                        borderColor: `${themeColor}33`,
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: themeColor }}
                      />{" "}
                      Live
                    </div>
                  </div>

                  {recentBookings.length > 0 ? (
                    <div className="space-y-4 lg:space-y-6">
                      {recentBookings.slice(0, 3).map((booking, i) => (
                        <div
                          key={i}
                          className="flex gap-3 lg:gap-4 group cursor-pointer"
                        >
                          <div
                            className="mt-1 p-1.5 lg:p-2 rounded-[16px] bg-card group-hover:scale-110 transition-transform shrink-0 h-fit"
                            style={{ color: themeColor }}
                          >
                            <CheckCircle2
                              size={12}
                              className="lg:w-3.5 lg:h-3.5"
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-[11px] lg:text-[14px] font-semibold text-white uppercase tracking-tight transition-colors truncate"
                              style={{ color: themeColor }}
                            >
                              Booking{" "}
                              {booking?.status === "CANCELLED"
                                ? "Cancelled"
                                : "Confirmed"}
                            </p>
                            <p className="text-[9px] lg:text-[12px] text-muted-foreground mt-0.5 truncate">
                              {booking?.user?.name ||
                                booking?.guestDetails?.name ||
                                "Guest"}{" "}
                              booked {booking?.turf?.name || "a enue"}
                            </p>
                            <p className="text-[8px] lg:text-[10px] font-medium text-white/70 uppercase mt-1 flex items-center gap-1">
                              <Clock
                                size={8}
                                className="lg:w-[10px] lg:h-[10px]"
                              />{" "}
                              Rs {booking?.totalPrice || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 lg:py-10 text-center gap-2 lg:gap-3 opacity-40">
                      <Zap size={24} className="lg:w-8 lg:h-8 text-gray-600" />
                      <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                        No activity yet
                      </p>
                      <p className="text-[8px] lg:text-[10px] text-gray-600">
                        Live events will appear here
                      </p>
                    </div>
                  )}

                  <Link
                    to="/venue-owner/bookings"
                    className="w-full mt-6 lg:mt-8 py-2 lg:py-3 bg-card border border-white/10 hover:text-white text-white text-[10px] lg:text-[14px] font-bold tracking-widest rounded-[16px] lg:rounded-[16px] transition-all font-inter flex items-center justify-center"
                  >
                    View Full Activity History
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Booking Performance */}
            <div className="lg:col-span-6">
              <ChartCard
                title="Booking Performance"
                subtitle="Revenue trends over time"
                action={
                  <div className="flex items-center gap-2 bg-card p-1 rounded-[16px]">
                    {["Weekly", "Monthly"].map((filter) => (
                      <Button
                        key={filter}
                        onClick={() =>
                          setRevenueFilter(
                            filter === "Weekly" ? "Week" : "Month"
                          )
                        }
                        className={`px-2 py-1 rounded-[8px] text-[9px] font-normal uppercase tracking-wider transition-all font-inter ${(revenueFilter === "Week" && filter === "Weekly") || (revenueFilter === "Month" && filter === "Monthly") ? "bg-gradient-to-r from-primary to-primary text-black" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                }
              >
                {currentRevenueData.length > 0 &&
                currentRevenueData.some((d) => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={currentRevenueData}>
                      <defs>
                        <linearGradient
                          id="colorPerf"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={themeColor}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={themeColor}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        font-family="Inter"
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        font-family="Inter"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#151617",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                        itemStyle={{
                          color: themeColor,
                          fontSize: "12px",
                          textTransform: "uppercase",
                          fontFamily: "Inter",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={themeColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPerf)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    height={300}
                    icon={BarChart2}
                    message="No revenue data yet"
                    sub="Start accepting bookings to see trends"
                  />
                )}
              </ChartCard>
            </div>

            {/* Revenue Split */}
            <div className="lg:col-span-6">
              <ChartCard
                title="Revenue Split"
                subtitle="Distribution by sport category"
              >
                {revenueByVenue.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={revenueByVenue}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {revenueByVenue.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#151617",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                          itemStyle={{
                            textTransform: "uppercase",
                            fontSize: "10px",
                            color: themeColor,
                            fontFamily: "Inter",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-1 gap-2 mt-4 w-full px-2">
                      {revenueByVenue.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            />
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-semibold text-white">
                            Rs {item.value?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    height={300}
                    icon={Package}
                    message="No category data yet"
                    sub="Revenue split will appear after bookings"
                  />
                )}
              </ChartCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ┌── Empty State Helper ──┐
const EmptyState = ({ height, icon: Icon, message, sub }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 text-center rounded-[16px] border border-dashed border-white/10"
    style={{ height }}
  >
    <Icon size={32} className="text-white/20" />
    <p className="text-[14px] font-semibold text-white tracking-wider font-inter">
      {message}
    </p>
    {sub && <p className="text-[12px] text-white/70 font-inter">{sub}</p>}
  </div>
);

// ┌── Stats Card ──┐
const StatsCard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  themeColor,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center group transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-3 p-2 rounded-full bg-white/[0.02] border border-white/[0.05] group-hover:bg-white/[0.05] transition-colors">
        <Icon
          className="w-4 h-4 md:w-5 md:h-5 opacity-90"
          style={{ color: themeColor }}
        />
      </div>
      <div className="flex flex-col items-center space-y-1">
        <div className="text-[16px] md:text-3xl font-bold text-white tracking-tight flex items-baseline justify-center gap-0.5 md:gap-1 font-inter">
          {prefix && (
            <span className="text-[10px] md:text-sm text-white/40 font-medium">
              {prefix}
            </span>
          )}
          {typeof CountUp === 'function' ? (
            <CountUp
              end={Number(value) || 0}
              duration={2}
              separator=","
              decimals={(Number(value) || 0) % 1 === 0 ? 0 : 1}
            />
          ) : CountUp && typeof CountUp.default === 'function' ? (
            <CountUp.default
              end={Number(value) || 0}
              duration={2}
              separator=","
              decimals={(Number(value) || 0) % 1 === 0 ? 0 : 1}
            />
          ) : (
            <span>{value}</span>
          )}
          {suffix && (
            <span className="text-[10px] md:text-sm text-white/40 font-medium">
              {suffix}
            </span>
          )}
        </div>
        <h3 className="text-[8px] md:text-[11px] font-medium text-white/70 uppercase tracking-[1.5px] font-inter mt-1">
          {title}
        </h3>
      </div>
    </div>
  );
};

const ChartCard = ({
  title,
  subtitle,
  children,
  action,
  className = "h-full",
}) => (
  <div
    className={`bg-card p-4 lg:p-8 rounded-[16px] lg:rounded-[16px] border border-white/10 hover:shadow-[0px_8px_24px_rgba(85,222,232,0.10)] transition-shadow relative overflow-hidden group flex flex-col ${className}`}
  >
    <div className="flex flex-col gap-1.5 md:gap-2 mb-4 lg:mb-6 relative z-10 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2 className="text-[13px] lg:text-lg font-bold text-white tracking-tighter leading-none mb-1 md:mb-2 font-inter">
            {title}
          </h2>
          <p className="text-white/70 tracking-normal text-[9px] md:text-[14px] font-inter font-normal">
            {subtitle}
          </p>
        </div>
        {action && <div className="z-20 self-start sm:self-auto">{action}</div>}
      </div>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

export default VenueOwnerDashboard;
