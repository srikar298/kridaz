import React, { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { FormField } from "@components/common";
import useAddTurf from "@hooks/venue-owner/useAddTurf";
import {
  fetchStates,
  fetchCities,
  searchLocations,
} from "@utils/locationService";
import { Search, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";import { Button, Input, Select, Textarea } from "@kridaz/ui";


const AddTurf = () => {
  const navigate = useNavigate();
  const {
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
    updateSlotPrice,
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
  } = useAddTurf();

  const [currentStep, setCurrentStep] = useState(1);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const selectedState = watch("state");
  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");
  const watchedLocation = watch("location");
  const watchedCity = watch("city");
  const watchedPricePerHour = watch("pricePerHour");
  const watchedSlotDuration = watch("slotDuration") || 60;
  const watchedFacilityCategory = watch("facilityCategory") || "Turf";
  const watchedImages = watch("images");
  const watchedMapUrl = watch("mapUrl");

  // Auto-extract lat/lng from Google Maps URL
  useEffect(() => {
    if (watchedMapUrl) {
      const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const regexQ = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      let lat, lng;
      const matchAt = watchedMapUrl.match(regexAt);
      if (matchAt && matchAt.length >= 3) {
        lat = matchAt[1];
        lng = matchAt[2];
      } else {
        const matchQ = watchedMapUrl.match(regexQ);
        if (matchQ && matchQ.length >= 3) {
          lat = matchQ[1];
          lng = matchQ[2];
        }
      }
      if (lat && lng) {
        if (watchedLat !== lat)
          setValue("latitude", lat, {
            shouldValidate: true,
            shouldDirty: true,
          });
        if (watchedLng !== lng)
          setValue("longitude", lng, {
            shouldValidate: true,
            shouldDirty: true,
          });
      }
    }
  }, [watchedMapUrl, watchedLat, watchedLng, setValue]);

  // Location Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (locationSearchQuery && locationSearchQuery.length >= 3) {
        setIsSearchingLocation(true);
        const results = await searchLocations(locationSearchQuery);
        setLocationSuggestions(results);
        setIsSearchingLocation(false);
      } else {
        setLocationSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [locationSearchQuery]);

  const handleLocationSelect = (loc) => {
    setValue("location", loc.display_name, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("city", loc.city || loc.suburb || loc.display_name, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("state", loc.state || loc.display_name, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("latitude", loc.lat, { shouldValidate: true, shouldDirty: true });
    setValue("longitude", loc.lon, { shouldValidate: true, shouldDirty: true });
    setLocationSearchQuery(loc.display_name);
    setShowLocationSuggestions(false);
  };

  const imagePreviews = React.useMemo(() => {
    if (!watchedImages) return [];
    try {
      if (watchedImages.length > 0) {
        return Array.from(watchedImages).map((file) =>
          URL.createObjectURL(file)
        );
      }
    } catch (e) {
      /* ignore */
    }
    return [];
  }, [watchedImages]);

  // Calculate projected earnings
  const activeSlotsCount = generatedSlots.filter((s) => s.isActive).length;
  const perSlotPrice =
    (Number(watchedPricePerHour) || 0) * (Number(watchedSlotDuration) / 60);
  const totalDailyEarnings = activeSlotsCount * perSlotPrice;

  // Load states on mount
  useEffect(() => {
    fetchStates().then(setStatesList);
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState).then(setCitiesList);
    } else {
      setCitiesList([]);
    }
  }, [selectedState]);

  // Build live map preview URL from coords or address
  const mapPreviewUrl = React.useMemo(() => {
    if (
      watchedLat &&
      watchedLng &&
      !isNaN(Number(watchedLat)) &&
      !isNaN(Number(watchedLng))
    ) {
      return `https://maps.google.com/maps?q=${watchedLat},${watchedLng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    const q = [watchedLocation, watchedCity, selectedState]
      .filter(Boolean)
      .join(", ");
    if (q.length > 3) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    return null;
  }, [watchedLat, watchedLng, watchedLocation, watchedCity, selectedState]);

  const sportsOptions = [
    "Football",
    "Cricket",
    "Tennis",
    "Badminton",
    "Table Tennis",
    "Basketball",
    "Volleyball",
    "Hockey",
  ];
  const groundTypeOptions = [
    "Natural Grass",
    "Artificial Turf",
    "Clay",
    "Hard Court",
    "Small Turf",
    "Indoor Court",
  ];
  const facilitiesOptions = [
    "Parking",
    "Washroom",
    "Drinking Water",
    "Changing Room",
    "First Aid",
    "Locker Room",
    "Cafeteria",
    "WiFi",
    "Lighting",
    "Sitting Area",
    "Pavilion",
    "Sight Screen",
    "Flood Lights",
    "Boundary Netting",
    "Shower",
  ];

  return (
    <div
      className="h-full custom-scrollbar bg-background text-white"
      onClick={() => setShowLocationSuggestions(false)}
    >
      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 space-y-4 md:space-y-8 animate-fade-in pt-0 pb-4 h-full relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-black font-['Open_Sans'] tracking-tight text-white uppercase whitespace-nowrap">
                ADD NEW{" "}
                <span className="text-primary">
                  {watchedFacilityCategory.toUpperCase()}
                </span>
              </h2>
            </div>
            <p className="text-white/70 font-inter text-[12px] md:text-[20px] mt-1 md:mt-2 ml-1 md:ml-4 font-light">
              Register a New Facility | Kridaz
            </p>
          </div>
        </header>

        {/* Step Indicators */}
        <div className="flex items-center justify-between relative z-10 mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 flex flex-col items-center gap-2 relative ${currentStep === step ? "opacity-100" : "opacity-50"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 ${currentStep === step ? "bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black shadow-[0_0_15px_rgba(204,255,0,0.5)]" : "bg-card  -white/10 text-white"}`}
              >
                {step}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                {step === 1
                  ? "General Info"
                  : step === 2
                    ? "Legalities"
                    : "Slot Mgmt"}
              </span>
              {step < 3 && (
                <div
                  className={`absolute top-5 left-[50%] w-full h-[2px] ${currentStep > step ? "bg-primary" : "bg-card"}`}
                />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey) {
              const errorMessage =
                errors[firstErrorKey]?.message ||
                `Please check the ${firstErrorKey} field`;
              // Try to find which step the error is in to help the user navigate
              let stepError = 1;
              const step2Fields = [
                "saleDeed",
                "electricityBill",
                "gstRegistration",
                "rentalAgreement",
                "ownershipAgreement",
                "policies",
                "managerContacts",
              ];
              const step3Fields = [
                "pricePerHour",
                "openTime",
                "closeTime",
                "slotDuration",
                "breakTime",
                "availableDays",
                "offDays",
                "slotsConfigDuration",
                "slotsConfigWeeks",
              ];
              if (step2Fields.includes(firstErrorKey)) stepError = 2;
              if (step3Fields.includes(firstErrorKey)) stepError = 3;
              setCurrentStep(stepError);
              toast.error(`Step ${stepError}: ${errorMessage}`);
            } else {
              toast.error("Please fill all required fields correctly.");
            }
          })}
          className="grid grid-cols-1 gap-6 md:gap-12 bg-background px-2 py-4 md:p-8 rounded-[16px] border-none md:border md:border-white/10 md:shadow-[var(--shadow-2)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />

          {/* Hidden fields for coords to still take GPS data */}
          <Input type="hidden" {...register("latitude")} />
          <Input type="hidden" {...register("longitude")} />
          <Input type="hidden" {...register("state")} />
          <Input type="hidden" {...register("city")} />

          {/* STEP 1: General Information */}
          {currentStep === 1 && (
            <div className="col-span-1 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 animate-fade-in">
              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    {watchedFacilityCategory} Name
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder={`${watchedFacilityCategory} Name`}
                  {...register("name")}
                  className={`w-full bg-card border ${errors.name ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all`}
                />
                {errors.name && (
                  <span className="text-primary text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Sport Arsenal
                  </span>
                </label>
                <Select
                  className="w-full bg-card border border-white/10 text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all appearance-none"
                  onChange={(e) => addSportType(e.target.value)}
                  value=""
                >
                  <option value="" disabled>
                    Select Sports
                  </option>
                  {sportsOptions.map((o) => (
                    <option key={o} value={o} disabled={sportTypes.includes(o)}>
                      {o}
                    </option>
                  ))}
                </Select>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sportTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-2 md:px-3 py-1 md:py-1.5 bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black font-bold rounded-[16px] md:rounded-[16px] text-[8px] md:text-[10px] flex items-center gap-2 uppercase tracking-widest"
                    >
                      {type}{" "}
                      <Button
                        type="button"
                        onClick={() => removeSportType(type)}
                        className="!p-0 !min-h-0 !h-auto !bg-transparent !border-none hover:text-white transition-colors shadow-none shrink-0 text-black/50"
                      >
                        <Plus size={12} className="rotate-45" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Facility Category
                  </span>
                </label>
                <Select
                  {...register("facilityCategory", {
                    required: "Please select a category",
                  })}
                  className={`w-full bg-card border ${errors.facilityCategory ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all appearance-none`}
                >
                  <option value="">Select Category</option>
                  <option value="Turf">Venue</option>
                  <option value="Ground">Venue</option>
                  <option value="Court">Court</option>
                  <option value="Stadium">Stadium</option>
                </Select>
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    enue Composition
                  </span>
                </label>
                <Select
                  className="w-full bg-card border border-white/10 text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all appearance-none"
                  onChange={(e) => addGroundType(e.target.value)}
                  value=""
                >
                  <option value="" disabled>
                    Select enue Types
                  </option>
                  {groundTypeOptions.map((o) => (
                    <option
                      key={o}
                      value={o}
                      disabled={groundTypes.includes(o)}
                    >
                      {o}
                    </option>
                  ))}
                </Select>
                <div className="mt-4 flex flex-wrap gap-2">
                  {groundTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-2 md:px-3 py-1 md:py-1.5 bg-card border border-white/10 text-white font-bold rounded-[16px] md:rounded-[16px] text-[8px] md:text-[10px] flex items-center gap-2 uppercase tracking-widest"
                    >
                      {type}{" "}
                      <Button
                        type="button"
                        onClick={() => removeGroundType(type)}
                        className="!p-0 !min-h-0 !h-auto !bg-transparent !border-none hover:text-primary transition-colors shadow-none shrink-0 text-white/50"
                      >
                        <Plus size={12} className="rotate-45" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-control md:col-span-2">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Facility Description
                  </span>
                </label>
                <Textarea
                  {...register("description")}
                  className={`w-full bg-card border ${errors.description ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-24 md:h-32 rounded-[16px] md:rounded-[16px] p-3 md:p-4 transition-all`}
                ></Textarea>
              </div>

              <div className="form-control md:col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Facility Images (Up to 10)
                  </span>
                </label>
                <label className={`w-full bg-card border ${errors.images ? "border-red-500" : "border-white/10"} text-white/70 text-[10px] md:text-sm rounded-[16px] h-9 md:h-12 flex items-center focus:outline-none transition-all cursor-pointer overflow-hidden relative`}>
                  <div className="bg-primary text-black px-4 md:px-6 h-full flex items-center justify-center font-bold uppercase tracking-widest text-[10px] shrink-0">
                    Choose Files
                  </div>
                  <div className="px-3 md:px-4 truncate flex-1 text-[10px]">
                    {watchedImages && watchedImages.length > 0 
                      ? `${watchedImages.length} image${watchedImages.length > 1 ? 's' : ''} selected` 
                      : "No files chosen"}
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setValue("images", e.target.files)}
                  />
                </label>
                {errors.images && (
                  <span className="text-primary text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                    {errors.images.message}
                  </span>
                )}

                {imagePreviews.length > 0 && (
                  <div className="flex gap-4 mt-2 overflow-x-auto pb-2 pt-3 pl-1 pr-3 custom-scrollbar">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 shrink-0">
                        <img
                          src={src}
                          alt={`preview ${i}`}
                          className="w-full h-full object-cover rounded-[16px] border border-white/10"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const dt = new DataTransfer();
                            Array.from(watchedImages).forEach((file, index) => {
                              if (index !== i) dt.items.add(file);
                            });
                            setValue("images", dt.files, { shouldValidate: true });
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 !min-h-0 !p-0 rounded-full bg-red-500 text-white !border-none flex items-center justify-center hover:bg-red-600 shadow-lg z-10"
                        >
                          <Plus size={10} className="rotate-45" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Facilities
                  </span>
                </label>
                <Select
                  className="w-full bg-card border border-white/10 text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all appearance-none"
                  onChange={(e) => addFacility(e.target.value)}
                  value=""
                >
                  <option value="" disabled>
                    Select Facilities
                  </option>
                  {facilitiesOptions.map((o) => (
                    <option key={o} value={o} disabled={facilities.includes(o)}>
                      {o}
                    </option>
                  ))}
                </Select>
                <div className="mt-4 flex flex-wrap gap-2">
                  {facilities.map((type, index) => (
                    <span
                      key={index}
                      className="px-2 md:px-3 py-1 md:py-1.5 bg-card border border-white/10 text-primary font-bold rounded-[16px] md:rounded-[16px] text-[8px] md:text-[10px] flex items-center gap-2 uppercase tracking-widest"
                    >
                      {type}{" "}
                      <Button
                        type="button"
                        onClick={() => removeFacility(type)}
                        className="!p-0 !min-h-0 !h-auto !bg-transparent !border-none hover:text-white transition-colors shadow-none shrink-0 text-primary/50"
                      >
                        <Plus size={12} className="rotate-45" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-control col-span-1 relative">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Search Location
                  </span>
                </label>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70"
                    size={16}
                  />
                  <Input
                    type="text"
                    placeholder="Type to search location..."
                    className={`w-full bg-card border ${errors.location ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] pl-[30px] md:pl-12 pr-4 transition-all`}
                    value={locationSearchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocationSearchQuery(val);
                      setShowLocationSuggestions(true);
                      setValue("location", val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue("city", val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue("state", val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                  />

                  {/* Autocomplete dropdown */}
                  {showLocationSuggestions &&
                    locationSuggestions.length > 0 && (
                      <div className="absolute z-50 top-[52px] left-0 right-0 bg-card border border-white/10 rounded-[16px] shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                        {locationSuggestions.map((loc, i) => (
                          <div
                            key={i}
                            className="p-4 border-b border-white/10 last:border-b-0 hover:bg-card cursor-pointer transition-colors"
                            onClick={() => handleLocationSelect(loc)}
                          >
                            <p className="text-sm text-white font-medium truncate">
                              {loc.display_name}
                            </p>
                            {(loc.city || loc.state) && (
                              <p className="text-[10px] text-white/70 mt-1 uppercase tracking-wider">
                                {[loc.city, loc.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                {errors.location && (
                  <span className="text-primary text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                    {errors.location.message}
                  </span>
                )}
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    YouTube Video URL
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...register("youtubeUrl")}
                  className={`w-full bg-card border ${errors.youtubeUrl ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all`}
                />
                {errors.youtubeUrl && (
                  <span className="text-primary text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                    {errors.youtubeUrl.message}
                  </span>
                )}
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2">
                  <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                    Google Maps URL
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="https://maps.app.goo.gl/..."
                  {...register("mapUrl")}
                  className={`w-full bg-card border ${errors.mapUrl ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all`}
                />
                {errors.mapUrl && (
                  <span className="text-primary text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                    {errors.mapUrl.message}
                  </span>
                )}
              </div>

              {mapPreviewUrl && (
                <div className="form-control md:col-span-3">
                  <label className="label mb-4">
                    <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1 flex items-center gap-2">
                      📍 Map Preview
                    </span>
                  </label>
                  <div
                    className="relative w-full rounded-[16px] overflow-hidden border border-white/10 shadow-[var(--shadow-1)]"
                    style={{ height: 220 }}
                  >
                    <iframe
                      title="Location Preview"
                      src={mapPreviewUrl}
                      width="100%"
                      height="100%"
                      style={{
                        border: 0,
                        filter:
                          "invert(90%) hue-rotate(180deg) saturate(0.7) brightness(0.9)",
                      }}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Legalities & Management */}
          {currentStep === 2 && (
            <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10 animate-fade-in">
              <div className="space-y-4 md:space-y-8">
                <h3 className="text-[14px] font-bold text-primary border-b border-white/10 pb-3 mb-8 uppercase tracking-[3px]">
                  Legal Documents
                </h3>

                <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:gap-x-8 md:gap-y-6">
                  {[
                    { name: "gstRegistration", label: "GST Registration" },
                    { name: "saleDeed", label: <>Sale Deed </> },
                    { name: "electricityBill", label: <>Electricity Bill </> },
                    { name: "rentalAgreement", label: "Rental Agreement" },
                    {
                      name: "ownershipAgreement",
                      label: "Ownership Agreement",
                    },
                    {
                      name: "googleProfileScreenshot",
                      label: "Google Profile Screenshot",
                    },
                  ].map((doc) => {
                    const selectedFiles = watch(doc.name);
                    const hasFile = selectedFiles && selectedFiles.length > 0;
                    return (
                      <div className="form-control" key={doc.name}>
                        <label className="label mb-2">
                          <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                            {doc.label}
                          </span>
                        </label>
                        <label className={`w-full bg-card border ${errors[doc.name] ? "border-red-500" : "border-white/10"} text-white/70 text-[10px] md:text-sm rounded-[16px] h-9 md:h-12 flex items-center focus:outline-none transition-all cursor-pointer overflow-hidden relative`}>
                          <div className="bg-white/10 text-white px-3 md:px-6 h-full flex items-center justify-center font-bold uppercase tracking-widest text-[8px] md:text-[10px] shrink-0">
                            Choose File
                          </div>
                          <div className="px-3 md:px-4 truncate flex-1 text-[8px] md:text-[10px]">
                            {hasFile ? selectedFiles[0].name : "No file chosen"}
                          </div>
                          <Input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) =>
                              setValue(doc.name, e.target.files, {
                                shouldValidate: true,
                              })
                            }
                          />
                        </label>
                        {hasFile && (
                          <span className="text-primary text-[8px] md:text-[10px] font-bold mt-2 block ml-1 truncate">
                            ✅ Ready to upload
                          </span>
                        )}
                        {errors[doc.name] && (
                          <span className="text-red-500 text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                            {errors[doc.name].message}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4 md:space-y-8">
                <h3 className="text-[14px] font-bold text-primary border-b border-white/10 pb-3 mb-8 uppercase tracking-[3px]">
                  Management & Policies
                </h3>

                <div className="form-control space-y-4">
                  <label className="label">
                    <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                      Venue Managers (Contacts)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
                    <Input
                      type="text"
                      placeholder="Manager Name"
                      value={newManagerName}
                      onChange={(e) => setNewManagerName(e.target.value)}
                      className="w-full bg-card border border-white/10 text-white text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 focus:outline-none focus:border-primary/60"
                    />
                    <Input
                      type="text"
                      placeholder="Phone"
                      value={newManagerPhone}
                      onChange={(e) => setNewManagerPhone(e.target.value)}
                      className="w-full bg-card border border-white/10 text-white text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 focus:outline-none focus:border-primary/60"
                    />
                    <Button
                      type="button"
                      onClick={addManagerContact}
                      className="w-full md:w-auto px-8 h-12 rounded-[16px] bg-card text-white hover:bg-primary hover:text-black border border-white/10 transition-all text-[11px] font-bold uppercase tracking-widest"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {managerContacts.map((manager, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-card p-4 rounded-[16px] border border-white/10"
                      >
                        <div className="flex flex-col">
                          <span className="text-white text-[13px] font-bold uppercase tracking-tight">
                            {manager.name}
                          </span>
                          <span className="text-white/70 text-[11px] font-mono mt-0.5">
                            {manager.phone}
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeManagerContact(index)}
                          className="text-[#444] hover:text-primary transition-colors uppercase text-[10px] font-bold tracking-widest"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label mb-2">
                    <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                      Venue Policies and Rules
                    </span>
                  </label>
                  <Textarea
                    {...register("policies")}
                    maxLength={1000}
                    className={`w-full bg-card border ${errors.policies ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-32 md:h-48 rounded-[16px] md:rounded-[16px] p-3 md:p-4 transition-all`}
                  ></Textarea>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Slot Management */}
          {currentStep === 3 && (
            <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10 animate-fade-in">
              <div className="space-y-4 md:space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                        Slot Duration
                      </span>
                    </label>
                    <Select
                      {...register("slotDuration")}
                      className={`w-full bg-card border ${errors.slotDuration ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all appearance-none`}
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes</option>
                      <option value={210}>210 Minutes</option>
                    </Select>
                  </div>
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                        Break Time
                      </span>
                    </label>
                    <Select
                      {...register("breakTime")}
                      className={`w-full bg-card border ${errors.breakTime ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all appearance-none`}
                    >
                      <option value={0}>No Break</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </Select>
                  </div>
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                        Opening Time
                      </span>
                    </label>
                    <Input
                      type="time"
                      {...register("openTime")}
                      className={`w-full bg-card border ${errors.openTime ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all [color-scheme:dark]`}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                        Closing Time
                      </span>
                    </label>
                    <Input
                      type="time"
                      {...register("closeTime")}
                      disabled={!openTime}
                      className={`w-full bg-card border ${errors.closeTime ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all disabled:opacity-50 [color-scheme:dark]`}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label mb-2">
                    <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                      Hourly Rate (INR)
                    </span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Hourly Rate (INR)"
                    {...register("pricePerHour")}
                    className={`w-full bg-card border ${errors.pricePerHour ? "border-red-500" : "border-white/10"} text-white focus:border-primary/60 focus:outline-none text-[10px] md:text-sm h-9 md:h-12 rounded-[16px] md:rounded-[16px] px-3 md:px-4 transition-all`}
                  />
                  {errors.pricePerHour && (
                    <span className="text-primary text-[8px] md:text-[10px] font-bold uppercase mt-1 md:mt-2 block ml-1">
                      {errors.pricePerHour.message}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <label className="label">
                    <span className="text-[8px] md:text-[11px] font-bold text-white/70 uppercase tracking-widest ml-1">
                      Weekly Operational Sequence
                    </span>
                  </label>
                  <div className="grid grid-cols-7 w-full gap-1.5 md:gap-3">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => {
                      const isActive = availableDays.includes(day);
                      return (
                        <Button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`w-full !p-0 !h-8 md:!h-10 rounded-[8px] md:rounded-[12px] text-[8px] md:text-[11px] font-black uppercase tracking-wider md:tracking-widest border transition-all ${isActive ? "bg-primary text-black border-primary shadow-[0_5px_15px_rgba(204,255,0,0.2)]" : "bg-card text-[#444] border-white/10 hover:border-primary/40"}`}
                        >
                          {day.substring(0, 3)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:space-y-8">
                <h3 className="text-[14px] font-bold text-primary border-b border-white/10 pb-3 mb-6 uppercase tracking-[3px]">
                  Slot Review
                </h3>
                {generatedSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`group p-4 md:p-5 rounded-[16px] border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                          slot.isActive
                            ? "bg-card border-primary/40 shadow-[0_4px_20px_-4px_rgba(191,243,103,0.1)] hover:border-primary/80"
                            : "bg-card border-white/10 opacity-60 hover:opacity-100 hover:border-white/20"
                        }`}
                      >
                        {/* Ambient Glow */}
                        {slot.isActive && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[24px] rounded-full -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-primary/20" />
                        )}

                        <div className="flex justify-between items-center mb-5 relative z-10">
                          <div className="flex flex-col">
                            <span
                              className={`text-[12px] md:text-[14px] font-bold font-mono tracking-tight transition-colors ${slot.isActive ? "text-white" : "text-white/70"}`}
                            >
                              {slot.startTime}{" "}
                              <span className="text-white/70 font-light mx-1">
                                →
                              </span>{" "}
                              {slot.endTime}
                            </span>
                          </div>
                          <Input
                            type="checkbox"
                            className="toggle toggle-sm bg-card border-none checked:bg-primary hover:bg-border transition-all cursor-pointer"
                            checked={slot.isActive}
                            onChange={() => toggleSlotActive(index)}
                          />
                        </div>

                        <div
                          className={`flex items-center gap-2 rounded-[16px] p-2.5 border transition-all duration-300 relative z-10 ${slot.isActive ? "bg-card border-white/10 focus-within:border-primary/50 focus-within:bg-card" : "bg-card border-transparent"}`}
                        >
                          <span
                            className={`text-[12px] md:text-[14px] font-black ${slot.isActive ? "text-white/40" : "text-[#444]"}`}
                          >
                            ₹
                          </span>
                          <Input
                            type="number"
                            value={slot.price}
                            onChange={(e) =>
                              updateSlotPrice(index, Number(e.target.value))
                            }
                            disabled={!slot.isActive}
                            placeholder="0"
                            className={`w-full bg-transparent text-[15px] md:text-[18px] font-black focus:outline-none font-mono tracking-wide [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${slot.isActive ? "text-primary" : "text-[#444]"}`}
                          />
                          {slot.isActive && (
                            <span className="text-[9px] uppercase font-bold tracking-widest text-white/70 ml-auto">
                              Per Slot
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-[16px] bg-card">
                    <span className="text-[#444] text-[11px] font-bold uppercase tracking-[4px]">
                      Set times to generate slots
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            className={`col-span-1 flex items-center mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10 relative z-10 ${currentStep === 1 ? "justify-between" : "justify-end"}`}
          >
            {currentStep === 1 && (
              <Button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 md:px-8 py-2 md:py-3 rounded-[16px] font-bold text-xs md:text-sm text-white bg-card border border-white/10 hover:bg-border uppercase tracking-wider transition-all duration-300"
              >
                Cancel
              </Button>
            )}

            <div className="flex items-center gap-3 md:gap-4">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentStep((prev) => Math.max(1, prev - 1));
                }}
                className={`px-6 md:px-8 py-2 md:py-3 rounded-[16px] font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-300 ${currentStep === 1 ? "hidden" : "bg-card text-white border border-white/10 hover:bg-border"}`}
              >
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentStep((prev) => Math.min(4, prev + 1));
                  }}
                  className="px-8 md:px-10 py-2 md:py-3 rounded-[16px] bg-primary text-black font-bold text-xs md:text-sm uppercase tracking-wider hover:opacity-90 transition-all duration-300 shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className={`px-8 md:px-12 py-2 md:py-3 rounded-[16px] bg-primary text-black font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none ${loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
                >
                  {loading ? "Submitting..." : "Submit Venue"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTurf;
