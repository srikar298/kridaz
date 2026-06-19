import { useSelector, useDispatch } from "react-redux";
import { setTurfs, setLoading, setError } from "@redux/slices/turfSlice";
import axiosInstance from "@hooks/useAxiosInstance";
import { useEffect } from "react";

const useTurfData = (filters = {}) => {
  const dispatch = useDispatch();
  const { turfs, loading, error } = useSelector((state) => state.turf);

  const fetchTurfData = async (searchParams = filters) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await axiosInstance.get("/api/user/turf/all", {
        params: searchParams,
        timeout: 15000,
      });

      if (response.data && response.data.turfs) {
        dispatch(setTurfs(response.data.turfs));
      } else {
        console.warn(
          "[useTurfData] Unexpected response format:",
          response.data
        );
        dispatch(setTurfs([]));
      }
    } catch (err) {
      console.error("[useTurfData] Error:", err);
      let message = "Failed to connect to server";
      if (err.code === "ECONNABORTED")
        message = "Request timed out. Server might be slow.";
      else if (err.response?.data?.message) message = err.response.data.message;
      else if (err.message) message = err.message;

      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchTurfData();
  }, [JSON.stringify(filters)]);

  return { turfs, loading, error, refetch: fetchTurfData };
};

export default useTurfData;
