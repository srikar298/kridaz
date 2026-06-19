import { useEffect, useMemo } from "react";
import * as Sentry from "@sentry/react";
import { format, parse, isBefore, isAfter, parseISO, addDays } from "date-fns";
import axiosInstance from "@hooks/useAxiosInstance";

const useTimeSelection = (
  selectedDate,
  turfId,
  setSelectedStartTime,
  setBookedTime,
  setTimeSlots,
  setPricePerHour,
  bookedTime,
  timeSlots,
  setDuration
) => {
  const availableTimes = useMemo(() => {
    if (timeSlots?.generatedSlots && timeSlots.generatedSlots.length > 0) {
      return timeSlots.generatedSlots
        .filter((slot) => slot.isActive)
        .map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price || timeSlots.pricePerHour || 0,
        }));
    }

    return [];
  }, [
    timeSlots?.openTime,
    timeSlots?.closeTime,
    timeSlots?.generatedSlots,
    timeSlots?.pricePerHour,
  ]);

  const handleTimeSelection = (time) => {
    setSelectedStartTime(time);
    setDuration(1);
  };

  const isTimeSlotBooked = (time) => {
    const timeToCheck = parse(time, "hh:mm a", new Date());
    return bookedTime.some((booking) => {
      const bookingStart = parse(booking.startTime, "hh:mm a", new Date());
      let bookingEnd = parse(booking.endTime, "hh:mm a", new Date());

      if (isBefore(bookingEnd, bookingStart)) {
        bookingEnd = addDays(bookingEnd, 1);
      }

      return (
        (isAfter(timeToCheck, bookingStart) ||
          isSameTime(timeToCheck, bookingStart)) &&
        isBefore(timeToCheck, bookingEnd)
      );
    });
  };

  const isSameTime = (time1, time2) => {
    return (
      time1.getHours() === time2.getHours() &&
      time1.getMinutes() === time2.getMinutes()
    );
  };

  const fetchByDate = async (currentSelectedDate, turfId) => {
    const date = format(currentSelectedDate, "yyyy-MM-dd");

    try {
      const response = await axiosInstance.get(
        `/api/user/turf/timeSlot?date=${date}&turfId=${turfId}`
      );
      const result = await response.data;
      setTimeSlots(result.timeSlots);
      setPricePerHour(result.timeSlots.pricePerHour);

      const formattedBookedTime = result.bookedTime.map((booking) => ({
        ...booking,
        startTime: format(parseISO(booking.startTime), "hh:mm a"),
        endTime: format(parseISO(booking.endTime), "hh:mm a"),
      }));
      setBookedTime(formattedBookedTime);
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    fetchByDate(selectedDate, turfId);
  }, [selectedDate, turfId]);

  return {
    availableTimes,
    handleTimeSelection,
    isTimeSlotBooked,
  };
};

export default useTimeSelection;
