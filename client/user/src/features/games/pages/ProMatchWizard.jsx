import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import SlotPickerPopup from "@components/SlotPickerPopup";
import MaterialDateTimePicker from "../../../shared/components/MaterialDateTimePicker";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  Search,
  Coins,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Trash2,
  Plus,
  Minus,
  ImageIcon,
  ChevronDown,
  Mail,
  ShieldAlert,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { useGetMyTeamsQuery } from "@redux/api/teamApi";
import CoinAnimation from "@components/CoinAnimation";
import { searchLocations, formatLocation } from "@utils/locationService";
import LocationVenuePicker from "../../../shared/components/modals/LocationVenuePicker";
import { Button, Input, Select, Textarea } from "@kridaz/ui";
import { useRef } from "react";


const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const MOCK_TEAM_IMAGES = [
  {
    label: "Stadium Night",
    url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
  },
  {
    label: "Football Arena",
    url: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80",
  },
  {
    label: "Cricket Venue",
    url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
  },
  {
    label: "Indoor Court",
    url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
  },
  {
    label: "Night Match",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
  },
  {
    label: "Floodlit Pitch",
    url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
  },
  {
    label: "Basketball",
    url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  },
  {
    label: "Running Track",
    url: "https://images.unsplash.com/photo-1564769610726-59cead6a6f8f?w=800&q=80",
  },
];

const SPORT_DEFAULTS = {
  Cricket: [
    { role: "Batsman", count: 4 },
    { role: "Bowler", count: 4 },
    { role: "All-rounder", count: 2 },
    { role: "Wicket Keeper", count: 1 },
  ],
  Football: [
    { role: "Forward", count: 3 },
    { role: "Midfielder", count: 3 },
    { role: "Defender", count: 4 },
    { role: "GK", count: 1 },
  ],
  Basketball: [
    { role: "Guard", count: 2 },
    { role: "Forward", count: 2 },
    { role: "Center", count: 1 },
  ],
  Volleyball: [
    { role: "Attacker", count: 2 },
    { role: "Setter", count: 1 },
    { role: "Blocker", count: 2 },
    { role: "Libero", count: 1 },
  ],
  Badminton: [{ role: "Player", count: 2 }],
  Tennis: [{ role: "Player", count: 2 }],
  "Table Tennis": [{ role: "Player", count: 2 }],
  Pickleball: [{ role: "Player", count: 2 }],
};
const SPORT_ICONS = {
  Cricket: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M25 75 L65 35 M30 80 L70 40 M30 80 A5 5 0 0 1 25 75" />
      <path d="M65 35 L70 40" strokeWidth="3" />
      <path d="M67 37 L82 22 M68 38 L83 23" />
      <path d="M82 22 L83 23" />
      <path d="M71 33 L73 35 M74 30 L76 32 M77 27 L79 29" />
      <circle cx="65" cy="70" r="7" />
      <path d="M58 70 A7 7 0 0 1 72 70" strokeDasharray="2,2" />
    </svg>
  ),
  Football: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="35" />
      <path
        d="M50 38 L60 45 L56 57 L44 57 L40 45 Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M50 38 L50 15 M60 45 L82 38 M56 57 L72 78 M44 57 L28 78 M40 45 L18 38" />
      <path d="M50 15 L38 20 M50 15 L62 20" />
      <path d="M82 38 L85 50 M82 38 L80 26" />
      <path d="M72 78 L60 83 M72 78 L81 68" />
      <path d="M28 78 L40 83 M28 78 L19 68" />
      <path d="M18 38 L20 26 M18 38 L15 50" />
    </svg>
  ),
  Basketball: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="35" />
      <path d="M15 50 H85 M50 15 V85" />
      <path d="M25 25 Q50 50 25 75 M75 25 Q50 50 75 75" />
    </svg>
  ),
  Volleyball: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="35" />
      <path d="M50 50 Q30 25 50 15" />
      <path d="M50 50 Q70 25 50 15" />
      <path d="M50 50 Q75 60 83 40" />
      <path d="M50 50 Q65 75 83 40" />
      <path d="M50 50 Q25 65 17 45" />
      <path d="M50 50 Q35 75 17 45" />
      <path d="M32 30 Q45 23 48 16" />
      <path d="M68 30 Q55 23 52 16" />
      <path d="M70 65 Q78 52 82 43" />
      <path d="M60 77 Q68 64 72 58" />
      <path d="M30 65 Q22 52 18 43" />
      <path d="M40 77 Q32 64 28 58" />
    </svg>
  ),
  Badminton: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M42 62 A12 12 0 0 0 58 62 Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M42 62 C42 72 58 72 58 62" />
      <path d="M42 62 L32 25 H68 L58 62" />
      <path d="M47 62 L41 25" />
      <path d="M50 62 L50 25" />
      <path d="M53 62 L59 25" />
      <path d="M37 44 Q50 48 63 44" />
      <path d="M35 34 Q50 38 65 34" />
    </svg>
  ),
  Tennis: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="35" />
      <path d="M22 35 Q50 50 22 65 M78 35 Q50 50 78 65" />
    </svg>
  ),
  "Table Tennis": (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="45" cy="45" r="22" fill="currentColor" fillOpacity="0.1" />
      <path d="M60 60 L78 78 A4 4 0 0 1 72 84 L54 66 M54 66 L60 60" />
      <path d="M40 61 Q45 55 52 50" />
      <circle cx="68" cy="40" r="7" />
      <path d="M64 36 A7 7 0 0 1 72 44" strokeWidth="1" />
    </svg>
  ),
  Pickleball: (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="35" />
      <circle cx="50" cy="30" r="2.5" fill="currentColor" />
      <circle cx="50" cy="70" r="2.5" fill="currentColor" />
      <circle cx="30" cy="50" r="2.5" fill="currentColor" />
      <circle cx="70" cy="50" r="2.5" fill="currentColor" />
      <circle cx="37" cy="37" r="2.5" fill="currentColor" />
      <circle cx="63" cy="37" r="2.5" fill="currentColor" />
      <circle cx="37" cy="63" r="2.5" fill="currentColor" />
      <circle cx="63" cy="63" r="2.5" fill="currentColor" />
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
    </svg>
  ),
};

const SPORT_CONFIGS = {
  Cricket: {
    formats: ["T20", "ODI", "Test", "Box Cricket", "Other"],
    ballTypes: ["Leather", "Tennis", "Tape", "Other"],
    groundTypes: ["Turf", "Matting", "Cement", "Other"],
  },
  Football: {
    formats: ["5-a-side", "7-a-side", "11-a-side", "Other"],
    ballTypes: ["Standard (Size 5)", "Futsal", "Other"],
    groundTypes: ["Grass", "Artificial Turf", "Indoor", "Other"],
  },
  Basketball: {
    formats: ["3v3", "5v5", "Other"],
    ballTypes: ["Size 7", "Size 6", "Other"],
    groundTypes: ["Indoor Wood", "Outdoor Concrete", "Other"],
  },
  Tennis: {
    formats: ["Singles", "Doubles", "Other"],
    ballTypes: ["Standard", "Pressureless", "Other"],
    groundTypes: ["Hard", "Clay", "Grass", "Other"],
  },
};

