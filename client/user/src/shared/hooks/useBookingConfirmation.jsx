import { format, parse, set, formatISO, addHours, parseISO } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useNavigate } from "react-router-dom";

import { useDispatch } from "react-redux";
import { updateUser } from "@redux/slices/authSlice";

const useBookingConfirmation = (
  id,
  selectedDate,
  selectedStartTime,
  duration,
  pricePerHour,
  setLoading
) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const confirmReservation = async (couponCode = null, paymentData = {}) => {
    const selectedTurfDate = format(selectedDate, "yyyy-MM-dd");
    const parsedStartTime = parse(selectedStartTime, "hh:mm a", new Date());

    const combinedStartDateTime = set(parseISO(selectedTurfDate), {
      hours: parsedStartTime.getHours(),
      minutes: parsedStartTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    const combinedEndDateTime = addHours(combinedStartDateTime, duration);

    const startTimeISO = formatISO(combinedStartDateTime);
    const endTimeISO = formatISO(combinedEndDateTime);

    try {
      setLoading(true);

      const bookingData = {
        id,
        duration,
        startTime: startTimeISO,
        endTime: endTimeISO,
        totalPrice: pricePerHour * duration,
        selectedTurfDate,
        ...(couponCode && { couponCode }),
        ...paymentData,
      };

      const response = await axiosInstance.post(
        "/api/user/booking/book-with-wallet",
        bookingData
      );

      if (response.data.success) {
        toast.success("Booking confirmed using Wallet!");
        dispatch(updateUser({ walletBalance: response.data.newBalance }));
        return response.data;
      }
    } catch (err) {
      if (err.response?.data?.message?.includes("Insufficient")) {
        toast.error(err.response.data.message);
        navigate("/wallet");
      } else if (err.response) {
        toast.error(err.response?.data?.message || "Booking failed");
      } else {
        toast.error("An error occurred during booking");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmReservation,
  };
};

export default useBookingConfirmation;
