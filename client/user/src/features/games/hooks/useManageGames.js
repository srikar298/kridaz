import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  useGetMyHostedGamesQuery,
  useApprovePlayerMutation,
  useRejectPlayerMutation,
  useCancelGameMutation,
  useHandleStreamerRequestMutation,
  useHandleUmpireRequestMutation,
  useHandleScorerRequestMutation,
} from "@redux/api/gamesApi";

const useManageGames = () => {
  const [hireModal, setHireModal] = useState({
    open: false,
    gameId: null,
    role: null,
  });
  const [venueModal, setVenueModal] = useState({ open: false, gameId: null });

  // RTK Queries & Mutations
  const {
    data: hostedGamesData,
    isLoading: loading,
    refetch,
  } = useGetMyHostedGamesQuery();

  const [approvePlayer] = useApprovePlayerMutation();
  const [rejectPlayer] = useRejectPlayerMutation();
  const [cancelGame] = useCancelGameMutation();

  const [handleStreamerRequest] = useHandleStreamerRequestMutation();
  const [handleUmpireRequest] = useHandleUmpireRequestMutation();
  const [handleScorerRequest] = useHandleScorerRequestMutation();

  const myGames = hostedGamesData?.games || [];

  const handleApprove = async (gameId, team, slotIndex) => {
    try {
      const res = await approvePlayer({ gameId, team, slotIndex }).unwrap();
      if (res.success) {
        toast.success("Player approved!");
        refetch();
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to approve player");
    }
  };

  const handleReject = async (gameId, team, slotIndex) => {
    if (
      !window.confirm(
        "Reject this player? Their reserved coins will be released."
      )
    )
      return;
    try {
      const res = await rejectPlayer({ gameId, team, slotIndex }).unwrap();
      if (res.success) {
        toast.success("Player rejected and coins released.");
        refetch();
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to reject player");
    }
  };

  const handleCancelGame = async (gameId) => {
    if (
      !window.confirm(
        "Cancel this game? All reserved coins for pending players will be released."
      )
    )
      return;
    try {
      const res = await cancelGame({ gameId }).unwrap();
      if (res.success) {
        toast.success("Game cancelled successfully.");
        refetch();
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to cancel game");
    }
  };

  const handleProfessionalRequest = async (gameId, role, action) => {
    try {
      let res;
      if (role === "streamer") {
        res = await handleStreamerRequest({ gameId, action }).unwrap();
      } else if (role === "umpire") {
        res = await handleUmpireRequest({ gameId, action }).unwrap();
      } else if (role === "scorer") {
        res = await handleScorerRequest({ gameId, action }).unwrap();
      }

      if (res?.success) {
        toast.success(
          `${role.charAt(0).toUpperCase() + role.slice(1)} request ${action.toLowerCase()}d!`
        );
        refetch();
      }
    } catch (err) {
      toast.error(
        err.data?.message || `Failed to ${action.toLowerCase()} request`
      );
    }
  };

  return {
    myGames,
    loading,
    hireModal,
    setHireModal,
    venueModal,
    setVenueModal,
    handleApprove,
    handleReject,
    handleCancelGame,
    handleProfessionalRequest,
    refetch,
  };
};

export default useManageGames;
