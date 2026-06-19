import { useParams, useLocation } from "react-router-dom";
import useDateSelection from "./useDateSelection";
import useTimeSelection from "./useTimeSelection";
import useDurationSelection from "./useDurationSelection";
import useBookingConfirmation from "./useBookingConfirmation";
import { useState, useMemo } from "react";

const useReservation = () => {
  const { id, turfId: paramTurfId } = useParams();
  const turfId = id || paramTurfId;
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    location.state?.selectedDate
      ? new Date(location.state.selectedDate)
      : new Date()
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    location.state?.selectedSlot?.startTime || null
  );
  const [bookedTime, setBookedTime] = useState([]);
  const [timeSlots, setTimeSlots] = useState({
    openTime: "",
    closeTime: "",
    generatedSlots: [],
  });
  const [pricePerHour, setPricePerHour] = useState(0);
  const [duration, setDuration] = useState(1);

  const { handleDateChange } = useDateSelection(
    setSelectedDate,
    setSelectedStartTime,
    setDuration
  );

  const { availableTimes, handleTimeSelection, isTimeSlotBooked } =
    useTimeSelection(
      selectedDate,
      turfId,
      setSelectedStartTime,
      setBookedTime,
      setTimeSlots,
      setPricePerHour,
      bookedTime,
      timeSlots,
      setDuration
    );

  const { handleDurationChange, isDurationAvailable } = useDurationSelection(
    selectedStartTime,
    timeSlots,
    isTimeSlotBooked,
    setDuration
  );

  const { confirmReservation } = useBookingConfirmation(
    turfId,
    selectedDate,
    selectedStartTime,
    duration,
    pricePerHour,
    setLoading
  );

  const totalPrice = useMemo(() => {
    if (!selectedStartTime || !timeSlots?.generatedSlots) return 0;

    const startIndex = timeSlots.generatedSlots.findIndex(
      (s) =>
        s.startTime ===
        (typeof selectedStartTime === "object"
          ? selectedStartTime.startTime
          : selectedStartTime)
    );
    if (startIndex === -1) return 0;

    let sum = 0;
    for (let i = 0; i < duration; i++) {
      const slot = timeSlots.generatedSlots[startIndex + i];
      if (slot) {
        sum += slot.price || timeSlots.pricePerHour || 0;
      } else {
        sum += timeSlots.pricePerHour || 0;
      }
    }
    return sum;
  }, [selectedStartTime, duration, timeSlots]);

  return {
    selectedDate,
    selectedStartTime,
    duration,
    availableTimes,
    timeSlots,
    handleDateChange,
    handleTimeSelection,
    handleDurationChange,
    isTimeSlotBooked,
    isDurationAvailable,
    confirmReservation,
    pricePerHour,
    totalPrice,
    loading,
  };
};

export default useReservation;
