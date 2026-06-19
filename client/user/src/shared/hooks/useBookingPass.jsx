import { useEffect, useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

export default function useBookingPass(bookingId) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatBookingData = (data) => {
    if (!data) return null;
    const adjustedStartTime = parseISO(data.timeSlot.startTime);
    const adjustedEndTime = parseISO(data.timeSlot.endTime);

    return {
      ...data,
      timeSlot: {
        ...data.timeSlot,
        formattedStartTime: format(adjustedStartTime, "hh:mm a"),
        formattedEndTime: format(adjustedEndTime, "hh:mm a"),
        date: format(adjustedStartTime, "dd MMM yyyy"),
      },
    };
  };

  const fetchBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/user/booking/${bookingId}`
      );
      const formattedBooking = formatBookingData(response.data);
      setBooking(formattedBooking);
    } catch (error) {
      console.error("Error fetching booking pass:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch booking details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  return { booking, loading, refresh: fetchBooking };
}
