import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useNavigate } from "react-router-dom";

const addVenueInviteSchema = z.object({
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits").optional().or(z.literal("")),
  name: z.string()
    .min(1, "Enter the name of the turf")
    .min(3, "Name must be at least 3 characters long"),
  description: z.string()
    .min(1, "Enter the description of the turf"),
  location: z.string()
    .min(1, "Enter the location of the turf"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  pricePerHour: z.preprocess((val) => Number(val), z.number()
    .min(100, "Price per hour must be at least 100 rupees")
    .max(5000, "Price per hour must be at most 5000 rupees")),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Open time is required"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Close time is required"),
  sportTypes: z.array(z.string()).min(1, "At least one sport type is required"),
  groundTypes: z.array(z.string()).min(1, "At least one ground type is required"),
  facilities: z.array(z.string()).min(1, "At least one facility is required"),
  slotDuration: z.preprocess((val) => Number(val), z.number().min(30).max(240)),
  breakTime: z.preprocess((val) => Number(val), z.number().min(0).max(60).optional().default(0)),
}).refine(data => {
  if (!data.email && !data.phone) return false;
  return true;
}, {
  message: "Either Email or Phone Number is required to send invite",
  path: ["email"],
});

export default function useAddVenueInvite() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(addVenueInviteSchema),
    defaultValues: {
      email: "",
      phone: "",
      sportTypes: [],
      groundTypes: [],
      facilities: [],
      openTime: "",
      closeTime: "",
      slotDuration: 60,
      breakTime: 0,
      city: "",
      state: "",
      latitude: "",
      longitude: "",
      pricePerHour: 0
    },
  });

  const [sportTypes, setSportTypes] = useState([]);
  const [groundTypes, setGroundTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [newSportType, setNewSportType] = useState("");
  const [newGroundType, setNewGroundType] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [magicLink, setMagicLink] = useState(null);

  const openTime = watch("openTime");
  const closeTime = watch("closeTime");
  const slotDuration = watch("slotDuration");
  const breakTime = watch("breakTime");
  const pricePerHour = watch("pricePerHour") || 0;

  useEffect(() => {
    setValue("sportTypes", sportTypes);
  }, [sportTypes, setValue]);

  useEffect(() => {
    setValue("groundTypes", groundTypes);
  }, [groundTypes, setValue]);

  useEffect(() => {
    setValue("facilities", facilities);
  }, [facilities, setValue]);

  const addSportType = (type) => {
    const sport = typeof type === 'string' ? type : newSportType;
    if (sport && !sportTypes.includes(sport)) {
      setSportTypes([...sportTypes, sport]);
      setNewSportType("");
    }
  };
  const removeSportType = (type) => setSportTypes(sportTypes.filter((sport) => sport !== type));

  const addGroundType = (type) => {
    const ground = typeof type === 'string' ? type : newGroundType;
    if (ground && !groundTypes.includes(ground)) {
      setGroundTypes([...groundTypes, ground]);
      setNewGroundType("");
    }
  };
  const removeGroundType = (type) => setGroundTypes(groundTypes.filter((ground) => ground !== type));

  const addFacility = (item) => {
    const facility = typeof item === 'string' ? item : newFacility;
    if (facility && !facilities.includes(facility)) {
      setFacilities([...facilities, facility]);
      setNewFacility("");
    }
  };
  const removeFacility = (item) => setFacilities(facilities.filter((f) => f !== item));

  useEffect(() => {
    if (openTime && closeTime && slotDuration) {
      const slots = [];
      const today = new Date().toISOString().split('T')[0];
      let current = new Date(`${today}T${openTime}`);
      let end = new Date(`${today}T${closeTime}`);
      
      if (end <= current) end.setDate(end.getDate() + 1);
      
      const defaultSlotPrice = (Number(pricePerHour) * (Number(slotDuration) / 60)).toFixed(2);

      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);
        
        if (slotEnd <= end) {
          slots.push({
            startTime: format(slotStart, "hh:mm aa"),
            endTime: format(slotEnd, "hh:mm aa"),
            isActive: true,
            price: Number(defaultSlotPrice)
          });
        }
        current = new Date(slotEnd.getTime() + (breakTime || 0) * 60000);
      }
      setGeneratedSlots(slots);
    }
  }, [openTime, closeTime, slotDuration, breakTime, pricePerHour]);

  const updateSlotPrice = (index, price) => {
    const newSlots = [...generatedSlots];
    newSlots[index].price = Number(price);
    setGeneratedSlots(newSlots);
  };

  const toggleSlotActive = (index) => {
    const newSlots = [...generatedSlots];
    newSlots[index].isActive = !newSlots[index].isActive;
    setGeneratedSlots(newSlots);
  };

  const submitToServer = async (data) => {
    setLoading(true);
    setMagicLink(null);
    try {
      // Format time fields before sending
      const today = new Date().toISOString().split('T')[0];
      data.openTime = format(new Date(`${today}T${data.openTime}`), "hh:mm aa");
      data.closeTime = format(new Date(`${today}T${data.closeTime}`), "hh:mm aa");

      const payload = {
        email: data.email || null,
        phone: data.phone || null,
        turfData: {
          ...data,
          generatedSlots
        }
      };

      const response = await axiosInstance.post("/api/admin/venue-invites", payload);
      toast.success(response.data.message);
      setMagicLink(response.data.magicLink);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    watch,
    onSubmit: submitToServer,
    sportTypes,
    addSportType,
    removeSportType,
    groundTypes,
    addGroundType,
    removeGroundType,
    facilities,
    addFacility,
    removeFacility,
    openTime,
    closeTime,
    slotDuration,
    breakTime,
    generatedSlots,
    toggleSlotActive,
    updateSlotPrice,
    loading,
    magicLink
  };
}
