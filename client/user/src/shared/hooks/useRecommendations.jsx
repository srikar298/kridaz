import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

/**
 * Custom React hook to fetch personalized ground recommendations from Kridaz ML Gateway
 */
const useRecommendations = (options = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lat = options.lat;
  const lng = options.lng;
  const limit = options.limit || 8;

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        "/api/user/turf/user/recommendations",
        {
          params: { lat, lng, limit },
          timeout: 10000,
        }
      );

      if (response.data && response.data.data) {
        setRecommendations(response.data.data);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error(
        "[useRecommendations] Error fetching ground recommendations:",
        err
      );
      let errMsg = "Failed to load personalized recommendations";
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

export default useRecommendations;
