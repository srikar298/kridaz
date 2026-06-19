import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { login } from "@redux/slices/authSlice";
import {
  useListGamesQuery,
  useLazyVerifyInviteQuery,
  useClaimSlotMutation,
  useJoinGameMutation,
} from "@redux/api/gamesApi";
import { fetchStates, fetchCities } from "@utils/locationService";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const useJoinGames = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { gateInteraction } = useLoginOnDemand();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [selectedGame, setSelectedGame] = useState(null);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [joiningSlot, setJoiningSlot] = useState(null);

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("All Sports");
  const [liveFilter, setLiveFilter] = useState(false);

  const userLocation = { city: "", state: "" };

  // Deep-link / Invite state
  const [inviteData, setInviteData] = useState(null);
  const [showInvitePopup, setShowInvitePopup] = useState(false);

  // Location filter state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // RTK Query hooks
  const {
    data: gamesData,
    isLoading: loading,
    refetch,
  } = useListGamesQuery({
    city: selectedCity,
    state: selectedState,
    gameType: sportFilter,
  });

  const [triggerVerifyInvite, { isLoading: verifyingInvite }] =
    useLazyVerifyInviteQuery();
  const [claimSlot] = useClaimSlotMutation();
  const [joinGame] = useJoinGameMutation();

  const handleVerifyInvite = useCallback(
    async (token) => {
      try {
        const res = await triggerVerifyInvite(token).unwrap();
        if (res.success) {
          setInviteData({
            ...res,
            token,
          });
          setShowInvitePopup(true);
        }
      } catch (err) {
        toast.error(err.data?.message || "Invalid or expired invite link");
      }
    },
    [triggerVerifyInvite]
  );

  useEffect(() => {
    const fetchUserAndGames = async () => {
      // Fetch user profile logic if necessary to set default location
      // But we can also get user location directly from auth state!
    };
    fetchUserAndGames();

    const loadStates = async () => {
      setLoadingStates(true);
      const data = await fetchStates();
      setStates(data);
      setLoadingStates(false);
    };
    loadStates();

    // Check for deep-link inviteToken
    const params = new URLSearchParams(window.location.search);
    const token = params.get("inviteToken");
    if (token) {
      handleVerifyInvite(token);
    }
  }, [handleVerifyInvite]);

  const handleClaimSlot = async () => {
    if (!inviteData) return;

    gateInteraction(
      async () => {
        try {
          const res = await claimSlot({ token: inviteData.token }).unwrap();
          if (res.success) {
            setShowInvitePopup(false);

            if (res.newToken && res.updatedRole) {
              dispatch(
                login({
                  token: res.newToken,
                  role: res.updatedRole,
                })
              );
              localStorage.setItem("authToken", res.newToken);
              toast.success(
                "You've been assigned as Umpire! Redirecting to your dashboard..."
              );
              setTimeout(() => navigate("/umpire/dashboard"), 1200);
            } else {
              toast.success("Slot claimed successfully!");
              refetch();
            }
          }
        } catch (err) {
          toast.error(err.data?.message || "Failed to claim slot");
        }
      },
      {
        title: "Claim Your Invited Slot",
        message: "Welcome to the game! Sign in to secure your reserved spot.",
      }
    );
  };

  // When a state is selected, load its cities
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    const loadCities = async () => {
      setLoadingCities(true);
      const data = await fetchCities(selectedState);
      setCities(data);
      setLoadingCities(false);
    };
    loadCities();
  }, [selectedState]);

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedCity("");
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
  };

  const handleClearLocation = () => {
    setSelectedState("");
    setSelectedCity("");
    setCities([]);
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const games = gamesData?.games || [];

  const filteredGames = games.filter((game) => {
    if (liveFilter && !game.isLive) return false;
    return (
      game.gameType.toLowerCase().includes(search.toLowerCase()) ||
      (game.ground?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      game.city?.toLowerCase().includes(search.toLowerCase()) ||
      (game.gameMode === "QUICK" ? "quick game" : "professional game").includes(
        search.toLowerCase()
      )
    );
  });

  const handleJoinGame = async () => {
    if (!joiningSlot) return;
    gateInteraction(
      async () => {
        try {
          const res = await joinGame({
            gameId: selectedGame.id,
            team: joiningSlot.team,
            slotIndex: joiningSlot.index,
            role: joiningSlot.role,
          }).unwrap();
          if (res.success) {
            setShowCoinAnim(true);
          }
        } catch (err) {
          const errorMsg = err.data?.message || "Failed to join game";
          toast.error(errorMsg);
          if (
            errorMsg.toLowerCase().includes("insufficient coins") ||
            errorMsg.toLowerCase().includes("insufficient wallet balance")
          ) {
            navigate("/wallet");
          }
        }
      },
      {
        title: "Join the Match",
        message:
          "Ready to hit the field? Sign in to secure your spot and start playing with the community.",
      }
    );
  };

  return {
    games,
    filteredGames,
    loading,
    selectedGame,
    setSelectedGame,
    showCoinAnim,
    setShowCoinAnim,
    showConfirm,
    setShowConfirm,
    joiningSlot,
    setJoiningSlot,
    search,
    setSearch,
    sportFilter,
    setSportFilter,
    liveFilter,
    setLiveFilter,
    userLocation,
    inviteData,
    showInvitePopup,
    setShowInvitePopup,
    states,
    cities,
    selectedState,
    selectedCity,
    loadingStates,
    loadingCities,
    handleStateChange,
    handleCityChange,
    handleClearLocation,
    handleSearch,
    handleJoinGame,
    handleClaimSlot,
    refetch,
    isAuthenticated,
    verifyingInvite,
    gateInteraction,
  };
};

export default useJoinGames;
