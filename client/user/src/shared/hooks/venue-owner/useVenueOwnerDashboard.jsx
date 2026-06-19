import React, { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useVenueOwnerDashboard = (venueId = null) => {
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalRevenue: 0,
    totalTurfs: 0,
    activeUsers: 0,
    utilization: 0,
    bookingsPerTurf: [],
    revenueOverTime: [],
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/owner/dashboard", {
          params: venueId ? { venueId } : {},
        });
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [venueId]);

  return { dashboardData, loading, error };
};

export default useVenueOwnerDashboard;
