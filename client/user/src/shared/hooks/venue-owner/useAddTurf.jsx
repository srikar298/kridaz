import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isValid } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useNavigate, useSearchParams } from "react-router-dom";

const addTurfSchema = z
  .object({
    name: z
      .string()
      .min(1, "Enter the name of the turf")
      .min(3, "Name must be at least 3 characters long"),
    description: z
      .string()
      .min(1, "Enter the description of the turf")
      .min(3, "Description must be at least 3 characters long"),
    policies: z
      .string()
      .min(1, "Venue policies and rules are required")
      .min(200, "Policies must be at least 200 characters long")
      .max(10000, "Policies must be at most 10,000 characters long"),
    location: z
      .string()
      .min(1, "Enter the location of the turf")
      .min(3, "Location must be at least 3 characters long"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    pricePerHour: z.coerce
      .number()
      .min(500, "Price per hour must be at least 500 rupees")
      .max(10000, "Price per hour must be at most 10000 rupees"),
    images: z.any().refine((value) => {
      if (!value || value.length === 0) return false;
      if (value.length > 10) return false;
      const acceptedFormats = ["image/png", "image/jpeg", "image/webp"];
      return Array.from(value).every((file) =>
        acceptedFormats.includes(file.type)
      );
    }, "Please upload at least one valid image (PNG, JPEG, or WebP). Max 10 images."),
    youtubeUrl: z
      .union([z.literal(""), z.string().url("Invalid YouTube URL")])
      .optional()
      .nullable(),
    openTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Open time is required"),
    closeTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Close time is required"),
    sportTypes: z
      .array(z.string())
      .min(1, "At least one sport type is required"),
    groundTypes: z
      .array(z.string())
      .min(1, "At least one ground type is required"),
    facilities: z.array(z.string()).min(1, "At least one facility is required"),
    slotDuration: z.preprocess(
      (val) => Number(val),
      z.number().min(30).max(240)
    ),
    breakTime: z.preprocess(
      (val) => Number(val),
      z.number().min(0).max(60).optional().default(0)
    ),
    slotsConfigDuration: z.enum(["Until Changed", "Fixed Weeks"], {
      required_error: "Configuration duration is required",
    }),
    slotsConfigWeeks: z.preprocess(
      (val) => Number(val),
      z.number().min(1).max(52).optional().default(1)
    ),
    mapUrl: z
      .union([z.literal(""), z.string().url("Invalid Google Maps URL")])
      .optional()
      .nullable(),
    managerContacts: z
      .array(
        z.object({
          name: z.string().min(1, "Manager name is required"),
          phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
        })
      )
      .optional(),
    gstRegistration: z.any().optional(),
    saleDeed: z.any().optional(),
    rentalAgreement: z.any().optional(),
    ownershipAgreement: z.any().optional(),
    googleProfileScreenshot: z.any().optional(),
    electricityBill: z.any().optional(),
  })
  .refine(
    (data) => {
      if (!data.openTime || !data.closeTime) return true;
      return true; // Removing strict comparison to allow past midnight like 02:00
    },
    {
      message: "Close time must be valid",
      path: ["closeTime"],
    }
  );

export default function useAddTurf() {
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    trigger,
    clearErrors,
    getValues,
  } = useForm({
    resolver: zodResolver(addTurfSchema),
    defaultValues: {
      sportTypes: [],
      groundTypes: [],
      facilities: [],
      openTime: "",
      closeTime: "",
      youtubeUrl: "",
      policies: "",
      slotDuration: 60,
      breakTime: 0,
      city: "",
      state: "",
      latitude: "",
      longitude: "",
      mapUrl: "",
      managerContacts: [],
      availableDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      offDays: [],
      slotsConfigDuration: "Until Changed",
      slotsConfigWeeks: 1,
    },
  });

  const [managerContacts, setManagerContacts] = useState([]);
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerPhone, setNewManagerPhone] = useState("");

  const [sportTypes, setSportTypes] = useState([]);
  const [groundTypes, setGroundTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [newSportType, setNewSportType] = useState("");
  const [newGroundType, setNewGroundType] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [generatedSlots, setGeneratedSlots] = useState([]);

  // Load draft from local storage on mount, or fetch invite data
  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/public/venue-invites/verify/${inviteToken}`
        );
        const { turf } = response.data.data.invite;
        if (turf) {
          setValue("name", turf.name || "");
          setValue("description", turf.description || "");
          setValue("location", turf.location || "");
          setValue("city", turf.city || "");
          setValue("state", turf.state || "");
          setValue("openTime", turf.openTime || "");
          setValue("closeTime", turf.closeTime || "");
          setValue("pricePerHour", turf.pricePerHour || 0);
          setValue("slotDuration", turf.slotDuration || 60);

          if (turf.sportTypes) setSportTypes(turf.sportTypes);
          if (turf.groundTypes) setGroundTypes(turf.groundTypes);
          if (turf.facilities) setFacilities(turf.facilities);

          toast.success("Loaded invited venue details.");
        }
      } catch (e) {
        console.error("Failed to fetch invite data", e);
        toast.error("Invalid or expired invite link");
      }
    };

    if (inviteToken) {
      fetchInviteData();
    } else {
      const savedDraft = localStorage.getItem("addVenueDraft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          Object.keys(parsed).forEach((key) => {
            if (key === "openTime" || key === "closeTime") {
              if (parsed[key]) setValue(key, parsed[key]);
            } else {
              setValue(key, parsed[key]);
            }
          });
          if (parsed.managerContacts)
            setManagerContacts(parsed.managerContacts);
          if (parsed.sportTypes) setSportTypes(parsed.sportTypes);
          if (parsed.groundTypes) setGroundTypes(parsed.groundTypes);
          if (parsed.facilities) setFacilities(parsed.facilities);
          toast.success("Draft loaded successfully!");
        } catch (e) {
          console.error("Failed to load draft");
        }
      }
    }
  }, [setValue, inviteToken]);

  const saveDraft = () => {
    const data = getValues();
    const dataToSave = { ...data };
    // Remove files
    delete dataToSave.images;
    delete dataToSave.saleDeed;
    delete dataToSave.electricityBill;
    delete dataToSave.rentalAgreement;
    delete dataToSave.ownershipAgreement;
    delete dataToSave.gstRegistration;
    delete dataToSave.googleProfileScreenshot;
    localStorage.setItem("addVenueDraft", JSON.stringify(dataToSave));
    toast.success("Draft saved successfully! (Files are not saved)");
  };

  const openTime = watch("openTime");
  const closeTime = watch("closeTime");
  const slotDuration = watch("slotDuration");
  const breakTime = watch("breakTime");
  const availableDays = watch("availableDays");
  const offDays = watch("offDays");

  useEffect(() => {
    setValue("sportTypes", sportTypes);
  }, [sportTypes, setValue]);

  useEffect(() => {
    setValue("groundTypes", groundTypes);
  }, [groundTypes, setValue]);

  useEffect(() => {
    setValue("facilities", facilities);
  }, [facilities, setValue]);

  useEffect(() => {
    setValue("managerContacts", managerContacts);
  }, [managerContacts, setValue]);

  const addManagerContact = () => {
    if (newManagerName && newManagerPhone) {
      if (!/^\d{10}$/.test(newManagerPhone)) {
        toast.error("Phone number must be 10 digits");
        return;
      }
      setManagerContacts([
        ...managerContacts,
        { name: newManagerName, phone: newManagerPhone },
      ]);
      setNewManagerName("");
      setNewManagerPhone("");
    } else {
      toast.error("Please enter both manager name and phone");
    }
  };

  const removeManagerContact = (index) => {
    setManagerContacts(managerContacts.filter((_, i) => i !== index));
  };

  const addSportType = (type) => {
    const sport = typeof type === "string" ? type : newSportType;
    if (sport && !sportTypes.includes(sport)) {
      setSportTypes([...sportTypes, sport]);
      setNewSportType("");
    }
  };

  const removeSportType = (type) => {
    setSportTypes(sportTypes.filter((sport) => sport !== type));
  };

  const addGroundType = (type) => {
    const ground = typeof type === "string" ? type : newGroundType;
    if (ground && !groundTypes.includes(ground)) {
      setGroundTypes([...groundTypes, ground]);
      setNewGroundType("");
    }
  };

  const removeGroundType = (type) => {
    setGroundTypes(groundTypes.filter((ground) => ground !== type));
  };

  const addFacility = (item) => {
    const facility = typeof item === "string" ? item : newFacility;
    if (facility && !facilities.includes(facility)) {
      setFacilities([...facilities, facility]);
      setNewFacility("");
    }
  };

  const removeFacility = (item) => {
    setFacilities(facilities.filter((f) => f !== item));
  };

  const toggleDay = (day) => {
    const currentDays = watch("availableDays");
    const currentOff = watch("offDays");

    if (currentDays.includes(day)) {
      setValue(
        "availableDays",
        currentDays.filter((d) => d !== day)
      );
      if (!currentOff.includes(day)) {
        setValue("offDays", [...currentOff, day]);
      }
    } else {
      setValue("availableDays", [...currentDays, day]);
      setValue(
        "offDays",
        currentOff.filter((d) => d !== day)
      );
    }
  };

  const pricePerHour = watch("pricePerHour") || 0;

  useEffect(() => {
    if (openTime && closeTime && slotDuration) {
      const slots = [];
      const today = new Date().toISOString().split("T")[0];
      let current = new Date(`${today}T${openTime}`);
      let end = new Date(`${today}T${closeTime}`);

      if (end <= current) {
        end.setDate(end.getDate() + 1);
      }

      const defaultSlotPrice = (
        Number(pricePerHour) *
        (Number(slotDuration) / 60)
      ).toFixed(2);

      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);

        if (slotEnd <= end) {
          slots.push({
            startTime: format(slotStart, "hh:mm aa"),
            endTime: format(slotEnd, "hh:mm aa"),
            isActive: true,
            price: Number(defaultSlotPrice),
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

    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "images") {
        if (data[key]) {
          Array.from(data[key]).forEach((file) => {
            formData.append("images", file);
          });
        }
      } else if (key === "openTime" || key === "closeTime") {
        const today = new Date().toISOString().split("T")[0];
        const dateObj = new Date(`${today}T${data[key]}`);
        formData.append(key, format(dateObj, "hh:mm aa"));
      } else if (
        key === "sportTypes" ||
        key === "groundTypes" ||
        key === "facilities"
      ) {
        if (Array.isArray(data[key])) {
          data[key].forEach((item) => {
            formData.append(key, item);
          });
        }
      } else if (key === "availableDays" || key === "offDays") {
        data[key].forEach((day) => formData.append(key, day));
      } else if (key === "managerContacts") {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      }
    });

    // Append generated slots
    formData.append("generatedSlots", JSON.stringify(generatedSlots));
    if (inviteToken) {
      formData.append("inviteToken", inviteToken);
    }

    try {
      const response = await axiosInstance.post(
        "/api/owner/turf/owner/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const result = response.data;
      toast.success(result.message);
      navigate("/venue-owner/turfs");
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message);
      } else if (error.request) {
        toast.error("No response from server. Please try again later.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    await submitToServer(data);
    localStorage.removeItem("addVenueDraft"); // Clear draft on successful submission
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude.toString());
        setValue("longitude", position.coords.longitude.toString());
        setIsLocating(false);
        toast.success("Coordinates captured successfully!");
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        toast.error(
          "Unable to retrieve your location. Please check permissions."
        );
      }
    );
  };

  return {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    watch,
    onSubmit,
    sportTypes,
    newSportType,
    setNewSportType,
    addSportType,
    removeSportType,
    groundTypes,
    newGroundType,
    setNewGroundType,
    addGroundType,
    removeGroundType,
    facilities,
    newFacility,
    setNewFacility,
    addFacility,
    removeFacility,
    openTime,
    closeTime,
    slotDuration,
    breakTime,
    availableDays,
    offDays,
    generatedSlots,
    toggleDay,
    toggleSlotActive,
    loading,
    getMyLocation,
    isLocating,
    managerContacts,
    newManagerName,
    setNewManagerName,
    newManagerPhone,
    setNewManagerPhone,
    addManagerContact,
    removeManagerContact,
    updateSlotPrice,
    trigger,
    clearErrors,
    getValues,
    saveDraft,
  };
}
