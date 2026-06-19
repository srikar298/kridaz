import { useSelector } from "react-redux";
import { useGetTurfsQuery, useGetSavedTurfsQuery } from "@redux/api/turfApi";

const useTurfData = (filters = {}) => {
  const apiParams = {
    searchTerm: filters.searchTerm,
    city: filters.city,
    state: filters.state,
    lat: filters.lat,
    lng: filters.lng,
    radius: filters.radius,
    limit: filters.limit,
    page: filters.page,
  };

  // Remove empty/undefined values so cache key remains stable
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === undefined || apiParams[key] === "") {
      delete apiParams[key];
    }
  });

  const { data, isLoading, isFetching, error, refetch } = useGetTurfsQuery(
    apiParams,
    {
      skip: !!filters._skip,
    }
  );

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const { data: savedData } = useGetSavedTurfsQuery(undefined, {
    skip: !isLoggedIn,
  });

  let errorMessage = null;
  if (error) {
    errorMessage =
      error.data?.message || error.message || "Failed to connect to server";
  }

  let turfs = data?.turfs || [];

  // Local Filtering logic
  if (filters.city) {
    turfs = turfs.filter(
      (t) => t.city?.toLowerCase() === filters.city.toLowerCase()
    );
  }

  if (filters.onlyAvailable) {
    turfs = turfs.filter((t) => t.slotsLeft > 0);
  }

  if (filters.onlyFavorites) {
    const savedIds = savedData?.turfs?.map((t) => t.id || t._id) || [];
    turfs = turfs.filter((t) => savedIds.includes(t.id || t._id));
  }

  if (filters.sport) {
    turfs = turfs.filter((t) => {
      const sports = t.sportTypes || t.sports || [];
      return sports.some(
        (s) => (s.name || s).toLowerCase() === filters.sport.toLowerCase()
      );
    });
  }

  const minR = filters.minRating || 0;
  const maxR = filters.maxRating || 5;
  if (minR > 0 || maxR < 5) {
    turfs = turfs.filter((t) => {
      const r = t.avgRating || 0;
      return r >= minR && r <= maxR;
    });
  }

  if (filters.priceLessThan5000 || filters.price5000AndAbove) {
    turfs = turfs.filter((t) => {
      const price = t.pricePerHour ?? t.price ?? 0;
      if (filters.priceLessThan5000 && filters.price5000AndAbove) return true;
      if (filters.priceLessThan5000 && price < 5000) return true;
      if (filters.price5000AndAbove && price >= 5000) return true;
      return false;
    });
  }

  if (
    filters.timingMorning ||
    filters.timingAfternoon ||
    filters.timingEvening ||
    filters.timingLateNight
  ) {
    turfs = turfs.filter((t) => {
      let parsedSlots = [];
      if (Array.isArray(t.generatedSlots)) {
        parsedSlots = t.generatedSlots;
      } else if (typeof t.generatedSlots === "string") {
        try {
          parsedSlots = JSON.parse(t.generatedSlots);
          if (typeof parsedSlots === "string")
            parsedSlots = JSON.parse(parsedSlots);
        } catch (e) {}
      }

      if (!Array.isArray(parsedSlots) || parsedSlots.length === 0) return false;
      return parsedSlots.some((slot) => {
        if (slot.isActive === false) return false;
        let hr = 0;
        if (typeof slot.startTime === "string") {
          if (slot.startTime.includes("T")) {
            hr = new Date(slot.startTime).getHours();
          } else {
            const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i.exec(
              slot.startTime
            );
            if (m) {
              hr = parseInt(m[1], 10);
              const ampm = (m[3] || "").toUpperCase();
              if (ampm === "AM" && hr === 12) hr = 0;
              if (ampm === "PM" && hr !== 12) hr += 12;
            } else {
              hr = new Date(slot.startTime).getHours();
            }
          }
        } else {
          hr = new Date(slot.startTime).getHours();
        }

        if (filters.timingMorning && hr >= 6 && hr < 11) return true;
        if (filters.timingAfternoon && hr >= 11 && hr < 17) return true;
        if (filters.timingEvening && hr >= 17 && hr < 22) return true;
        if (filters.timingLateNight && (hr >= 22 || hr < 6)) return true;
        return false;
      });
    });
  }

  return {
    turfs,
    loading: isLoading || isFetching,
    error: errorMessage,
    refetch,
  };
};

export default useTurfData;
