import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const useGuestLocation = () => {
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [location, setLocation] = useState(() => {
    const cached = localStorage.getItem("kridaz_guest_location");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoggedIn) return; // Only needed for guests

    // If we already have it in state/cache, don't re-prompt
    if (location) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(coords);
        localStorage.setItem("kridaz_guest_location", JSON.stringify(coords));
        setLoading(false);
      },
      (err) => {
        console.error("Error getting guest location:", err);
        setError(
          "Location permission denied or unavailable. Showing global feed."
        );
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [isLoggedIn, location]);

  return { location, loading, error };
};

export default useGuestLocation;
