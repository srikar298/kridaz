import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";import { Button } from "@kridaz/ui";


const MaterialDateTimePicker = ({
  isOpen,
  onClose,
  onSelect,
  initialDate,
  initialTime,
}) => {
  const [step, setStep] = useState("DATE"); // 'DATE' or 'TIME'
  const [clockView, setClockView] = useState("HOUR"); // 'HOUR' or 'MINUTE'

  const [selectedDate, setSelectedDate] = useState(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Parse time
  const initHour = initialTime ? parseInt(initialTime.split(":")[0]) : 9;
  const initMinute = initialTime ? parseInt(initialTime.split(":")[1]) : 0;
  const [selectedHour, setSelectedHour] = useState(initHour);
  const [selectedMinute, setSelectedMinute] = useState(initMinute);
  const [amPm, setAmPm] = useState(initHour >= 12 ? "PM" : "AM");

  useEffect(() => {
    if (isOpen) {
      setStep("DATE");
      setClockView("HOUR");
    }
  }, [isOpen]);

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setTimeout(() => {
      setStep("TIME");
    }, 300);
  };

  const handleHourClick = (h) => {
    let newHour = h;
    if (amPm === "PM" && h < 12) newHour += 12;
    if (amPm === "AM" && h === 12) newHour = 0;
    setSelectedHour(newHour);
    setTimeout(() => {
      setClockView("MINUTE");
    }, 300);
  };

  const handleMinuteClick = (m) => {
    setSelectedMinute(m);
    setTimeout(() => {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const formattedTime = `${String(selectedHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      onSelect(formattedDate, formattedTime);
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const formattedTime = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    onSelect(formattedDate, formattedTime);
    onClose();
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        if (!isCurrentMonth) {
          days.push(<div key={day.toString()} className="w-8 h-8"></div>);
        } else {
          days.push(
            <div
              key={day.toString()}
              onClick={() => handleDateClick(cloneDay)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all
                ${isSelected ? "bg-gradient-to-r from-cyan-400 to-lime-400 text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]" : "text-white hover:bg-neutral-800"}`}
            >
              {formattedDate}
            </div>
          );
        }
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day} className="flex justify-between w-full mt-2">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="w-full">
        {/* Header */}
        <div className="bg-neutral-800 p-4 -mt-4 -mx-4 mb-4 rounded-t-xl">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">
            {format(selectedDate, "yyyy")}
          </p>
          <p className="text-2xl font-black text-white">
            {format(selectedDate, "EEE, d MMM")}
          </p>
        </div>

        <div className="flex justify-between items-center mb-4 px-2">
          <Button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="text-sm font-bold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className="flex justify-between w-full mb-2 px-2">
          {weekDays.map((wd, i) => (
            <div
              key={i}
              className="w-8 text-center text-xs font-black text-neutral-500"
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="px-2">{rows}</div>
      </div>
    );
  };

  const renderClock = () => {
    const isHour = clockView === "HOUR";
    const items = isHour
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    let activeValue = isHour ? selectedHour % 12 || 12 : selectedMinute;

    // Calculate active index for the hand
    const activeIndex = items.indexOf(activeValue);

    return (
      <div className="w-full flex flex-col items-center">
        {/* Header */}
        <div className="bg-neutral-800 p-4 -mt-4 -mx-4 mb-6 rounded-t-xl w-[calc(100%+32px)] flex flex-col items-center">
          <div className="flex items-baseline gap-1 text-5xl font-black text-white">
            <span
              onClick={() => setClockView("HOUR")}
              className={`cursor-pointer transition-colors ${clockView === "HOUR" ? "text-white" : "text-neutral-500"}`}
            >
              {String(selectedHour % 12 || 12).padStart(2, "0")}
            </span>
            <span className="text-neutral-500 mb-1">:</span>
            <span
              onClick={() => setClockView("MINUTE")}
              className={`cursor-pointer transition-colors ${clockView === "MINUTE" ? "text-white" : "text-neutral-500"}`}
            >
              {String(selectedMinute).padStart(2, "0")}
            </span>
          </div>
          <div className="flex gap-4 mt-3">
            <Button
              onClick={() => {
                setAmPm("AM");
                if (selectedHour >= 12) setSelectedHour(selectedHour - 12);
              }}
              className={`text-xs font-black px-3 py-1 rounded-full transition-colors ${amPm === "AM" ? "bg-gradient-to-r from-cyan-400 to-lime-400 text-black" : "text-neutral-400"}`}
            >
              AM
            </Button>
            <Button
              onClick={() => {
                setAmPm("PM");
                if (selectedHour < 12) setSelectedHour(selectedHour + 12);
              }}
              className={`text-xs font-black px-3 py-1 rounded-full transition-colors ${amPm === "PM" ? "bg-gradient-to-r from-cyan-400 to-lime-400 text-black" : "text-neutral-400"}`}
            >
              PM
            </Button>
          </div>
        </div>

        {/* Circular Clock Face */}
        <div className="relative w-64 h-64 bg-neutral-800 rounded-full flex items-center justify-center">
          {/* Center Dot */}
          <div className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-lime-400 rounded-full z-10" />

          {/* Clock Hand */}
          <div
            className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div
              className="absolute left-1/2 bottom-1/2 w-[2px] bg-gradient-to-t from-cyan-400 to-lime-400 origin-bottom"
              style={{
                height: "105px",
                transform: `translateX(-50%) rotate(${activeIndex * 30}deg)`,
              }}
            >
              <div className="absolute -top-[15px] -left-[14px] w-[30px] h-[30px] bg-lime-400/20 rounded-full border border-lime-400" />
            </div>
          </div>

          {/* Numbers */}
          {items.map((item, i) => {
            const rad = ((i * 30 - 90) * Math.PI) / 180;
            const radius = 105;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const isActive = activeValue === item;

            return (
              <div
                key={item}
                onClick={() =>
                  isHour ? handleHourClick(item) : handleMinuteClick(item)
                }
                className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer z-10 transition-colors text-white ${!isActive ? "hover:bg-neutral-700" : ""}`}
                style={{
                  top: "50%",
                  left: "50%",
                  marginTop: "-16px",
                  marginLeft: "-16px",
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {String(item).padStart(2, "0")}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 rounded-xl shadow-2xl overflow-hidden w-full max-w-[320px] p-4 border border-neutral-800"
      >
        <div className="min-h-[380px]">
          <AnimatePresence mode="wait">
            {step === "DATE" ? (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {renderCalendar()}
              </motion.div>
            ) : (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderClock()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-neutral-800">
          <div className="flex gap-2">
            <Button
              onClick={() => setStep("DATE")}
              className={`p-2 rounded-lg transition-colors ${step === "DATE" ? "text-lime-400 bg-lime-400/10" : "text-neutral-500 hover:text-white hover:bg-neutral-800"}`}
            >
              <Calendar size={18} />
            </Button>
            <Button
              onClick={() => setStep("TIME")}
              className={`p-2 rounded-lg transition-colors ${step === "TIME" ? "text-lime-400 bg-lime-400/10" : "text-neutral-500 hover:text-white hover:bg-neutral-800"}`}
            >
              <Clock size={18} />
            </Button>
          </div>

          <div className="flex gap-2 text-sm font-bold">
            <Button
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleConfirm}
              className="px-4 py-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-lime-400 hover:opacity-80 transition-opacity uppercase tracking-widest"
            >
              OK
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MaterialDateTimePicker;
