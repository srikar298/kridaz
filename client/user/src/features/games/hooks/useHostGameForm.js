import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useGetMyTeamsQuery } from "@redux/api/teamApi";
import {
  useCreateGameMutation,
  useLazyGetGroundsQuery,
  useLazyGetUmpiresQuery,
  useLazyGetStreamersQuery,
} from "@redux/api/gamesApi";
import { fetchStates, fetchCities } from "@utils/locationService";

export const MOCK_TEAM_IMAGES = [
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

export const SPORT_DEFAULTS = {
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

const useHostGameForm = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeSlotPicker, setActiveSlotPicker] = useState(null);

  // Form State
  const [gameData, setGameData] = useState({
    gameType: "",
    date: "",
    time: "",
    groundId: null,
    umpireId: null,
    streamerId: null,
    perPlayerCharge: 0,
    gameMode: "PROFESSIONAL",
    quickPlayerCount: 0,
    quickSlotsData: [],
    city: user?.city || "",
    state: user?.state || "",
    teamA: { name: "", slots: [], image: MOCK_TEAM_IMAGES[0].url },
    teamB: { name: "", slots: [], image: MOCK_TEAM_IMAGES[1].url },
  });

  const [enues, setGrounds] = useState([]);
  const [umpires, setUmpires] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedUmpire, setSelectedUmpire] = useState(null);
  const [selectedStreamer, setSelectedStreamer] = useState(null);

  // Location dropdown state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Custom Umpire Modal
  const [showCustomUmpireModal, setShowCustomUmpireModal] = useState(false);
  const [customUmpireData, setCustomUmpireData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Clock picker state
  const [showClock, setShowClock] = useState(false);
  const [clockHour, setClockHour] = useState(9);
  const [clockMinute, setClockMinute] = useState(0);
  const [clockAmPm, setClockAmPm] = useState("AM");

  // Team Fill state
  const [showTeamFillModal, setShowTeamFillModal] = useState(false);
  const [fillingTeamKey, setFillingTeamKey] = useState(null); // 'teamA', 'teamB', or 'quick'

  const { data: teamsData } = useGetMyTeamsQuery();
  const myTeams = teamsData?.teams || [];

  const [createGame, { isLoading: isCreating }] = useCreateGameMutation();
  const [triggerGetGrounds] = useLazyGetGroundsQuery();
  const [triggerGetUmpires] = useLazyGetUmpiresQuery();
  const [triggerGetStreamers] = useLazyGetStreamersQuery();

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
      const newSlots = [...gameData[teamKey].slots];
      let slotIdx = 0;

      team.members.forEach((member) => {
        if (slotIdx < newSlots.length) {
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
        }
      });
      setGameData({
        ...gameData,
        [teamKey]: { ...gameData[teamKey], slots: newSlots },
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

  useEffect(() => {
    if (user?.city && user?.state) {
      setGameData((prev) => ({ ...prev, city: user.city, state: user.state }));
    }

    // Load Indian states on mount
    const loadStates = async () => {
      setLoadingStates(true);
      const data = await fetchStates();
      setStates(data);
      setLoadingStates(false);
    };
    loadStates();
  }, [user]);

  // When state changes, load its cities
  useEffect(() => {
    if (!gameData.state) {
      setCities([]);
      return;
    }
    const loadCities = async () => {
      setLoadingCities(true);
      const data = await fetchCities(gameData.state);
      setCities(data);
      setLoadingCities(false);
    };
    loadCities();
  }, [gameData.state]);

  const loadDomainData = useCallback(async () => {
    try {
      const groundsRes = await triggerGetGrounds({
        city: gameData.city,
        state: gameData.state,
        sportType: gameData.gameType,
      }).unwrap();
      setGrounds(groundsRes.enues || []);

      const umpiresRes = await triggerGetUmpires({
        city: gameData.city,
        state: gameData.state,
        gameType: gameData.gameType,
      }).unwrap();
      setUmpires(umpiresRes.umpires || []);

      const streamersRes = await triggerGetStreamers({
        city: gameData.city,
        state: gameData.state,
        gameType: gameData.gameType,
      }).unwrap();
      setStreamers(streamersRes.streamers || []);
    } catch (err) {
      toast.error(
        "Failed to fetch matchmaking assets (enues/umpires/streamers)"
      );
    }
  }, [
    gameData.city,
    gameData.state,
    gameData.gameType,
    triggerGetGrounds,
    triggerGetUmpires,
    triggerGetStreamers,
  ]);

  useEffect(() => {
    if (step === 3 && gameData.gameType) {
      loadDomainData();
    }
  }, [step, gameData.gameType, loadDomainData]);

  const totalCost =
    (selectedGround?.pricePerHour || 0) +
    (selectedUmpire?.price || 0) +
    (selectedStreamer?.price || 0);

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
    slots.push({
      role: "Player",
      userId: user?.id || user?._id,
      name: user?.name,
      status: "JOINED",
    });

    for (let i = 1; i < gameData.quickPlayerCount; i++) {
      slots.push({ role: "Player", status: "OPEN" });
    }

    setGameData((prev) => ({ ...prev, quickSlotsData: slots }));
    setStep(4.5);
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
        status: "HELD",
      };
    }

    setGameData({ ...gameData, quickSlotsData: newSlots });
    setActiveSlotPicker(null);
  };

  const handleCreateGame = async () => {
    try {
      const payload = {
        ...gameData,
        customUmpireData: customUmpireData.name ? customUmpireData : undefined,
      };
      const res = await createGame(payload).unwrap();
      if (res.success) {
        setShowCoinAnim(true);
      }
    } catch (err) {
      const errorMsg = err.data?.message || "Failed to create game";
      toast.error(errorMsg);
      if (
        errorMsg.toLowerCase().includes("insufficient coins") ||
        errorMsg.toLowerCase().includes("insufficient wallet balance")
      ) {
        navigate("/wallet");
      }
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
    reader.onload = (uploadEvent) => {
      setGameData({
        ...gameData,
        [teamKey]: { ...gameData[teamKey], image: uploadEvent.target.result },
      });
      toast.success(
        `${teamKey === "teamA" ? "Team 1" : "Team 2"} logo uploaded!`
      );
    };
    reader.readAsDataURL(file);
  };

  return {
    step,
    setStep,
    loading: isCreating,
    showCoinAnim,
    setShowCoinAnim,
    showConfirm,
    setShowConfirm,
    activeSlotPicker,
    setActiveSlotPicker,
    gameData,
    setGameData,
    grounds,
    umpires,
    streamers,
    selectedGround,
    setSelectedGround,
    selectedUmpire,
    setSelectedUmpire,
    selectedStreamer,
    setSelectedStreamer,
    states,
    cities,
    loadingStates,
    loadingCities,
    showCustomUmpireModal,
    setShowCustomUmpireModal,
    customUmpireData,
    setCustomUmpireData,
    showClock,
    setShowClock,
    clockHour,
    setClockHour,
    clockMinute,
    setClockMinute,
    clockAmPm,
    setClockAmPm,
    showTeamFillModal,
    setShowTeamFillModal,
    fillingTeamKey,
    setFillingTeamKey,
    myTeams,
    handleFillFromTeam,
    formatTime,
    displayTime,
    totalCost,
    initSlots,
    initQuickSlots,
    handleSlotSelection,
    handleCreateGame,
    addSlot,
    removeSlot,
    updateSlotRole,
    handleTeamImageUpload,
  };
};

export default useHostGameForm;
