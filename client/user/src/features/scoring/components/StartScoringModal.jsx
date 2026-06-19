import * as Sentry from "@sentry/react";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Video,
  Users,
  Trophy,
  Search,
  Check,
  MapPin,
  UserCheck,
  SkipForward,
  Loader2,
  Swords,
  Phone,
  MessageCircle,
  UserPlus,
  Plus,
  Eye,
  EyeOff,
  CheckSquare,
  Mic,
  Star,
  Heart,
  ClipboardList,
  Radio,
  Info,
  Zap,
} from "lucide-react";
import { useSetupScoringMatchMutation } from "@redux/api/scoringApi";
import {
  useGetMyTeamsQuery,
  useGetOpponentTeamsQuery,
  useLazyFindTeamByCodeQuery,
  useGetTeamByIdQuery,
  useLazySearchPlayersQuery,
  useInviteMemberMutation,
  useAddCustomMemberMutation,
} from "@redux/api/teamApi";
import {
  useGetGroundsQuery,
  useGetUmpiresQuery,
  useGetMyHostedGamesQuery,
  useGetMyJoinedGamesQuery,
} from "@redux/api/gamesApi";
import toast from "react-hot-toast";
import {
  fetchStates,
  fetchCities,
  searchLocations,
  reverseGeocode,
} from "../../../shared/utils/locationService";
import { countryCodes } from "../../../utils/countryCodes";
import CreateTeamModal from "../../teams/components/CreateTeamModal";

// ─── Static Data ─────────────────────────────────────────────────────────────

const CRICKET_FORMATS = [
  { value: "T20", label: "T20", sub: "20 Overs" },
  { value: "T10", label: "T10", sub: "10 Overs" },
  { value: "ODI", label: "ODI", sub: "50 Overs" },
  { value: "THE_HUNDRED", label: "The Hundred", sub: "100 Balls" },
  { value: "TEST", label: "Test Match", sub: "5 Days" },
  { value: "5_DAY", label: "5 Day Match", sub: "90 Overs/day" },
  { value: "90_OVERS", label: "90 Overs", sub: "1 Day" },
  { value: "1_WEEK", label: "One Week", sub: "Multi-day" },
  { value: "CUSTOM", label: "Custom", sub: "Set your own overs" },
];

const BALL_TYPES = [
  { value: "TENNIS", label: "Tennis Ball", emoji: "🎾" },
  { value: "LEATHER", label: "Leather Ball", emoji: "🏏" },
  { value: "WHITE", label: "White Ball", emoji: "⚪" },
  { value: "PINK", label: "Pink Ball", emoji: "🔴" },
  { value: "RUBBER", label: "Rubber Ball", emoji: "⚫" },
];

const GROUND_TYPES = [
  { value: "OUTDOOR", label: "Outdoor Ground", emoji: "🌳" },
  { value: "INDOOR", label: "Indoor Ground", emoji: "🏟️" },
  { value: "TURF", label: "Artificial Turf", emoji: "🟩" },
];

const MATCH_TIMINGS = [
  { value: "DAY", label: "Day Match", emoji: "☀️" },
  { value: "NIGHT", label: "Night Match", emoji: "🌙" },
  { value: "D_N", label: "Day/Night", emoji: "🌅" },
];

const PITCH_TYPES = [
  { value: "ROUGH", label: "Rough" },
  { value: "CEMENT", label: "Cement" },
  { value: "TURF", label: "Turf" },
  { value: "ASTRO_TURF", label: "Astro Turf" },
  { value: "MATTING", label: "Matting" },
];

const STEPS = [{ id: 1, label: "Match Setup" }];

// ─── Field/Select components ─────────────────────────────────────────────────

const inputClass =
  "w-full bg-white/[0.03] border border-white/10 rounded-[12px] p-3 h-[44px] text-white focus:border-[#55DEE8]/30 outline-none transition-colors placeholder:text-white/30";
const labelClass =
  "text-[10px] text-white/40 mb-1 block font-black uppercase tracking-widest";
