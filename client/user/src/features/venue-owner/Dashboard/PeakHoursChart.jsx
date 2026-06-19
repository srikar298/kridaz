import * as Sentry from "@sentry/react";
import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";

const PeakHoursChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState("");
  const [filter, setFilter] = useState("week"); // day, week, month, year
  const [summary, setSummary] = useState({
    totalWeeklyBookings: 0,
    peakTime: "N/A",
  });

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    try {
      const res = await axiosInstance.get("/api/owner/turf/owner/all");
      const data = Array.isArray(res.data) ? res.data : [];
      setTurfs(data);
      if (data.length > 0) {
        setSelectedTurf(data[0]._id);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    if (selectedTurf) {
      fetchData();
    }
  }, [filter, selectedTurf]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/owner/dashboard/occupancy?filter=${filter}&turfId=${selectedTurf}`
      );
      if (res.data.success) {
        setData(res.data.peakHours);
        setSummary(res.data.summary);
      }
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1B1B1B] border border-white/10 p-3 rounded-[16px] shadow-[0px_4px_16px_rgba(0,0,0,0.4)]">
          <p className="text-[12px] text-white/70 tracking-widest font-bold mb-1 font-inter">
            {payload[0].payload.time}
          </p>
          <p className="text-white font-bold flex items-center gap-2 font-inter">
            <span className="w-2 h-2 rounded-full bg-[#B3DC26]" />
            {payload[0].value} Bookings
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#121212] p-6 rounded-[16px] border border-white/10 hover:shadow-[0px_8px_24px_rgba(85,222,232,0.10)] transition-shadow h-full flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[16px] font-bold text-white tracking-tighter whitespace-nowrap font-inter truncate">
              Peak Booking Hours
            </h2>
            <div className="px-1.5 py-0.5 bg-[#B3DC26]/10 text-[#B3DC26] rounded-[16px] text-[10px] font-bold tracking-widest border border-white/10 shrink-0">
              Live
            </div>
          </div>
          <p className="text-[12px] font-normal text-white/70 tracking-widest font-inter truncate">
            Time distribution analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 xl:mt-0">
          <select
            value={selectedTurf}
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="bg-[#121212] border border-white/10 text-white text-[10px] sm:text-[12px] font-bold tracking-widest rounded-[16px] px-2 py-1 focus:outline-none focus:border-[#55DEE8] transition-all cursor-pointer hover:border-[#55DEE8]/50 max-w-[140px] sm:max-w-[180px] truncate"
          >
            <option value="" disabled>
              Select Facility
            </option>
            {turfs.map((turf) => (
              <option key={turf._id} value={turf._id}>
                {turf.name}
              </option>
            ))}
          </select>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#121212] border border-white/10 text-white text-[10px] sm:text-[12px] font-bold tracking-widest rounded-[16px] px-2 py-1 focus:outline-none focus:border-[#55DEE8] transition-all cursor-pointer hover:border-[#55DEE8]/50"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#BFF367" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#BFF367" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2D2D2D"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#878C9F", fontSize: 10, fontWeight: 500 }}
              interval={3}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#878C9F", fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#BFF367", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#BFF367"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-[#1B1B1B] p-2.5 sm:p-4 rounded-[16px] sm:rounded-[16px] border border-white/10 flex items-center gap-2 sm:gap-3 group hover:border-[#55DEE8]/50 transition-all overflow-hidden">
          <div className="shrink-0 p-1.5 sm:p-2 bg-[#B3DC26]/10 text-[#B3DC26] rounded-[16px] sm:rounded-[16px] group-hover:scale-110 transition-transform">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[12px] text-white/70 font-bold tracking-widest mb-0.5 font-inter whitespace-nowrap overflow-hidden text-ellipsis">
              Peak Time
            </p>
            <p className="text-white font-bold text-xs sm:text-sm tracking-tight font-inter whitespace-nowrap overflow-hidden text-ellipsis">
              {summary.peakTime}
            </p>
          </div>
        </div>
        <div className="bg-[#1B1B1B] p-2.5 sm:p-4 rounded-[16px] sm:rounded-[16px] border border-white/10 flex items-center gap-2 sm:gap-3 group hover:border-[#55DEE8]/50 transition-all overflow-hidden">
          <div className="shrink-0 p-1.5 sm:p-2 bg-[#B3DC26]/10 text-[#B3DC26] rounded-[16px] sm:rounded-[16px] group-hover:scale-110 transition-transform">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[12px] text-white/70 font-bold tracking-widest mb-0.5 font-inter whitespace-nowrap overflow-hidden text-ellipsis">
              Total Vol.
            </p>
            <p className="text-white font-bold text-xs sm:text-sm tracking-tight font-inter whitespace-nowrap overflow-hidden text-ellipsis">
              {data.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursChart;
