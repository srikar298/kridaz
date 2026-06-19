import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

/**
 * Custom React hook to fetch similar ground recommendations based on proximity
 */
const useSimilarRecommendations = (turfId, options = {}) => {
  const [similarTurfs, setSimilarTurfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const limit = options.limit || 4;

  const fetchSimilar = useCallback(async () => {
    if (!turfId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `/api/user/turf/user/${turfId}/similar`,
        {
          params: { limit },
          timeout: 10000,
        }
      );

      if (response.data && response.data.data) {
        setSimilarTurfs(response.data.data);
      } else {
        setSimilarTurfs([]);
      }
    } catch (err) {
      console.error(
        "[useSimilarRecommendations] Error fetching similar turfs:",
        err
      );
      let errMsg = "Failed to load similar venue suggestions";
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [turfId, limit]);

  useEffect(() => {
    fetchSimilar();
  }, [fetchSimilar]);

  return { similarTurfs, loading, error, refetch: fetchSimilar };
};

export default useSimilarRecommendations;