const ProMatchWizard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useSelector((/** @type {any} */ state) => state.auth);
  const [step, setStep] = useState(parseInt(searchParams.get("step")) || 1);

  const updateStep = (newStep) => {
    setStep(newStep);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("step", newStep.toString());
        return params;
      },
      { replace: false }
    );
  };
  const [loading, setLoading] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSlotPicker, setActiveSlotPicker] = useState(null);

  // Coupon & Billing State
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Form State
  const storedData = JSON.parse(sessionStorage.getItem("hostGameData_pro"));
  const initialGameData = storedData
    ? {
      ...storedData,
      // Force wizard-specific defaults to prevent cross-wizard contamination
      requestType: "MATCH",
      gameMode: "PROFESSIONAL",
      quickPlayerCount: storedData.quickPlayerCount || 2,
      splitCostWithMultiplePlayers: storedData.splitCostWithMultiplePlayers || false,
      descriptionTags: storedData.descriptionTags || "",
      format: storedData.format || "",
      ballType: storedData.ballType || "",
      groundType: storedData.groundType || "",
      experienceLevel: storedData.experienceLevel || "Any",
      gameVibe: storedData.gameVibe || "Casual / Fun",
      autoApprovePlayers: storedData.autoApprovePlayers !== undefined ? storedData.autoApprovePlayers : true,
      genderPreference: storedData.genderPreference || "Co-ed (Mixed)",
      ageGroup: storedData.ageGroup || "Any Age",
      equipmentStatus: storedData.equipmentStatus || "Everyone brings their own",
      duration: storedData.duration || "120",
      name: storedData.name || "",
      maxMembers: storedData.maxMembers || 11,
      oversPerInnings: storedData.oversPerInnings || 20,
    }
    : {
      requestType: "MATCH",
      gameType: "",
      gameMode: "PROFESSIONAL", // QUICK, PROFESSIONAL, or HIRING
      date: "",
      time: "",
      duration: "120", // Default 2 hours
      name: "",
      maxMembers: 11,
      oversPerInnings: 20,
      quickPlayerCount: 2,
      splitCostWithMultiplePlayers: false,
      descriptionTags: "",
      format: "",
      ballType: "",
      groundType: "",
      experienceLevel: "Any",
      gameVibe: "Casual / Fun",
      autoApprovePlayers: true,
      genderPreference: "Co-ed (Mixed)",
      ageGroup: "Any Age",
      equipmentStatus: "Everyone brings their own",
      quickSlotsData: [],
      city: user?.city || "",
      state: user?.state || "",
      teamA: { name: "", slots: [], image: MOCK_TEAM_IMAGES[0].url },
      teamB: { name: "", slots: [], image: MOCK_TEAM_IMAGES[1].url },
      bookingId: "",
      matchPreferences: {
        budget: "",
        budgetType: "Per Match",
        requirements: "",
        isDateFlexible: false,
        isLocationFlexible: false,
        customLocation: "",
        lookingForRoles: [],
      },
    };
  const [gameData, setGameData] = useState(initialGameData);

  useEffect(() => {
    sessionStorage.setItem("hostGameData_pro", JSON.stringify(gameData));
  }, [gameData]);

  // Persist step across reloads if coming from URL
  useEffect(() => {
    const urlStep = searchParams.get("step");
    if (urlStep) {
      setStep(parseInt(urlStep));
    }
    const urlReqType = searchParams.get("requestType");
    const urlBookingId = searchParams.get("bookingId");
    const urlTurfId = searchParams.get("turfId");
    if (urlReqType) {
      setGameData((prev) => ({
        ...prev,
        requestType: urlReqType,
        bookingId: urlBookingId || prev.bookingId,
        groundId: urlTurfId || prev.groundId,
        gameMode: urlReqType === "MATCH" ? prev.gameMode : "QUICK",
      }));
    }
  }, [searchParams]);

  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedUmpire, setSelectedUmpire] = useState(null);

  // Location dropdown state
  // Location Autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const locationRef = useRef(null);

  // Custom Umpire Modal
  const [showCustomUmpireModal, setShowCustomUmpireModal] = useState(false);
  const [customUmpireData, setCustomUmpireData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Clock picker state
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showEndDateTimePicker, setShowEndDateTimePicker] = useState(false);
  const [showClock, setShowClock] = useState(false); // Legacy, can be removed later
  const [clockHour, setClockHour] = useState(9);
  const [clockMinute, setClockMinute] = useState(0);
  const [clockAmPm, setClockAmPm] = useState("AM");

  const displayFullDateTime = () => {
    if (gameData.date && gameData.time) {
      const d = new Date(`${gameData.date}T${gameData.time}`);
      return (
        d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) + `, ${gameData.time} local time`
      );
    }
    return "Select Date & Time";
  };

  // Team Fill state
  const [showTeamFillModal, setShowTeamFillModal] = useState(false);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [fillingTeamKey, setFillingTeamKey] = useState(null); // 'teamA', 'teamB', or 'quick'
  const [activeTeamTab, setActiveTeamTab] = useState("teamA");
  const { data: teamsData } = useGetMyTeamsQuery();
  const myTeams = teamsData?.teams || [];

  const handleFillFromTeam = (team) => {
    if (fillingTeamKey === "quick") {
      const newSlots = [...gameData.quickSlotsData];
      let slotIdx = 1; // Start from slot 2 (index 1) as slot 1 is host

      team.members.forEach((member) => {
        if (slotIdx < newSlots.length && member.user?._id !== (user?.id || user?._id)) {
          if (member.user) {
            newSlots[slotIdx] = {
              ...newSlots[slotIdx],
              userId: member.user._id,
              name: member.user.name,
              profilePicture: member.user.profilePicture,
              status: "HELD",
            };
          } else {
            newSlots[slotIdx] = {
              ...newSlots[slotIdx],
              customPlayer: { name: member.name, email: member.email },
              status: "HELD",
            };
          }
          slotIdx++;
        }
      });
      setGameData({ ...gameData, quickSlotsData: newSlots });
    } else {
      // Professional mode
      const teamKey = fillingTeamKey;
      const otherTeamKey = teamKey === "teamA" ? "teamB" : "teamA";

      if (gameData[otherTeamKey].name === team.name) {
        toast.error("You cannot select the same team for both sides");
        return;
      }

      const newSlots = [...gameData[teamKey].slots];
      let slotIdx = 0;

      team.members.forEach((member) => {
        if (slotIdx >= newSlots.length) {
          newSlots.push({ role: "Player", status: "OPEN" });
        }
        if (member.user) {
          newSlots[slotIdx] = {
            ...newSlots[slotIdx],
            userId: member.user._id,
            name: member.user.name,
            status: "HELD",
          };
        } else {
          newSlots[slotIdx] = {
            ...newSlots[slotIdx],
            customPlayer: { name: member.name, email: member.email },
            status: "HELD",
          };
        }
        slotIdx++;
      });
      setGameData({
        ...gameData,
        [teamKey]: {
          ...gameData[teamKey],
          slots: newSlots,
          name: team.name,
          image: team.logo || gameData[teamKey].image,
          logo: team.logo || null,
          imageName: team.logo ? "Team Logo" : null,
        },
      });
    }
    setShowTeamFillModal(false);
    toast.success(`Slots filled from ${team.name}`);
  };

  const formatTime = (h, m, ampm) => {
    const hour24 = ampm === "PM" ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const displayTime = (h, m, ampm) => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const normalizeString = (str) => {
    return str
      ? str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
      : "";
  };

  useEffect(() => {
    setMounted(true);

    // Check for popup trigger in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("popup") === "customUmpire") {
      setShowCustomUmpireModal(true);
    }

    const initLocation = async () => {
      setLoadingStates(true);
      const statesData = await fetchStates();
      setStates(statesData);
      setLoadingStates(false);

      if (user?.city || user?.state) {
        setGameData((prev) => ({
          ...prev,
          city: user?.city || prev.city,
          state: user?.state || prev.state,
          customLocation: user?.city && user?.state ? `${user.city}, ${user.state}` : (prev.customLocation || "")
        }));
      }
    };

    initLocation();
  }, [user]);

  // Location Autocomplete Effect
  useEffect(() => {
    if (!gameData.customLocation || gameData.customLocation.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchLocations(gameData.customLocation);
        setLocationSuggestions(results);
        setShowLocationSuggestions(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gameData.customLocation]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (suggestion) => {
    const cityName = suggestion.city || suggestion.display_name.split(",")[0];
    const stateName = suggestion.state || "";
    const formatted = formatLocation(suggestion);
    setGameData({
      ...gameData,
      customLocation: formatted,
      city: cityName,
      state: stateName
    });
    setShowLocationSuggestions(false);
  };


  // Handle return from Venue/Professional selection
  useEffect(() => {
    const urlGroundId = searchParams.get("groundId");
    const urlUmpireId = searchParams.get("umpireId");
    const urlDate = searchParams.get("date");
    const urlTime = searchParams.get("time");

    if (
      urlGroundId &&
      (!selectedGround || selectedGround._id !== urlGroundId)
    ) {
      axiosInstance
        .get(`/api/user/turf/details/${urlGroundId}`)
        .then((res) => {
          const turf = res.data.turf || res.data;
          setSelectedGround(turf);
          setGameData((prev) => ({
            ...prev,
            groundId: turf._id,
            date: urlDate
              ? new Date(urlDate).toISOString().split("T")[0]
              : prev.date,
            time: urlTime || prev.time,
            groundPrice: searchParams.get("price")
              ? Number(searchParams.get("price"))
              : turf.pricePerHour,
            isPlatformBooking: !!searchParams.get("price"),
          }));
        })
        .catch((err) => console.error("Error fetching venue details:", err));
    }

    if (
      urlUmpireId &&
      (!selectedUmpire || selectedUmpire._id !== urlUmpireId)
    ) {
      axiosInstance
        .get(
          `/api/professional/details/${urlUmpireId}?date=${urlDate || new Date().toISOString()}`
        )
        .then((res) => {
          const pro = res.data.professional;
          setSelectedUmpire(pro);
          setGameData((prev) => ({
            ...prev,
            umpireId: pro._id,
            date: urlDate
              ? new Date(urlDate).toISOString().split("T")[0]
              : prev.date,
            time: urlTime || prev.time,
          }));
        })
        .catch((err) =>
          console.error("Error fetching professional details:", err)
        );
    }
  }, [searchParams, selectedGround, selectedUmpire]);

  const isStandalonePost =
    gameData.gameMode === "HIRING" ||
    [
      "GBNO",
      "LOOKING_FOR_TEAM",
      "NEED_UMPIRE",
      "NEED_SCORER",
      "NEED_STREAMER",
      "NEED_COACH",
      "NET_BOWLERS",
      "PRACTICE",
    ].includes(gameData.requestType);

  const groundCost =
    isStandalonePost || !gameData.isPlatformBooking
      ? 0
      : (gameData.date && gameData.time)
        ? gameData.groundPrice !== undefined
          ? gameData.groundPrice
          : selectedGround?.pricePerHour || 0
        : 0;
  const subTotal = groundCost + (selectedUmpire?.price || 0);
  const discountAmount = couponData?.discountAmount || 0;
  const platformFee = couponData
    ? couponData.platformFee
    : (subTotal - discountAmount) * 0.015;
  const totalCost = couponData
    ? couponData.finalCost
    : isStandalonePost
      ? 0
      : subTotal > 0
        ? subTotal - discountAmount + platformFee
        : 0;

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await axiosInstance.post("/api/hosted-game/validate-coupon", {
        code: couponCode,
        groundCost: groundCost,
        umpireCost: selectedUmpire?.price || 0,
      });
      if (res.data.success) {
        setCouponData(res.data.coupon);
        toast.success("Coupon applied successfully");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      setCouponData(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const initSlots = (sport) => {
    const defaults = SPORT_DEFAULTS[sport] || [{ role: "Player", count: 5 }];
    const slots = [];
    defaults.forEach((d) => {
      for (let i = 0; i < d.count; i++) {
        slots.push({ role: d.role, status: "OPEN" });
      }
    });

    setGameData((prev) => ({
      ...prev,
      gameType: sport,
      teamA: { ...prev.teamA, slots: [...slots] },
      teamB: { ...prev.teamB, slots: [...slots] },
    }));
  };

  const initQuickSlots = () => {
    const slots = [];
    // First slot is always the host
    slots.push({
      role: "Player",
      userId: user?.id || user?._id,
      name: user?.name,
      profilePicture: user?.profilePicture,
      status: "JOINED",
    });

    // Remaining slots are open
    for (let i = 1; i < gameData.quickPlayerCount; i++) {
      slots.push({ role: "Player", status: "OPEN" });
    }

    setGameData((prev) => ({ ...prev, quickSlotsData: slots }));
  };

  const handleSlotSelection = (player) => {
    if (!activeSlotPicker) return;
    const { idx } = activeSlotPicker;

    const newSlots = [...gameData.quickSlotsData];
    if (player.isCustom) {
      newSlots[idx] = {
        ...newSlots[idx],
        customPlayer: { name: player.name || "Guest", email: player.email },
        status: "HELD",
      };
    } else {
      newSlots[idx] = {
        ...newSlots[idx],
        userId: player._id,
        name: player.name,
        profilePicture: player.profilePicture,
        status: "HELD",
      };
    }

    setGameData({ ...gameData, quickSlotsData: newSlots });
    setActiveSlotPicker(null);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const isFlexible = gameData.matchPreferences?.isDateFlexible;
      const finalDate =
        isFlexible && (!gameData.date || gameData.date === "Invalid Date")
          ? new Date().toISOString()
          : gameData.date;
      const finalTime = isFlexible && !gameData.time ? "TBD" : gameData.time;

      let finalEndTime = null;
      if (finalTime && finalTime !== "TBD" && gameData.duration) {
        try {
          const [hours, minutes] = finalTime.split(":").map(Number);
          const totalMins = hours * 60 + minutes + parseInt(gameData.duration);
          const endHours = Math.floor(totalMins / 60) % 24;
          const endMins = totalMins % 60;
          finalEndTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
        } catch (e) {
           console.error("Error calculating end time", e);
        }
      }

      let finalTeamB = { ...gameData.teamB };
      if (
        (gameData.gameMode === "PRO" || gameData.gameMode === "PROFESSIONAL") &&
        (!finalTeamB.slots || finalTeamB.slots.length === 0)
      ) {
        finalTeamB.slots = Array(gameData.maxMembers || 11).fill({ role: "Player", status: "OPEN" });
      }

      const payload = {
        ...gameData,
        teamB: finalTeamB,
        date: finalDate,
        time: finalTime,
        endTime: finalEndTime,
        groundId: gameData.groundId || null, // Prevent stale IDs from causing backend cost mismatch
        isPlatformBooking: !!gameData.isPlatformBooking,
        ...(gameData.gameMode === "QUICK"
          ? {
            teamA: {
              ...gameData.teamA,
              name: "Casual Pool",
            },
            groundId: null,
            groundPrice: 0,
            umpireId: null,
            streamerId: null,
          }
          : {}),
        couponCode: couponData ? couponCode : undefined,
        customUmpireData: customUmpireData.name ? customUmpireData : undefined,
      };
      const res = await axiosInstance.post("/api/hosted-game/create", payload);
      if (res.data.success) {
        // Send automated chat invites to invited users
        const invitedUserIds = [];
        if (gameData.gameMode === "QUICK") {
          gameData.quickSlotsData.forEach((slot) => {
            if (
              slot.userId &&
              slot.userId !== (user?.id || user?._id) &&
              slot.status === "HELD"
            ) {
              invitedUserIds.push(slot.userId);
            }
          });
        } else {
          ["teamA", "teamB"].forEach((teamKey) => {
            gameData[teamKey].slots.forEach((slot) => {
              if (
                slot.userId &&
                slot.userId !== (user?.id || user?._id) &&
                slot.status === "HELD"
              ) {
                invitedUserIds.push(slot.userId);
              }
            });
          });
        }

        if (invitedUserIds.length > 0) {
          const inviteLink = `${window.location.origin}/game/${res.data.game.id}`;
          const messageContent = `Hey! I've invited you to join a game. Click here to confirm your slot: ${inviteLink}`;
          try {
            await axiosInstance.post("/api/chat/message/broadcast", {
              content: messageContent,
              userIds: invitedUserIds,
            });
          } catch (e) {
            console.error("Failed to send auto-invites in chat", e);
          }
        }

        setShowCoinAnim(true);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create game";
      toast.error(errorMsg);
      if (
        errorMsg.toLowerCase().includes("insufficient coins") ||
        errorMsg.toLowerCase().includes("insufficient wallet balance")
      ) {
        navigate("/wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  const addSlot = (teamKey) => {
    const newSlots = [
      ...gameData[teamKey].slots,
      { role: "Player", status: "OPEN" },
    ];
    setGameData({
      ...gameData,
      [teamKey]: { ...gameData[teamKey], slots: newSlots },
    });
  };

  const removeSlot = (teamKey, idx) => {
    const newSlots = gameData[teamKey].slots.filter((_, i) => i !== idx);
    setGameData({
      ...gameData,
      [teamKey]: { ...gameData[teamKey], slots: newSlots },
    });
  };

  const updateSlotRole = (teamKey, idx, role) => {
    const newSlots = [...gameData[teamKey].slots];
    newSlots[idx].role = role;
    setGameData({
      ...gameData,
      [teamKey]: { ...gameData[teamKey], slots: newSlots },
    });
  };

  const handleTeamImageUpload = (teamKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setGameData((prev) => ({
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          image: ev.target.result,
          imageName: file.name,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full bg-background text-white pt-4 pb-4 px-3 sm:px-6">
      <div
        className={`max-w-4xl mx-auto transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        {/* Header */}
        <div className="hidden sm:flex items-center justify-between mb-4 gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] sm:text-3xl xl:text-4xl 2xl:text-5xl font-black mb-1 sm:mb-2 tracking-tight font-open-sans normal-case truncate">
              Host a Match
            </h1>
            <p
              className="text-xs sm:text-[14px] text-white/70 truncate sm:truncate-none sm:whitespace-normal whitespace-nowrap"
              style={SUBHEADING_STYLE}
            >
              Create a game and find players in your area
            </p>
          </div>
          <div className="hidden md:flex gap-2 shrink-0">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= s ? "bg-gradient-to-r from-secondary to-primary" : "bg-card"}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Game Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 max-w-3xl mx-auto py-2"
          >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 pt-5 border-t border-white/10 mt-5"
              >
                {/* Match Title */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                    <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                      Match Title
                    </label>
                  </div>
                  <Input
                    type="text"
                    placeholder="e.g. Sunday League Final (Optional)"
                    value={gameData.name || ""}
                    onChange={(e) => setGameData({ ...gameData, name: e.target.value })}
                    className="w-full bg-background border border-white/10 hover:border-cyan-400/60 rounded-[16px] py-3 px-4 text-sm text-white focus:border-cyan-400 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                      <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                        Select Sport
                      </label>
                    </div>

                    {/* Dropdown Toggle Button */}
                    <Button
                      onClick={() =>
                        setIsSportDropdownOpen(!isSportDropdownOpen)
                      }
                      className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-cyan-400/60 rounded-[16px] py-2.5 px-3 text-[11px] font-bold transition-all text-white mb-3"
                    >
                      <div className="flex items-center gap-3">
                        {gameData.gameType ? (
                          <>
                            <div className="w-5 h-5 flex items-center justify-center">
                              {SPORT_ICONS[gameData.gameType]}
                            </div>
                            <span>{gameData.gameType}</span>
                          </>
                        ) : (
                          <>
                            <Trophy size={18} className="text-cyan-400" />
                            <span className="text-white/70">
                              Select a Sport
                            </span>
                          </>
                        )}
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-white/70 transition-transform duration-300 ${isSportDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </Button>

                    <AnimatePresence>
                      {isSportDropdownOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {Object.keys(SPORT_DEFAULTS).map((sport) => (
                              <div
                                key={sport}
                                className={`rounded-[16px] p-[1.5px] transition-all duration-300 ${gameData.gameType === sport ? "bg-gradient-to-b from-secondary to-primary shadow-[0_0_15px_rgba(6,182,212,0.12)] scale-[1.015]" : "bg-card/40 hover:bg-neutral-700/40"}`}
                              >
                                <Button
                                  onClick={() => {
                                    initSlots(sport);
                                    setIsSportDropdownOpen(false);
                                  }}
                                  className={`w-full bg-background rounded-[16px] p-2.5 flex flex-col items-center justify-center gap-1.5 relative transition-all duration-300 group overflow-hidden ${gameData.gameType === sport ? "" : "hover:bg-card"}`}
                                >
                                  {/* Diagonal Corner Hover Glow Effects (Only when selected) */}
                                  {gameData.gameType === sport && (
                                    <>
                                      <div className="absolute top-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.22),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tl-[14px]" />
                                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_bottom_right,rgba(163,230,53,0.22),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-br-[14px]" />
                                    </>
                                  )}

                                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-colors group-hover:border-neutral-750 bg-black/40 z-10">
                                    {SPORT_ICONS[sport] || (
                                      <Trophy className="text-white/70 w-5 h-5" />
                                    )}
                                  </div>

                                  <div className="flex flex-col items-center z-10">
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-widest transition-colors ${gameData.gameType === sport ? "text-white" : "text-white/70 group-hover:text-white"}`}
                                    >
                                      {sport}
                                    </span>
                                    {gameData.gameType === sport && (
                                      <div className="w-5 h-[2px] bg-gradient-to-r from-secondary to-primary mt-1.5 rounded-full" />
                                    )}
                                  </div>

                                  {gameData.gameType === sport && (
                                    <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-secondary to-primary text-background rounded-full p-0.5 flex items-center justify-center w-4 h-4 shadow-[0_0_10px_rgba(6,182,212,0.35)] z-10">
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4.5"
                                        className="w-2.5 h-2.5"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </div>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>

                  {gameData.isPlatformBooking ? (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                        <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                          Slot Details
                        </label>
                      </div>
                      <div className="flex flex-col gap-2 p-3 bg-card border border-white/10 rounded-[16px]">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Date</span>
                          <span className="text-[11px] font-bold text-white">
                            {gameData.date ? new Date(gameData.date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Time</span>
                          <span className="text-[11px] font-bold text-white">
                            {gameData.time || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Slot Price</span>
                          <span className="text-[11px] font-bold text-cyan-400">
                            ₹{gameData.groundPrice || selectedGround?.pricePerHour || 0}
                          </span>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                        <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                          Start & End Time Selection
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 relative">
                        <Button
                          type="button"
                          onClick={() => setShowDateTimePicker(true)}
                          className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-cyan-400/60 rounded-[16px] py-2.5 px-3 text-[11px] font-bold transition-all text-white h-[42px]"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Calendar size={18} className="text-cyan-400 flex-shrink-0" />
                            <span
                              className={`truncate ${gameData.date && gameData.time ? "text-white" : "text-white/70"}`}
                            >
                              {gameData.date && gameData.time ? `${gameData.date} ${gameData.time}` : "Select"}
                            </span>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowEndDateTimePicker(true)}
                          className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-cyan-400/60 rounded-[16px] py-2.5 px-3 text-[11px] font-bold transition-all text-white h-[42px]"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Clock size={18} className="text-cyan-400 flex-shrink-0" />
                            <span
                              className={`truncate ${gameData.endDate && gameData.endTime ? "text-white" : "text-white/70"}`}
                            >
                              {gameData.endDate && gameData.endTime ? `${gameData.endDate} ${gameData.endTime}` : "Select End Time"}
                            </span>
                          </div>
                        </Button>

                        <MaterialDateTimePicker
                          isOpen={showDateTimePicker}
                          onClose={() => setShowDateTimePicker(false)}
                          initialDate={gameData.date || null}
                          initialTime={gameData.time || null}
                          onSelect={(date, time) => {
                            setGameData({ ...gameData, date, time });
                          }}
                        />
                        <MaterialDateTimePicker
                          isOpen={showEndDateTimePicker}
                          onClose={() => setShowEndDateTimePicker(false)}
                          initialDate={gameData.endDate || null}
                          initialTime={gameData.endTime || null}
                          onSelect={(endDate, endTime) => {
                            setGameData({ ...gameData, endDate, endTime });
                          }}
                        />
                      </div>
                    </section>
                  )}
                </div>

                <section className="space-y-4" ref={locationRef}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                    <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                      Search Location
                    </label>
                  </div>

                  {selectedGround ? (
                    <div className="p-4 sm:p-5 rounded-[16px] border border-primary/20 bg-primary/5">
                      <div className="flex gap-4 sm:gap-5">
                        <img
                          src={
                            selectedGround.images?.[0] ||
                            "https://via.placeholder.com/150"
                          }
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-sm sm:text-base mb-1 tracking-tight truncate">
                            {selectedGround.name}
                          </h3>
                          <p className="flex text-[10px] sm:text-[11px] text-white/70 mb-2 sm:mb-3 items-center gap-1 font-medium truncate">
                            <MapPin size={12} className="flex-shrink-0" /> <span className="truncate">{selectedGround.location || selectedGround.address || selectedGround.city}</span>
                          </p>
                          {gameData.isPlatformBooking && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {gameData.date && (
                                <span className="px-2 py-1 bg-background rounded text-[9px] sm:text-[10px] text-cyan-400 font-bold uppercase">
                                  {new Date(gameData.date).toLocaleDateString()}
                                </span>
                              )}
                              {gameData.time && (
                                <span className="px-2 py-1 bg-background rounded text-[9px] sm:text-[10px] text-lime-400 font-bold uppercase">
                                  {gameData.time}
                                </span>
                              )}
                            </div>
                          )}
                          <div className={`flex items-center mt-2 sm:mt-4 ${gameData.isPlatformBooking ? 'justify-between' : 'justify-end'}`}>
                            {gameData.isPlatformBooking && (gameData.date && gameData.time) && (
                              <span className="text-primary font-black text-xs sm:text-sm">
                                ₹
                                {gameData.groundPrice !== undefined
                                  ? gameData.groundPrice
                                  : selectedGround?.pricePerHour}
                              </span>
                            )}
                            <Button
                              onClick={() => {
                                setSearchParams((prev) => {
                                  const params = new URLSearchParams(prev);
                                  params.delete("groundId");
                                  params.delete("price");
                                  params.delete("date");
                                  params.delete("time");
                                  return params;
                                }, { replace: true });
                                setSelectedGround(null);
                                setGameData({ ...gameData, groundId: null });
                              }}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background text-white/70 hover:text-white rounded-[16px] text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(true)}
                        className="w-full bg-background border border-white/10 hover:border-cyan-400/60 rounded-[16px] py-4 pl-12 pr-4 text-left flex items-center justify-between transition-all group-hover:bg-white/5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                      >
                        <MapPin
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 z-10 transition-colors"
                          size={18}
                        />
                        <span className={`text-sm font-bold truncate pr-4 ${gameData.customLocation ? "text-white" : "text-white/40"}`}>
                          {gameData.customLocation || "Search for a venue or city..."}
                        </span>
                        <Search size={16} className="text-white/40 flex-shrink-0" />
                      </button>
                    </div>
                  )}

                  <LocationVenuePicker 
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onSelect={(data) => {
                      setSearchParams((prev) => {
                        const params = new URLSearchParams(prev);
                        params.delete("groundId");
                        params.delete("price");
                        params.delete("date");
                        params.delete("time");
                        return params;
                      }, { replace: true });
                      setGameData({
                        ...gameData,
                        customLocation: data.displayName,
                        city: data.city,
                        state: data.state,
                        groundId: data.type === 'VENUE' ? data.venueId : null,
                      });
                      if (data.type === 'VENUE' && data.venue) {
                        setSelectedGround(data.venue);
                      } else {
                        setSelectedGround(null);
                      }
                      setIsLocationModalOpen(false);
                    }}
                    onBookSlot={(venue) => {
                      const updatedGameData = {
                        ...gameData,
                        customLocation: venue.name,
                        city: venue.city,
                        state: venue.state,
                        groundId: venue.id || venue._id,
                      };
                      setGameData(updatedGameData);
                      sessionStorage.setItem("hostGameData_pro", JSON.stringify(updatedGameData));
                      navigate(`/venue/${venue.id || venue._id}?returnTo=${encodeURIComponent(`/host-game/pro?step=1&city=${venue.city}&state=${venue.state}`)}`);
                    }}
                  />
                </section>

                {gameData.requestType === "MATCH" && (
                  <section className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-3 bg-card border border-white/10 rounded-[16px] p-3 flex-1">
                        <Input
                          type="checkbox"
                          id="is-practice-match"
                          checked={gameData.matchPreferences?.isPracticeMatch || false}
                          onChange={(e) =>
                            setGameData({
                              ...gameData,
                              matchPreferences: {
                                ...gameData.matchPreferences,
                                isPracticeMatch: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded border-white/20 text-cyan-400 focus:ring-0 focus:ring-offset-0 bg-background"
                        />
                        <label
                          htmlFor="is-practice-match"
                          className="text-xs text-white font-bold cursor-pointer"
                        >
                          Is this a practice match?
                        </label>
                      </div>

                    </div>
                  </section>
                )}

                {/* Dynamic Sport Fields */}
                {gameData.gameType && SPORT_CONFIGS[gameData.gameType] && (
                  <section className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                      <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                        Match Specifications
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SPORT_CONFIGS[gameData.gameType].formats && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-white/50 uppercase">Match Format</label>
                          <Select
                            value={gameData.format || ""}
                            onChange={(e) => setGameData({ ...gameData, format: e.target.value })}
                            className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                          >
                            <option value="">Select Format</option>
                            {SPORT_CONFIGS[gameData.gameType].formats.map(fmt => (
                              <option key={fmt} value={fmt}>{fmt}</option>
                            ))}
                          </Select>
                        </div>
                      )}
                      {SPORT_CONFIGS[gameData.gameType].ballTypes && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-white/50 uppercase">Ball Type</label>
                          <Select
                            value={gameData.ballType || ""}
                            onChange={(e) => setGameData({ ...gameData, ballType: e.target.value })}
                            className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                          >
                            <option value="">Select Ball</option>
                            {SPORT_CONFIGS[gameData.gameType].ballTypes.map(bt => (
                              <option key={bt} value={bt}>{bt}</option>
                            ))}
                          </Select>
                        </div>
                      )}
                      {SPORT_CONFIGS[gameData.gameType].groundTypes && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-white/50 uppercase">Ground / Surface</label>
                          <Select
                            value={gameData.groundType || ""}
                            onChange={(e) => setGameData({ ...gameData, groundType: e.target.value })}
                            className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                          >
                            <option value="">Select Surface</option>
                            {SPORT_CONFIGS[gameData.gameType].groundTypes.map(gt => (
                              <option key={gt} value={gt}>{gt}</option>
                            ))}
                          </Select>
                        </div>
                      )}
                      {gameData.gameType === "Cricket" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-white/50 uppercase">Overs per Innings</label>
                          <Input
                            type="number"
                            min="1"
                            max="90"
                            value={gameData.oversPerInnings || 20}
                            onChange={(e) => setGameData({ ...gameData, oversPerInnings: parseInt(e.target.value) || 20 })}
                            className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Description / Custom Rules */}
                <section className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                    <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                      Description / Custom Rules
                    </label>
                  </div>
                  <Textarea
                    placeholder="Add any specific rules, match details, or custom instructions here..."
                    value={gameData.descriptionTags || ""}
                    onChange={(e) => setGameData({ ...gameData, descriptionTags: e.target.value })}
                    rows={3}
                    className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all resize-none"
                  />
                </section>

                {/* Player Preferences & Max Players */}
                <section className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                    <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                      Player Preferences & Squad Size
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50 uppercase">Max Players</label>
                      <Input
                        type="number"
                        min="2"
                        max="50"
                        value={gameData.maxMembers || 11}
                        onChange={(e) => setGameData({ ...gameData, maxMembers: parseInt(e.target.value) || 11 })}
                        className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50 uppercase">Experience</label>
                      <Select
                        value={gameData.experienceLevel || "Any"}
                        onChange={(e) => setGameData({ ...gameData, experienceLevel: e.target.value })}
                        className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                      >
                        <option value="Any">Any Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Professional">Professional</option>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50 uppercase">Gender</label>
                      <Select
                        value={gameData.genderPreference || "Co-ed (Mixed)"}
                        onChange={(e) => setGameData({ ...gameData, genderPreference: e.target.value })}
                        className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                      >
                        <option value="Co-ed (Mixed)">Co-ed (Mixed)</option>
                        <option value="Men Only">Men Only</option>
                        <option value="Women Only">Women Only</option>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50 uppercase">Age</label>
                      <Select
                        value={gameData.ageGroup || "Any Age"}
                        onChange={(e) => setGameData({ ...gameData, ageGroup: e.target.value })}
                        className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                      >
                        <option value="Any Age">Any</option>
                        <option value="Under 18">Under 18</option>
                        <option value="18-35">18-35</option>
                        <option value="35+">35+</option>
                      </Select>
                    </div>
                  </div>
                </section>

                {gameData.requestType === "LOOKING_FOR" && (
                  <section className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                      <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                        Roles You're Looking For
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Umpire", "Scorer", "Streamer", "Coach", "Bowlers", "Batters"].map((role) => {
                        const isSelected = gameData.matchPreferences?.lookingForRoles?.includes(role);
                        return (
                          <Button
                            key={role}
                            onClick={() => {
                              const currentRoles = gameData.matchPreferences?.lookingForRoles || [];
                              const newRoles = isSelected
                                ? currentRoles.filter(r => r !== role)
                                : [...currentRoles, role];
                              setGameData({
                                ...gameData,
                                matchPreferences: {
                                  ...gameData.matchPreferences,
                                  lookingForRoles: newRoles,
                                },
                              });
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                              isSelected
                                ? "bg-cyan-400/20 text-cyan-400 border-cyan-400"
                                : "bg-card border-white/10 text-white/70 hover:border-white/30"
                            }`}
                          >
                            {role}
                          </Button>
                        );
                      })}
                    </div>
                  </section>
                )}


                {gameData.gameMode === "HIRING" && (
                  <section className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[2.5px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                      <label className="text-[10px] font-bold text-white uppercase tracking-widest block">
                        Hiring Details
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-white/50 uppercase">
                          Budget (₹)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 1500"
                          value={gameData.matchPreferences?.budget || ""}
                          onChange={(e) =>
                            setGameData({
                              ...gameData,
                              matchPreferences: {
                                ...gameData.matchPreferences,
                                budget: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-white/50 uppercase">
                          Pay Rate
                        </label>
                        <Select
                          value={
                            gameData.matchPreferences?.budgetType || "Per Match"
                          }
                          onChange={(e) =>
                            setGameData({
                              ...gameData,
                              matchPreferences: {
                                ...gameData.matchPreferences,
                                budgetType: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all"
                        >
                          <option value="Per Match">Per Match</option>
                          <option value="Per Day">Per Day</option>
                          <option value="Per Hour">Per Hour</option>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50 uppercase">
                        Requirements / Notes
                      </label>
                      <Textarea
                        placeholder="e.g. Need experienced umpire for T20 final..."
                        rows={3}
                        value={gameData.matchPreferences?.requirements || ""}
                        onChange={(e) =>
                          setGameData({
                            ...gameData,
                            matchPreferences: {
                              ...gameData.matchPreferences,
                              requirements: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-sm text-white focus:border-secondary outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-card border border-white/10 rounded-[16px] p-3">
                      <Input
                        type="checkbox"
                        id="flex-date"
                        checked={
                          gameData.matchPreferences?.isDateFlexible || false
                        }
                        onChange={(e) =>
                          setGameData({
                            ...gameData,
                            matchPreferences: {
                              ...gameData.matchPreferences,
                              isDateFlexible: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-white/20 text-cyan-400 focus:ring-0 focus:ring-offset-0 bg-background"
                      />
                      <label
                        htmlFor="flex-date"
                        className="text-xs text-white font-bold cursor-pointer"
                      >
                        Date and Time are flexible / TBD
                      </label>
                    </div>
                  </section>
                )}

                
                {/* enues */}
              {gameData.requestType === "GBNO" ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-white/70 uppercase tracking-widest whitespace-nowrap">
                      Opponent Preference
                    </label>
                  </div>
                  <div className="bg-card border border-white/10 rounded-[16px] overflow-hidden">
                    <Button
                      onClick={() =>
                        setGameData({
                          ...gameData,
                          matchPreferences: {
                            ...gameData.matchPreferences,
                            gbnoPreference: "SPECIFIC_PLAYERS",
                          },
                        })
                      }
                      className={`w-full flex items-center justify-between p-4 transition-all ${gameData.matchPreferences?.gbnoPreference === "SPECIFIC_PLAYERS" ? "bg-primary/10 border-b border-primary/20" : "hover:bg-white/5 border-b border-white/5"}`}
                    >
                      <span className="text-sm font-bold text-white">
                        Specific number of players
                      </span>
                      {gameData.matchPreferences?.gbnoPreference ===
                        "SPECIFIC_PLAYERS" && (
                        <Trophy size={16} className="text-primary" />
                      )}
                    </Button>
                    <Button
                      onClick={() =>
                        setGameData({
                          ...gameData,
                          matchPreferences: {
                            ...gameData.matchPreferences,
                            gbnoPreference: "FULL_TEAM",
                          },
                        })
                      }
                      className={`w-full flex items-center justify-between p-4 transition-all ${gameData.matchPreferences?.gbnoPreference === "FULL_TEAM" ? "bg-primary/10" : "hover:bg-white/5"}`}
                    >
                      <span className="text-sm font-bold text-white">
                        Full opponent team
                      </span>
                      {gameData.matchPreferences?.gbnoPreference ===
                        "FULL_TEAM" && (
                        <Trophy size={16} className="text-primary" />
                      )}
                    </Button>
                  </div>
                </section>
              ) : null}

            {/* Pricing / Quick Settings Section */}
            {gameData.gameMode === "QUICK" && (
              <div className="bg-card border border-white/10 rounded-[16px] p-3 sm:p-4 shadow-xl shadow-black/30 mb-3">
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-[3px] h-[16px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                      <h3 className="text-xs font-black uppercase text-white tracking-wider">
                        Quick Game Settings
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-background p-2.5 rounded-[16px] border border-white/10 justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black uppercase text-white/70 tracking-wider">
                            Total Players
                          </span>
                          <span className="text-[8px] text-white/70 font-medium">
                            Pool including you
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            onClick={() =>
                              setGameData((prev) => ({
                                ...prev,
                                quickPlayerCount: Math.max(
                                  2,
                                  prev.quickPlayerCount - 1
                                ),
                              }))
                            }
                            className="w-5 h-5 rounded-full bg-card border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                          >
                            <Minus size={14} />
                          </Button>
                          <span className="text-lg font-black text-white w-6 text-center select-none tabular-nums">
                            {gameData.quickPlayerCount || 2}
                          </span>
                          <Button
                            type="button"
                            onClick={() =>
                              setGameData((prev) => ({
                                ...prev,
                                quickPlayerCount: Math.min(
                                  22,
                                  prev.quickPlayerCount + 1
                                ),
                              }))
                            }
                            className="w-5 h-5 rounded-full bg-card border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Split Cost Toggle */}
                      <div className="flex items-center justify-between bg-background p-3 rounded-[16px] border border-white/10">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black uppercase text-white/70 tracking-wider">
                            Split Cost
                          </span>
                          <span className="text-[8px] text-white/50 font-medium mt-0.5">
                            Divide venue price among players
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gameData.splitCostWithMultiplePlayers}
                            onChange={(e) =>
                              setGameData({ ...gameData, splitCostWithMultiplePlayers: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      {/* Experience Level */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-white/70 tracking-wider px-1">
                          Experience Level
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["Any", "Beginner", "Intermediate", "Advanced"].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setGameData({ ...gameData, experienceLevel: level })}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${gameData.experienceLevel === level ? "bg-primary text-white border-primary" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"} border`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-white/70 tracking-wider px-1">
                          Description
                        </span>
                        <textarea
                          rows="3"
                          placeholder="Add detailed description, rules, or anything else..."
                          className="w-full bg-background border border-white/10 rounded-[12px] p-3 text-[11px] text-white focus:border-primary/50 focus:outline-none transition-colors resize-none"
                          value={gameData.descriptionTags}
                          onChange={(e) => setGameData({ ...gameData, descriptionTags: e.target.value })}
                        />
                      </div>

                      <div className="h-px w-full bg-white/10 my-2"></div>

                      {/* Game Vibe / Intensity */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-white/70 tracking-wider px-1">
                          Game Vibe / Intensity
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["Casual / Fun", "Competitive", "Practice / Drills"].map((vibe) => (
                            <button
                              key={vibe}
                              type="button"
                              onClick={() => setGameData({ ...gameData, gameVibe: vibe })}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${gameData.gameVibe === vibe ? "bg-primary text-white border-primary" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"} border`}
                            >
                              {vibe}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gender Preference */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-white/70 tracking-wider px-1">
                          Gender Preference
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["Co-ed (Mixed)", "Men Only", "Women Only"].map((pref) => (
                            <button
                              key={pref}
                              type="button"
                              onClick={() => setGameData({ ...gameData, genderPreference: pref })}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${gameData.genderPreference === pref ? "bg-primary text-white border-primary" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"} border`}
                            >
                              {pref}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Age Group Restriction & Equipment Status (Side by side) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-black uppercase text-white/70 tracking-wider px-1">
                            Age Group
                          </span>
                          <select
                            value={gameData.ageGroup}
                            onChange={(e) => setGameData({ ...gameData, ageGroup: e.target.value })}
                            className="w-full bg-background border border-white/10 rounded-[12px] p-2.5 text-[11px] text-white focus:border-primary/50 focus:outline-none transition-colors appearance-none"
                          >
                            <option value="Any Age">Any Age</option>
                            <option value="Under 18">Under 18</option>
                            <option value="18 - 35">18 - 35</option>
                            <option value="35+">35+</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-black uppercase text-white/70 tracking-wider px-1">
                            Equipment
                          </span>
                          <select
                            value={gameData.equipmentStatus}
                            onChange={(e) => setGameData({ ...gameData, equipmentStatus: e.target.value })}
                            className="w-full bg-background border border-white/10 rounded-[12px] p-2.5 text-[11px] text-white focus:border-primary/50 focus:outline-none transition-colors appearance-none"
                          >
                            <option value="Everyone brings their own">Bring your own</option>
                            <option value="Provided by host / venue">Provided</option>
                          </select>
                        </div>
                      </div>

                      {/* Auto-Approve Players Toggle */}
                      <div className="flex items-center justify-between bg-background p-3 rounded-[16px] border border-white/10 mt-1">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black uppercase text-white/70 tracking-wider">
                            Auto-Approve Players
                          </span>
                          <span className="text-[8px] text-white/50 font-medium mt-0.5">
                            Instantly accept join requests
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gameData.autoApprovePlayers}
                            onChange={(e) =>
                              setGameData({ ...gameData, autoApprovePlayers: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                    </div>
                  </div>
                  <div className="text-center py-2.5 px-3 bg-primary/5 border border-primary/10 rounded-[16px] mt-4 md:mt-0">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                      You + {gameData.quickPlayerCount - 1} Players Pool
                    </span>
                  </div>
                </div>
              </div>
            )}

                <div className="flex gap-3 pt-4 mt-4">
                  <Button
                    onClick={() => {
                      sessionStorage.removeItem("hostGameData_pro");
                      navigate("/host-game");
                    }}
                    className="flex-1 py-3 sm:py-3.5 bg-card text-white/70 font-bold rounded-[16px] sm:rounded-[16px] border border-white/10 hover:border-white/10 transition-all duration-300 text-sm sm:text-base font-open-sans uppercase tracking-wider"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (
                        gameData.requestType === "LOOKING_FOR" ||
                        gameData.gameMode === "HIRING"
                      ) {
                        handleCreateGame();
                      } else if (gameData.gameMode === "QUICK") {
                        initQuickSlots();
                        updateStep(3);
                      } else {
                        updateStep(2);
                      }
                    }}
                    disabled={
                      (!gameData.gameMode &&
                        gameData.requestType === "MATCH") ||
                      !gameData.gameType ||
                      (!gameData.matchPreferences?.isDateFlexible &&
                        (!gameData.date || !gameData.time)) ||
                      !gameData.city ||
                      !gameData.state ||
                      loading ||
                      (gameData.gameMode === "HIRING" &&
                        (!gameData.matchPreferences?.budget ||
                          !gameData.matchPreferences?.requirements))
                    }
                    className="flex-[2] h-[40px] sm:h-[40px] bg-gradient-to-r from-secondary to-primary text-background font-bold rounded-[16px] sm:rounded-[16px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-xs sm:text-xs font-open-sans shadow-[0_8px_24px_rgba(191,243,103,0.15)] uppercase tracking-wider disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                  >
                    {loading
                      ? "WAIT..."
                      : gameData.requestType === "LOOKING_FOR" ||
                          gameData.gameMode === "HIRING"
                        ? "PUBLISH"
                        : "CONTINUE"}
                  </Button>
                </div>
              </motion.div>
          </motion.div>
        )}

        {/* Step 4: Setup (Professional) */}



        {/* Step 4: Team Configuration (Professional Only) */}
        {step === 2 && gameData.gameMode === "PROFESSIONAL" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            {/* Team Selection Tabs */}
            <div className="flex p-1 bg-card border border-white/10 rounded-[16px] max-w-sm mx-auto mb-3">
              {["teamA", "teamB"].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTeamTab(tab)}
                  className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[16px] transition-all relative ${
                    activeTeamTab === tab
                      ? "text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {activeTeamTab === tab && (
                    <motion.div
                      layoutId="activeTeamTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-secondary to-primary rounded-[16px]"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10">
                    {tab === "teamA" ? "Team A" : "Team B"}
                  </span>
                </Button>
              ))}
            </div>

            <div className="bg-card border border-white/10 rounded-[16px] p-4 sm:p-6 overflow-hidden">
              <AnimatePresence mode="wait">
                {[activeTeamTab].map((teamKey) => (
                  <motion.div
                    key={teamKey}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Team Header */}
                    <div className="flex items-center justify-between gap-5">
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-14 h-14 rounded-[16px] flex items-center justify-center font-black text-2xl overflow-hidden ${teamKey === "teamA" ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"}`}
                        >
                          {gameData[teamKey].logo ? (
                            <img
                              src={gameData[teamKey].logo}
                              alt="Team Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : teamKey === "teamA" ? (
                            "A"
                          ) : (
                            "B"
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1">
                            Team Name
                          </label>
                          <Input
                            className="bg-transparent text-2xl font-black border-none outline-none focus:ring-0 w-full p-0 tracking-tight"
                            placeholder={
                              teamKey === "teamA"
                                ? "Enter Home Team Name"
                                : "Enter Away Team Name"
                            }
                            value={gameData[teamKey].name}
                            onChange={(e) =>
                              setGameData({
                                ...gameData,
                                [teamKey]: {
                                  ...gameData[teamKey],
                                  name: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setFillingTeamKey(teamKey);
                          setShowTeamFillModal(true);
                        }}
                        className="px-4 h-[40px] bg-gradient-to-r from-secondary to-primary rounded-[16px] text-background font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
                        title="Add Team"
                      >
                        Add Team
                      </Button>
                    </div>

                    {/* Team Image Upload */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/70 uppercase tracking-widest block">
                        Card Background Image
                      </label>

                      {/* Preview + Upload Row */}
                      <div className="flex items-center gap-3">
                        {/* Preview */}
                        <div
                          className="relative w-28 h-18 shrink-0 rounded-[16px] overflow-hidden border border-white/10 bg-card"
                          style={{ height: "70px" }}
                        >
                          <img
                            src={gameData[teamKey].image}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>

                        {/* Upload button */}
                        <label
                          htmlFor={`img-upload-${teamKey}`}
                          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/30 rounded-[16px] cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                            <ImageIcon
                              size={16}
                              className="text-primary group-hover:text-primary transition-colors"
                            />
                          </div>
                          <span className="text-[10px] font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent uppercase tracking-widest">
                            {gameData[teamKey].imageName
                              ? "Change Photo"
                              : "Upload Photo"}
                          </span>
                          {gameData[teamKey].imageName && (
                            <span className="text-[8px] text-white/30 truncate max-w-[120px]">
                              {gameData[teamKey].imageName}
                            </span>
                          )}
                          <Input
                            id={`img-upload-${teamKey}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleTeamImageUpload(teamKey, e)}
                          />
                        </label>
                      </div>

                      {/* Quick-select presets */}
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                          Or choose a preset
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {MOCK_TEAM_IMAGES.map((img) => (
                            <Button
                              key={img.url}
                              onClick={() =>
                                setGameData((prev) => ({
                                  ...prev,
                                  [teamKey]: {
                                    ...prev[teamKey],
                                    image: img.url,
                                    imageName: null,
                                  },
                                }))
                              }
                              className={`relative rounded-[16px] overflow-hidden border-2 transition-all shrink-0 w-20 aspect-video ${gameData[teamKey].image === img.url ? "border-primary shadow-[0_0_10px_rgba(204,255,0,0.3)]" : "border-transparent hover:border-white/20"}`}
                            >
                              <img
                                src={img.url}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                              {gameData[teamKey].image === img.url && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <CheckCircle2
                                    size={14}
                                    className="text-primary"
                                  />
                                </div>
                              )}
                              <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-[6px] font-black text-white text-center py-0.5 uppercase">
                                {img.label}
                              </p>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="space-y-3">
                      {gameData[teamKey].slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className={`flex-1 flex items-center gap-3 bg-card border ${slot.userId || slot.customPlayer ? "border-primary/50 bg-primary/5" : "border-white/10"} p-4 rounded-[16px] group-hover:border-primary/30 transition-all`}
                          >
                            <Input
                              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none w-full"
                              value={slot.role}
                              onChange={(e) =>
                                updateSlotRole(teamKey, idx, e.target.value)
                              }
                            />
                            {slot.userId || slot.customPlayer ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[150px]">
                                  {slot.name ||
                                    slot.customPlayer?.name ||
                                    slot.customPlayer?.email}
                                </span>
                                <span className="text-[9px] font-black text-black uppercase tracking-tighter bg-primary px-2 py-1 rounded shrink-0">
                                  FILLED
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter bg-card px-2 py-1 rounded shrink-0">
                                OPEN
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              if (slot.userId || slot.customPlayer) {
                                const newSlots = [...gameData[teamKey].slots];
                                newSlots[idx] = {
                                  role: slot.role,
                                  status: "OPEN",
                                };
                                setGameData({
                                  ...gameData,
                                  [teamKey]: {
                                    ...gameData[teamKey],
                                    slots: newSlots,
                                  },
                                });
                              } else {
                                removeSlot(teamKey, idx);
                              }
                            }}
                            className="p-3 text-neutral-600 hover:text-red-500 transition-colors bg-card rounded-[16px] border border-white/10 shrink-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => addSlot(teamKey)}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-[16px] text-white/70 text-xs font-black uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2 bg-card/30"
                    >
                      <Plus size={16} /> Add More Slots
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => updateStep(1)}
                className="flex-1 h-[40px] flex items-center justify-center bg-card text-white/70 font-bold rounded-[16px] border border-white/10 hover:border-white/20 transition-all text-xs font-open-sans uppercase tracking-wider"
              >
                Back
              </Button>
              <Button
                onClick={() => updateStep(3)}
                className="flex-[2] h-[40px] bg-gradient-to-r from-secondary to-primary text-background font-bold rounded-[16px] hover:scale-[1.01] active:scale-[0.99] transition-all text-xs shadow-[0_8px_24px_rgba(191,243,103,0.15)] font-open-sans uppercase tracking-wider"
              >
                PREVIEW MATCH
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Preview & Finalize */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 max-w-xl mx-auto pb-24"
          >
            {/* Header Section */}
            <div className="text-center space-y-3 pb-6 border-b border-white/10">
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-[4px] uppercase tracking-widest font-inter inline-block border border-primary/20">
                {gameData.gameMode === "QUICK"
                  ? "Quick Game"
                  : "Professional Match"}
              </span>
              <h2 className="text-xl font-black tracking-tight font-open-sans uppercase text-white">
                {gameData.gameType} Battle
              </h2>
              <div className="flex justify-center items-center gap-3 text-white/70 font-bold text-[11px] uppercase tracking-widest font-inter">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />{" "}
                  {gameData.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" /> {gameData.time}
                </span>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-card border border-white/10 p-3 sm:p-4 rounded-[16px] flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-card/80 rounded-[16px] flex items-center justify-center shrink-0 border border-white/10/50">
                <MapPin className="text-primary w-5 h-5" />
              </div>
              <div className="min-w-0 w-full text-left flex-1">
                <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mb-1 font-inter">
                  Selected Venue
                </p>
                <p className="font-black text-sm sm:text-base text-white truncate leading-none font-open-sans uppercase">
                  {selectedGround?.name || "Self-Arranged"}
                </p>
                <p className="text-xs text-white/70 mt-1.5 font-medium italic font-inter truncate">
                  {selectedGround?.location || "Location to be decided"}
                </p>
              </div>
            </div>

            {/* Match Setup Details */}
            {gameData.gameMode === "QUICK" ? (
              <div className="p-5 bg-card border border-white/10 rounded-[16px] flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mb-1 font-inter">
                    Player Slots
                  </p>
                  <p className="font-black text-sm sm:text-base text-white uppercase font-open-sans">
                    Single Pool Match
                  </p>
                </div>
                <div className="flex items-center -space-x-2">
                  {Array.from({
                    length: Math.min(gameData.quickPlayerCount, 5),
                  }).map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-neutral-900 bg-card flex items-center justify-center text-primary"
                    >
                      <Users size={14} />
                    </div>
                  ))}
                  {gameData.quickPlayerCount > 5 && (
                    <div className="w-5 h-5 rounded-full border-2 border-neutral-900 bg-primary text-black flex items-center justify-center text-[10px] font-black font-inter">
                      +{gameData.quickPlayerCount - 5}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 bg-card border border-white/10 rounded-[16px] gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-[16px] bg-card overflow-hidden border border-white/10/50 shadow-lg">
                    <img
                      src={
                        gameData.teamA.image ||
                        "https://api.dicebear.com/7.x/initials/svg?seed=A"
                      }
                      alt="Team A"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider font-open-sans text-center truncate w-[80px]">
                    {gameData.teamA.name || "Team A"}
                  </span>
                </div>

                <div className="px-4 py-2 bg-card rounded-[4px] border border-white/10 text-xs font-black text-white/70 uppercase tracking-widest italic font-inter">
                  VS
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-[16px] bg-card overflow-hidden border border-white/10/50 shadow-lg">
                    <img
                      src={
                        gameData.teamB.image ||
                        "https://api.dicebear.com/7.x/initials/svg?seed=B"
                      }
                      alt="Team B"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider font-open-sans text-center truncate w-[80px]">
                    {gameData.teamB.name || "Team B"}
                  </span>
                </div>
              </div>
            )}

            {/* Entry Fee Setting */}
            <div className="bg-card border border-white/10 p-4 sm:p-5 rounded-[16px] flex items-center justify-between shadow-lg">
              <div className="space-y-1 text-left">
                <span className="text-xs font-black text-white/70 uppercase tracking-widest font-inter block">
                  Entry Charge per Player
                </span>
                <p className="text-[10px] text-white/50 font-medium italic font-inter">
                  Recommended: Total Cost ({totalCost}) / Total Players
                </p>
              </div>
              <div className="flex items-center gap-2 bg-black p-2 rounded-[16px] border border-white/10 shrink-0">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-[12px] flex items-center justify-center shrink-0">
                  <Coins className="text-yellow-500" size={20} />
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={gameData.perPlayerCharge || ""}
                  onChange={(e) =>
                    setGameData({
                      ...gameData,
                      perPlayerCharge: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-20 sm:w-24 bg-transparent border-none text-center font-black text-xl outline-none focus:ring-0 text-white"
                />
              </div>
            </div>

            {/* Billing Summary & Coupon */}
            {(totalCost > 0 || subTotal > 0) && (
            <div className="bg-card border border-white/10 rounded-[16px] overflow-hidden">
              <div className="p-3 border-b border-white/10/50 flex items-center gap-3 bg-card/20">
                <Receipt className="text-primary w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white font-open-sans">
                  Checkout Summary
                </h3>
              </div>

              <div className="p-3 space-y-3">
                <div className="space-y-3 text-sm font-medium text-white/70 font-inter">
                  <div className="flex justify-between items-center">
                    <span>Venue Cost</span>
                    <span className="text-white font-bold">
                      {subTotal} coins
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-primary">
                      <span>Discount Applied</span>
                      <span className="font-bold">-{discountAmount} coins</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Platform Fee (1.5%)</span>
                    <span className="text-white font-bold">
                      {platformFee.toFixed(2)} coins
                    </span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="pt-4 border-t border-white/10/50">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      disabled={!!couponData}
                      className="flex-1 bg-black border border-white/10 rounded-[16px] px-4 py-3 text-sm text-white font-bold outline-none focus:border-secondary uppercase tracking-wider disabled:opacity-50 transition-colors"
                    />
                    {!couponData ? (
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={applyingCoupon || !couponCode}
                        className="px-6 py-3 bg-card text-white font-black rounded-[16px] text-[11px] uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-50 transition-all font-inter"
                      >
                        {applyingCoupon ? "..." : "Apply"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setCouponData(null);
                          setCouponCode("");
                          setCouponError("");
                        }}
                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-[16px] text-[11px] uppercase tracking-widest hover:bg-red-500/20 transition-all font-inter"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-[10px] uppercase font-black tracking-widest mt-2">
                      {couponError}
                    </p>
                  )}
                  {couponData && (
                    <p className="text-primary text-[10px] uppercase font-black tracking-widest mt-2">
                      Coupon applied successfully!
                    </p>
                  )}
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-primary p-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-black/70 font-black uppercase tracking-widest font-inter mb-0.5">
                    Total Amount
                  </p>
                  <p className="text-xs text-black/70 font-bold font-inter italic">
                    To be reserved from wallet
                  </p>
                </div>
                <div className="flex items-center gap-2 text-black">
                  <Coins size={24} className="text-black" />
                  <span className="font-black text-2xl font-open-sans tracking-tight">
                    {totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => updateStep(gameData.gameMode === "QUICK" ? 1 : 2)}
                className="flex-[0.8] h-[40px] bg-card text-white/70 font-black rounded-[16px] border border-white/10 hover:border-white/10 hover:text-white transition-all text-[11px] uppercase tracking-widest font-open-sans flex items-center justify-center"
              >
                Back
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex-[2] h-[40px] bg-gradient-to-r from-secondary to-primary text-background font-bold rounded-[16px] hover:scale-[1.01] active:scale-[0.99] transition-all text-xs sm:text-xs font-open-sans uppercase tracking-widest shadow-[0_8px_24px_rgba(191,243,103,0.15)] flex justify-center items-center gap-3"
              >
                CONFIRM <ArrowRight size={20} />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showTeamFillModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamFillModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative bg-background border border-white/10 p-8 rounded-[16px] max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 blur-[100px] rounded-full" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-[16px] flex items-center justify-center">
                  <ShieldCheck size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Fill from Team
                  </h2>
                  <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mt-1">
                    Bulk slot assignment
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {myTeams.length > 0 ? (
                  myTeams.map((team) => (
                    <div
                      key={team._id}
                      onClick={() => handleFillFromTeam(team)}
                      className="p-4 bg-card border border-white/5 rounded-[16px] flex items-center justify-between group hover:border-yellow-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[16px] bg-card border border-white/5 overflow-hidden">
                          <img
                            src={
                              team.logo ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}`
                            }
                            alt={team.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs group-hover:text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary transition-colors">
                            {team.name}
                          </h4>
                          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">
                            {team.members?.length || 0} Members
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-gradient-to-r from-primary/10 to-primary/10 rounded-lg text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary group-hover:bg-gradient-to-r from-secondary to-primary group-hover:text-background transition-all">
                        <Plus size={16} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-4 bg-card rounded-[16px] border border-dashed border-white/10">
                    <ShieldAlert
                      className="mx-auto text-neutral-700"
                      size={48}
                    />
                    <div className="space-y-1">
                      <p className="text-sm text-white/70 font-medium italic">
                        No teams found in your profile
                      </p>
                      <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">
                        Create a team in the My Teams section first
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <p className="text-[10px] text-white/70 font-black uppercase tracking-widest text-center px-4">
                  Note: This will fill empty slots with team members. Host slot
                  will not be overwritten.
                </p>
                <Button
                  onClick={() => setShowTeamFillModal(false)}
                  className="w-full py-4 bg-card rounded-[16px] font-black text-[11px] uppercase tracking-widest text-white/70 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */ }
  {/* Slot Picker Popup */ }
      <SlotPickerPopup
        isOpen={!!activeSlotPicker}
        onClose={() => setActiveSlotPicker(null)}
        onSelect={handleSlotSelection}
        gameId={null} // Draft mode
        slotId={activeSlotPicker?.idx}
      />

      <AnimatePresence>
        {showCustomUmpireModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomUmpireModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative bg-background border border-white/10 p-8 rounded-[16px] max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-r from-primary/10 to-primary/10 blur-[100px] rounded-full" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-[16px] flex items-center justify-center">
                  <UserCheck size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Add Custom Umpire
                  </h2>
                  <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mt-1">
                    Inviting off-platform
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter umpire name"
                    value={customUmpireData.name}
                    onChange={(e) =>
                      setCustomUmpireData({
                        ...customUmpireData,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-card border-2 border-white/10 rounded-[16px] py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={customUmpireData.email}
                    onChange={(e) =>
                      setCustomUmpireData({
                        ...customUmpireData,
                        email: e.target.value,
                      })
                    }
                    className="w-full bg-card border-2 border-white/10 rounded-[16px] py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">
                    Phone Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={customUmpireData.phone}
                    onChange={(e) =>
                      setCustomUmpireData({
                        ...customUmpireData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full bg-card border-2 border-white/10 rounded-[16px] py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <Button
                  onClick={() => setShowCustomUmpireModal(false)}
                  className="flex-1 py-4 bg-card rounded-[16px] font-black text-[10px] uppercase tracking-widest text-white/70 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!customUmpireData.name || !customUmpireData.email}
                  onClick={() => {
                    setSelectedUmpire(null);
                    setGameData({ ...gameData, umpireId: null });
                    setShowCustomUmpireModal(false);
                    toast.success(
                      `Custom umpire ${customUmpireData.name} added!`
                    );
                  }}
                  className="flex-[2] py-4 bg-yellow-500 text-black font-black rounded-[16px] text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Confirm Umpire
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative bg-black border border-white/10 p-10 rounded-[16px] max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-yellow-500/10 rounded-[16px] flex items-center justify-center mx-auto mb-4">
                <Coins size={48} className="text-yellow-500" />
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight font-open-sans uppercase">
                Reserve Coins
              </h2>
              <p className="text-white/70 font-medium mb-10 leading-relaxed text-[14px] font-inter">
                Hosting this game will reserve{" "}
                <span className="text-white font-black">{totalCost} coins</span>{" "}
                from your wallet. It will be deducted only when the match is
                confirmed.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 bg-card rounded-[16px] font-black text-[11px] uppercase tracking-widest text-white/70"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    handleCreateGame();
                  }}
                  className="flex-1 h-[40px] bg-gradient-to-r from-secondary to-primary text-background font-bold rounded-[16px] shadow-[0_8px_24px_rgba(191,243,103,0.15)] text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CoinAnimation
        show={showCoinAnim}
        amount={totalCost}
        onComplete={() => {
          setShowCoinAnim(false);
          toast.success("Match Hosted Successfully!");
          navigate("/my-hosted-games");
        }}
      />

  {
    loading && (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary font-bold uppercase tracking-[0.3em] text-xs">
            Reserving Coins...
          </p>
        </div>
      </div>
    )
  }
    </div >
  );
};

export default ProMatchWizard;
