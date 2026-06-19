import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

/**
 * Custom React hook to fetch personalized user follow recommendations
 */
const useUserRecommendations = (options = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lat = options.lat;
  const lng = options.lng;
  const limit = options.limit || 5;

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        "/api/user/players/recommendations",
        {
          params: { lat, lng, limit },
          timeout: 10000,
        }
      );

      if (response.data && response.data.players) {
        setRecommendations(response.data.players);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error(
        "[useUserRecommendations] Error fetching user recommendations:",
        err
      );
      let errMsg = "Failed to load player suggestions";
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refetch: fetchRecommendations };
};

export default useUserRecommendations;
