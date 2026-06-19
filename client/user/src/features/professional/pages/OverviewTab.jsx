import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Bookings vs Income Mock Data
const graphData = {
  Today: [{ name: "Today", bookings: 2, income: 400 }],
  "This Week": [
    { name: "Mon", bookings: 2, income: 400 },
    { name: "Tue", bookings: 3, income: 600 },
    { name: "Wed", bookings: 1, income: 200 },
    { name: "Thu", bookings: 5, income: 1000 },
    { name: "Fri", bookings: 4, income: 800 },
    { name: "Sat", bookings: 8, income: 1600 },
    { name: "Sun", bookings: 6, income: 1200 },
  ],
  "This Month": [
    { name: "Week 1", bookings: 12, income: 2400 },
    { name: "Week 2", bookings: 18, income: 3600 },
    { name: "Week 3", bookings: 15, income: 3000 },
    { name: "Week 4", bookings: 22, income: 4400 },
  ],
  "All Time": [
    { name: "Jan", bookings: 45, income: 9000 },
    { name: "Feb", bookings: 52, income: 10400 },
    { name: "Mar", bookings: 48, income: 9600 },
    { name: "Apr", bookings: 65, income: 13000 },
    { name: "May", bookings: 70, income: 14000 },
  ],
  "Custom Time": [
    { name: "Day 1", bookings: 5, income: 1000 },
    { name: "Day 2", bookings: 7, income: 1400 },
    { name: "Day 3", bookings: 4, income: 800 },
  ],
};

const skippedRequests = [
  {
    title: "Local League Final - Central Ground",
    dateTime: "27 Oct, 16:00 - 18:00",
    pay: "₹1,800",
  },
  {
    title: "Junior T20 Match - Sports Club",
    dateTime: "29 Oct, 10:00 - 12:00",
    pay: "₹1,200",
  },
];

import {
  MapPin,
  Activity,
  IndianRupee,
  Star,
  CheckCircle,
  Bell,
  Clock,
  ChevronDown,
  X,
  Shield,
  MessageCircle,
} from "lucide-react";
import {
  useToggleOnlineMutation,
  useGetMyOnDemandBookingsQuery,
  useVerifyOTPMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useGetDashboardStatsQuery,
} from "../../../redux/api/professionalApi";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "@redux/slices/authSlice.js";
import { useSocket } from "@context/SocketContext";

