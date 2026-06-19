import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useNavigate } from "react-router-dom";

const editTurfSchema = z
  .object({
    name: z
      .string()
      .min(1, "Enter the name of the turf")
      .min(3, "Name must be at least 3 characters long"),
    description: z
      .string()
      .min(1, "Enter the description of the turf")
      .min(3, "Description must be at least 3 characters long"),
    location: z
      .string()
      .min(1, "Enter the location of the turf")
      .min(3, "Location must be at least 3 characters long"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    pricePerHour: z
      .number({ invalid_type_error: "Enter the price per hour of the turf" })
      .min(500, "Price per hour must be at least 500 rupees")
      .max(3000, "Price per hour must be at most 3000 rupees"),
    images: z
      .any()
      .nullable()
      .optional()
      .refine(
        (value) => {
          if (!value || value.length === 0) return true;
          if (value.length > 10) return false;
          const acceptedFormats = ["image/png", "image/jpeg", "image/webp"];
          return Array.from(value).every((file) =>
            acceptedFormats.includes(file.type)
          );
        },
        {
          message: "Max 10 images allowed (PNG, JPEG, or WebP).",
        }
      ),
    youtubeUrl: z
      .string()
      .url("Invalid YouTube URL")
      .or(z.literal(""))
      .nullable()
      .optional(),
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
    slotDuration: z
      .number({ required_error: "Slot duration is required" })
      .min(30)
      .max(240),
    breakTime: z.number().min(0).max(60).optional(),
    slotsConfigDuration: z.enum(["Until Changed", "Fixed Weeks"]),
    slotsConfigWeeks: z.number().optional(),
    mapUrl: z
      .string()
      .url("Invalid Google Maps URL")
      .or(z.literal(""))
      .nullable()
      .optional(),
    policies: z
      .string()
      .min(1, "Enter the venue policies and rules")
      .min(200, "Policies must be at least 200 characters long")
      .max(10000, "Policies cannot exceed 10000 characters"),
    managerContacts: z
      .array(
        z.object({
          name: z.string().min(1, "Manager name is required"),
          phone: z
            .string()
            .min(1, "Manager phone is required")
            .regex(/^\d{10}$/, "Phone must be 10 digits"),
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
      if (data.slotsConfigDuration === "Fixed Weeks") {
        return (
          data.slotsConfigWeeks !== undefined &&
          data.slotsConfigWeeks >= 1 &&
          data.slotsConfigWeeks <= 52
        );
      }
      return true;
    },
    {
      message: "Number of weeks is required",
      path: ["slotsConfigWeeks"],
    }
  )
  .refine(
    (data) => {
      if (!data.openTime || !data.closeTime) return true;
      return true;
    },
    {
      message: "Close time must be valid",
      path: ["closeTime"],
    }
  );

export default function useEditTurf(turfId) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [turf, setTurf] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm({
    resolver: zodResolver(editTurfSchema),
    defaultValues: {
      sportTypes: [],
      groundTypes: [],
      facilities: [],
      openTime: "",
      closeTime: "",
      youtubeUrl: "",
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
      policies: "",
    },
  });

  const [managerContacts, setManagerContacts] = useState([]);
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerPhone, setNewManagerPhone] = useState("");

  const [sportTypes, setSportTypes] = useState([]);
  const [groundTypes, setGroundTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [generatedSlots, setGeneratedSlots] = useState([]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(`editVenueDraft_${turfId}`);
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
        if (parsed.managerContacts) setManagerContacts(parsed.managerContacts);
        if (parsed.sportTypes) setSportTypes(parsed.sportTypes);
        if (parsed.groundTypes) setGroundTypes(parsed.groundTypes);
        if (parsed.facilities) setFacilities(parsed.facilities);
        toast.success("Draft loaded successfully!");
      } catch (e) {
        console.error("Failed to load draft");
      }
    }
  }, [setValue, turfId]);

  const saveDraft = () => {
    const data = getValues();
    const dataToSave = { ...data };
    delete dataToSave.images;
    delete dataToSave.saleDeed;
    delete dataToSave.electricityBill;
    delete dataToSave.rentalAgreement;
    delete dataToSave.ownershipAgreement;
    delete dataToSave.gstRegistration;
    delete dataToSave.googleProfileScreenshot;
    localStorage.setItem(
      `editVenueDraft_${turfId}`,
      JSON.stringify(dataToSave)
    );
    toast.success("Draft saved successfully! (Files are not saved)");
  };

  const openTime = watch("openTime");
  const closeTime = watch("closeTime");
  const slotDuration = watch("slotDuration");
  const breakTime = watch("breakTime");
  const availableDays = watch("availableDays");
  const offDays = watch("offDays");

  const [pendingUpdates, setPendingUpdates] = useState({});
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get("/api/settings/payout");
        setSettings(response.data.payoutSettings);
      } catch (err) {
        console.error("Failed to fetch payout settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/owner/turf/owner/${turfId}/details`
        );

        const turfData = response.data.turf || response.data;

        if (!turfData) {
          throw new Error("Turf not found");
        }
        setTurf(turfData);
        setPendingUpdates(turfData.pendingUpdates || {});

        // Populate form
        setValue("name", turfData.name);
        setValue("description", turfData.description);
        setValue("location", turfData.location);
        setValue("city", turfData.city || "");
        setValue("state", turfData.state || "");

        if (
          turfData.locationData &&
          turfData.locationData.coordinates &&
          turfData.locationData.coordinates.length === 2
        ) {
          // MongoDB GeoJSON is [longitude, latitude]
          setValue(
            "longitude",
            turfData.locationData.coordinates[0]?.toString() || ""
          );
          setValue(
            "latitude",
            turfData.locationData.coordinates[1]?.toString() || ""
          );
        }

        setValue("pricePerHour", turfData.pricePerHour);
        setValue("youtubeUrl", turfData.youtubeUrl || "");
        setValue("mapUrl", turfData.mapUrl || "");
        setValue("policies", turfData.policies || "");

        if (turfData.managerContacts) {
          setManagerContacts(turfData.managerContacts);
          setValue("managerContacts", turfData.managerContacts);
        }

        setSportTypes(turfData.sportTypes || []);
        setGroundTypes(turfData.groundTypes || []);
        setFacilities(turfData.facilities || []);

        if (turfData.openTime) {
          // If the backend returns "hh:mm aa" format like "02:30 PM", we need to convert it to "HH:mm"
          try {
            if (
              turfData.openTime.includes("AM") ||
              turfData.openTime.includes("PM")
            ) {
              const parsedOpen = parse(
                turfData.openTime,
                "hh:mm aa",
                new Date()
              );
              if (isValid(parsedOpen))
                setValue("openTime", format(parsedOpen, "HH:mm"));
            } else {
              setValue("openTime", turfData.openTime.substring(0, 5)); // Just in case it's ISO or other string
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        if (turfData.closeTime) {
          try {
            if (
              turfData.closeTime.includes("AM") ||
              turfData.closeTime.includes("PM")
            ) {
              const parsedClose = parse(
                turfData.closeTime,
                "hh:mm aa",
                new Date()
              );
              if (isValid(parsedClose))
                setValue("closeTime", format(parsedClose, "HH:mm"));
            } else {
              setValue("closeTime", turfData.closeTime.substring(0, 5));
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }

        if (turfData.slotDuration)
          setValue("slotDuration", turfData.slotDuration);
        if (turfData.breakTime !== undefined)
          setValue("breakTime", turfData.breakTime);
        if (turfData.availableDays)
          setValue("availableDays", turfData.availableDays);
        if (turfData.offDays) setValue("offDays", turfData.offDays);
        if (turfData.generatedSlots) setGeneratedSlots(turfData.generatedSlots);
        if (turfData.slotsConfigDuration)
          setValue("slotsConfigDuration", turfData.slotsConfigDuration);
        if (turfData.slotsConfigWeeks)
          setValue("slotsConfigWeeks", turfData.slotsConfigWeeks);
      } catch (err) {
        toast.error("Failed to fetch turf details");
        navigate("/venue-owner/turfs");
      } finally {
        setFetching(false);
      }
    };
    if (turfId) fetchTurf();
  }, [turfId, setValue, navigate]);

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
    if (type && !sportTypes.includes(type)) {
      setSportTypes([...sportTypes, type]);
    }
  };

  const removeSportType = (type) => {
    setSportTypes(sportTypes.filter((sport) => sport !== type));
  };

  const addGroundType = (type) => {
    if (type && !groundTypes.includes(type)) {
      setGroundTypes([...groundTypes, type]);
    }
  };

  const removeGroundType = (type) => {
    setGroundTypes(groundTypes.filter((ground) => ground !== type));
  };

  const addFacility = (item) => {
    if (item && !facilities.includes(item)) {
      setFacilities([...facilities, item]);
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
          const sTime = format(slotStart, "hh:mm aa");
          const eTime = format(slotEnd, "hh:mm aa");

          const existing = generatedSlots.find(
            (s) => s.startTime === sTime && s.endTime === eTime
          );

          slots.push({
            startTime: sTime,
            endTime: eTime,
            isActive: existing ? existing.isActive : true,
            price: existing ? existing.price : Number(defaultSlotPrice),
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

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "images") {
        if (data[key] && data[key].length > 0) {
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

    try {
      const response = await axiosInstance.put(
        `/api/owner/turf/owner/${turfId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(response.data.message);
      localStorage.removeItem(`editVenueDraft_${turfId}`);
      navigate(`/venue-owner/turf/${turfId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
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
    availableDays,
    offDays,
    generatedSlots,
    toggleDay,
    toggleSlotActive,
    loading,
    fetching,
    getMyLocation,
    isLocating,
    pendingUpdates,
    managerContacts,
    newManagerName,
    setNewManagerName,
    newManagerPhone,
    setNewManagerPhone,
    addManagerContact,
    removeManagerContact,
    updateSlotPrice,
    turf,
    settings,
    trigger,
    saveDraft,
  };
}
