import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Star, Heart, MapPin, Share2, MessageSquare, Bookmark, 
  Wallet, Users, Calendar, Clock, Info, ArrowRight, Lock, Zap, X
} from "lucide-react";
import { useSelector } from "react-redux";
import { useGetSavedTurfsQuery, useToggleTurfLikeMutation } from "@redux/api/turfApi";
import toast from "react-hot-toast";
import { format, parse, isBefore, isAfter, parseISO, addDays } from "date-fns";
import axiosInstance from "@infrastructure/axios";

/** Haversine distance in km */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateObj: d,
      dayName: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" })
    });
  }
  return dates;
};

const TurfCardMobile = ({ turf, distance: distanceProp }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const user = useSelector((state) => state.auth.user);
  
  const { data: savedData } = useGetSavedTurfsQuery(undefined, { skip: !isLoggedIn });
  const [toggleLikeApi] = useToggleTurfLikeMutation();

  const targetId = turf.id || turf._id;
  const isWishlisted = isLoggedIn && savedData?.turfs?.some(t => (t.id || t._id) === targetId);

  const returnTo = searchParams.get('returnTo');
  const baseTo = `/venue/${targetId}`;
  const to = returnTo ? `${baseTo}?returnTo=${encodeURIComponent(returnTo)}` : baseTo;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.averageRating ?? turf.avgRating ?? turf.rating ?? 0;
  const reviewsCount = turf.reviewsCount ?? 0;
  
  // Extract sports
  const sportTypes = turf.sportTypes || [];

  // Dates & Slots
  const [dates] = useState(generateDates());
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDateTimeDrawerOpen, setIsDateTimeDrawerOpen] = useState(false);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
    }
    return daysArray;
  };
  const calendarDays = getDaysInMonth(currentMonthDate);

  let parsedSlots = [];
  if (Array.isArray(turf.generatedSlots)) {
    parsedSlots = turf.generatedSlots;
  } else if (typeof turf.generatedSlots === 'string') {
    try {
      parsedSlots = JSON.parse(turf.generatedSlots);
      if (typeof parsedSlots === 'string') parsedSlots = JSON.parse(parsedSlots);
    } catch (e) {
      console.error("Failed to parse generatedSlots", e);
    }
  }

  const activeSlots = Array.isArray(parsedSlots) 
    ? parsedSlots.filter(s => s.isActive !== false) 
    : [];

  const displaySlots = activeSlots.length > 0
    ? activeSlots.map(s => `${s.startTime} - ${s.endTime}`)
    : [];

  const [bookedTime, setBookedTime] = useState([]);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedDate || !targetId) return;
      try {
        const dateStr = format(selectedDate.dateObj, "yyyy-MM-dd");
        const response = await axiosInstance.get(
          `/api/user/turf/timeSlot?date=${dateStr}&turfId=${targetId}`
        );
        if (response.data && response.data.bookedTime) {
          const formattedBookedTime = response.data.bookedTime.map((booking) => ({
            ...booking,
            startTime: format(parseISO(booking.startTime), "hh:mm a"),
            endTime: format(parseISO(booking.endTime), "hh:mm a"),
          }));
          setBookedTime(formattedBookedTime);
        }
      } catch (error) {
        console.error("Failed to fetch booked slots:", error);
      }
    };
    fetchBookedTimes();
  }, [selectedDate.dateObj, targetId]);

  const isSameTime = (time1, time2) => {
    return (
      time1.getHours() === time2.getHours() &&
      time1.getMinutes() === time2.getMinutes()
    );
  };

  const isTimeSlotBooked = (time) => {
    try {
      let timeToCheckStr = time;
      if (time.includes('-')) {
          timeToCheckStr = time.split('-')[0].trim();
      }
      const timeToCheck = parse(timeToCheckStr, "hh:mm a", new Date());
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
    } catch (e) {
      return false;
    }
  };

  // ── Carousel Logic ──
  const carouselItems = [];
  if (turf.youtubeUrl) {
    const getYouTubeId = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    const videoId = getYouTubeId(turf.youtubeUrl);
    if (videoId) {
      carouselItems.push({ type: 'video', id: videoId });
    }
  }
  images.forEach(img => {
    carouselItems.push({ type: 'image', url: img });
  });

  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const width = container.clientWidth;
      const currentIdx = Math.round(container.scrollLeft / width);
      const nextIdx = (currentIdx + 1) % carouselItems.length;
      
      container.scrollTo({
        left: nextIdx * width,
        behavior: 'smooth'
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // ── Distance calculation ──
  const [calcDistance, setCalcDistance] = useState(null);
  useEffect(() => {
    if (distanceProp) return; 
    const venueLat = turf.location?.coordinates?.[1] ?? turf.latitude ?? turf.lat;
    const venueLng = turf.location?.coordinates?.[0] ?? turf.longitude ?? turf.lng;
    if (!venueLat || !venueLng) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, venueLat, venueLng);
          setCalcDistance(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
        },
        () => {},
        { timeout: 5000, maximumAge: 300000 }
      );
    }
  }, [turf, distanceProp]);

  const distance = distanceProp || calcDistance;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login to save venues");
      return;
    }
    try {
      await toggleLikeApi(targetId).unwrap();
    } catch (err) {
      console.error("Failed to toggle wishlist like:", err);
      toast.error("Failed to save venue");
    }
  };

  // Determine the price based on selected slot
  const getSelectedSlotPrice = () => {
    if (!selectedSlot) return turf.pricePerHour ?? turf.price ?? null;
    const slotIndex = displaySlots.indexOf(selectedSlot);
    if (slotIndex !== -1) {
      return activeSlots[slotIndex]?.price ?? turf.pricePerHour ?? turf.price ?? null;
    }
    return turf.pricePerHour ?? turf.price ?? null;
  };
  
  const currentPrice = getSelectedSlotPrice();

  const handleBookNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedSlot) {
      toast.error("Please select a time slot to book");
      return;
    }

    if (returnTo) {
      const url = new URL(returnTo, window.location.origin);
      url.searchParams.set('groundId', turf._id || turf.id);
      url.searchParams.set('date', selectedDate.dateObj.toISOString());
      url.searchParams.set('time', selectedSlot);
      if (currentPrice !== null) {
        url.searchParams.set('price', currentPrice);
      }
      navigate(url.pathname + url.search);
      return;
    }

    navigate(`/checkout/${turf._id || turf.id}`, {
      state: {
        turfName: turf.name,
        selectedDate: selectedDate.dateObj.toISOString(),
        startTime: selectedSlot,
        duration: 1,
        amount: currentPrice !== null ? Number(currentPrice) : 0,
        location: turf.location
      }
    });
  };

  return (
    <div className="w-full h-auto bg-[#121212] rounded-[16px] overflow-hidden border border-[rgba(255,255,255,0.08)] font-inter shadow-[0px_8px_24px_rgba(85,222,232,0.10)] flex flex-col">
      {/* ── Top Image Header (16:9 ratio) ── */}
      <div className="relative w-full aspect-video shrink-0 group">
        <div 
          ref={scrollContainerRef}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {carouselItems.map((item, idx) => (
            <div key={idx} className="w-full h-full shrink-0 snap-center">
              {item.type === 'video' ? (
                <iframe
                  className="w-full h-full object-cover pointer-events-none"
                  src={`https://www.youtube.com/embed/${item.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.id}&playsinline=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <img
                  src={item.url || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
                  alt={`${turf.name} - ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>


        {/* Action Buttons Overlay */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(to);
            }}
            className="flex items-center justify-center px-3 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors text-[11px] font-bold"
          >
            About
          </button>
          <button 
            onClick={toggleWishlist}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
          >
            <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : "text-white"} />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: turf.name,
                  text: 'Check out this venue on Kridaz!',
                  url: window.location.origin + '/venue/' + targetId,
                }).catch(err => console.log('Share failed:', err));
              } else {
                navigator.clipboard.writeText(window.location.origin + '/venue/' + targetId);
                toast.success("Link copied to clipboard");
              }
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
          >
            <Share2 size={14} />
          </button>
        </div>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-[#BFF367]' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      {/* ── Content Area (Fills remaining height) ── */}
      <div className="flex-1 p-[16px] flex flex-col justify-start gap-[16px] bg-transparent shrink-0 overflow-hidden">
        
        {/* Title and Rating Row */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-[700] font-inter tracking-normal text-[#FFFFFF] leading-[28px] mb-1 truncate">
              {turf.name}
            </h2>
            <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.70)] mt-0.5">
              <MapPin size={12} className="text-[#BFF367] shrink-0" />
              <p className="text-[12px] font-[400] leading-[16px] truncate">
                {turf.location || turf.city || 'Location unavailable'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-[#BFF367]">
              <Star size={14} className="fill-[#BFF367]" />
              <span className="text-[18px] font-[700] leading-none">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>




        {/* Date Selector */}
        <div className="flex flex-col gap-[8px]">
          <div className="grid grid-cols-5 gap-[12px]">
            {dates.slice(0, 4).map((d, idx) => {
              const isSelected = selectedDate.dateNum === d.dateNum;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center justify-center w-full py-1.5 rounded-[16px] border transition-all ${
                    isSelected 
                      ? "border-none bg-[#BFF367] text-[#000000]" 
                      : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF]"
                  }`}
                >
                  <span className="text-[12px] font-[400] mb-0.5">{d.dayName.substring(0, 3)}</span>
                  <span className="text-[14px] font-[600] leading-none">{d.dateNum}</span>
                </button>
              );
            })}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDateTimeDrawerOpen(true); }}
              className="flex flex-col items-center justify-center w-full py-1.5 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF] transition-all group"
            >
              <Calendar size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Time Slot Selector */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#FFFFFF]">
              <Clock size={12} />
              <h4 className="text-[14px] font-[600] leading-[20px]">Select time slot</h4>
            </div>
          </div>
          <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-[12px] pb-1">
            {displaySlots.length > 0 ? displaySlots.map((slot, idx) => {
              const isSelected = selectedSlot === slot;
              const isBooked = isTimeSlotBooked(slot);
              return (
                <button
                  key={idx}
                  disabled={isBooked}
                  onClick={() => !isBooked && setSelectedSlot(slot)}
                  className={`shrink-0 relative px-3 py-1.5 rounded-[16px] border transition-all text-[12px] font-[600] flex items-center justify-center ${
                    isBooked
                      ? "bg-[#1A1A1A] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] cursor-not-allowed"
                      : isSelected
                        ? "bg-[#BFF367] border-none text-[#000000]"
                        : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF]"
                  }`}
                >
                  {slot}
                </button>
              );
            }) : <div className="text-[12px] text-[rgba(255,255,255,0.70)] py-1.5 px-1 italic">No slots available</div>}
          </div>
        </div>

        {/* Book Now Button & Footer */}
        <div className="flex flex-col gap-[12px] mt-auto pt-[12px]">
          <button 
            onClick={handleBookNow}
            className={`w-full font-[700] text-[18px] h-[58px] rounded-[16px] flex items-center justify-center transition-all ${
              selectedSlot 
                ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[#000000] shadow-[0px_8px_24px_rgba(191,243,103,0.15)]" 
                : "bg-[#1B1B1B] text-[#FFFFFF] border border-[rgba(255,255,255,0.08)] opacity-40 cursor-not-allowed"
            }`}
          >
            <span>{selectedSlot ? (currentPrice !== null && currentPrice !== undefined && currentPrice !== "" ? `${returnTo ? 'Add to Game' : 'Book Now'} - ₹${currentPrice}` : (returnTo ? 'Add to Game' : 'Book Now')) : "Select a Time Slot"}</span>
          </button>
        </div>
      </div>

      {/* Date & Time Selector Drawer */}
      {isDateTimeDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-start">
          <style>{`
            @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideDownDrawer { from { transform: translateY(-100%); } to { transform: translateY(0); } }
          `}</style>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            style={{ animation: 'fadeOverlay 0.3s ease-out' }}
            onClick={(e) => { e.stopPropagation(); setIsDateTimeDrawerOpen(false); }}
          />
          <div 
            className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] p-[24px] flex flex-col overflow-y-auto no-scrollbar font-sans rounded-t-[20px]"
            style={{ animation: 'slideDownDrawer 0.4s cubic-bezier(0.16, 1, 0.3, 1)', marginTop: 'auto', height: '90dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-[18px] font-[700] text-[#FFFFFF]">Select Date & Time</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsDateTimeDrawerOpen(false); }}
                className="p-2 rounded-full bg-transparent text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF] transition-colors border border-[rgba(255,255,255,0.08)]"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col mb-6 shrink-0 bg-[#121212] p-[16px] rounded-[16px] border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[16px] font-[600] text-[#FFFFFF]">Select Date</h4>
                <div className="flex items-center gap-3 bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] rounded-full px-2 py-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)); }}
                    className="p-1 text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[12px] font-[600] text-[#FFFFFF] uppercase tracking-wider min-w-[60px] text-center">
                    {currentMonthDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)); }}
                    className="p-1 text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[12px] text-[rgba(255,255,255,0.70)] font-[400] py-1 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const isSelected = selectedDate?.dateObj && day.toDateString() === selectedDate.dateObj.toDateString();
                  // Check if selectedDate from initial map is used (which uses dateNum)
                  const isInitiallySelected = !selectedDate.dateObj && day.getDate() === selectedDate.dateNum && day.getMonth() === new Date().getMonth();
                  const isActive = isSelected || isInitiallySelected;
                  
                  const isPast = day < new Date(new Date().setHours(0,0,0,0));
                  return (
                    <button
                      key={idx}
                      disabled={isPast}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate({
                          dateObj: day,
                          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
                          dateNum: day.getDate(),
                          month: day.toLocaleDateString("en-US", { month: "short" })
                        });
                      }}
                      className={`aspect-square rounded-full flex items-center justify-center text-[12px] font-[600] transition-all ${
                        isActive 
                          ? "bg-[#BFF367] text-[#000000]" 
                          : isPast ? "text-[rgba(255,255,255,0.20)] cursor-not-allowed" : "text-[rgba(255,255,255,0.70)] hover:bg-[#1B1B1B]"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <h4 className="text-[16px] font-[600] text-[#FFFFFF] mb-3 shrink-0">Time Slots</h4>
            <div className="grid grid-cols-2 gap-[12px] mb-6 shrink-0">
              {displaySlots.length > 0 ? displaySlots.map((slot, idx) => {
                const isSelected = selectedSlot === slot;
                const isBooked = isTimeSlotBooked(slot);
                return (
                  <button
                    key={idx}
                    disabled={isBooked}
                    onClick={(e) => { e.stopPropagation(); !isBooked && setSelectedSlot(slot); }}
                    className={`py-3 rounded-[16px] border transition-all text-[12px] font-[600] flex items-center justify-center ${
                      isBooked
                        ? "bg-[#1A1A1A] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] cursor-not-allowed"
                        : isSelected ? "border-none bg-[#BFF367] text-[#000000]" : "border-[rgba(255,255,255,0.08)] bg-[#121212] text-[rgba(255,255,255,0.70)] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              }) : <div className="col-span-2 text-center text-[12px] text-[rgba(255,255,255,0.70)] py-4 italic">No slots available for this day.</div>}
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (selectedSlot) {
                  handleBookNow(e);
                } else {
                  setIsDateTimeDrawerOpen(false);
                }
              }}
              className={`w-full mt-auto font-[700] text-[18px] h-[58px] rounded-[16px] flex items-center justify-center transition-all shrink-0 ${
                selectedSlot 
                  ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[#000000] shadow-[0px_8px_24px_rgba(191,243,103,0.15)]" 
                  : "bg-[#1B1B1B] text-[#FFFFFF] border border-[rgba(255,255,255,0.08)] opacity-40"
              }`}
            >
              {selectedSlot ? (currentPrice !== null && currentPrice !== undefined && currentPrice !== "" ? `${returnTo ? 'Add to Game' : 'Book Now'} - ₹${currentPrice}` : (returnTo ? 'Add to Game' : 'Book Now')) : "Close"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TurfCardMobile;