const selectClass =
  "w-full bg-[#121212] border border-white/10 rounded-[12px] p-3 h-[44px] text-white outline-none transition-colors focus:border-[#55DEE8]/30";

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const normalizedOptions = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const selectedLabel =
    normalizedOptions.find((o) => String(o.value) === String(value))?.label ||
    placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] bg-[#121212] border border-white/10 rounded-[12px] px-3 flex items-center justify-between transition-colors focus:border-[#55DEE8]/30 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/20"}`}
      >
        <span className="truncate text-white text-sm font-bold">
          {selectedLabel}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 w-full min-w-[120px] bg-[#1A1A1A] border border-white/10 rounded-[12px] shadow-xl overflow-hidden max-h-48 overflow-y-auto scrollbar-hide"
          >
            {normalizedOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-white/5 ${String(value) === String(opt.value) ? "text-[#55DEE8] font-bold bg-[#55DEE8]/5" : "text-white"}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const StartScoringModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [showCustomVenuePopup, setShowCustomVenuePopup] = useState(false);

  const [supportsContacts, setSupportsContacts] = useState(false);

  useEffect(() => {
    const isMobileView =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(
        navigator.userAgent
      );
    if (isMobileView) {
      setSupportsContacts(true);
    }
  }, []);

  const handleImportFromContacts = async () => {
    try {
      if (!("contacts" in navigator && "ContactsManager" in window)) {
        toast.error(
          "Contacts API is only supported on a real mobile device. Please test this on your phone."
        );
        return;
      }
      const props = ["name", "tel"];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name.length > 0) {
          setCustomPlayerName(contact.name[0]);
        }
        if (contact.tel && contact.tel.length > 0) {
          let rawPhone = contact.tel[0].replace(/\D/g, "");
          if (rawPhone.length > 10) rawPhone = rawPhone.slice(-10);
          setCustomPlayerPhone(rawPhone);
        }
      }
    } catch (ex) {
      console.log("Contacts API failed:", ex);
    }
  };

  const [customVenueNameInput, setCustomVenueNameInput] = useState("");
  const [customVenueLocationInput, setCustomVenueLocationInput] = useState("");
  const [showVenuePopup, setShowVenuePopup] = useState(false);
  const [showProfessionalsPopup, setShowProfessionalsPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showGroundsDropdown, setShowGroundsDropdown] = useState(false);
  const [groundSearchQuery, setGroundSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    matchName: "",
    sportType: "CRICKET",
    format: "T20",
    ballType: "TENNIS",
    groundType: "OUTDOOR",
    maxMembers: 11,
    teamAId: "",
    teamBId: "",
    teamAName: "",
    teamBName: "",
    teamAPlayers: [],
    teamBPlayers: [],
    venueId: null,
    customVenue: "",
    professionals: [],
    customProfessionals: [],
    tossWinner: "",
    tossDecision: "BAT",
    scoringPassword: "",
    youtubeLiveUrl: "",
    customDays: 1,
    customOversPerDay: 20,
    powerPlayOvers: 6,
    powerPlayMapping: [1, 2, 3, 4, 5, 6],
    location: "",
    matchDateTime: "",
    pitchType: "TURF",
    matchTiming: "DAY",
    slowOverRateEnabled: false,
  });

  useEffect(() => {
    if (isOpen && initialData) {
      const tA = initialData.teams?.teamA;
      const tB = initialData.teams?.teamB;
      const nameA = tA?.name || "";
      const nameB = tB?.name || "";
      const mName = nameA && nameB ? `${nameA} vs ${nameB}` : "";
      const sType = initialData.gameType
        ? initialData.gameType.toUpperCase()
        : "CRICKET";

      const loc = initialData.turf?.location || initialData.customVenue || "";
      const vId = initialData.turf?._id || null;
      let mDateTime = "";
      if (initialData.date && initialData.time) {
        try {
          const d = new Date(initialData.date);
          mDateTime = `${d.toISOString().split("T")[0]}T${initialData.time}`;
        } catch (e) {
          /* ignore invalid date */
        }
      }

      const extractPlayers = (teamObj) => {
        if (!teamObj || !Array.isArray(teamObj.slots)) return [];
        return teamObj.slots
          .filter(
            (s) => s.user || s.userId || s.customPlayerId || s.customPlayer
          )
          .map((s) => {
            if (s.user || s.userId) {
              return {
                id: s.user?._id || s.user?.id || s.userId,
                name: s.user?.name || s.user?.username || "Player",
                profilePicture: s.user?.profilePicture || null,
                role: "PLAYER",
                isCustom: false,
              };
            } else {
              return {
                id:
                  s.customPlayerId ||
                  s.customPlayer?.id ||
                  Math.random().toString(),
                name: s.customPlayer?.name || "Custom Player",
                profilePicture: null,
                role: "PLAYER",
                isCustom: true,
              };
            }
          });
      };

      const pA = extractPlayers(tA);
      const pB = extractPlayers(tB);

      setFormData((f) => ({
        ...f,
        matchName: mName || f.matchName,
        sportType: sType,
        teamAId: tA?._id || tA?.id || tA?.teamId || f.teamAId,
        teamBId: tB?._id || tB?.id || tB?.teamId || f.teamBId,
        teamAName: nameA || f.teamAName,
        teamBName: nameB || f.teamBName,
        teamAPlayers: pA.length > 0 ? pA : f.teamAPlayers,
        teamBPlayers: pB.length > 0 ? pB : f.teamBPlayers,
        location: loc || f.location,
        venueId: vId || f.venueId,
        customVenue: initialData.customVenue || f.customVenue,
        matchDateTime: mDateTime || f.matchDateTime,
      }));
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_calling_code) {
            const code = data.country_calling_code.replace("+", "");
            setCustomPlayerCountryCode(code);
          }
        })
        .catch((err) => Sentry.captureException(err));
    }
  }, [isOpen]);

  // Team selector popup state
  const [selectingTeam, setSelectingTeam] = useState(null); // 'A' | 'B'
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamTab, setTeamTab] = useState("myTeams");
  const [showMatchSettingsPopup, setShowMatchSettingsPopup] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // Custom Date/Time Picker popup state
  const [showDatePickerPopup, setShowDatePickerPopup] = useState(false);
  const [showTimeStep, setShowTimeStep] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [tempDate, setTempDate] = useState(null);
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState("PM");

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const openDatePicker = () => {
    const base = formData.matchDateTime
      ? new Date(formData.matchDateTime)
      : new Date();
    const now = new Date();
    const activeDate = base < now ? now : base;

    setTempDate(
      new Date(
        activeDate.getFullYear(),
        activeDate.getMonth(),
        activeDate.getDate()
      )
    );

    let h = activeDate.getHours();
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;

    const m = Math.round(activeDate.getMinutes() / 5) * 5;

    setTempHour(h);
    setTempMinute(m >= 60 ? 55 : m);
    setTempPeriod(period);

    setCalendarMonth(activeDate.getMonth());
    setCalendarYear(activeDate.getFullYear());
    setShowTimeStep(false);
    setShowDatePickerPopup(true);
  };

  const applyDatePicker = () => {
    if (!tempDate) return;

    let hour24 = tempHour % 12;
    if (tempPeriod === "PM") hour24 += 12;

    const finalDate = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      tempDate.getDate(),
      hour24,
      tempMinute
    );

    const pad = (num) => String(num).padStart(2, "0");
    const formatted = `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())}T${pad(finalDate.padHours ? pad(finalDate.getHours()) : pad(finalDate.getHours()))}:${pad(finalDate.getMinutes())}`;

    setFormData((f) => ({ ...f, matchDateTime: formatted }));
    setShowDatePickerPopup(false);
  };

  // Custom Members per Team Inline state and handlers
  const [showCustomMembersInline, setShowCustomMembersInline] = useState(false);
  const [customMembersInput, setCustomMembersInput] = useState("");
  const customMembersTimerRef = useRef(null);

  const handleCustomMembersChange = (valStr) => {
    const cleaned = valStr.replace(/\D/g, "");
    setCustomMembersInput(cleaned);
    const num = parseInt(cleaned);

    if (customMembersTimerRef.current) {
      clearTimeout(customMembersTimerRef.current);
    }

    if (!isNaN(num) && num > 0) {
      setFormData((f) => ({ ...f, maxMembers: num }));

      // Auto-collapse after 800ms debounce
      customMembersTimerRef.current = setTimeout(() => {
        setShowCustomMembersInline(false);
      }, 800);
    }
  };

  // Player selection popup state
  const [playerPopup, setPlayerPopup] = useState(null); // { teamKey: 'A' | 'B', action: 'ADD' | 'REPLACE', replaceId: null }
  const [activePlayerTab, setActivePlayerTab] = useState("search"); // 'search' or 'custom'
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [customPlayerPhone, setCustomPlayerPhone] = useState("");
  const [customPlayerCountryCode, setCustomPlayerCountryCode] = useState("91");
  const [customInviteData, setCustomInviteData] = useState(null);

  const [xiTab, setXiTab] = useState("A");
  const [addonsTab, setAddonsTab] = useState("VENUE");

  // Venue & Professional Filters
  const [venueSearchQuery, setVenueSearchQuery] = useState("");
  const [proSearchQuery, setProSearchQuery] = useState("");
  const [venueStateFilter, setVenueStateFilter] = useState("");
  const [venueCityFilter, setVenueCityFilter] = useState("");
  const [proRoleFilter, setProRoleFilter] = useState("");
  const [proStateFilter, setProStateFilter] = useState("");
  const [proCityFilter, setProCityFilter] = useState("");
  const [states, setStates] = useState([]);
  const [venueCities, setVenueCities] = useState([]);
  const [proCities, setProCities] = useState([]);

  const handleProStateChange = async (stateVal) => {
    setProStateFilter(stateVal);
    setProCityFilter("");
    if (stateVal) {
      const c = await fetchCities(stateVal);
      setProCities(c);
    } else {
      setProCities([]);
    }
  };

  // Custom Venue & Pro
  const [customVenueInput, setCustomVenueInput] = useState("");
  const [customProfessionalName, setCustomProfessionalName] = useState("");
  const [customProfessionalPhone, setCustomProfessionalPhone] = useState("");
  const [customProfessionalRole, setCustomProfessionalRole] =
    useState("UMPIRE");
  const [showCustomProInvite, setShowCustomProInvite] = useState(false);
  const [customProInviteData, setCustomProInviteData] = useState(null);

  // Location state
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (locationInput.trim().length >= 2) {
        try {
          const results = await searchLocations(locationInput);
          setLocationSuggestions(results || []);
        } catch (error) {
          Sentry.captureException(error);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [locationInput]);

  // Fetch initial location (Auto-detect)
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`
                );
                const data = await res.json();
                const userState = data.address?.state;
                let userCity =
                  data.address?.city ||
                  data.address?.town ||
                  data.address?.village ||
                  data.address?.suburb;

                if (userState && isMounted) {
                  const locString = userCity
                    ? `${userCity}, ${userState}`
                    : userState;
                  setLocationInput(locString);
                  setFormData((f) => ({ ...f, location: locString }));
                  setMapCoordinates({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                  });
                }
              } catch (err) {
                Sentry.addBreadcrumb({
                  message: JSON.stringify(["Reverse geocoding failed", err]),
                });
              }
            },
            () => {
              Sentry.addBreadcrumb({
                message: String("Geolocation permission denied or failed"),
              });
            }
          );
        }
      } catch (err) {
        Sentry.captureException(err);
      }
    };
    initLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  // Toss animation state
  const [isTossFlipping, setIsTossFlipping] = useState(false);
  const [tossFlipDeg, setTossFlipDeg] = useState(0);

  const [setupMatch, { isLoading }] = useSetupScoringMatchMutation();
  const { data: myTeamsData } = useGetMyTeamsQuery(undefined, {
    skip: !isOpen,
  });
  const { data: oppTeamsData } = useGetOpponentTeamsQuery(undefined, {
    skip: !isOpen,
  });
  const [findTeamByCode, { data: searchedTeamData, isFetching: isSearching }] =
    useLazyFindTeamByCodeQuery();

  // Load team details when teams are selected (for player list)
  const { data: teamADetails } = useGetTeamByIdQuery(formData.teamAId, {
    skip: !formData.teamAId,
  });
  const { data: teamBDetails } = useGetTeamByIdQuery(formData.teamBId, {
    skip: !formData.teamBId,
  });

  // Addons queries
  const { data: groundsData, isLoading: isLoadingGrounds } = useGetGroundsQuery(
    {
      sportType: formData.sportType,
    },
    { skip: !isOpen }
  );

  const { data: hostedGamesData } = useGetMyHostedGamesQuery(undefined, {
    skip: !isOpen,
  });
  const { data: joinedGamesData } = useGetMyJoinedGamesQuery(undefined, {
    skip: !isOpen,
  });

  // Extract unique prebooked turfs from hosted and joined games
  const prebookedTurfs = useMemo(() => {
    const turfsMap = new Map();
    const hostedGames = hostedGamesData?.games || [];
    const joinedGames = joinedGamesData?.games || [];

    [...hostedGames, ...joinedGames].forEach((game) => {
      if (game.turf) {
        const id = game.turf.id || game.turf._id;
        if (id) {
          turfsMap.set(id, {
            id: id,
            _id: id,
            name: game.turf.name,
            city: game.turf.city || "",
            state: game.turf.state || "",
            images: game.turf.images || [],
            latitude: game.turf.latitude || game.turf.lat,
            longitude: game.turf.longitude || game.turf.lon,
            lat: game.turf.lat || game.turf.latitude,
            lon: game.turf.lon || game.turf.longitude,
          });
        }
      }
    });

    return Array.from(turfsMap.values());
  }, [hostedGamesData, joinedGamesData]);
  const { data: umpiresData, isLoading: isLoadingUmpires } = useGetUmpiresQuery(
    {
      gameType: formData.sportType,
      state: proStateFilter || undefined,
      city: proCityFilter || undefined,
      query: proSearchQuery || undefined,
    },
    { skip: step !== 4 && step !== 5 }
  );

  const [
    searchPlayers,
    { data: searchPlayersData, isFetching: isSearchingPlayers },
  ] = useLazySearchPlayersQuery();
  const [invitePlayer, { isLoading: isInviting }] = useInviteMemberMutation();
  const [addCustomPlayer, { isLoading: isAddingCustom }] =
    useAddCustomMemberMutation();

  const myTeams = myTeamsData?.teams || [];
  const oppTeams = oppTeamsData?.teams || [];
  const allTeams = [...myTeams, ...oppTeams];

  const selectedTeamA = allTeams.find(
    (t) => t._id === formData.teamAId || t.id === formData.teamAId
  );
  const selectedTeamB = allTeams.find(
    (t) => t._id === formData.teamBId || t.id === formData.teamBId
  );

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleClose = () => {
    setStep(1);
    setSelectingTeam(null);
    onClose();
  };

  // ─── Team selection ──────────────────────────────────────────────────────────
  const handleTeamSearch = async () => {
    if (teamSearchQuery.trim()) await findTeamByCode(teamSearchQuery.trim());
  };

  useEffect(() => {
    if (teamSearchQuery.trim().length === 10) {
      findTeamByCode(teamSearchQuery.trim());
    }
  }, [teamSearchQuery, findTeamByCode]);

  const selectTeam = (teamId, teamName) => {
    const key = selectingTeam === "A" ? "teamAId" : "teamBId";
    const nameKey = selectingTeam === "A" ? "teamAName" : "teamBName";
    const playerKey = selectingTeam === "A" ? "teamAPlayers" : "teamBPlayers";

    if (selectingTeam === "A" && teamId === formData.teamBId) {
      toast.error("Team A and Team B cannot be the same team.");
      return;
    }
    if (selectingTeam === "B" && teamId === formData.teamAId) {
      toast.error("Team A and Team B cannot be the same team.");
      return;
    }

    setFormData((f) => ({
      ...f,
      [key]: teamId,
      [nameKey]: teamName || "",
      [playerKey]: [],
    }));

    const teamKey = selectingTeam;
    setSelectingTeam(null);
    setTeamSearchQuery("");

    // Automatically open the Add Player popup on the Roster tab
    setPlayerPopup({ teamKey: teamKey, action: "ADD", replaceId: null });
    setActivePlayerTab("roster");
  };

  const getTeamName = (id) => {
    if (!id) return "Team Selected";
    const t = allTeams.find((t) => (t._id || t.id) === id);
    if (t?.name) return t.name;
    if (
      searchedTeamData?.team &&
      (searchedTeamData.team._id || searchedTeamData.team.id) === id
    )
      return searchedTeamData.team.name;
    if (id === formData.teamAId && teamADetails?.team?.name)
      return teamADetails.team.name;
    if (id === formData.teamBId && teamBDetails?.team?.name)
      return teamBDetails.team.name;
    if (id === formData.teamAId && formData.teamAName)
      return formData.teamAName;
    if (id === formData.teamBId && formData.teamBName)
      return formData.teamBName;
    return "Team Selected";
  };

  // ─── Playing XI ─────────────────────────────────────────────────────────────
  const initPlayersFromTeam = (teamKey) => {
    const details = teamKey === "A" ? teamADetails : teamBDetails;
    if (!details?.team) return;
    const regularMembers = (details.team.members || []).map((m) => ({
      id: m.user?.id || m.userId,
      name: m.user?.name || m.user?.username || "Player",
      profilePicture: m.user?.profilePicture || null,
      role: m.role || "PLAYER",
      isCustom: false,
    }));
    const customMembers = (details.team.customMembers || []).map((m) => ({
      id: m.id,
      name: m.name || "Custom Player",
      profilePicture: null,
      role: "PLAYER",
      isCustom: true,
    }));
    const allMembers = [...regularMembers, ...customMembers].slice(
      0,
      formData.maxMembers
    );
    const playerKey = teamKey === "A" ? "teamAPlayers" : "teamBPlayers";
    setFormData((f) => ({ ...f, [playerKey]: allMembers }));
  };

  useEffect(() => {
    if (step === 3) {
      if (formData.teamAPlayers.length === 0 && teamADetails?.team) {
        initPlayersFromTeam("A");
      }
      if (formData.teamBPlayers.length === 0 && teamBDetails?.team) {
        initPlayersFromTeam("B");
      }
    }
  }, [step, teamADetails, teamBDetails]);

  const removePlayer = (teamKey, playerId) => {
    const playerKey = teamKey === "A" ? "teamAPlayers" : "teamBPlayers";
    setFormData((f) => ({
      ...f,
      [playerKey]: f[playerKey].filter((p) => p.id !== playerId),
    }));
  };

  const handleInviteAndAdd = async (player) => {
    const teamId =
      playerPopup?.teamKey === "A" ? formData.teamAId : formData.teamBId;
    const isMyTeam = myTeams.some((t) => (t._id || t.id) === teamId);
    if (teamId && !initialData && isMyTeam) {
      try {
        await invitePlayer({
          teamId,
          userId: player._id || player.id,
        }).unwrap();
        toast.success("Invitation sent to player!");
      } catch (err) {
        toast.error(err.data?.message || "Failed to send invitation");
      }
    }
    selectPlayer(player);
  };

  const handleAddCustomPlayerSubmit = async (e) => {
    e?.preventDefault();
    if (!customPlayerName.trim()) return toast.error("Player Name is required");

    if (
      customPlayerPhone &&
      customPlayerPhone.replace(/\D/g, "").length !== 10
    ) {
      return toast.error("Phone number must be exactly 10 digits");
    }

    const teamId =
      playerPopup?.teamKey === "A" ? formData.teamAId : formData.teamBId;
    const isMyTeam = myTeams.some((t) => (t._id || t.id) === teamId);
    if (!teamId || initialData || !isMyTeam) {
      selectPlayer({
        id: Math.random().toString(),
        name: customPlayerName,
        isCustom: true,
        phone: customPlayerPhone,
      });
      setCustomPlayerName("");
      setCustomPlayerPhone("");
      toast.success("Custom player added to match!");
      return;
    }

    try {
      const result = await addCustomPlayer({
        teamId,
        name: customPlayerName,
        phone: customPlayerPhone,
      }).unwrap();

      if (result.success) {
        const inviteResult = result.results?.[0];

        if (inviteResult?.status === "error" && inviteResult?.existingUserId) {
          toast.success(
            `User exists (${inviteResult.existingUserName}). Inviting them...`
          );
          await invitePlayer({
            teamId,
            userId: inviteResult.existingUserId,
          }).unwrap();
          selectPlayer({
            id: inviteResult.existingUserId,
            name: inviteResult.existingUserName,
            username: inviteResult.existingUserName,
          });
          setCustomPlayerName("");
          setCustomPlayerPhone("");
          return;
        }

        if (inviteResult?.status === "invited_custom") {
          setCustomInviteData({
            token: inviteResult.token,
            phone: customPlayerPhone,
            countryCode: customPlayerCountryCode,
            name: customPlayerName,
          });
          toast.success("Player added! Send them a WhatsApp invite.");
          selectPlayer({
            id: inviteResult.customMemberId || Math.random().toString(),
            name: customPlayerName,
            isCustom: true,
          });
        } else {
          toast.success("Custom player added to team!");
          selectPlayer({
            id: inviteResult?.customMemberId || Math.random().toString(),
            name: customPlayerName,
            isCustom: true,
          });
          setCustomPlayerName("");
          setCustomPlayerPhone("");
        }
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to add player");
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (playerSearchQuery.trim()) {
        searchPlayers(playerSearchQuery.trim());
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [playerSearchQuery, searchPlayers]);

  //  Handlers

  // Initialize location filters
  useEffect(() => {
    if (user) {
      if (user.state) {
        setVenueStateFilter(user.state);
        setProStateFilter(user.state);
      }
      if (user.city) {
        setVenueCityFilter(user.city);
        setProCityFilter(user.city);
      }
    }
  }, [user]);

  // Validate state filters against loaded states
  useEffect(() => {
    if (states.length > 0) {
      if (venueStateFilter && !states.includes(venueStateFilter)) {
        setVenueStateFilter("");
      }
      if (proStateFilter && !states.includes(proStateFilter)) {
        setProStateFilter("");
      }
    }
  }, [states, venueStateFilter, proStateFilter]);

  // Validate city filters against loaded cities
  useEffect(() => {
    if (venueCities.length > 0) {
      if (venueCityFilter && !venueCities.includes(venueCityFilter)) {
        setVenueCityFilter("");
      }
    } else if (venueStateFilter === "") {
      setVenueCityFilter("");
    }
  }, [venueCities, venueCityFilter, venueStateFilter]);

  useEffect(() => {
    if (proCities.length > 0) {
      if (proCityFilter && !proCities.includes(proCityFilter)) {
        setProCityFilter("");
      }
    } else if (proStateFilter === "") {
      setProCityFilter("");
    }
  }, [proCities, proCityFilter, proStateFilter]);

  // Fetch all states
  useEffect(() => {
    const loadStates = async () => {
      const fetchedStates = await fetchStates();
      setStates(fetchedStates);
    };
    loadStates();
  }, []);

  // Fetch venue cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (venueStateFilter) {
        const fetchedCities = await fetchCities(venueStateFilter);
        setVenueCities(fetchedCities);
      } else {
        setVenueCities([]);
        setVenueCityFilter("");
      }
    };
    loadCities();
  }, [venueStateFilter]);

  // Fetch pro cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (proStateFilter) {
        const fetchedCities = await fetchCities(proStateFilter);
        setProCities(fetchedCities);
      } else {
        setProCities([]);
        setProCityFilter("");
      }
    };
    loadCities();
  }, [proStateFilter]);

  const selectPlayer = (player) => {
    if (!playerPopup) return;
    const { teamKey, action, replaceId } = playerPopup;
    const playerKey = teamKey === "A" ? "teamAPlayers" : "teamBPlayers";

    setFormData((f) => {
      let newList = [...f[playerKey]];
      const newPlayer = {
        id: player.id || player._id || Math.random().toString(36).substr(2, 9),
        name: player.name || player.username || customPlayerName,
        profilePicture: player.profilePicture || null,
        role: player.role || "PLAYER",
        isCustom:
          player.isCustom !== undefined
            ? player.isCustom
            : !(player.id || player._id),
      };

      if (action === "REPLACE" && replaceId) {
        newList = newList.map((p) => (p.id === replaceId ? newPlayer : p));
      } else {
        // ADD
        if (newList.length < formData.maxMembers) {
          if (!newList.find((p) => p.id === newPlayer.id)) {
            newList.push(newPlayer);
          } else {
            toast.error("Player already in Playing XI");
            return f;
          }
        } else {
          toast.error("Maximum players reached for this format");
          return f;
        }
      }
      return { ...f, [playerKey]: newList };
    });
    if (action === "REPLACE") {
      setPlayerPopup(null);
    }
    setPlayerSearchQuery("");
    setCustomPlayerName("");
  };

  const changePlayerRole = (teamKey, playerId, role) => {
    const key = teamKey === "A" ? "teamAPlayers" : "teamBPlayers";
    setFormData((f) => {
      let players = [...f[key]];

      // Enforce unique role assignment
      if (role !== "PLAYER") {
        players = players.map((p) =>
          p.role === role ? { ...p, role: "PLAYER" } : p
        );
      }

      // Assign the new role (which also unassigns them from any previous role because p.role is a single string)
      if (playerId) {
        players = players.map((p) => (p.id === playerId ? { ...p, role } : p));
      }
      return { ...f, [key]: players };
    });
  };

  // ─── Toss ────────────────────────────────────────────────────────────────────
  const doToss = () => {
    if (isTossFlipping) return;
    setIsTossFlipping(true);
    let deg = 0;
    const interval = setInterval(() => {
      deg += 40;
      setTossFlipDeg(deg);
      if (deg >= 720) {
        clearInterval(interval);
        setIsTossFlipping(false);
        const winner =
          Math.random() > 0.5 ? formData.teamAId : formData.teamBId;
        setFormData((f) => ({ ...f, tossWinner: winner }));
      }
    }, 60);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        slowOverRateConfig: formData.slowOverRateEnabled
          ? { enabled: true, penaltyType: "ONE_FIELDER_INSIDE_CIRCLE" }
          : { enabled: false },
        matchName:
          formData.matchName ||
          `${getTeamName(formData.teamAId)} vs ${getTeamName(formData.teamBId)}`,
        teamAData: { name: getTeamName(formData.teamAId) },
        teamBData: { name: getTeamName(formData.teamBId) },
      };
      const res = await setupMatch(payload).unwrap();
      toast.success("Scoring match created!");
      const matchId = res.game?.id || res.game?._id;
      if (matchId) {
        navigate(`/scoring/${matchId}`);
      } else {
        if (onSuccess) onSuccess();
      }
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create match");
    }
  };

  // ─── Step Validation ─────────────────────────────────────────────────────────
  const canGoNext = () => {
    switch (step) {
      case 1:
        return (
          !!formData.teamAId &&
          !!formData.teamBId &&
          formData.teamAId !== formData.teamBId &&
          formData.teamAPlayers.length > 0 &&
          formData.teamBPlayers.length > 0
        );
      default:
        return true;
    }
  };

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          const userState = data.address?.state;
          let userCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.suburb;

          if (userState) {
            const locString = userCity
              ? `${userCity}, ${userState}`
              : userState;
            setLocationInput(locString);
            setMapCoordinates({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            });
            toast.success("Live location detected!");
          } else {
            toast.error("Failed to get address for live location.");
          }
        } catch (err) {
          Sentry.captureException(err);
          toast.error("Reverse geocoding failed.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        Sentry.captureException(error);
        toast.error(error.message || "Geolocation access denied.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  // ─── Custom Location & Map Picker Popup ───────────────────────────────────────
  if (showLocationPopup) {
    const handleApplyLocation = () => {
      setFormData((f) => ({ ...f, location: locationInput }));
      setShowLocationPopup(false);
    };

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0">
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={() => setShowLocationPopup(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-full h-screen bg-[#121212] shadow-2xl overflow-hidden flex flex-col flex-shrink-0"
        >
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-[35px] space-y-4 bg-[#121212] scrollbar-hide">
            {/* Search and Locate Me Row */}
            <div className="space-y-2">
              <label className={labelClass}>Search City, State or Turf</label>
              <div className="flex gap-2">
                {/* Search Input Box */}
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[16px]"
                    size={16}
                  />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    className="w-full h-11 bg-[#121212] border border-white/10 rounded-[12px] pl-11 pr-4 text-white focus:outline-none focus:border-[#55DEE8]/30 transition-all text-sm font-semibold placeholder:text-white/30"
                    placeholder="Enter location (e.g. Indiranagar, Bengaluru)"
                  />

                  {/* Suggestions dropdown inside modal */}
                  {showLocationSuggestions &&
                    locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-lg overflow-hidden shadow-2xl z-[100]">
                        <div className="max-h-[160px] overflow-y-auto font-sans">
                          {locationSuggestions.map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                const displayName =
                                  typeof loc === "object"
                                    ? loc.display_name
                                    : loc;
                                setLocationInput(displayName);
                                if (loc.lat && loc.lon) {
                                  setMapCoordinates({
                                    lat: loc.lat,
                                    lon: loc.lon,
                                  });
                                }
                                setShowLocationSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-[#55DEE8] hover:text-black transition-colors"
                            >
                              {typeof loc === "object" ? loc.display_name : loc}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* GPS Live Geolocation Button - Premium Non-AI Styling */}
                <button
                  type="button"
                  onClick={handleDetectLiveLocation}
                  disabled={isDetectingLocation}
                  className="px-4 h-11 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-[12px] text-white hover:text-[#55DEE8] font-semibold text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50 flex-shrink-0"
                >
                  {isDetectingLocation && (
                    <Loader2
                      size={14}
                      className="animate-spin text-[#55DEE8]"
                    />
                  )}
                  <span>Locate Me</span>
                </button>
              </div>
            </div>

            {/* Dedicated Turf/Venue Selector Field */}
            <div className="space-y-2 relative">
              <label className={labelClass}>Select listed turf or venue</label>

              {/* Clickable Select Field */}
              <button
                type="button"
                onClick={() => setShowGroundsDropdown(!showGroundsDropdown)}
                className={`w-full flex items-center justify-between p-3.5 rounded-[12px] border text-sm font-semibold transition-all text-left ${
                  formData.venueId
                    ? "bg-[#55DEE8]/10 border-[#55DEE8]/30 text-[#55DEE8]"
                    : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MapPin
                    size={16}
                    className={
                      formData.venueId ? "text-[#55DEE8]" : "text-white/40"
                    }
                  />
                  <span className="truncate">
                    {groundsData?.grounds?.find(
                      (g) => g.id === formData.venueId
                    )?.name ||
                      prebookedTurfs.find(
                        (g) =>
                          g.id === formData.venueId ||
                          g._id === formData.venueId
                      )?.name ||
                      "Select or Search Listed Turf..."}
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-white/40 transition-transform duration-200 ${showGroundsDropdown ? "rotate-90" : ""}`}
                />
              </button>

              {/* Collapsible Search and List Drawer */}
              <AnimatePresence>
                {showGroundsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 bg-[#121212] border border-white/10 rounded-[12px] p-3 space-y-3 z-50 shadow-2xl relative"
                  >
                    {/* Dedicated search bar for listed grounds */}
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Search turfs by name or city..."
                        value={groundSearchQuery}
                        onChange={(e) => setGroundSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-md pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#55DEE8]/30"
                      />
                      {groundSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setGroundSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Scrollable list of grounds filtered ONLY by this search bar */}
                    <div className="max-h-52 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                      {isLoadingGrounds ? (
                        <div className="flex justify-center py-4">
                          <Loader2
                            className="animate-spin text-[#55DEE8]"
                            size={14}
                          />
                        </div>
                      ) : (
                        (() => {
                          const query = groundSearchQuery.toLowerCase().trim();

                          // Filter matching prebooked grounds
                          const matchingPrebooked = prebookedTurfs.filter(
                            (g) => {
                              if (!query) return true;
                              return (
                                g.name.toLowerCase().includes(query) ||
                                g.city.toLowerCase().includes(query) ||
                                (g.state &&
                                  g.state.toLowerCase().includes(query))
                              );
                            }
                          );

                          // Filter matching listed grounds
                          const matchingListed =
                            groundsData?.grounds?.filter((g) => {
                              if (!query) return true;
                              return (
                                g.name.toLowerCase().includes(query) ||
                                g.city.toLowerCase().includes(query) ||
                                (g.state &&
                                  g.state.toLowerCase().includes(query))
                              );
                            }) || [];

                          // Exclude prebooked grounds from the listed grounds section to prevent double display
                          const prebookedIds = new Set(
                            prebookedTurfs.map((g) => g.id || g._id)
                          );
                          const filteredListed = matchingListed.filter(
                            (g) =>
                              !prebookedIds.has(g.id) &&
                              !prebookedIds.has(g._id)
                          );

                          const hasPrebooked = matchingPrebooked.length > 0;
                          const hasListed = filteredListed.length > 0;

                          if (!hasPrebooked && !hasListed) {
                            return (
                              <div className="text-center py-6 text-[10px] font-bold text-white/30 uppercase tracking-wider">
                                No matching grounds or turfs found
                              </div>
                            );
                          }

                          const renderGroundItem = (g, isPrebooked = false) => {
                            const isSelected =
                              formData.venueId === g.id ||
                              formData.venueId === g._id;
                            return (
                              <button
                                key={g.id || g._id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData((f) => ({
                                      ...f,
                                      venueId: null,
                                      location: "",
                                    }));
                                    setLocationInput("");
                                    setMapCoordinates(null);
                                  } else {
                                    setFormData((f) => ({
                                      ...f,
                                      venueId: g.id || g._id,
                                      location: `${g.name}, ${g.city}`,
                                    }));
                                    setLocationInput(`${g.name}, ${g.city}`);

                                    // Set map coordinates instantly
                                    if (g.latitude && g.longitude) {
                                      setMapCoordinates({
                                        lat: g.latitude,
                                        lon: g.longitude,
                                      });
                                    } else if (g.lat && g.lon) {
                                      setMapCoordinates({
                                        lat: g.lat,
                                        lon: g.lon,
                                      });
                                    } else {
                                      setMapCoordinates(null);
                                    }
                                  }
                                  setShowGroundsDropdown(false);
                                  setGroundSearchQuery("");
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-md border text-left transition-all ${
                                  isSelected
                                    ? "bg-[#55DEE8]/10 border-[#55DEE8]/30 text-[#55DEE8]"
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <MapPin
                                    size={12}
                                    className={
                                      isSelected
                                        ? "text-[#55DEE8]"
                                        : "text-white/40"
                                    }
                                  />
                                  <div className="truncate">
                                    <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                                      {g.name}
                                      {isPrebooked && (
                                        <span className="px-1.5 py-0.5 bg-[#BFF367]/15 text-[#BFF367] text-[8px] font-black uppercase rounded tracking-wider">
                                          Prebooked
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-white/40 truncate">
                                      {g.city}
                                      {g.state ? `, ${g.state}` : ""}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check size={12} className="text-[#55DEE8]" />
                                )}
                              </button>
                            );
                          };

                          return (
                            <div className="space-y-4">
                              {/* Prebooked grounds section */}
                              {hasPrebooked && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 px-1">
                                    <Trophy
                                      size={11}
                                      className="text-[#BFF367]"
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#BFF367]">
                                      Your Prebooked Grounds
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {matchingPrebooked.map((g) =>
                                      renderGroundItem(g, true)
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Standard listed grounds section */}
                              {hasListed && (
                                <div className="space-y-1.5">
                                  {hasPrebooked && (
                                    <div className="border-t border-white/5 my-2" />
                                  )}
                                  <div className="flex items-center gap-1.5 px-1">
                                    <MapPin
                                      size={11}
                                      className="text-white/40"
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                      Listed Turfs & Venues
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {filteredListed.map((g) =>
                                      renderGroundItem(g, false)
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Google Interactive Map Embed Frame */}
            <div className="space-y-2">
              <label className={labelClass}>Location Map Preview</label>
              <div className="relative w-full h-52 bg-white/[0.01] border border-white/10 rounded-[12px] overflow-hidden shadow-inner flex items-center justify-center">
                <iframe
                  title="Location Map"
                  src={
                    mapCoordinates
                      ? `https://maps.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(locationInput || "India")}&t=&z=13&ie=UTF8&iwloc=&output=embed`
                  }
                  className="w-full h-full border-none opacity-80"
                  allowFullScreen=""
                  loading="lazy"
                />
                {/* Clean border overlay for premium styling */}
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[12px]" />
              </div>
            </div>

            {/* Action Buttons Nav */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationPopup(false)}
                className="px-6 py-2.5 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <ChevronLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleApplyLocation}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black rounded-[12px] uppercase tracking-widest text-xs hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#55DEE8]/10"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Custom Date & Time Picker Popup ──────────────────────────────────────────
  if (showDatePickerPopup) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const totalDays = getDaysInMonth(calendarYear, calendarMonth);
    const firstDayIndex = getFirstDayOfMonth(calendarYear, calendarMonth);
    const daysArray = [];

    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      daysArray.push(new Date(calendarYear, calendarMonth, i));
    }

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const isPrevMonthDisabled = () => {
      return (
        calendarYear <= now.getFullYear() && calendarMonth <= now.getMonth()
      );
    };

    const handlePrevMonth = () => {
      if (isPrevMonthDisabled()) return;
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    };

    const handleNextMonth = () => {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    };

    const isPastTime = (hour, minute, period) => {
      if (!tempDate) return false;
      const isToday =
        tempDate.getFullYear() === now.getFullYear() &&
        tempDate.getMonth() === now.getMonth() &&
        tempDate.getDate() === now.getDate();
      if (!isToday) return false;

      let hr24 = hour % 12;
      if (period === "PM") hr24 += 12;

      const compDate = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        hr24,
        minute
      );
      return compDate < now;
    };

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0">
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={() => setShowDatePickerPopup(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-full h-screen bg-[#121212] shadow-2xl overflow-hidden flex flex-col flex-shrink-0"
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 bg-black flex-shrink-0">
            <div>
              <h2
                className="text-lg font-black text-white uppercase tracking-widest font-display"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Select Match Date & Time
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212] scrollbar-hide">
            {/* Calendar Month Header */}
            {!showTimeStep && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white uppercase tracking-widest">
                  {months[calendarMonth]} {calendarYear}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={isPrevMonthDisabled()}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            {!showTimeStep && (
              <div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {daysArray.map((dateVal, idx) => {
                    if (!dateVal) {
                      return <div key={`empty-${idx}`} />;
                    }

                    const isPast = dateVal < todayStart;
                    const isSelected =
                      tempDate &&
                      tempDate.getDate() === dateVal.getDate() &&
                      tempDate.getMonth() === dateVal.getMonth() &&
                      tempDate.getFullYear() === dateVal.getFullYear();

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isPast}
                        onClick={() => {
                          setTempDate(dateVal);
                          let hr24 = tempHour % 12;
                          if (tempPeriod === "PM") hr24 += 12;
                          const compDate = new Date(
                            dateVal.getFullYear(),
                            dateVal.getMonth(),
                            dateVal.getDate(),
                            hr24,
                            tempMinute
                          );
                          if (compDate < now) {
                            let activeNow = new Date();
                            let h = activeNow.getHours();
                            const period = h >= 12 ? "PM" : "AM";
                            h = h % 12;
                            if (h === 0) h = 12;
                            const m =
                              Math.round(activeNow.getMinutes() / 5) * 5;
                            setTempHour(h);
                            setTempMinute(m >= 60 ? 55 : m);
                            setTempPeriod(period);
                          }
                          setShowTimeStep(true);
                        }}
                        className={`py-2 text-xs font-bold rounded-[12px] transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg shadow-[#55DEE8]/20"
                            : isPast
                              ? "text-white/20 cursor-not-allowed"
                              : "text-white hover:bg-white/5"
                        }`}
                      >
                        {dateVal.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Picker */}
            {showTimeStep && (
              <div className="pt-4 space-y-4 pb-8">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block text-center">
                  Select Time
                </span>

                <input
                  type="time"
                  value={`${String(tempPeriod === "PM" && tempHour !== 12 ? tempHour + 12 : tempPeriod === "AM" && tempHour === 12 ? 0 : tempHour).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [h, m] = val.split(":").map(Number);
                      let period = h >= 12 ? "PM" : "AM";
                      let hour12 = h % 12;
                      if (hour12 === 0) hour12 = 12;

                      setTempHour(hour12);
                      setTempMinute(m);
                      setTempPeriod(period);

                      const finalDate = new Date(
                        tempDate.getFullYear(),
                        tempDate.getMonth(),
                        tempDate.getDate(),
                        h,
                        m
                      );

                      const pad = (num) => String(num).padStart(2, "0");
                      const formatted = `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())}T${pad(finalDate.getHours())}:${pad(finalDate.getMinutes())}`;

                      setFormData((f) => ({ ...f, matchDateTime: formatted }));
                      setTimeout(() => setShowDatePickerPopup(false), 300);
                    }
                  }}
                  className="w-full bg-[#121212] border border-[#55DEE8]/30 rounded-[12px] px-4 py-8 text-white focus:outline-none focus:ring-1 focus:ring-[#55DEE8]/50 text-center text-4xl font-black tracking-widest style-time-input"
                />

                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  .style-time-input::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.5;
                    cursor: pointer;
                    height: 100%;
                    width: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                  }
                  .style-time-input {
                    position: relative;
                  }
                `,
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (showTimeStep) {
                    setShowTimeStep(false);
                  } else {
                    setShowDatePickerPopup(false);
                  }
                }}
                className="px-6 py-2.5 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <ChevronLeft size={14} /> Back
              </button>
              {!showTimeStep && (
                <button
                  type="button"
                  onClick={() => setShowTimeStep(true)}
                  disabled={!tempDate}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black rounded-[12px] uppercase tracking-widest text-xs hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#55DEE8]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Date
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Match Setup Settings Popup ──────────────────────────────────────────────
  if (showMatchSettingsPopup) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0">
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={() => setShowMatchSettingsPopup(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-full h-screen bg-[#121212] shadow-2xl overflow-hidden flex flex-col flex-shrink-0"
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 bg-black flex-shrink-0">
            <div>
              <h2
                className="text-lg font-black text-white uppercase tracking-widest font-display"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Match Setup Settings
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212] scrollbar-hide">
            <div className="grid grid-cols-2 gap-4">
              {/* Ball Type */}
              <div className="space-y-1">
                <label htmlFor="ballType" className={labelClass}>
                  Ball Type
                </label>
                <select
                  id="ballType"
                  value={formData.ballType}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, ballType: e.target.value }))
                  }
                  className={selectClass}
                >
                  {BALL_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ground Type */}
              <div className="space-y-1">
                <label htmlFor="groundType" className={labelClass}>
                  Ground Type
                </label>
                <select
                  id="groundType"
                  value={formData.groundType}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, groundType: e.target.value }))
                  }
                  className={selectClass}
                >
                  {GROUND_TYPES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pitch Type */}
              <div className="space-y-1">
                <label htmlFor="pitchType" className={labelClass}>
                  Pitch Type
                </label>
                <select
                  id="pitchType"
                  value={formData.pitchType}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, pitchType: e.target.value }))
                  }
                  className={selectClass}
                >
                  {PITCH_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Match Timing */}
              <div className="space-y-1">
                <label htmlFor="matchTiming" className={labelClass}>
                  Match Timing
                </label>
                <select
                  id="matchTiming"
                  value={formData.matchTiming}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, matchTiming: e.target.value }))
                  }
                  className={selectClass}
                >
                  {MATCH_TIMINGS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slow Over-Rate Penalty */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                  Slow Over-Rate Penalty
                </label>
                <div
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.slowOverRateEnabled ? "bg-[#BFF367]" : "bg-white/10"}`}
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      slowOverRateEnabled: !f.slowOverRateEnabled,
                    }))
                  }
                >
                  <motion.div
                    layout
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#121212] shadow-sm ${formData.slowOverRateEnabled ? "right-0.5" : "left-0.5"}`}
                  />
                </div>
              </div>
              <p className="text-[11px] text-white/40 leading-snug">
                If enabled, a penalty of one extra fielder inside the circle
                will be applied if the bowling team is behind schedule.
              </p>
            </div>

            {/* Power Play Overs Mapping */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                  Power Play Overs Mapping
                </label>
                <span className="text-xs text-[#BFF367] font-bold">
                  {(formData.powerPlayMapping || []).length} Selected
                </span>
              </div>
              <p className="text-[11px] text-white/40 leading-snug">
                Select specific overs that will be played as power play overs.
              </p>
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto scrollbar-hide py-1">
                {Array.from({
                  length: (() => {
                    const format = formData.format;
                    if (format === "T20") return 20;
                    if (format === "T10") return 10;
                    if (format === "ODI") return 50;
                    if (format === "THE_HUNDRED") return 20;
                    if (format === "CUSTOM")
                      return formData.customOversPerDay || 20;
                    return 90;
                  })(),
                }).map((_, i) => {
                  const overNum = i + 1;
                  const isSelected = (formData.powerPlayMapping || []).includes(
                    overNum
                  );
                  return (
                    <button
                      key={overNum}
                      type="button"
                      onClick={() => {
                        setFormData((f) => {
                          const mapping = f.powerPlayMapping || [];
                          if (isSelected) {
                            return {
                              ...f,
                              powerPlayMapping: mapping.filter(
                                (n) => n !== overNum
                              ),
                            };
                          } else {
                            return {
                              ...f,
                              powerPlayMapping: [...mapping, overNum].sort(
                                (a, b) => a - b
                              ),
                            };
                          }
                        });
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all border ${isSelected ? "bg-[#BFF367] text-black border-[#BFF367] shadow-[0_0_10px_rgba(191,243,103,0.3)] scale-110" : "bg-white/5 text-white/60 border-white/10 hover:border-white/30 hover:bg-white/10"}`}
                    >
                      {overNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowMatchSettingsPopup(false)}
                className="px-6 py-2.5 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={() => setShowMatchSettingsPopup(false)}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black rounded-[12px] uppercase tracking-widest text-xs hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#55DEE8]/10"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Team Selection Popup ────────────────────────────────────────────────────
  if (selectingTeam) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectingTeam(null)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-full h-screen bg-[#0F0F0F] shadow-2xl overflow-hidden flex flex-col flex-shrink-0"
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/10">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              Select Team {selectingTeam}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/[0.03] rounded-[12px] border border-white/5">
              {["myTeams", "opponentTeams"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTeamTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${teamTab === tab ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg" : "text-white/40 hover:text-white"}`}
                >
                  {tab === "myTeams" ? "My Teams" : "Opponents"}
                </button>
              ))}
            </div>

            {/* Create Team Button */}
            <button
              onClick={() => setShowCreateTeam(true)}
              className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all rounded-[12px] text-[#BFF367] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Create Team
            </button>

            {/* Opponent search */}
            {teamTab === "opponentTeams" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTeamSearch()}
                  placeholder="Search by Team Code..."
                  className={inputClass}
                />
                <button
                  onClick={handleTeamSearch}
                  disabled={isSearching}
                  className="px-3 bg-white/10 hover:bg-white/20 rounded-[12px] transition-colors text-white"
                >
                  {isSearching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                </button>
              </div>
            )}
            {/* Team list */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {teamTab === "myTeams" &&
                myTeams.map((t) => {
                  const tid = t._id || t.id;
                  const isSelected =
                    formData.teamAId === tid || formData.teamBId === tid;
                  return (
                    <button
                      key={tid}
                      onClick={() => selectTeam(tid, t.name)}
                      className="w-full flex items-center justify-between p-3 rounded-[12px] bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        {t.logo ? (
                          <img
                            src={t.logo}
                            className="w-8 h-8 rounded-lg object-cover"
                            alt={t.name}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40">
                            <Users size={14} />
                          </div>
                        )}
                        <span className="font-bold text-white text-sm">
                          {t.name}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-[#BFF367]" />
                      )}
                    </button>
                  );
                })}
              {teamTab === "opponentTeams" && (
                <>
                  {!searchedTeamData &&
                    oppTeams.map((t) => {
                      const tid = t._id || t.id;
                      const isSelected =
                        formData.teamAId === tid || formData.teamBId === tid;
                      return (
                        <button
                          key={tid}
                          onClick={() => selectTeam(tid, t.name)}
                          className="w-full flex items-center justify-between p-3 rounded-[12px] bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            {t.logo ? (
                              <img
                                src={t.logo}
                                className="w-8 h-8 rounded-lg object-cover"
                                alt={t.name}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40">
                                <Swords size={14} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-sm">
                                {t.name}
                              </div>
                              <div className="text-[10px] text-white/40">
                                {t.teamCode}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check size={16} className="text-[#BFF367]" />
                          )}
                        </button>
                      );
                    })}
                  {searchedTeamData?.team && (
                    <button
                      onClick={() =>
                        selectTeam(
                          searchedTeamData.team._id || searchedTeamData.team.id,
                          searchedTeamData.team.name
                        )
                      }
                      className="w-full flex items-center justify-between p-3 rounded-[12px] bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#55DEE8]/30 hover:border-[#55DEE8] transition-all text-left mt-2"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">
                          {searchedTeamData.team.name}
                        </div>
                        <div className="text-[10px] text-[#55DEE8]">
                          Search Result · {searchedTeamData.team.teamCode}
                        </div>
                      </div>
                      <Check size={14} className="text-[#55DEE8]" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-white/10 bg-black flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectingTeam(null)}
              className="w-full py-3 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>
        </motion.div>
        <CreateTeamModal
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          onSuccess={(newTeam) => {
            selectTeam(newTeam.id || newTeam._id, newTeam.name);
            setShowCreateTeam(false);
          }}
        />
      </div>
    );
  }

  // ─── Player Selection Popup ──────────────────────────────────────────────────
  let playerPopupNode = null;
  if (playerPopup) {
    const teamDetailsForPopup =
      playerPopup.teamKey === "A" ? teamADetails : teamBDetails;
    const rosterMembers = teamDetailsForPopup?.team
      ? [
          ...(teamDetailsForPopup.team.members || []).map((m) => ({
            id: m.user?.id || m.userId,
            name: m.user?.name || m.user?.username || "Player",
            username: m.user?.username,
            profilePicture: m.user?.profilePicture || null,
            role: m.role || "PLAYER",
            isCustom: false,
          })),
          ...(teamDetailsForPopup.team.customMembers || []).map((m) => ({
            id: m.id,
            name: m.name || "Custom Player",
            profilePicture: null,
            role: "PLAYER",
            isCustom: true,
          })),
        ]
      : [];

    playerPopupNode = (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setPlayerPopup(null);
            setCustomInviteData(null);
          }}
        />
        <motion.div
          key="playerPopupAnim"
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-full h-screen bg-[#0F0F0F] shadow-2xl overflow-hidden flex flex-col flex-shrink-0"
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              {playerPopup.action === "REPLACE"
                ? "Replace Player"
                : "Add Player"}
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button
              onClick={() => setActivePlayerTab("roster")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activePlayerTab === "roster" ? "text-[#BFF367] border-b-2 border-[#BFF367]" : "text-white/40 hover:text-white/80"}`}
            >
              Roster
            </button>
            <button
              onClick={() => setActivePlayerTab("search")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activePlayerTab === "search" ? "text-[#BFF367] border-b-2 border-[#BFF367]" : "text-white/40 hover:text-white/80"}`}
            >
              Search
            </button>
            <button
              onClick={() => setActivePlayerTab("custom")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activePlayerTab === "custom" ? "text-[#BFF367] border-b-2 border-[#BFF367]" : "text-white/40 hover:text-white/80"}`}
            >
              Custom
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {activePlayerTab === "roster" ? (
              <div className="space-y-2">
                {rosterMembers.length > 0 ? (
                  rosterMembers.map((p) => {
                    const currentList =
                      playerPopup.teamKey === "A"
                        ? formData.teamAPlayers
                        : formData.teamBPlayers;
                    const isAdded = currentList.some((cp) => cp.id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (isAdded) {
                            setFormData((f) => {
                              const key =
                                playerPopup.teamKey === "A"
                                  ? "teamAPlayers"
                                  : "teamBPlayers";
                              return {
                                ...f,
                                [key]: f[key].filter((cp) => cp.id !== p.id),
                              };
                            });
                          } else {
                            selectPlayer(p);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-[12px] border transition-all text-left ${isAdded ? "bg-[#BFF367]/10 border-[#BFF367]/30" : "bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10"}`}
                      >
                        <div className="flex items-center gap-3">
                          {p.profilePicture ? (
                            <img
                              src={p.profilePicture}
                              className="w-10 h-10 rounded-full object-cover"
                              alt={p.name}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                              <Users size={16} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {p.username || p.name}
                            </div>
                            <div className="text-xs text-white/40">
                              {p.isCustom ? "Custom Player" : p.name}
                            </div>
                          </div>
                        </div>
                        {!isAdded && (
                          <div className="p-2 rounded-full bg-[#BFF367]/10 text-[#BFF367]">
                            <Plus size={16} />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-white/40">
                    <Users size={32} className="mx-auto mb-3 opacity-50" />
                    <div className="text-sm font-bold text-white mb-1">
                      No players in roster
                    </div>
                    <div className="text-xs">
                      Add players via Search or Custom
                    </div>
                  </div>
                )}
              </div>
            ) : activePlayerTab === "search" ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    {isSearchingPlayers ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                  </div>
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder="Search by name, username, or phone..."
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <div className="space-y-2">
                  {searchPlayersData?.players?.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleInviteAndAdd(p)}
                      className="w-full flex items-center justify-between p-3 rounded-[12px] bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        {p.profilePicture ? (
                          <img
                            src={p.profilePicture}
                            className="w-10 h-10 rounded-full object-cover"
                            alt={p.username}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                            <Users size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {p.username}
                          </div>
                          <div className="text-xs text-white/40">{p.name}</div>
                        </div>
                      </div>
                      <div className="bg-[#BFF367]/10 text-[#BFF367] p-2 rounded-full">
                        <UserPlus size={16} />
                      </div>
                    </button>
                  ))}

                  {!isSearchingPlayers &&
                    playerSearchQuery &&
                    !searchPlayersData?.players?.length && (
                      <div className="text-center py-8 text-white/40">
                        <UserCheck
                          size={32}
                          className="mx-auto mb-3 opacity-50"
                        />
                        <div className="text-sm font-bold text-white mb-1">
                          No players found
                        </div>
                        <div className="text-xs">
                          Try searching by a different name or phone
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!customInviteData ? (
                  <form
                    id="customPlayerForm"
                    onSubmit={handleAddCustomPlayerSubmit}
                    className="space-y-4"
                  >
                    {supportsContacts && (
                      <button
                        type="button"
                        onClick={handleImportFromContacts}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#121212] border border-white/10 rounded-[12px] text-[#BFF367] font-semibold text-xs hover:border-[#BFF367]/30 transition-colors uppercase tracking-wider"
                      >
                        <Users size={16} /> Add player from your contacts
                      </button>
                    )}

                    <div>
                      <label className={labelClass}>Player Name *</label>
                      <input
                        type="text"
                        value={customPlayerName}
                        onChange={(e) => setCustomPlayerName(e.target.value)}
                        placeholder="E.g., Virat Kohli"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <div className="flex bg-[#121212] border border-white/10 rounded-[12px] focus-within:border-[#55DEE8]/30 transition-colors h-[44px] overflow-hidden">
                        <select
                          value={customPlayerCountryCode}
                          onChange={(e) =>
                            setCustomPlayerCountryCode(e.target.value)
                          }
                          className="w-[90px] bg-transparent text-white text-sm outline-none px-2 border-r border-white/10 cursor-pointer"
                        >
                          {countryCodes.map((c) => (
                            <option
                              key={c.code}
                              value={c.dial_code}
                              className="bg-[#121212] text-white"
                            >
                              {c.code} (+{c.dial_code})
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          value={customPlayerPhone}
                          onChange={(e) =>
                            setCustomPlayerPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          placeholder="9876543210"
                          className="flex-1 bg-transparent text-white text-sm px-3 outline-none placeholder:text-white/30"
                        />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1.5 ml-1 flex items-center gap-1">
                        <Phone size={10} /> Add phone to send them a WhatsApp
                        invite
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-3 py-4">
                    <div className="w-16 h-16 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#25D366]/30">
                      <MessageCircle size={32} className="text-[#25D366]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white mb-2">
                        Invite Ready!
                      </h4>
                      <p className="text-sm text-white/60 mb-6">
                        {customInviteData.name} has been added to the team. Send
                        them a WhatsApp invite so they can claim their profile.
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const message = `Hey ${customInviteData.name}! I've added you to our team on Kridaz. Click here to join: ${window.location.origin}/invite?token=${customInviteData.token}`;
                            window.open(
                              `https://wa.me/${customInviteData.countryCode}${customInviteData.phone}?text=${encodeURIComponent(message)}`,
                              "_blank"
                            );
                            setPlayerPopup(null);
                            setCustomInviteData(null);
                          }}
                          className="flex-1 py-3 bg-[#25D366] text-white font-bold rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
                        >
                          <MessageCircle size={18} />
                          Send WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            setPlayerPopup(null);
                            setCustomInviteData(null);
                          }}
                          className="py-3 px-6 bg-white/10 text-white font-bold rounded-[12px] hover:bg-white/20 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 p-4 border-t border-white/10 bg-black flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setPlayerPopup(null);
                setCustomInviteData(null);
              }}
              className={`${activePlayerTab === "custom" && !customInviteData ? "px-6" : "w-full"} py-3 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest`}
            >
              Next <ChevronRight size={14} />
            </button>
            {activePlayerTab === "custom" && !customInviteData && (
              <button
                type="submit"
                form="customPlayerForm"
                disabled={isAddingCustom || !customPlayerName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black rounded-[12px] uppercase tracking-wider text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {isAddingCustom && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Add Custom Player
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Steps renderer ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: Match Setup ───────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4 pt-2 pb-2">
            <TouchSliderWheel
              label="Max Members per Team"
              value={formData.maxMembers || 11}
              min={5}
              max={15}
              onChange={(val) =>
                setFormData((f) => ({ ...f, maxMembers: val }))
              }
            />

            {/* Teams & Members Selection Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 mt-6 mb-6">
              <div className="mb-3 px-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Select Teams & Members
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 relative z-10">
                {/* Team A */}
                <div
                  className="min-w-0 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 cursor-pointer transition-all"
                  onClick={() => {
                    setXiTab("A");
                    if (!formData.teamAId) {
                      setSelectingTeam("A");
                    } else {
                      setStep(2);
                    }
                  }}
                >
                  <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#121212] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                    {formData.teamAId ? (
                      teamADetails?.team?.logo ? (
                        <img
                          src={teamADetails.team.logo}
                          alt="Team A"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base sm:text-lg font-black text-[#BFF367]">
                          {getTeamName(formData.teamAId).charAt(0)}
                        </span>
                      )
                    ) : (
                      <span className="text-base sm:text-lg font-black text-[#BFF367]">
                        A
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-bold text-[10px] sm:text-[11px] truncate tracking-wider uppercase">
                      {getTeamName(formData.teamAId) || "SELECT TEAM A"}
                    </span>
                    <span className="text-white/40 text-[9px] sm:text-[10px] mt-0.5 tracking-wide truncate">
                      <span className="text-[#BFF367]">
                        {formData.teamAPlayers.length}/{formData.maxMembers}
                      </span>{" "}
                      Players
                    </span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center z-20 shadow-xl">
                  <span className="text-white text-[8px] sm:text-[9px] font-black">
                    VS
                  </span>
                </div>

                {/* Team B */}
                <div
                  className="min-w-0 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 cursor-pointer transition-all"
                  onClick={() => {
                    setXiTab("B");
                    if (!formData.teamBId) {
                      setSelectingTeam("B");
                    } else {
                      setStep(2);
                    }
                  }}
                >
                  <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#121212] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                    {formData.teamBId ? (
                      teamBDetails?.team?.logo ? (
                        <img
                          src={teamBDetails.team.logo}
                          alt="Team B"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base sm:text-lg font-black text-[#BFF367]">
                          {getTeamName(formData.teamBId).charAt(0)}
                        </span>
                      )
                    ) : (
                      <span className="text-base sm:text-lg font-black text-[#BFF367]">
                        B
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-bold text-[10px] sm:text-[11px] truncate tracking-wider uppercase">
                      {getTeamName(formData.teamBId) || "SELECT TEAM B"}
                    </span>
                    <span className="text-white/40 text-[9px] sm:text-[10px] mt-0.5 tracking-wide truncate">
                      <span className="text-[#BFF367]">
                        {formData.teamBPlayers.length}/{formData.maxMembers}
                      </span>{" "}
                      Players
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Match Format */}
              <div className="space-y-1">
                <label htmlFor="format" className={labelClass}>
                  Match Format
                </label>
                <select
                  id="format"
                  value={formData.format}
                  onChange={(e) => {
                    const format = e.target.value;
                    let defaultPowerPlay = 6;
                    if (format === "T10") defaultPowerPlay = 3;
                    if (format === "ODI") defaultPowerPlay = 10;
                    setFormData((f) => ({
                      ...f,
                      format,
                      powerPlayOvers: defaultPowerPlay,
                      powerPlayMapping: Array.from(
                        { length: defaultPowerPlay },
                        (_, i) => i + 1
                      ),
                    }));
                  }}
                  className={selectClass}
                >
                  {CRICKET_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label} ({f.sub})
                    </option>
                  ))}
                </select>
              </div>

              {/* Match Date & Time */}
              <div className="space-y-1">
                <label className={labelClass}>Match Date & Time</label>
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="w-full bg-[#121212] border border-white/10 rounded-[12px] px-4 py-2.5 text-left text-white focus:outline-none focus:border-[#55DEE8]/30 transition-all text-sm font-semibold animate-pulse-subtle"
                >
                  <span className="block truncate">
                    {formData.matchDateTime
                      ? (() => {
                          const d = new Date(formData.matchDateTime);
                          if (isNaN(d.getTime())) return "Select Date & Time";
                          return d.toLocaleString("en-US", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        })()
                      : "Select Date & Time"}
                  </span>
                </button>
              </div>
            </div>

            {formData.format === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-[12px] border border-white/10">
                <div className="space-y-1">
                  <label htmlFor="customDays" className={labelClass}>
                    Days
                  </label>
                  <input
                    id="customDays"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.customDays}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        customDays: Math.min(
                          10,
                          Math.max(1, parseInt(e.target.value) || 1)
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="customOversPerDay" className={labelClass}>
                    Overs per Day
                  </label>
                  <input
                    id="customOversPerDay"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.customOversPerDay}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        customOversPerDay: Math.min(
                          100,
                          Math.max(1, parseInt(e.target.value) || 1)
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Venue & Power Play */}
            <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
              {/* Venue */}
              <div className="space-y-1">
                <label className={labelClass}>VENUE</label>
                <button
                  type="button"
                  onClick={() => setShowVenuePopup(true)}
                  className="w-full bg-[#121212] border border-white/10 rounded-[12px] px-4 py-2.5 text-left text-white focus:outline-none focus:border-[#55DEE8]/30 transition-all text-sm font-semibold flex items-center justify-between"
                >
                  <span className="flex-1 min-w-0 block truncate text-white mr-2 text-left">
                    {formData.customVenue
                      ? formData.customVenue
                      : formData.venueId
                        ? groundsData?.grounds?.find(
                            (g) => g.id === formData.venueId
                          )?.name || "Sports Venue"
                        : "Select Venue"}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-white/40 flex-shrink-0"
                  />
                </button>
              </div>

              {/* Power Play Overs */}
              <div className="space-y-1">
                <label className={`${labelClass} flex items-center gap-1`}>
                  POWER PLAY OVERS
                  <Info size={12} className="text-white/40" />
                </label>
                <div className="w-full bg-[#121212] border border-white/10 rounded-[12px] flex items-stretch overflow-hidden h-[42px]">
                  {(formData.format === "T10"
                    ? [1, 2, 3, 4, 5]
                    : formData.format === "ODI"
                      ? [8, 9, 10, 11, 12]
                      : [4, 5, 6, 7, 8]
                  ).map((over) => {
                    const isSelected = formData.powerPlayOvers === over;
                    return (
                      <button
                        key={over}
                        type="button"
                        onClick={() =>
                          setFormData((f) => ({
                            ...f,
                            powerPlayOvers: over,
                            powerPlayMapping: Array.from(
                              { length: over },
                              (_, i) => i + 1
                            ),
                          }))
                        }
                        className={`flex-1 flex items-center justify-center text-[12px] font-black transition-all ${
                          isSelected
                            ? "bg-[#BFF367] text-black shadow-inner z-10"
                            : "text-white/40 hover:bg-white/5 hover:text-white border-r border-white/5 last:border-0"
                        }`}
                      >
                        {over}
                      </button>
                    );
                  })}
                </div>
                {formData.powerPlayMapping &&
                  formData.powerPlayMapping.length > 0 && (
                    <div className="mt-1 text-[10px] text-white/40 font-semibold">
                      Mapped Overs:{" "}
                      {(() => {
                        const m = [...formData.powerPlayMapping].sort(
                          (a, b) => a - b
                        );
                        if (m.length === 0) return "None";
                        if (m[m.length - 1] === m.length && m[0] === 1) {
                          return `1 to ${m.length}`;
                        }
                        return m.join(", ");
                      })()}
                    </div>
                  )}
              </div>
            </div>

            {/* Match Officials */}
            <div className="space-y-3 mt-6 mb-2">
              <div className="px-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Match Officials{" "}
                  <span className="normal-case tracking-normal">
                    (Optional)
                  </span>
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {/* Umpires */}
                <div className="min-w-[110px] flex-1 bg-[#121212] border border-white/5 rounded-xl py-2 px-3 flex flex-col items-center gap-1.5 snap-start relative">
                  <div className="absolute inset-0 bg-[#55DEE8]/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="text-[#55DEE8] relative z-10">
                    <UserCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-center relative z-10 mb-1">
                    <div className="text-white text-[10px] font-bold tracking-widest uppercase mt-1">
                      Umpires
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProRoleFilter("UMPIRE");
                      setShowProfessionalsPopup(true);
                    }}
                    className="w-full py-1.5 rounded-lg border border-[#55DEE8]/30 hover:bg-[#55DEE8]/10 text-[#55DEE8] text-[10px] font-bold tracking-wider transition-colors mt-2 relative z-10"
                  >
                    ADD
                  </button>
                </div>

                {/* Scorer */}
                <div className="min-w-[110px] flex-1 bg-[#121212] border border-white/5 rounded-xl py-2 px-3 flex flex-col items-center gap-1.5 snap-start relative">
                  <div className="absolute inset-0 bg-[#BFF367]/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="text-[#BFF367] relative z-10">
                    <ClipboardList size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-center relative z-10 mb-1">
                    <div className="text-white text-[10px] font-bold tracking-widest uppercase mt-1">
                      Scorer
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProRoleFilter("SCORER");
                      setShowProfessionalsPopup(true);
                    }}
                    className="w-full py-1.5 rounded-lg border border-[#BFF367]/30 hover:bg-[#BFF367]/10 text-[#BFF367] text-[10px] font-bold tracking-wider transition-colors mt-2 relative z-10"
                  >
                    ADD
                  </button>
                </div>

                {/* Streamer */}
                <div className="min-w-[110px] flex-1 bg-[#121212] border border-white/5 rounded-xl py-2 px-3 flex flex-col items-center gap-1.5 snap-start relative">
                  <div className="absolute inset-0 bg-[#A855F7]/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="text-[#A855F7] relative z-10">
                    <Radio size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-center relative z-10 mb-1">
                    <div className="text-white text-[10px] font-bold tracking-widest uppercase mt-1">
                      Streamer
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProRoleFilter("STREAMER");
                      setShowProfessionalsPopup(true);
                    }}
                    className="w-full py-1.5 rounded-lg border border-[#A855F7]/30 hover:bg-[#A855F7]/10 text-[#A855F7] text-[10px] font-bold tracking-wider transition-colors mt-2 relative z-10"
                  >
                    ADD
                  </button>
                </div>

                {/* Commentator */}
                <div className="min-w-[110px] flex-1 bg-[#121212] border border-white/5 rounded-xl py-2 px-3 flex flex-col items-center gap-1.5 snap-start relative">
                  <div className="absolute inset-0 bg-[#EC4899]/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="text-[#EC4899] relative z-10">
                    <Mic size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-center relative z-10 mb-1">
                    <div className="text-white text-[10px] font-bold tracking-widest uppercase mt-1">
                      Commentator
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProRoleFilter("COMMENTATOR");
                      setShowProfessionalsPopup(true);
                    }}
                    className="w-full py-1.5 rounded-lg border border-[#EC4899]/30 hover:bg-[#EC4899]/10 text-[#EC4899] text-[10px] font-bold tracking-wider transition-colors mt-2 relative z-10"
                  >
                    ADD
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/30 px-1 mt-1">
                <Info size={12} className="flex-shrink-0" />
                <span className="text-[10px]">
                  You can add officials from your contacts or enter mobile
                  numbers.
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Match Setup</label>
              <button
                type="button"
                onClick={() => setShowMatchSettingsPopup(true)}
                className="w-full bg-[#121212] border border-white/10 rounded-[12px] px-4 py-3 text-left text-white focus:outline-none focus:border-[#55DEE8]/30 transition-all text-sm font-semibold"
              >
                <span className="block truncate">{`${BALL_TYPES.find((b) => b.value === formData.ballType)?.label || "Tennis Ball"} · ${GROUND_TYPES.find((g) => g.value === formData.groundType)?.label || "Outdoor Ground"} · ${PITCH_TYPES.find((p) => p.value === formData.pitchType)?.label || "Turf"} · ${MATCH_TIMINGS.find((m) => m.value === formData.matchTiming)?.label || "Day Match"}`}</span>
              </button>
            </div>
          </div>
        );

      // ── Step 2: Playing XIs ───────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4 pt-1">
            <h3 className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">SELECT COMPETING TEAMS</h3>
            <div className="flex flex-col gap-4">
              {[{ key: 'A', label: 'TEAM A', color: '#45DADA' }, { key: 'B', label: 'TEAM B', color: '#69DE80' }].map(({ key, label, color }) => {
                const id = key === 'A' ? formData.teamAId : formData.teamBId;
                const name = id ? getTeamName(id) : null;
                const team = allTeams.find(t => (t._id || t.id) === id);
                return (
                  <button 
                    key={key} 
                    onClick={() => setSelectingTeam(key)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 active:scale-[0.98] transition-all p-5 rounded-[12px] flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-4">
                      {team?.logo ? (
                        <img src={team.logo} className="w-16 h-16 rounded-[12px] object-cover border border-white/10" alt="" />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-[12px] flex items-center justify-center transition-colors" 
                          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                        >
                          <Users size={28} style={{ color }} />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color }}>{label}</span>
                        <p className="text-white font-bold text-base transition-colors group-hover:text-[#45DADA]">{name || `Select ${label}`}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/30 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
            {formData.teamAId && formData.teamBId && formData.teamAId === formData.teamBId && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-[8px] p-3 mt-2">
                Team A and Team B cannot be the same team.
              </p>
            )}
          </div>
        );

      // ── Step 3: Playing XIs ───────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex border-b border-white/10 flex-shrink-0">
              <button
                onClick={() => setXiTab("A")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors truncate px-2 ${xiTab === "A" ? "text-[#55DEE8] border-b-2 border-[#55DEE8]" : "text-white/40 hover:text-white/80"}`}
              >
                {getTeamName(formData.teamAId) || "TBD"}
              </button>
              <button
                onClick={() => setXiTab("B")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors truncate px-2 ${xiTab === "B" ? "text-[#BFF367] border-b-2 border-[#BFF367]" : "text-white/40 hover:text-white/80"}`}
              >
                {getTeamName(formData.teamBId) || "TBD"}
              </button>
            </div>
            {xiTab === "A" ? (
              !formData.teamAId ? (
                <div className="flex flex-col gap-4 mt-8">
                  <button
                    onClick={() => setSelectingTeam("A")}
                    className="w-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 active:scale-[0.98] transition-all p-4 rounded-[12px] flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-[12px] flex items-center justify-center transition-colors"
                        style={{
                          background: "#55DEE815",
                          border: "1px solid #55DEE825",
                        }}
                      >
                        <Users size={28} style={{ color: "#55DEE8" }} />
                      </div>
                      <div>
                        <span
                          className="text-[10px] font-black uppercase tracking-widest block mb-1"
                          style={{ color: "#55DEE8" }}
                        >
                          TEAM A
                        </span>
                        <p className="text-white font-bold text-base transition-colors group-hover:text-[#55DEE8]">
                          Select TEAM A
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-white/30 group-hover:text-white transition-colors"
                    />
                  </button>
                </div>
              ) : (
                <PlayingXIStep
                  teamKey="A"
                  teamName={getTeamName(formData.teamAId)}
                  players={formData.teamAPlayers}
                  maxMembers={formData.maxMembers}
                  teamDetails={teamADetails?.team}
                  onInit={() => initPlayersFromTeam("A")}
                  onRemove={(id) => removePlayer("A", id)}
                  onAdd={() => {
                    setPlayerPopup({
                      teamKey: "A",
                      action: "ADD",
                      replaceId: null,
                    });
                    setActivePlayerTab("roster");
                  }}
                  onReplace={(id) => {
                    setPlayerPopup({
                      teamKey: "A",
                      action: "REPLACE",
                      replaceId: id,
                    });
                    setActivePlayerTab("roster");
                  }}
                  onRoleChange={(id, role) => changePlayerRole("A", id, role)}
                />
              )
            ) : !formData.teamBId ? (
              <div className="flex flex-col gap-4 mt-8">
                <button
                  onClick={() => setSelectingTeam("B")}
                  className="w-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 active:scale-[0.98] transition-all p-4 rounded-[12px] flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-[12px] flex items-center justify-center transition-colors"
                      style={{
                        background: "#BFF36715",
                        border: "1px solid #BFF36725",
                      }}
                    >
                      <Users size={28} style={{ color: "#BFF367" }} />
                    </div>
                    <div>
                      <span
                        className="text-[10px] font-black uppercase tracking-widest block mb-1"
                        style={{ color: "#BFF367" }}
                      >
                        TEAM B
                      </span>
                      <p className="text-white font-bold text-base transition-colors group-hover:text-[#BFF367]">
                        Select TEAM B
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-white/30 group-hover:text-white transition-colors"
                  />
                </button>
              </div>
            ) : (
              <PlayingXIStep
                teamKey="B"
                teamName={getTeamName(formData.teamBId)}
                players={formData.teamBPlayers}
                maxMembers={formData.maxMembers}
                teamDetails={teamBDetails?.team}
                onInit={() => initPlayersFromTeam("B")}
                onRemove={(id) => removePlayer("B", id)}
                onAdd={() => {
                  setPlayerPopup({
                    teamKey: "B",
                    action: "ADD",
                    replaceId: null,
                  });
                  setActivePlayerTab("roster");
                }}
                onReplace={(id) => {
                  setPlayerPopup({
                    teamKey: "B",
                    action: "REPLACE",
                    replaceId: id,
                  });
                  setActivePlayerTab("roster");
                }}
                onRoleChange={(id, role) => changePlayerRole("B", id, role)}
              />
            )}
          </div>
        );

      // ── Step 4: Add-ons (Venue + Professionals) ───────────────────────────────
      case 4:
        return (
          <div className="space-y-5 h-full flex flex-col relative pb-16">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">Add-ons</h3>
              <p className="text-sm text-white/40">Optionally hire a venue or professionals. You can skip this step.</p>
            </div>

            <div className="flex p-1 bg-[#1A1A1A] rounded-[8px] flex-shrink-0">
              <button onClick={() => setAddonsTab('VENUE')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all ${addonsTab === 'VENUE' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/60 hover:text-white'}`}>
                VENUE
              </button>
              <button onClick={() => setAddonsTab('PROFESSIONALS')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all ${addonsTab === 'PROFESSIONALS' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/60 hover:text-white'}`}>
                PROFESSIONALS
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {addonsTab === 'VENUE' && (
                <div className="space-y-4 pr-1">
                  {/* Venue Search & Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search venues..."
                        className={`${inputClass} pl-10 py-2 text-sm`}
                        value={venueSearchQuery}
                        onChange={e => setVenueSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <CustomDropdown
                        className="w-1/2"
                        value={venueStateFilter}
                        onChange={setVenueStateFilter}
                        placeholder="All States"
                        options={[{value: '', label: 'All States'}, ...states]}
                      />
                      <CustomDropdown
                        className="w-1/2"
                        value={venueCityFilter}
                        onChange={setVenueCityFilter}
                        placeholder="All Cities"
                        options={[{value: '', label: 'All Cities'}, ...venueCities]}
                        disabled={!venueStateFilter}
                      />
                    </div>
                  </div>

                  {/* Venue List */}
                  <div className="space-y-2">
                    {formData.customVenue && (
                      <button onClick={() => setFormData(f => ({ ...f, customVenue: '', location: '' }))}
                        className="w-full flex items-center justify-between p-4 rounded-[12px] border border-dashed transition-all text-left bg-[#1a1a1a] border-white/20 hover:border-white/40 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                            <MapPin size={18} className="text-white/60" />
                          </div>
                          <div>
                            <div className="font-black text-white text-sm tracking-wide flex items-center gap-2">
                              {formData.customVenue}
                            </div>
                            <div className="text-xs text-white/40 mt-0.5">{formData.location || 'Custom Location'}</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {isLoadingGrounds ? (
                      <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/40" /></div>
                    ) : (() => {
                      const filteredVenues = groundsData?.grounds?.filter(g =>
                        (!venueStateFilter || g.state === venueStateFilter) &&
                        (!venueCityFilter || g.city === venueCityFilter) &&
                        (!venueSearchQuery || 
                          g.name.toLowerCase().includes(venueSearchQuery.toLowerCase()) || 
                          (g.city && g.city.toLowerCase().includes(venueSearchQuery.toLowerCase())))
                      ) || [];

                      if (filteredVenues.length === 0 && !formData.customVenue) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <EyeOff size={40} className="mb-4" />
                            <div className="text-sm italic font-medium">No listed venues match your filters.</div>
                          </div>
                        );
                      }

                      return filteredVenues.map(g => (
                        <button key={g.id} onClick={() => setFormData(f => ({ ...f, venueId: f.venueId === g.id ? null : g.id, customVenue: '' }))}
                          className={`w-full flex items-center justify-between p-3 rounded-[8px] border transition-all text-left ${formData.venueId === g.id ? 'bg-[#55DEE8]/10 border-[#55DEE8]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <MapPin size={18} className={formData.venueId === g.id ? 'text-[#55DEE8]' : 'text-white/40'} />
                            <div>
                              <div className="font-bold text-white text-sm">{g.name}</div>
                              <div className="text-[10px] text-white/40">{g.city}</div>
                            </div>
                          </div>
                          {formData.venueId === g.id && <Check size={16} className="text-[#55DEE8]" />}
                        </button>
                      ));
                    })()}
                  </div>

                </div>
              )}
              {addonsTab === 'PROFESSIONALS' && (
                <div className="space-y-4 pr-1">
                  {/* Professionals Search & Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search professionals (name, phone, email)..."
                        className={`${inputClass} pl-10 py-2 text-sm`}
                        value={proSearchQuery}
                        onChange={e => setProSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <CustomDropdown
                        className="w-1/2"
                        value={proCityFilter}
                        onChange={setProCityFilter}
                        placeholder="All Cities"
                        options={[{value: '', label: 'All Cities'}, ...Array.from(new Set(umpiresData?.umpires?.map(u => u.city).filter(Boolean) || []))]}
                      />
                      <CustomDropdown
                        className="w-1/2"
                        value={proRoleFilter}
                        onChange={setProRoleFilter}
                        placeholder="All Roles"
                        options={[
                          {value: '', label: 'All Roles'},
                          {value: 'UMPIRE', label: 'Umpire'},
                          {value: 'SCORER', label: 'Scorer'},
                          {value: 'COMMENTATOR', label: 'Commentator'}
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-[25px]">
                    {/* List Custom Professionals already added */}
                    {formData.customProfessionals?.map((cp, idx) => (
                      <div key={`custom-${idx}`} className="w-full flex flex-col p-0 rounded-[4px] overflow-hidden transition-all text-left bg-transparent relative">
                        {/* Remove button */}
                        <button onClick={() => setFormData(f => ({ ...f, customProfessionals: f.customProfessionals.filter((_, i) => i !== idx) }))}
                          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-red-500/80 transition-colors">
                          <X size={16} className="text-white" />
                        </button>
                        
                        {/* Image Section */}
                        <div className="w-full aspect-[4/3] relative bg-white/5">
                          {(() => {
                            let roleImage = null;
                            if (cp.role === 'UMPIRE') roleImage = '/images/roles/umpire.png';
                            if (cp.role === 'SCORER') roleImage = '/images/roles/scorer.png';
                            if (cp.role === 'COMMENTATOR') roleImage = '/images/roles/commentator.png';
                            if (cp.role === 'STREAMER') roleImage = '/images/roles/streamer.png';
                            
                            if (roleImage) {
                              return <img src={roleImage} alt={cp.role} className="w-full h-full object-cover" />;
                            }
                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center opacity-50 bg-[#1a1a1a]">
                                {cp.role === 'COMMENTATOR' ? <Mic size={40} className="text-white/20 mb-2" /> : cp.role === 'SCORER' ? <CheckSquare size={40} className="text-white/20 mb-2" /> : <UserCheck size={40} className="text-white/20 mb-2" />}
                                <span className="text-xs font-medium text-white/40">No Image</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Details Section */}
                        <div className="pt-3 pb-4 px-3 flex flex-col gap-1 w-full bg-transparent">
                          <div className="flex justify-between items-start w-full gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-bold text-white text-[15px] truncate">{cp.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{cp.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoadingUmpires ? (
                      <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/40" /></div>
                    ) : (() => {
                      const filteredPros = umpiresData?.umpires?.filter(u =>
                        (!proRoleFilter || u.role === proRoleFilter) &&
                        (!proStateFilter || u.state === proStateFilter) &&
                        (!proCityFilter || u.city === proCityFilter) &&
                        (!proSearchQuery || 
                          u.name?.toLowerCase().includes(proSearchQuery.toLowerCase()) || 
                          u.username?.toLowerCase().includes(proSearchQuery.toLowerCase()))
                      ) || [];

                      return filteredPros.length > 0 ? (
                        filteredPros.map(u => {
                          const isSelected = formData.professionals.includes(u.id);
                          return (
                              <button key={u.id} onClick={() => setFormData(f => ({ ...f, professionals: isSelected ? f.professionals.filter(id => id !== u.id) : [...f.professionals, u.id] }))}
                                className={`w-full flex flex-col p-0 rounded-[16px] overflow-hidden transition-all text-left ${isSelected ? 'shadow-[0_0_15px_rgba(191,243,103,0.15)] ring-1 ring-[#BFF367]' : 'bg-transparent'}`}>
                                {/* Image Section */}
                                <div className="w-full aspect-[4/3] relative bg-white/5">
                                  {u.profilePicture ? (
                                    <img src={u.profilePicture} className="w-full h-full object-cover" alt={u.name} />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center opacity-50 bg-[#1a1a1a]">
                                      <UserCheck size={40} className="text-white/20 mb-2" />
                                      <span className="text-xs font-medium text-white/40">No Image</span>
                                    </div>
                                  )}
                                  
                                  {/* Heart / Favorite Icon */}
                                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
                                    <Heart size={16} className="text-white" />
                                  </div>

                                  {/* Selected Overlay */}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-[#BFF367]/10 flex items-center justify-center backdrop-blur-[1px]">
                                      <div className="w-12 h-12 rounded-full bg-[#BFF367] flex items-center justify-center shadow-xl">
                                        <Check size={24} className="text-black" />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Details Section */}
                                <div className="pt-3 pb-4 px-1 flex flex-col gap-1 w-full bg-transparent">
                                  <div className="flex justify-between items-start w-full gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div className="w-5 h-5 rounded-full bg-[#FFC107] flex items-center justify-center shrink-0">
                                        <MapPin size={12} className="text-black fill-black" />
                                      </div>
                                      <span className="font-bold text-white text-[15px] truncate">{u.name || 'Professional'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                      <span className="text-[13px] text-[#FFC107] font-bold">{u.rating || '4.8'}</span>
                                      <Star size={13} className="text-[#FFC107] fill-[#FFC107]" />
                                    </div>
                                  </div>
                                  <div className="text-[13px] text-white/50 truncate">
                                    {u.distance || '0.7 km away'}
                                  </div>
                                </div>
                              </button>
                          );
                        })
                      ) : (
                        formData.customProfessionals?.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <EyeOff size={40} className="mb-4" />
                            <div className="text-sm italic font-medium">No professionals match your search.</div>
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ── Step 5: Final Review + Confirm ─────────────────────────────────────────
      case 5: {
        const teamAName = getTeamName(formData.teamAId);
        const teamBName = getTeamName(formData.teamBId);
        const formatLabel = CRICKET_FORMATS.find(f => f.value === formData.format)?.label || formData.format;
        const ballLabel = BALL_TYPES.find(b => b.value === formData.ballType)?.label || formData.ballType;
        const groundLabel = GROUND_TYPES.find(g => g.value === formData.groundType)?.label || formData.groundType;
        const timingLabel = MATCH_TIMINGS.find(t => t.value === formData.matchTiming)?.label || formData.matchTiming;
        const selectedVenueName = formData.venueId ? groundsData?.grounds?.find(g => g.id === formData.venueId)?.name : null;
        return (
          <div className="space-y-5">
            {/* Match Summary */}
            <div className="bg-white/[0.03] rounded-[8px] border border-white/5 p-4 space-y-8">
              <div className="flex items-center justify-between w-full text-white font-black text-xl">
                <span className="truncate flex-1 text-left">{teamAName}</span>
                <span className="text-white/30 text-sm px-4">vs</span>
                <span className="truncate flex-1 text-right">{teamBName}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-white/5 rounded-[8px] p-4 flex items-center justify-between">
                  <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Ball</div>
                  <div className="text-white text-sm font-bold">{ballLabel}</div>
                </div>
                <div className="bg-white/5 rounded-[8px] p-4 flex items-center justify-between">
                  <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Ground</div>
                  <div className="text-white text-sm font-bold truncate text-right max-w-[60%]" title={selectedVenueName || groundLabel}>
                    {selectedVenueName || groundLabel}
                  </div>
                </div>
                <div className="bg-white/5 rounded-[8px] p-4 flex items-center justify-between">
                  <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Players</div>
                  <div className="text-white text-sm font-bold">{formData.maxMembers} per side</div>
                </div>
              </div>

            </div>
            {/* Security */}
            <div>
              <label className={labelClass}><Shield size={12} className="inline mr-1" />Scoring App Password <span className="text-red-500">*</span></label>
              <input type="password" value={formData.scoringPassword}
                onChange={e => setFormData(f => ({ ...f, scoringPassword: e.target.value }))}
                className={inputClass} placeholder="Minimum 6 characters required" />
            </div>
            {/* YouTube Live URL */}
            <div>
              <label className={labelClass}><Video size={12} className="inline mr-1" />YouTube Live URL <span className="text-white/30">(Optional)</span></label>
              <input type="url" value={formData.youtubeLiveUrl}
                onChange={e => setFormData(f => ({ ...f, youtubeLiveUrl: e.target.value }))}
                className={inputClass} placeholder="https://youtube.com/live/..." />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ─── Main Modal ───────────────────────────────────────────────────────────────
  const portalTarget =
    typeof document !== "undefined"
      ? document.getElementById("root") || document.body
      : null;
  if (!portalTarget) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#55DEE8] w-12 h-12" />
              <p className="text-white text-xs font-black tracking-widest uppercase animate-pulse">
                Creating Match...
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-full h-[100dvh] sm:h-screen bg-[#121212] shadow-2xl overflow-hidden flex flex-col flex-shrink-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 bg-black flex-shrink-0">
                <div>
                  <h2
                    className="text-lg font-black text-white uppercase tracking-widest font-display"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    Start Scoring Match
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#121212] scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Persistent Add Custom Venue / Pro Button */}
              <div className="flex gap-3 p-4 pb-6 border-t border-white/10 bg-black flex-shrink-0">
                <button
                  onClick={step > 1 ? handlePrev : handleClose}
                  className="px-6 py-3 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                {step < STEPS.length ? (
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="flex-1 py-3 px-4 rounded-[12px] bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black hover:opacity-90 hover:scale-[1.02] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#55DEE8]/20"
                  >
                    <>
                      Next <ChevronRight size={14} />
                    </>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPasswordPopup(true)}
                    disabled={isLoading || !canGoNext()}
                    className="flex-1 py-3 px-4 rounded-[12px] bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black hover:opacity-90 hover:scale-[1.02] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#55DEE8]/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />{" "}
                        Creating...
                      </>
                    ) : (
                      <>
                        <Trophy size={16} /> Create Match
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {showPasswordPopup && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowPasswordPopup(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[340px] bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center"
                  >
                    <h3 className="text-lg font-black text-white uppercase tracking-wide mb-1 text-center font-display">
                      Match Security
                    </h3>
                    <p className="text-xs text-white/40 text-center mb-6 leading-relaxed">
                      Set a password for the scoring app to prevent unauthorized
                      access.
                    </p>

                    <div className="w-full mb-6">
                      <label className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Shield size={12} className="text-[#55DEE8]" /> SCORING
                        APP PASSWORD <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.scoringPassword}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              scoringPassword: e.target.value,
                            }))
                          }
                          className="w-full bg-[#1A1A1A] text-white pl-4 pr-12 py-2.5 rounded-[12px] focus:outline-none focus:ring-1 focus:ring-[#55DEE8] border border-white/5 font-mono text-sm tracking-widest placeholder:tracking-normal placeholder:font-sans"
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => setShowPasswordPopup(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-[12px] text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (
                            formData.scoringPassword.trim() !== "" &&
                            formData.scoringPassword.length >= 6
                          ) {
                            setShowPasswordPopup(false);
                            handleSubmit();
                          }
                        }}
                        disabled={
                          isLoading ||
                          formData.scoringPassword.trim() === "" ||
                          formData.scoringPassword.length < 6
                        }
                        className="flex-[1.5] py-3 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-[12px] text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#55DEE8]/10"
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <Trophy size={14} /> Create Match
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            <AnimatePresence>{playerPopupNode}</AnimatePresence>
            <AnimatePresence>
              {showCustomVenuePopup && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowCustomVenuePopup(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/10 rounded-t-[24px] flex flex-col px-6 pb-8 pt-4 shadow-2xl"
                  >
                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">
                          Add Custom Venue
                        </h3>
                      </div>
                      <div className="flex-1 space-y-4 mb-8">
                        <div>
                          <label className={labelClass}>Venue Name</label>
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="e.g. Lords Cricket Ground"
                            value={customVenueNameInput}
                            onChange={(e) =>
                              setCustomVenueNameInput(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Venue Location (Optional)
                          </label>
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="e.g. Mumbai, Maharashtra"
                            value={customVenueLocationInput}
                            onChange={(e) =>
                              setCustomVenueLocationInput(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => setShowCustomVenuePopup(false)}
                          className="px-6 py-4 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>
                        <button
                          onClick={() => {
                            if (!customVenueNameInput.trim()) {
                              toast.error("Please enter a venue name");
                              return;
                            }
                            setFormData((f) => ({
                              ...f,
                              customVenue: customVenueNameInput.trim(),
                              location:
                                customVenueLocationInput.trim() || f.location,
                              venueId: null,
                            }));
                            setShowCustomVenuePopup(false);
                          }}
                          disabled={!customVenueNameInput.trim()}
                          className="flex-1 py-4 rounded-[12px] bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg shadow-[#55DEE8]/20"
                        >
                          Add Venue
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Custom Pro Invite Popup (Bottom Sheet) */}
            <AnimatePresence>
              {showCustomProInvite && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowCustomProInvite(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/10 rounded-t-[24px] flex flex-col px-6 pb-8 pt-4 shadow-2xl h-[90vh]"
                  >
                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                      {customProInviteData ? (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-[#BFF367]/20 rounded-full flex items-center justify-center border border-[#BFF367]">
                              <MessageCircle
                                size={32}
                                className="text-[#BFF367]"
                              />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">
                                Send WhatsApp Invite
                              </h4>
                            </div>
                            <div className="bg-white/5 p-3 rounded-[12px] text-left w-full mt-4 border border-white/10">
                              <p className="text-xs text-white/60 font-mono break-words">
                                Hey {customProInviteData.name}, I've invited you
                                to officiate as a {customProInviteData.role} for
                                an upcoming match on Kridaz! Click here to join:
                                https://kridaz.com/invite?token=CUSTOM&role=
                                {customProInviteData.role}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const text = encodeURIComponent(
                                  `Hey ${customProInviteData.name}, I've invited you to officiate as a ${customProInviteData.role} for an upcoming match on Kridaz! Click here to join: https://kridaz.com/invite?token=CUSTOM&role=${customProInviteData.role}`
                                );
                                window.open(
                                  `https://wa.me/${customProInviteData.phone}?text=${text}`,
                                  "_blank"
                                );
                                setShowCustomProInvite(false);
                                setCustomProInviteData(null);
                              }}
                              className="w-full py-4 rounded-[12px] bg-[#BFF367] text-black font-black uppercase tracking-wider hover:bg-[#a5db4e] transition-colors mt-6"
                            >
                              Send via WhatsApp
                            </button>
                            <button
                              onClick={() => {
                                setShowCustomProInvite(false);
                                setCustomProInviteData(null);
                              }}
                              className="text-sm text-white/40 hover:text-white uppercase font-bold tracking-wider mt-4"
                            >
                              Skip for now
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">
                              Invite Professional
                            </h3>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <label className={labelClass}>
                                Professional's Name
                              </label>
                              <input
                                type="text"
                                className={inputClass}
                                placeholder="e.g. John Doe"
                                value={customProfessionalName}
                                onChange={(e) =>
                                  setCustomProfessionalName(e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                WhatsApp Number
                              </label>
                              <div className="flex bg-[#121212] border border-white/10 rounded-[12px] focus-within:border-[#55DEE8]/30 transition-colors h-[44px] overflow-hidden">
                                <select
                                  value={customPlayerCountryCode}
                                  onChange={(e) =>
                                    setCustomPlayerCountryCode(e.target.value)
                                  }
                                  className="w-[90px] bg-transparent text-white px-3 border-r border-white/10 outline-none text-sm cursor-pointer hover:bg-white/5 appearance-none font-bold"
                                >
                                  {countryCodes.map((c) => (
                                    <option
                                      key={c.code}
                                      value={c.dial_code}
                                      className="bg-[#121212] text-white"
                                    >
                                      {c.code} (+{c.dial_code})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="tel"
                                  placeholder="9876543210"
                                  className="flex-1 bg-transparent text-white px-4 outline-none text-sm placeholder:text-white/30"
                                  value={customProfessionalPhone}
                                  onChange={(e) =>
                                    setCustomProfessionalPhone(
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10)
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>Role</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  {
                                    id: "UMPIRE",
                                    label: "Umpire",
                                    icon: Shield,
                                  },
                                  {
                                    id: "SCORER",
                                    label: "Scorer",
                                    icon: CheckSquare,
                                  },
                                  {
                                    id: "COMMENTATOR",
                                    label: "Commentator",
                                    icon: Mic,
                                  },
                                  {
                                    id: "STREAMER",
                                    label: "Streamer",
                                    icon: Video,
                                  },
                                ].map((role) => {
                                  const isSelected =
                                    customProfessionalRole === role.id;
                                  const Icon = role.icon;
                                  return (
                                    <button
                                      key={role.id}
                                      type="button"
                                      onClick={() =>
                                        setCustomProfessionalRole(role.id)
                                      }
                                      className={`flex flex-col items-center justify-center py-4 rounded-[12px] border transition-all ${isSelected ? "bg-white/5 border-white/10 text-[#BFF367]" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white"}`}
                                    >
                                      <Icon size={24} className="mb-2" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {role.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-6 mt-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowCustomProInvite(false)}
                              className="px-6 py-4 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                              <ChevronLeft size={14} /> Back
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  !customProfessionalName ||
                                  !customProfessionalPhone
                                ) {
                                  toast.error(
                                    "Please enter name and phone number"
                                  );
                                  return;
                                }
                                const newPro = {
                                  name: customProfessionalName,
                                  phone: `+${customPlayerCountryCode}${customProfessionalPhone}`,
                                  role: customProfessionalRole,
                                };
                                setFormData((f) => ({
                                  ...f,
                                  customProfessionals: [
                                    ...(f.customProfessionals || []),
                                    newPro,
                                  ],
                                }));
                                setCustomProInviteData(newPro);
                                setCustomProfessionalName("");
                                setCustomProfessionalPhone("");
                              }}
                              disabled={
                                !customProfessionalName ||
                                !customProfessionalPhone
                              }
                              className="flex-1 py-4 rounded-[12px] bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg shadow-[#55DEE8]/20"
                            >
                              Invite
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Venue Popup */}
            <AnimatePresence>
              {showVenuePopup && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowVenuePopup(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 z-[10001] bg-[#121212] border-t border-white/10 rounded-t-[24px] flex flex-col px-6 pb-8 pt-4 shadow-2xl h-[85vh]"
                  >
                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                    <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">
                        Select Venue
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
                      {/* Venue Search & Filters */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Search venues..."
                            className={`${inputClass} pl-10 py-2 text-sm`}
                            value={venueSearchQuery}
                            onChange={(e) =>
                              setVenueSearchQuery(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex gap-2 relative z-10">
                          <CustomDropdown
                            className="w-1/2"
                            value={venueStateFilter}
                            onChange={setVenueStateFilter}
                            placeholder="All States"
                            options={[
                              { value: "", label: "All States" },
                              ...states,
                            ]}
                          />
                          <CustomDropdown
                            className="w-1/2"
                            value={venueCityFilter}
                            onChange={setVenueCityFilter}
                            placeholder="All Cities"
                            options={[
                              { value: "", label: "All Cities" },
                              ...venueCities,
                            ]}
                            disabled={!venueStateFilter}
                          />
                        </div>
                      </div>

                      {/* Venue List */}
                      <div className="space-y-2">
                        {formData.customVenue && (
                          <button
                            onClick={() =>
                              setFormData((f) => ({
                                ...f,
                                customVenue: "",
                                location: "",
                              }))
                            }
                            className="w-full flex items-center justify-between p-4 rounded-[12px] border border-dashed transition-all text-left bg-[#1a1a1a] border-white/20 hover:border-white/40 group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-4 relative z-10">
                              <div className="w-10 h-10 rounded-[12px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                <MapPin size={18} className="text-white/60" />
                              </div>
                              <div>
                                <div className="font-black text-white text-sm tracking-wide flex items-center gap-2">
                                  {formData.customVenue}
                                </div>
                                <div className="text-xs text-white/40 mt-0.5">
                                  {formData.location || "Custom Location"}
                                </div>
                              </div>
                            </div>
                          </button>
                        )}

                        {isLoadingGrounds ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-white/40" />
                          </div>
                        ) : (
                          (() => {
                            const filteredVenues =
                              groundsData?.grounds?.filter(
                                (g) =>
                                  (!venueStateFilter ||
                                    g.state === venueStateFilter) &&
                                  (!venueCityFilter ||
                                    g.city === venueCityFilter) &&
                                  (!venueSearchQuery ||
                                    g.name
                                      .toLowerCase()
                                      .includes(
                                        venueSearchQuery.toLowerCase()
                                      ) ||
                                    (g.city &&
                                      g.city
                                        .toLowerCase()
                                        .includes(
                                          venueSearchQuery.toLowerCase()
                                        )))
                              ) || [];

                            if (
                              filteredVenues.length === 0 &&
                              !formData.customVenue
                            ) {
                              return (
                                <div className="flex flex-col items-center justify-center py-12 opacity-40">
                                  <EyeOff size={40} className="mb-4" />
                                  <div className="text-sm italic font-medium">
                                    No listed venues match your filters.
                                  </div>
                                </div>
                              );
                            }

                            return filteredVenues.map((g) => (
                              <button
                                key={g.id}
                                onClick={() => {
                                  setFormData((f) => ({
                                    ...f,
                                    venueId: f.venueId === g.id ? null : g.id,
                                    customVenue: "",
                                  }));
                                  setShowVenuePopup(false);
                                  setShowGroundsDropdown(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-[12px] border transition-all text-left ${formData.venueId === g.id ? "bg-[#55DEE8]/10 border-[#55DEE8]" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <MapPin
                                    size={18}
                                    className={
                                      formData.venueId === g.id
                                        ? "text-[#55DEE8]"
                                        : "text-white/40"
                                    }
                                  />
                                  <div>
                                    <div className="font-bold text-white text-sm">
                                      {g.name}
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                      {g.city}
                                    </div>
                                  </div>
                                </div>
                                {formData.venueId === g.id && (
                                  <Check size={16} className="text-[#55DEE8]" />
                                )}
                              </button>
                            ));
                          })()
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6 mt-auto shrink-0 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowVenuePopup(false);
                          setCustomVenueNameInput(formData.customVenue || "");
                          setCustomVenueLocationInput(formData.location || "");
                          setShowCustomVenuePopup(true);
                        }}
                        className="bg-[#1a1a1a] text-white border border-white/20 shadow-xl w-full py-4 rounded-[12px] font-black text-xs uppercase tracking-widest hover:bg-[#2a2a2a] hover:border-white/50 hover:text-white hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add Custom Venue
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowVenuePopup(false)}
                        className="px-6 py-4 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                      >
                        <ChevronLeft size={14} /> Back
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Professionals Popup */}
            <AnimatePresence>
              {showProfessionalsPopup && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowProfessionalsPopup(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 z-[10001] bg-[#121212] border-t border-white/10 rounded-t-[24px] flex flex-col px-6 pb-8 pt-4 shadow-2xl h-[85vh]"
                  >
                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                    <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">
                        Select Professional
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
                      {/* Professionals Search & Filters */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Search professionals (name, phone, email)..."
                            className={`${inputClass} pl-10 py-2 text-sm`}
                            value={proSearchQuery}
                            onChange={(e) => setProSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 relative z-10">
                          <CustomDropdown
                            className="w-1/2"
                            value={proCityFilter}
                            onChange={setProCityFilter}
                            placeholder="All Cities"
                            options={[
                              { value: "", label: "All Cities" },
                              ...Array.from(
                                new Set(
                                  umpiresData?.umpires
                                    ?.map((u) => u.city)
                                    .filter(Boolean) || []
                                )
                              ),
                            ]}
                          />
                          <CustomDropdown
                            className="w-1/2"
                            value={proRoleFilter}
                            onChange={setProRoleFilter}
                            placeholder="All Roles"
                            options={[
                              { value: "", label: "All Roles" },
                              { value: "UMPIRE", label: "Umpire" },
                              { value: "SCORER", label: "Scorer" },
                              { value: "COMMENTATOR", label: "Commentator" },
                              { value: "STREAMER", label: "Streamer" },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-[25px]">
                        {/* List Custom Professionals already added */}
                        {formData.customProfessionals?.map((cp, idx) => (
                          <div
                            key={`custom-${idx}`}
                            className="w-full flex flex-col p-0 rounded-[4px] overflow-hidden transition-all text-left bg-transparent relative"
                          >
                            {/* Remove button */}
                            <button
                              onClick={() =>
                                setFormData((f) => ({
                                  ...f,
                                  customProfessionals:
                                    f.customProfessionals.filter(
                                      (_, i) => i !== idx
                                    ),
                                }))
                              }
                              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black backdrop-blur-md flex items-center justify-center hover:bg-red-500/80 transition-colors"
                            >
                              <X size={16} className="text-white" />
                            </button>

                            {/* Image Section */}
                            <div className="w-full aspect-[4/3] relative bg-white/5">
                              {(() => {
                                let roleImage = null;
                                if (cp.role === "UMPIRE")
                                  roleImage = "/images/roles/umpire.png";
                                if (cp.role === "SCORER")
                                  roleImage = "/images/roles/scorer.png";
                                if (cp.role === "COMMENTATOR")
                                  roleImage = "/images/roles/commentator.png";
                                if (cp.role === "STREAMER")
                                  roleImage = "/images/roles/streamer.png";

                                if (roleImage) {
                                  return (
                                    <img
                                      src={roleImage}
                                      alt={cp.role}
                                      className="w-full h-full object-cover"
                                    />
                                  );
                                }
                                return (
                                  <div className="w-full h-full flex flex-col items-center justify-center opacity-50 bg-[#1a1a1a]">
                                    {cp.role === "COMMENTATOR" ? (
                                      <Mic
                                        size={40}
                                        className="text-white/20 mb-2"
                                      />
                                    ) : cp.role === "SCORER" ? (
                                      <CheckSquare
                                        size={40}
                                        className="text-white/20 mb-2"
                                      />
                                    ) : (
                                      <UserCheck
                                        size={40}
                                        className="text-white/20 mb-2"
                                      />
                                    )}
                                    <span className="text-xs font-medium text-white/40">
                                      No Image
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Details Section */}
                            <div className="pt-3 pb-4 px-3 flex flex-col gap-1 w-full bg-transparent">
                              <div className="flex justify-between items-start w-full gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="font-bold text-white text-[15px] truncate">
                                    {cp.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                  <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">
                                    {cp.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {isLoadingUmpires ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-white/40" />
                          </div>
                        ) : (
                          (() => {
                            const filteredPros =
                              umpiresData?.umpires?.filter(
                                (u) =>
                                  (!proRoleFilter ||
                                    u.role === proRoleFilter) &&
                                  (!proStateFilter ||
                                    u.state === proStateFilter) &&
                                  (!proCityFilter ||
                                    u.city === proCityFilter) &&
                                  (!proSearchQuery ||
                                    u.name
                                      ?.toLowerCase()
                                      .includes(proSearchQuery.toLowerCase()) ||
                                    u.username
                                      ?.toLowerCase()
                                      .includes(proSearchQuery.toLowerCase()))
                              ) || [];

                            return filteredPros.length > 0
                              ? filteredPros.map((u) => {
                                  const isSelected =
                                    formData.professionals.includes(u.id);
                                  return (
                                    <button
                                      key={u.id}
                                      onClick={() => {
                                        setFormData((f) => ({
                                          ...f,
                                          professionals: isSelected
                                            ? f.professionals.filter(
                                                (id) => id !== u.id
                                              )
                                            : [...f.professionals, u.id],
                                        }));
                                        setShowProfessionalsPopup(false);
                                      }}
                                      className={`w-full flex flex-col p-0 rounded-[16px] overflow-hidden transition-all text-left ${isSelected ? "shadow-[0_0_15px_rgba(191,243,103,0.15)] ring-1 ring-[#BFF367]" : "bg-transparent"}`}
                                    >
                                      {/* Image Section */}
                                      <div className="w-full aspect-[4/3] relative bg-white/5">
                                        {u.profilePicture ? (
                                          <img
                                            src={u.profilePicture}
                                            className="w-full h-full object-cover"
                                            alt={u.name}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center opacity-50 bg-[#1a1a1a]">
                                            <UserCheck
                                              size={40}
                                              className="text-white/20 mb-2"
                                            />
                                            <span className="text-xs font-medium text-white/40">
                                              No Image
                                            </span>
                                          </div>
                                        )}

                                        {/* Heart / Favorite Icon */}
                                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black transition-colors">
                                          <Heart
                                            size={16}
                                            className="text-white"
                                          />
                                        </div>

                                        {/* Selected Overlay */}
                                        {isSelected && (
                                          <div className="absolute inset-0 bg-[#BFF367]/10 flex items-center justify-center backdrop-blur-[1px]">
                                            <div className="w-12 h-12 rounded-full bg-[#BFF367] flex items-center justify-center shadow-xl">
                                              <Check
                                                size={24}
                                                className="text-black"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Details Section */}
                                      <div className="pt-3 pb-4 px-1 flex flex-col gap-1 w-full bg-transparent">
                                        <div className="flex justify-between items-start w-full gap-2">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-5 h-5 rounded-full bg-[#FFC107] flex items-center justify-center shrink-0">
                                              <MapPin
                                                size={12}
                                                className="text-black fill-black"
                                              />
                                            </div>
                                            <span className="font-bold text-white text-[15px] truncate">
                                              {u.name || "Professional"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                            <span className="text-[13px] text-[#FFC107] font-bold">
                                              {u.rating || "4.8"}
                                            </span>
                                            <Star
                                              size={13}
                                              className="text-[#FFC107] fill-[#FFC107]"
                                            />
                                          </div>
                                        </div>
                                        <div className="text-[13px] text-white/50 truncate">
                                          {u.distance || "0.7 km away"}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })
                              : formData.customProfessionals?.length === 0 && (
                                  <div className="flex flex-col items-center justify-center py-12 opacity-40">
                                    <EyeOff size={40} className="mb-4" />
                                    <div className="text-sm italic font-medium">
                                      No professionals match your search.
                                    </div>
                                  </div>
                                );
                          })()
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6 mt-auto shrink-0 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfessionalsPopup(false);
                          setShowCustomProInvite(true);
                        }}
                        className="bg-[#1a1a1a] text-white border border-white/20 shadow-xl w-full py-4 rounded-[12px] font-black text-xs uppercase tracking-widest hover:bg-[#2a2a2a] hover:border-white/50 hover:text-white hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} /> Invite Professional
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProfessionalsPopup(false)}
                        className="px-6 py-4 rounded-[12px] border border-white/10 text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                      >
                        <ChevronLeft size={14} /> Back
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <CreateTeamModal
              isOpen={showCreateTeam}
              onClose={() => setShowCreateTeam(false)}
              onSuccess={(newTeam) => {
                selectTeam(newTeam.id || newTeam._id);
                setShowCreateTeam(false);
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </>,
    portalTarget
  );
};

// ─── Playing XI Sub-component ─────────────────────────────────────────────────

// ─── Playing XI Sub-component ─────────────────────────────────────────────────

const PlayingXIStep = ({
  teamKey,
  teamName,
  players,
  maxMembers,
  teamDetails,
  onInit,
  onRemove,
  onAdd,
  onReplace,
  onRoleChange,
}) => {
  const color = teamKey === "A" ? "#55DEE8" : "#BFF367";
  const hasAutoLoaded = players.length > 0;
  const [activeRoleSelect, setActiveRoleSelect] = React.useState(null);

  return (
    <div className="space-y-3 h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2
          className="text-lg font-black text-white uppercase tracking-wide truncate pr-4"
          title={
            teamName ? `${teamName} Playing XI` : `Team ${teamKey} Playing XI`
          }
        >
          {teamName ? `${teamName} Playing XI` : `Team ${teamKey} Playing XI`}
        </h2>
        <span
          className="text-xs font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex-shrink-0"
          style={{ color }}
        >
          {players.length}/{maxMembers}
        </span>
      </div>

      {/* Modern Assign Roles UI */}
      {players.length > 0 && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
            Assign Roles
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Captain */}
            <button
              onClick={() => setActiveRoleSelect("CAPTAIN")}
              className="bg-[#111] p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 relative group hover:bg-[#161616] transition-colors h-[64px] cursor-pointer"
            >
              <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                C
              </span>
              <span className="text-[11px] font-bold text-white w-full text-center truncate px-1">
                {players.find((p) => p.role === "CAPTAIN")?.name || "Select"}
              </span>
            </button>

            {/* Wicket Keeper 1 */}
            <button
              onClick={() => setActiveRoleSelect("WICKET_KEEPER_1")}
              className="bg-[#111] p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 relative group hover:bg-[#161616] transition-colors h-[64px] cursor-pointer"
            >
              <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                W1
              </span>
              <span className="text-[11px] font-bold text-white w-full text-center truncate px-1">
                {players.find((p) => p.role === "WICKET_KEEPER_1")?.name ||
                  "Select"}
              </span>
            </button>

            {/* Wicket Keeper 2 */}
            <button
              onClick={() => setActiveRoleSelect("WICKET_KEEPER_2")}
              className="bg-[#111] p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 relative group hover:bg-[#161616] transition-colors h-[64px] cursor-pointer"
            >
              <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                W2
              </span>
              <span className="text-[11px] font-bold text-white w-full text-center truncate px-1">
                {players.find((p) => p.role === "WICKET_KEEPER_2")?.name ||
                  "Select"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modern Custom Role Selection List Modal */}
      <AnimatePresence>
        {activeRoleSelect && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setActiveRoleSelect(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative bg-[#121212] border-t border-white/10 rounded-t-2xl p-4 flex flex-col max-h-[70vh] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Select{" "}
                  {activeRoleSelect === "CAPTAIN"
                    ? "Captain"
                    : activeRoleSelect === "WICKET_KEEPER_1"
                      ? "Wicket Keeper 1"
                      : "Wicket Keeper 2"}
                </h3>
                <button
                  onClick={() => setActiveRoleSelect(null)}
                  className="p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                <button
                  onClick={() => {
                    const oldRole = players.find(
                      (p) => p.role === activeRoleSelect
                    );
                    if (oldRole) onRoleChange(oldRole.id, "PLAYER");
                    setActiveRoleSelect(null);
                  }}
                  className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between hover:border-white/20 transition-all text-left"
                >
                  <span className="text-white/60 font-bold text-sm">None</span>
                </button>
                {players.map((p) => {
                  const roleTag =
                    p.role === "CAPTAIN"
                      ? "Captain"
                      : p.role === "WICKET_KEEPER_1"
                        ? "Keeper 1"
                        : p.role === "WICKET_KEEPER_2"
                          ? "Keeper 2"
                          : null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        const oldRole = players.find(
                          (p) => p.role === activeRoleSelect
                        );
                        if (oldRole) onRoleChange(oldRole.id, "PLAYER");
                        onRoleChange(p.id, activeRoleSelect);
                        setActiveRoleSelect(null);
                      }}
                      className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-3 hover:border-white/20 transition-all text-left"
                    >
                      {p.profilePicture ? (
                        <img
                          src={p.profilePicture}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                          alt={p.name}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-sm font-bold border border-white/10 flex-shrink-0">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-white font-bold text-sm flex-1 truncate">
                        {p.name}
                      </span>
                      {roleTag && (
                        <span className="text-[10px] font-black tracking-widest uppercase text-white/40 mr-2">
                          {roleTag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Player / Auto-load Buttons */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <button
          onClick={onAdd}
          disabled={players.length >= maxMembers}
          className="w-full py-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> ADD PLAYER
        </button>
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm bg-white/5 rounded-lg border border-white/5 border-dashed flex-shrink-0">
          No players added yet.<br />Auto-load from roster or add manually.
        </div>
      )}

      {/* Player List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 overflow-x-hidden">
        <AnimatePresence>
          {players.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              transition={{ duration: 0.2 }}
              className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-3 md:gap-4 hover:border-white/20 transition-all"
            >
              {p.profilePicture ? (
                <img
                  src={p.profilePicture}
                  className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                  alt={p.name}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-sm font-bold border border-white/10 flex-shrink-0">
                  {p.name?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-white text-sm font-bold truncate block">
                  {p.name}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onRemove(p.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

// ─── Touch Slider Wheel Sub-component ──────────────────────────────────────────

const TouchSliderWheel = ({ value, onChange, min = 0, max = 20, label }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400); // Robust fallback
  const tickWidth = 56; // Spacing between each number for elegant breathing room
  const isDragging = useRef(false);
  const lastWheelTime = useRef(0);

  const x = useMotionValue(0);

  // ResizeObserver ensures exact measurement, syncing on load and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0) {
      setContainerWidth(rect.width);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Compute precise centering offset
  const getTargetOffset = (val) => {
    return containerWidth / 2 - (val - min) * tickWidth - tickWidth / 2;
  };

  // Sync visual slider offset with selected value state smoothly
  useEffect(() => {
    if (!isDragging.current) {
      const target = getTargetOffset(value);
      animate(x, target, {
        type: "spring",
        stiffness: 350,
        damping: 30,
        restDelta: 0.1,
      });
    }
  }, [value, containerWidth]);

  // Handle active touch/mouse dragging updates dynamically
  const handleDrag = () => {
    const currentX = x.get();
    const calculatedVal =
      min + (containerWidth / 2 - tickWidth / 2 - currentX) / tickWidth;
    const nearestVal = Math.max(min, Math.min(max, Math.round(calculatedVal)));
    if (nearestVal !== value) {
      onChange(nearestVal);
    }
  };

  // Snap precisely into position on release
  const handleDragEnd = () => {
    isDragging.current = false;
    const currentX = x.get();
    const calculatedVal =
      min + (containerWidth / 2 - tickWidth / 2 - currentX) / tickWidth;
    const nearestVal = Math.max(min, Math.min(max, Math.round(calculatedVal)));
    onChange(nearestVal);
    const target = getTargetOffset(nearestVal);
    animate(x, target, { type: "spring", stiffness: 350, damping: 28 });
  };

  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 60) return; // Throttle wheel events
    lastWheelTime.current = now;

    const delta = e.deltaY || e.deltaX;
    if (Math.abs(delta) > 0) {
      const step = delta > 0 ? 1 : -1;
      const nextVal = Math.max(min, Math.min(max, value + step));
      if (nextVal !== value) {
        onChange(nextVal);
      }
    }
  };

  // Build ticks array
  const ticks = [];
  for (let i = min; i <= max; i++) {
    ticks.push(i);
  }

  // Set drag limits to prevent dragging out of bounds
  const leftLimit = getTargetOffset(max);
  const rightLimit = getTargetOffset(min);

  return (
    <div className="space-y-1.5 w-full select-none">
      {label && (
        <label className="text-[10px] text-white/40 mb-1 block font-black uppercase tracking-widest">
          {label}
        </label>
      )}
      <div
        ref={containerRef}
        className="relative w-full h-16 bg-white/[0.02] border border-white/10 rounded-[12px] overflow-hidden cursor-ew-resize flex items-center shadow-inner touch-none"
        onWheel={handleWheel}
      >
        {/* Glow behind center selected number */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 bg-[#BFF367]/10 blur-md rounded-full pointer-events-none z-10" />

        {/* Center selection brackets / indicator frames */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1.5 bottom-1.5 w-14 border-x border-[#BFF367]/30 bg-[#BFF367]/[0.02] rounded-md pointer-events-none z-10" />

        {/* Draggable Track */}
        <motion.div
          drag="x"
          dragConstraints={{ left: leftLimit, right: rightLimit }}
          dragElastic={0.1}
          dragMomentum={false}
          style={{ x }}
          onDragStart={() => {
            isDragging.current = true;
          }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="absolute left-0 h-full flex items-center cursor-grab active:cursor-grabbing"
        >
          {/* HUGE HIT AREA FOR DRAGGING */}
          <div className="absolute top-0 bottom-0 -left-[2000px] w-[4000px] bg-transparent" />

          {ticks.map((tick) => {
            const isSelected = tick === value;
            const distanceFromCenter = Math.abs(tick - value);

            // Dynamic scale and opacity based on proximity to center
            const opacity = Math.max(0.04, 1 - distanceFromCenter * 0.28);
            const scale = Math.max(0.65, 1 - distanceFromCenter * 0.12);

            return (
              <div
                key={tick}
                className="absolute flex flex-col items-center justify-center cursor-pointer"
                onClick={() => onChange(tick)}
                style={{
                  left: (tick - min) * tickWidth,
                  width: tickWidth,
                  opacity,
                  transform: `scale(${scale})`,
                  transition: "opacity 0.12s, transform 0.12s",
                }}
              >
                {/* Pure text wheel - no lines, text size behaves dynamically */}
                <span
                  className={`font-mono transition-all duration-150 ${
                    isSelected
                      ? "text-[#BFF367] text-2xl font-black drop-shadow-[0_0_8px_rgba(191,243,103,0.6)]"
                      : "text-white/30 text-sm font-semibold"
                  }`}
                >
                  {tick}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Left/Right fading vignettes */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};

export default StartScoringModal;
