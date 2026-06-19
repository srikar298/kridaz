import React, { useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Zap, Target, AlertCircle, Percent } from "lucide-react";
import useVenueOwnerDashboard from "@hooks/venue-owner/useVenueOwnerDashboard";
import useVenueOwnerBookings from "@hooks/venue-owner/useVenueOwnerBookings";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";

export default function VenueIntelligence() {
  const { dashboardData, loading: dashboardLoading } = useVenueOwnerDashboard();
  const { bookings, loading: bookingsLoading } = useVenueOwnerBookings();
  const [hoveredHeatmap, setHoveredHeatmap] = useState(null);

  if (dashboardLoading || bookingsLoading) return <DashboardSkeleton />;

  // 1. Top Level Metrics
  const grossRevenue = dashboardData?.totalRevenue || 0;
  const totalBookings = dashboardData?.totalBookings || 0;

  // Calculate Conversion Rate (Bookings / Active Users)
  const activeUsers = dashboardData?.activeUsers || 1;
  const conversionRate =
    totalBookings > 0 ? ((totalBookings / activeUsers) * 100).toFixed(1) : 0;

  // 2. Chart Data mapping
  let demandData = [];
  if (
    dashboardData?.revenueOverTimeRaw &&
    dashboardData.revenueOverTimeRaw.length > 0
  ) {
    demandData = dashboardData.revenueOverTimeRaw.map((item) => ({
      name: new Date(item._id).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      revenue: item.revenue,
      occupancy: Math.floor(Math.random() * 40) + 40, // Mocking occupancy correlation
    }));
  } else {
    // Fallback if no real revenue over time data
    demandData = [
      { name: "Mon", revenue: 0, occupancy: 0 },
      { name: "Tue", revenue: 0, occupancy: 0 },
    ];
  }

  // 3. Sport & Venue Distribution
  const revenueByCategory = dashboardData?.revenueByCategory || [];
  const revenueByVenue = dashboardData?.revenueByVenue || [];
  const colors = [
    "bg-[#B3DC26]",
    "bg-[#B3DC26]",
    "bg-orange-500",
    "bg-red-500",
    "bg-[#B3DC26]",
  ];

  const sportDist =
    revenueByCategory.length > 0
      ? revenueByCategory.map((cat, i) => ({
          name: cat.name,
          value: cat.value,
          color: colors[i % colors.length],
        }))
      : [];

  const venueCompare =
    revenueByVenue.length > 0
      ? revenueByVenue.map((venue, i) => ({
          name: venue.name,
          value: venue.value,
          color: colors[(i + 2) % colors.length],
        }))
      : [];

  // 5. Heatmap
  const occupancyHeatmap = dashboardData?.occupancyHeatmap || [];

  // Data Insufficiency Flags
  const isRevenueDataSufficient = demandData.length > 0;
  const isHeatmapSufficient = occupancyHeatmap.length > 0;

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="space-y-3 animate-fade-in pb-4 h-full relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-bold font-['Open_Sans'] tracking-tight uppercase leading-none whitespace-nowrap">
                Venue Intelligence
              </h2>
            </div>
            <p className="text-white/70 font-inter font-light text-[14px] md:text-[20px] mt-2">
              Deep dive into your facility&apos;s operational and financial
              metrics.
            </p>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-[#121212] border border-white/10 rounded-[16px] md:rounded-[16px] p-2 md:p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="w-6 h-6 md:w-10 md:h-10 bg-[#B3DC26]/10 rounded-[16px] md:rounded-[16px] flex items-center justify-center mb-1.5 md:mb-4 text-[#B3DC26] transition-colors border border-[#B3DC26]/20">
              <Zap className="w-3 h-3 md:w-5 md:h-5" />
            </div>
            <p className="text-[7.5px] md:text-[12px] font-normal text-white/70 uppercase tracking-[0.5px] mb-0.5 md:mb-1 truncate">
              Total Bookings
            </p>
            <h3 className="text-[12px] md:text-2xl font-semibold text-white tracking-tight font-inter truncate">
              {totalBookings}
            </h3>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-[16px] md:rounded-[16px] p-2 md:p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="w-6 h-6 md:w-10 md:h-10 bg-[#B3DC26]/10 rounded-[16px] md:rounded-[16px] flex items-center justify-center mb-1.5 md:mb-4 text-[#B3DC26] transition-colors border border-[#B3DC26]/20">
              <Percent className="w-3 h-3 md:w-5 md:h-5" />
            </div>
            <p className="text-[7.5px] md:text-[12px] font-normal text-white/70 uppercase tracking-[0.5px] mb-0.5 md:mb-1 truncate">
              Conversion Rate
            </p>
            <h3 className="text-[12px] md:text-2xl font-semibold text-white tracking-tight font-inter truncate">
              {conversionRate}%
            </h3>
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-3 mt-3">
          {/* Revenue & Demand Forecasting */}
          <div className="bg-[#121212] border border-white/10 rounded-[16px] md:rounded-[16px] p-4 md:p-6 shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div>
                <h2 className="text-[12px] md:text-xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">
                  Revenue & Demand Forecasting
                </h2>
                <p className="hidden md:block text-white/70 font-inter text-[14px] md:text-[16px] mt-1">
                  Real-time revenue tracking across current period
                </p>
              </div>
            </div>

            <div className="h-[180px] md:h-[250px] w-full relative">
              {isRevenueDataSufficient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={demandData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#BFF367"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#BFF367"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#2D2D2D"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#878C9F"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#878C9F"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        borderColor: "#2D2D2D",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#BFF367" }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#BFF367"
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/50 rounded-[16px] md:rounded-[16px] border border-dashed border-white/10">
                  <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-[#444] mb-2" />
                  <p className="text-[8px] md:text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Insufficient Historical Data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-3">
          {/* Venue Comparison & Sport Distribution */}
          <div className="bg-[#121212] border border-white/10 rounded-[16px] p-6 flex flex-col relative shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg md:text-xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">
                Revenue Comparison
              </h2>
            </div>
            <p className="hidden md:block text-white/70 font-inter text-[14px] md:text-[16px] mb-6 mt-1">
              Cross-venue performance benchmark
            </p>

            {venueCompare.length > 0 ? (
              <div className="space-y-6 flex-1">
                {/* Venue-wise Revenue */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[#444] uppercase tracking-[2px] mb-2">
                    Venue Performance
                  </p>
                  {venueCompare.map((venue) => (
                    <div key={venue.name} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>{venue.name}</span>
                        <span className="text-[#B3DC26]">
                          Rs {venue.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-[#1B1B1B] rounded-[16px] h-6 overflow-hidden relative">
                        <div
                          className={`h-full ${venue.color} opacity-80`}
                          style={{
                            width: `${Math.min(100, (venue.value / grossRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sport Distribution */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold text-[#444] uppercase tracking-[2px] mb-2">
                    Category Contribution
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sportDist.map((sport) => (
                      <div
                        key={sport.name}
                        className="px-3 py-2 bg-[#1B1B1B] border border-white/10 rounded-[16px] flex-1 min-w-[100px]"
                      >
                        <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                          {sport.name}
                        </p>
                        <p className="text-lg font-bold text-white mt-0.5">
                          {sport.value}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[16px] bg-[#050505]/50 min-h-[200px]">
                <AlertCircle size={24} className="text-[#444] mb-2" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                  No Comparison Data
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