const OverviewTab = ({ role, profile }) => {
  const user = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const isOnline = user?.isOnline || false;
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Timeline states
  const [bookingsTimeline, setBookingsTimeline] = useState("This Week");
  const [earningsTimeline, setEarningsTimeline] = useState("This Week");
  const [timeTimeline, setTimeTimeline] = useState("This Week");
  const [ratingTimeline, setRatingTimeline] = useState("This Week");
  const [graphTimeline, setGraphTimeline] = useState("This Week");

  // Real-time match offers state
  const [activeOffer, setActiveOffer] = useState(null);
  const [offerCountdown, setOfferCountdown] = useState(30);

  const { data: bookingsData, refetch: refetchBookings } =
    useGetMyOnDemandBookingsQuery();
  const { data: statsData, refetch: refetchStats } =
    useGetDashboardStatsQuery();
  const [toggleOnlineApi, { isLoading: isToggling }] =
    useToggleOnlineMutation();
  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOTPMutation();
  const [acceptOfferApi] = useAcceptOfferMutation();
  const [rejectOfferApi] = useRejectOfferMutation();

  // Handle Online Toggle
  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    // Optimistic update — flip UI instantly before API responds
    dispatch(updateUser({ isOnline: nextState }));

    const performToggle = async (coords = {}) => {
      try {
        await toggleOnlineApi({ isOnline: nextState, ...coords }).unwrap();
        refetchStats();
      } catch (err) {
        console.error("Failed to toggle online status", err);
        // Rollback on failure
        dispatch(updateUser({ isOnline: !nextState }));
      }
    };

    if (nextState && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          performToggle({ latitude, longitude });
        },
        () => {
          performToggle();
        }
      );
    } else {
      performToggle();
    }
  };

  // Handle OTP Submission
  const handleVerifyOtp = async (bookingId) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (otp.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit OTP.");
      return;
    }
    try {
      await verifyOtpApi({ bookingId, otp }).unwrap();
      setSuccessMsg("Check-in successful! Payout escrow released.");
      setOtp("");
      refetchBookings();
      refetchStats();
    } catch (err) {
      setErrorMsg(
        err.data?.message || "OTP verification failed. Please try again."
      );
    }
  };

  // Active match request calculation
  const activeBooking = bookingsData?.bookings?.find(
    (b) => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
  );

  const pastBookingsCount =
    bookingsData?.bookings?.filter((b) => b.status === "COMPLETED").length || 0;
  const totalEarnings =
    bookingsData?.bookings
      ?.filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + parseFloat(b.hourlyRate), 0) || 0;

  // Listen to WebSocket events for incoming match offers
  useEffect(() => {
    if (!socket) return;

    const handleMatchOffer = (data) => {
      if (isOnline) {
        setActiveOffer(data);
        setOfferCountdown(30);
      }
    };

    socket.on("professional:match_offer", handleMatchOffer);
    return () => {
      socket.off("professional:match_offer", handleMatchOffer);
    };
  }, [socket, isOnline]);

  // Handle countdown timer for incoming offers
  useEffect(() => {
    if (!activeOffer) return;
    if (offerCountdown <= 0) {
      setActiveOffer(null);
      return;
    }
    const timer = setTimeout(() => {
      setOfferCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeOffer, offerCountdown]);

  const handleAcceptOffer = async (offerId) => {
    try {
      await acceptOfferApi(offerId).unwrap();
      setActiveOffer(null);
      refetchBookings();
      refetchStats();
    } catch (err) {
      alert(
        "Failed to accept offer. It may have expired or been taken by another professional."
      );
      setActiveOffer(null);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await rejectOfferApi(offerId).unwrap();
      setActiveOffer(null);
      refetchStats();
    } catch (err) {
      setActiveOffer(null);
    }
  };

  const getFilteredBookings = (timeline) => {
    const completed =
      bookingsData?.bookings?.filter((b) => b.status === "COMPLETED") || [];
    const now = new Date();

    if (timeline === "Today") {
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      return completed.filter((b) => new Date(b.createdAt) >= todayStart);
    }
    if (timeline === "This Week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return completed.filter((b) => new Date(b.createdAt) >= oneWeekAgo);
    }
    if (timeline === "This Month") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return completed.filter((b) => new Date(b.createdAt) >= oneMonthAgo);
    }
    return completed;
  };

  const getBookingsValue = () => {
    return getFilteredBookings(bookingsTimeline).length;
  };

  const getEarningsValue = () => {
    const filtered = getFilteredBookings(earningsTimeline);
    return filtered.reduce((sum, b) => sum + parseFloat(b.hourlyRate || 0), 0);
  };

  const getAvgTimeValue = () => {
    const filtered = getFilteredBookings(timeTimeline);
    if (filtered.length === 0) return "0%";

    let totalMinutes = 0;
    const uniqueDays = new Set();

    filtered.forEach((b) => {
      uniqueDays.add(new Date(b.createdAt).toDateString());
      if (b.matchStartTime && b.matchEndTime) {
        const [sh, sm] = b.matchStartTime.split(":").map(Number);
        const [eh, em] = b.matchEndTime.split(":").map(Number);
        let start = sh * 60 + sm;
        let end = eh * 60 + em;
        if (end < start) end += 24 * 60;
        totalMinutes += end - start;
      } else {
        totalMinutes += 120; // default 2 hours
      }
    });

    const daysCount = uniqueDays.size || 1;
    const avgMinutesPerDay = totalMinutes / daysCount;
    // Percentage of a 24-hour day (1440 minutes)
    const percentage = ((avgMinutesPerDay / 1440) * 100).toFixed(1);

    return `${percentage}%`;
  };

  const getRatingValue = () => {
    return Number(statsData?.stats?.rating || profile?.rating || 5.0).toFixed(
      1
    );
  };

  const offerDuration = 30;
  const visibleOffer = activeOffer;
  const visibleOfferCountdown = activeOffer ? offerCountdown : 18;
  const offerProgress = Math.max(
    0,
    Math.min(1, visibleOfferCountdown / offerDuration)
  );
  const offerStrokeLength = 264;
  const offerStrokeOffset = offerStrokeLength * (1 - offerProgress);

  return (
    <div className="space-y-6 text-white font-inter">
      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {/* Bookings */}
        <div className="col-span-2 lg:col-span-2 p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col justify-between h-36 relative">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">
              Bookings
            </span>
            <div className="p-2 bg-white/5 rounded-lg absolute top-4 right-4">
              <Activity size={16} className="text-gray-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                Completed
              </p>
              <h3 className="text-2xl font-bold text-white">
                {statsData?.stats?.bookings?.completed || 0}
              </h3>
            </div>
            <div className="w-px h-8 bg-[#2D2D2D]"></div>
            <div>
              <p className="text-[10px] text-[#BFF367] uppercase font-bold mb-0.5">
                Assigned
              </p>
              <h3 className="text-xl font-bold text-white">
                {statsData?.stats?.bookings?.assigned || 0}
              </h3>
            </div>
            <div className="w-px h-8 bg-[#2D2D2D]"></div>
            <div>
              <p className="text-[10px] text-green-400 uppercase font-bold mb-0.5">
                In Progress
              </p>
              <h3 className="text-xl font-bold text-white">
                {statsData?.stats?.bookings?.inProgress || 0}
              </h3>
            </div>
          </div>
          <div className="mt-3 flex items-center border-t border-[#2D2D2D] pt-3">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider">
              All Time
            </span>
          </div>
        </div>

        {/* Earnings */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col justify-between h-36 relative">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">
              Earnings
            </span>
            <div className="p-2 bg-[#BFF367]/10 rounded-lg absolute top-4 right-4">
              <IndianRupee size={16} className="text-[#BFF367]" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-3xl font-bold text-[#BFF367]">
              ₹{getEarningsValue()}
            </h3>
          </div>
          <div className="mt-3 flex items-center border-t border-[#2D2D2D] pt-3">
            <div className="relative inline-flex items-center w-full">
              <select
                value={earningsTimeline}
                onChange={(e) => setEarningsTimeline(e.target.value)}
                className="appearance-none bg-transparent text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider pr-4 outline-none cursor-pointer hover:text-white transition-colors z-10 w-full"
              >
                <option className="bg-[#141414] text-white" value="Today">
                  Today
                </option>
                <option className="bg-[#141414] text-white" value="This Week">
                  This Week
                </option>
                <option className="bg-[#141414] text-white" value="This Month">
                  This Month
                </option>
                <option className="bg-[#141414] text-white" value="All Time">
                  All Time
                </option>
              </select>
              <ChevronDown
                size={12}
                className="text-[#878C9F] absolute right-0 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Daily Avg Time */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col justify-between h-36 relative">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider leading-tight">
              Daily Avg
              <br />
              Time
            </span>
            <div className="p-2 bg-[#BFF367]/10 rounded-lg absolute top-4 right-4">
              <Clock size={16} className="text-[#BFF367]" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-bold text-white">
              {statsData?.stats?.daat || 0}%{" "}
              <span className="text-sm font-normal text-gray-400">active</span>
            </h3>
          </div>
          <div className="mt-3 flex items-center border-t border-[#2D2D2D] pt-3">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider">
              30 Days
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col justify-between h-36 relative">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">
              Rating
            </span>
            <div className="p-2 bg-yellow-400/10 rounded-lg absolute top-4 right-4">
              <Star size={16} className="text-yellow-400" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <h3 className="text-3xl font-bold text-white">
              {getRatingValue()}
            </h3>
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div className="mt-3 flex items-center border-t border-[#2D2D2D] pt-3">
            <div className="relative inline-flex items-center w-full">
              <select
                value={ratingTimeline}
                onChange={(e) => setRatingTimeline(e.target.value)}
                className="appearance-none bg-transparent text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider pr-4 outline-none cursor-pointer hover:text-white transition-colors z-10 w-full"
              >
                <option className="bg-[#141414] text-white" value="Today">
                  Today
                </option>
                <option className="bg-[#141414] text-white" value="This Week">
                  This Week
                </option>
                <option className="bg-[#141414] text-white" value="This Month">
                  This Month
                </option>
                <option className="bg-[#141414] text-white" value="All Time">
                  All Time
                </option>
              </select>
              <ChevronDown
                size={12}
                className="text-[#878C9F] absolute right-0 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Requests & Acceptance */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col justify-between h-36 relative">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider leading-tight">
              Match
              <br />
              Requests
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                Acc
              </p>
              <h3 className="text-xl font-bold text-green-400">
                {statsData?.stats?.acceptedRequests ?? pastBookingsCount}
              </h3>
            </div>
            <div className="w-px h-6 bg-[#2D2D2D]"></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                Rej
              </p>
              <h3 className="text-xl font-bold text-red-400">
                {statsData?.stats?.rejectedRequests ?? 0}
              </h3>
            </div>
            <div className="w-px h-6 bg-[#2D2D2D]"></div>
            <div>
              <p className="text-[10px] text-[#BFF367] uppercase font-bold mb-0.5">
                Rate
              </p>
              <h3 className="text-xl font-bold text-white">
                {statsData?.stats?.acceptanceRate ?? 100}%
              </h3>
            </div>
          </div>
          <div className="mt-3 flex items-center border-t border-[#2D2D2D] pt-3">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider">
              30 Days
            </span>
          </div>
        </div>

        {/* Conflict Balance */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col justify-between h-36 relative">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider leading-tight">
              Conflict
              <br />
              Balance
            </span>
            <div className="p-2 bg-red-500/10 rounded-lg absolute top-4 right-4">
              <Shield size={16} className="text-red-400" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-bold text-white">
              ₹{profile?.disputeBalance || 0}
            </h3>
          </div>
          <div className="mt-3 flex items-center border-t border-[#2D2D2D] pt-3">
            <span className="text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider">
              Funds on Hold
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Active Match Details & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assigned Booking Card */}
          {activeBooking ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-[#BFF367]/40 shadow-lg shadow-[#BFF367]/5 space-y-6">
              <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-4">
                <div className="flex items-center gap-3">
                  <span className="animate-ping w-2.5 h-2.5 rounded-full bg-[#BFF367]" />
                  <h2 className="text-lg font-bold tracking-tight">
                    Active Match Assignment
                  </h2>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${activeBooking.status === "IN_PROGRESS" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-[#BFF367]/10 text-[#BFF367] border border-[#BFF367]/20"}`}
                >
                  {activeBooking.status === "IN_PROGRESS"
                    ? "In Progress"
                    : "Assigned"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-[#878C9F] uppercase tracking-wider">
                    Client details
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {activeBooking.user?.profilePicture ? (
                      <img
                        src={activeBooking.user.profilePicture}
                        alt="User Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                        {activeBooking.user?.name?.charAt(0) || "C"}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold">
                        {activeBooking.user?.name || "Client"}
                      </h4>
                      <p className="text-xs text-[#878C9F]">
                        {activeBooking.user?.phone ||
                          activeBooking.user?.email ||
                          ""}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/messages?userId=${activeBooking.user?.id}`)
                      }
                      className="flex items-center justify-center p-2 rounded-lg bg-[#BFF367]/10 text-[#BFF367] hover:bg-[#BFF367]/20 transition-colors"
                      title="Chat with Customer"
                    >
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#878C9F] uppercase tracking-wider">
                    Location / Ground
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={16} className="text-[#BFF367]" />
                    <span className="text-sm font-medium">
                      {activeBooking.ground?.name ||
                        activeBooking.customLocation?.address ||
                        "Custom Location"}
                    </span>
                  </div>
                </div>
              </div>

              {/* OTP Validation Form - show if not started */}
              {activeBooking.status === "ASSIGNED" ? (
                <div className="p-5 rounded-xl bg-[#222222] border border-[#2D2D2D] space-y-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Clock size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Arrival OTP Verification
                    </span>
                  </div>
                  <p className="text-xs text-[#878C9F]">
                    Ask the organizer for the 6-digit OTP code to verify your
                    arrival and activate the booking session.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-Digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                      className="flex-1 bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-center font-mono tracking-widest text-lg focus:outline-none focus:border-[#BFF367] transition-colors"
                    />
                    <button
                      onClick={() => handleVerifyOtp(activeBooking.id)}
                      disabled={isVerifying}
                      className="bg-[#BFF367] hover:bg-[#44cdd7] text-black font-semibold rounded-xl px-6 py-2.5 transition-colors text-sm"
                    >
                      Verify
                    </button>
                  </div>

                  {errorMsg && (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      {errorMsg}
                    </p>
                  )}
                  {successMsg && (
                    <p className="text-green-400 text-xs mt-1 font-medium">
                      {successMsg}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={20} />
                  <div>
                    <h5 className="text-sm font-semibold text-green-400">
                      Check-in Verified
                    </h5>
                    <p className="text-xs text-[#878C9F] mt-0.5">
                      Session actively in progress. Complete the service to
                      record matches.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : isOnline ? (
            <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-4">
              <h3 className="text-lg font-bold text-white">Bookings Pending</h3>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#BFF367]">
                  Skipped Requests
                </h4>
                {!statsData?.stats?.skippedRequests ||
                statsData.stats.skippedRequests.length === 0 ? (
                  <p className="text-xs text-[#878C9F]">
                    No skipped booking requests.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {statsData.stats.skippedRequests.map((request, index) => (
                      <div
                        key={request.id || index}
                        className="rounded-xl border border-[#BFF367]/40 bg-black/20 p-4 transition-all hover:border-[#BFF367]/60 hover:bg-[#BFF367]/[0.03]"
                      >
                        <div className="space-y-2">
                          <h5 className="text-sm font-bold text-white">
                            {index + 1}. {request.title}
                          </h5>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#B8BCC8]">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={13} className="text-[#878C9F]" />
                              {request.dateTime}
                            </span>
                            <span className="text-[#2D2D2D]">|</span>
                            <span className="font-bold text-white">
                              {request.pay}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] text-[#878C9F]">Status</p>
                            <p className="text-xs font-black uppercase tracking-wider text-yellow-400">
                              Skipped
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="mb-1 text-[11px] text-[#878C9F]">
                              Action
                            </p>
                            <button
                              disabled
                              className="rounded-full bg-gray-700 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-gray-400 cursor-not-allowed"
                            >
                              Skipped
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-[#141414] border border-[#2D2D2D] text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Bookings Pending</h3>
                <p className="text-[#878C9F] text-sm mt-1 max-w-md mx-auto">
                  You are offline. Go online using the toggle above to start
                  receiving match booking offers.
                </p>
              </div>
            </div>
          )}

          {/* Bookings vs Income Graph */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-4">
            <div className="flex justify-between items-center relative z-20">
              <h3 className="text-lg font-bold text-white">
                Bookings vs Income
              </h3>
              <div className="relative inline-flex items-center">
                <select
                  value={graphTimeline}
                  onChange={(e) => setGraphTimeline(e.target.value)}
                  className="appearance-none bg-transparent text-[11px] text-[#878C9F] font-semibold uppercase tracking-wider pr-4 outline-none cursor-pointer hover:text-white transition-colors z-10"
                >
                  <option className="bg-[#141414] text-white" value="Today">
                    Today
                  </option>
                  <option className="bg-[#141414] text-white" value="This Week">
                    This Week
                  </option>
                  <option
                    className="bg-[#141414] text-white"
                    value="This Month"
                  >
                    This Month
                  </option>
                  <option className="bg-[#141414] text-white" value="All Time">
                    All Time
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="text-[#878C9F] absolute right-0 pointer-events-none"
                />
              </div>
            </div>
            <div className="h-[250px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    statsData?.stats?.graphData?.[graphTimeline] ||
                    graphData[graphTimeline] ||
                    []
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorIncome"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#BFF367" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#BFF367" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorBookings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#BFF367" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#BFF367" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A2D35"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717582", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717582", fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717582", fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1D27",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke="#BFF367"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="income"
                    name="Income (₹)"
                    stroke="#BFF367"
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Info / Instructions Panel */}
        <div className="hidden space-y-6 lg:block">
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex flex-col items-center">
            <h3 className="text-lg font-bold text-white w-full text-left mb-6">
              Kridaz Points
            </h3>

            {/* Circular Progress */}
            <div className="w-32 h-32 rounded-full border-4 border-[#2A2D35] flex items-center justify-center relative mb-8">
              <svg
                className="absolute inset-0 w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="transparent"
                  stroke="#BFF367"
                  strokeWidth="8"
                  strokeDasharray="289"
                  strokeDashoffset={
                    289 *
                    (1 -
                      Math.min(
                        100,
                        Math.max(0, statsData?.stats?.trustScore || 100)
                      ) /
                        100)
                  }
                  className="drop-shadow-[0_0_8px_rgba(191,243,103,0.5)]"
                />
              </svg>
              <div className="text-center z-10 flex items-center justify-center h-full">
                <span className="text-4xl font-bold text-[#BFF367]">
                  {statsData?.stats?.trustScore || 100}
                </span>
              </div>
            </div>

            {/* Guidelines */}
            <div className="space-y-3 w-full">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFF367]/10 text-[#BFF367] flex shrink-0 items-center justify-center text-[10px] font-bold mt-0.5">
                  1
                </div>
                <p className="text-xs text-gray-300">
                  No points will be reduced if rejected.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFF367]/10 text-[#BFF367] flex shrink-0 items-center justify-center text-[10px] font-bold mt-0.5">
                  2
                </div>
                <p className="text-xs text-gray-300">
                  There will be an increase in point for every successful
                  booking.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFF367]/10 text-[#BFF367] flex shrink-0 items-center justify-center text-[10px] font-bold mt-0.5">
                  3
                </div>
                <p className="text-xs text-gray-300">
                  There will be a 0.5 point reduction for skipping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Match Offer Dialog Modal */}
      {visibleOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl animate-in zoom-in-95 duration-200">
            <div className="relative overflow-hidden rounded-[22px] border border-[#BFF367]/80 bg-[#061413]/95 p-4 shadow-[0_0_36px_rgba(85,222,232,0.28),0_0_30px_rgba(191,243,103,0.14)]">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[#BFF367]/[0.06] blur-3xl" />
              <div className="relative grid grid-cols-1 items-center gap-5 md:grid-cols-[180px_1fr]">
                <div className="mx-auto space-y-3">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-black/30">
                    <svg
                      className="absolute h-32 w-32 -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(85,222,232,0.14)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#BFF367"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={offerStrokeLength}
                        strokeDashoffset={offerStrokeOffset}
                        className="drop-shadow-[0_0_10px_rgba(85,222,232,0.85)] transition-all duration-500"
                      />
                    </svg>
                    <div className="relative text-center">
                      <p className="text-[11px] font-medium text-white/80">
                        {visibleOfferCountdown}/{offerDuration}
                      </p>
                      <p className="text-4xl font-black leading-none text-[#BFF367]">
                        {visibleOfferCountdown}s
                      </p>
                      <p className="mt-1 text-xs text-white/75">Remaining</p>
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                    <p className="text-xs text-white/75">
                      <span className="text-white">
                        {visibleOffer.date || "Today"}
                      </span>
                      <span className="mx-1.5 text-white/35">|</span>
                      <span className="text-white">
                        {visibleOffer.time || "Immediate"}
                        {visibleOffer.endTime
                          ? ` - ${visibleOffer.endTime}`
                          : ""}
                      </span>
                    </p>
                    <p className="text-lg text-white/80">
                      Pay:{" "}
                      <span className="font-black text-[#BFF367]">
                        ₹{visibleOffer.budget}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#BFF367] text-base font-black uppercase text-black shadow-[0_0_18px_rgba(85,222,232,0.32)]">
                      {(
                        visibleOffer.userName ||
                        visibleOffer.user?.name ||
                        "U"
                      ).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        Requested By
                      </p>
                      <p className="truncate text-sm font-black text-white">
                        {visibleOffer.userName ||
                          visibleOffer.user?.name ||
                          "Tournament Organizer"}
                      </p>
                      <p className="truncate text-xs font-medium text-white/55">
                        {visibleOffer.userPhone ||
                          visibleOffer.user?.phoneNumber ||
                          "Contact shared after acceptance"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[#BFF367]">
                      <Bell size={16} className="animate-bounce" />
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/70">
                        Active Booking Request
                      </p>
                    </div>
                    <h3 className="text-2xl font-black leading-tight text-white">
                      {visibleOffer.title ||
                        `On-Demand ${role || "Professional"} Booking`}
                    </h3>
                    <p className="mt-1 text-xl font-bold text-white">
                      {visibleOffer.groundName || "Selected Venue"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={() =>
                        activeOffer && handleAcceptOffer(activeOffer.offerId)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-[#BFF367] px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_0_18px_rgba(191,243,103,0.55)] transition-all hover:bg-[#CCFF00]"
                    >
                      <CheckCircle size={17} fill="currentColor" />
                      Accept Booking
                    </button>
                    <button
                      onClick={() =>
                        activeOffer && handleRejectOffer(activeOffer.offerId)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/60 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-red-300 shadow-[0_0_18px_rgba(248,113,113,0.2)] transition-all hover:bg-red-500/20"
                    >
                      <X size={17} />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
