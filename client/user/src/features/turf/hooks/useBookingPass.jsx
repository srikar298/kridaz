import * as Sentry from "@sentry/react";
import { useEffect, useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

export default function useBookingPass(bookingId) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatBookingData = (data) => {
    if (!data) return null;

    let adjustedStartTime = null;
    let adjustedEndTime = null;
    let formattedStartTime = "TBD";
    let formattedEndTime = "TBD";
    let bookingDate = "TBD";

    if (data.timeSlot?.startTime) {
      adjustedStartTime = parseISO(data.timeSlot.startTime);
      adjustedEndTime = parseISO(data.timeSlot.endTime);
    } else if (data.playStartTime) {
      adjustedStartTime = parseISO(data.playStartTime);
      adjustedEndTime = parseISO(data.playEndTime);
    } else if (data.createdAt) {
      adjustedStartTime = parseISO(data.createdAt);
    }

    if (adjustedStartTime) {
      formattedStartTime = format(adjustedStartTime, "hh:mm a");
      bookingDate = format(adjustedStartTime, "dd MMM yyyy");
    }
    if (adjustedEndTime) {
      formattedEndTime = format(adjustedEndTime, "hh:mm a");
    }

    return {
      ...data,
      timeSlot: {
        ...(data.timeSlot || {}),
        formattedStartTime,
        formattedEndTime,
        date: bookingDate,
        startTime: adjustedStartTime ? adjustedStartTime.toISOString() : null,
        endTime: adjustedEndTime ? adjustedEndTime.toISOString() : null,
      },
      turf: data.turf || {
        name: data.customVenue || data.city || "Custom Venue",
        location: data.city || "Unknown Location",
      },
    };
  };

  const fetchBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/booking/user/${bookingId}`
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
