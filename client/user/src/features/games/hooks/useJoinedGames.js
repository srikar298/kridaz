import { toast } from "react-hot-toast";
import {
  useGetMyJoinedGamesQuery,
  useLeaveGameMutation,
} from "@redux/api/gamesApi";

const useJoinedGames = () => {
  const {
    data: joinedGamesData,
    isLoading: loading,
    refetch,
  } = useGetMyJoinedGamesQuery();
  const [leaveGame, { isLoading: isLeaving }] = useLeaveGameMutation();

  const joinedGames = joinedGamesData?.games || [];

  const handleLeave = async (gameId) => {
    if (
      !window.confirm(
        "Are you sure you want to leave this game? Your coins will be refunded according to the refund policy."
      )
    )
      return;
    try {
      const res = await leaveGame({ gameId }).unwrap();
      if (res.success) {
        toast.success("Left the game successfully.");
        refetch();
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to leave the game");
    }
  };

  return {
    joinedGames,
    loading,
    isLeaving,
    handleLeave,
    refetch,
  };
};

export default useJoinedGames;
