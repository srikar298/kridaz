import { useMemo } from "react";
import { useGetUserBookingsQuery } from "@redux/api/userApi";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format, parseISO, subHours, subMinutes } from "date-fns";

export default function useBookingHistory() {
  const {
    data: bookingsRaw = [],
    isLoading: loading,
    refetch,
  } = useGetUserBookingsQuery();

  const formatBookingsData = (bookings) => {
    return bookings.map((booking) => {
      if (!booking?.timeSlot?.startTime) return booking;
      const adjustedStartTime = parseISO(booking.timeSlot.startTime);
      const adjustedEndTime = parseISO(booking.timeSlot.endTime);

      return {
        ...booking,
        timeSlot: {
          ...booking.timeSlot,
          formattedStartTime: format(adjustedStartTime, "hh:mm a"),
          formattedEndTime: format(adjustedEndTime, "hh:mm a"),
          date: format(adjustedStartTime, "dd MMM yyyy"),
        },
      };
    });
  };

  const bookings = useMemo(() => {
    return formatBookingsData(bookingsRaw);
  }, [bookingsRaw]);

  const cancelBooking = async (booking) => {
    const playTime = new Date(booking.playStartTime);
    const now = new Date();
    const hoursRemaining = (playTime - now) / (1000 * 60 * 60);

    let confirmMsg =
      "Are you sure you want to cancel this booking? No refund will be issued as it's within 24 hours of the slot.";
    if (hoursRemaining >= 24) {
      confirmMsg =
        "Are you sure you want to cancel? Since you are cancelling more than 24 hours before the slot, you will receive a 30% refund in your wallet. The remaining 70% is non-refundable.";
    }

    if (!window.confirm(confirmMsg)) return false;

    try {
      const response = await axiosInstance.post(
        `/api/booking/user/cancel/${booking.id || booking._id}`
      );
      if (response.data.success) {
        toast.success(
          response.data.message || "Booking cancelled successfully."
        );
        refetch();
        return true;
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking.");
    }
    return false;
  };

  return { bookings, loading, cancelBooking };
}
