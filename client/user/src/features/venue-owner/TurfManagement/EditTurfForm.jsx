import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";import { Button, Input, Select, Textarea } from "@kridaz/ui";

import {
  Save,
  X,
  Clock,
  MapPin,
  Tag,
  Activity,
  ShieldCheck,
} from "lucide-react";

const EditTurfForm = ({ turf, onSave, onCancel, turfId }) => {
  const validationSchema = z
    .object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      policies: z
        .string()
        .min(1, "Policies are required")
        .min(200, "Policies must be at least 200 characters long"),
      pricePerHour: z
        .number({ invalid_type_error: "Price per Hour is required" })
        .positive("Price per Hour must be a positive number")
        .min(500, "Price per Hour must be greater than 500")
        .max(10000, "Price per Hour must be less than 10000"),
      location: z.string().min(1, "Location is required"),
      openTime: z.date({ required_error: "Open Time is required" }),
      closeTime: z.date({ required_error: "Close Time is required" }),
    })
    .refine((data) => data.closeTime > data.openTime, {
      message: "Close Time must be after Open Time",
      path: ["closeTime"],
    });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...turf,
      openTime: turf.openTime
        ? parse(turf.openTime, "hh:mm a", new Date())
        : null,
      closeTime: turf.closeTime
        ? parse(turf.closeTime, "hh:mm a", new Date())
        : null,
    },
  });

  const onSubmit = (data) => {
    onSave(
      {
        ...data,
        openTime: data.openTime ? format(data.openTime, "hh:mm a") : null,
        closeTime: data.closeTime ? format(data.closeTime, "hh:mm a") : null,
      },
      turfId
    );
  };

  const filterPassedTime = (time) => {
    const currentDate = new Date();
    const selectedDate = new Date(time);
    const isTurfExisting = !!turf._id;

    return currentDate.getTime() < selectedDate.getTime() || isTurfExisting;
  };

  const filterCloseTime = (time) => {
    const openTime = getValues("openTime");
    return openTime?.getTime() < time.getTime();
  };

  const InputWrapper = ({ label, icon: Icon, children, error }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-white/70 uppercase tracking-[1px] md:tracking-[2px] ml-1">
        {Icon && <Icon size={12} className="text-primary/60" />}
        {label}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-1 mt-1 animate-shake">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-background border-none md:border md:border-white/10 rounded-[16px] overflow-hidden md:shadow-2xl animate-fade-in"
    >
      <div className="px-2 py-4 md:p-6 lg:p-8 space-y-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">
              Edit Arena Identity
            </h2>
          </div>
          <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-[16px] flex items-center gap-2">
            <ShieldCheck size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Admin Control
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 md:gap-8">
          <div className="space-y-3 md:space-y-6">
            <InputWrapper label="Arena Name" error={errors.name?.message}>
              <Input
                type="text"
                {...register("name")}
                placeholder="E.g. Wembley Pro"
                className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white placeholder-[#333] focus:outline-none transition-all ${errors.name ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
              />
            </InputWrapper>

            <InputWrapper
              label="Arena Biography"
              error={errors.description?.message}
            >
              <Textarea
                {...register("description")}
                placeholder="Describe the atmosphere and facilities..."
                rows={4}
                className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white placeholder-[#333] focus:outline-none transition-all resize-none ${errors.description ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
              ></Textarea>
            </InputWrapper>

            <InputWrapper
              label="Venue Policies & Rules"
              error={errors.policies?.message}
            >
              <Textarea
                {...register("policies")}
                maxLength={1000}
                placeholder="Rules, cancellation terms, safety... (Min 200 chars)"
                rows={6}
                className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white placeholder-[#333] focus:outline-none transition-all resize-none ${errors.policies ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
              ></Textarea>
              {!errors.policies && (
                <p className="text-[9px] font-bold text-[#444] uppercase tracking-widest ml-1 mt-1">
                  {watch("policies")?.length || 0} / 1000 max characters (200
                  min)
                </p>
              )}
            </InputWrapper>

            <div className="grid grid-cols-2 gap-4">
              <InputWrapper
                label="Hourly Rate (Rs)"
                error={errors.pricePerHour?.message}
              >
                <Input
                  type="number"
                  {...register("pricePerHour", { valueAsNumber: true })}
                  placeholder="2500"
                  className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white placeholder-[#333] focus:outline-none transition-all ${errors.pricePerHour ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
                />
              </InputWrapper>

              <InputWrapper
                label="Location Index"
                error={errors.location?.message}
                icon={MapPin}
              >
                <Input
                  type="text"
                  {...register("location")}
                  placeholder="City, State"
                  className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white placeholder-[#333] focus:outline-none transition-all ${errors.location ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
                />
              </InputWrapper>
            </div>
          </div>

          <div className="space-y-3 md:space-y-6">
            {/* Dynamic Attributes */}
            <div className="grid grid-cols-1 gap-6">
              <InputWrapper label="Sport Arsenal" icon={Activity}>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-[#050505] border border-white/10 rounded-[16px]">
                  {watch("sportTypes")?.length > 0 ? (
                    watch("sportTypes").map((sport) => (
                      <span
                        key={sport}
                        className="px-2 md:px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-[16px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/tag animate-scale-in"
                      >
                        {sport}
                        <Button
                          type="button"
                          onClick={() =>
                            setValue(
                              "sportTypes",
                              watch("sportTypes").filter((s) => s !== sport)
                            )
                          }
                          className="hover:text-white transition-colors"
                        >
                          <X size={10} />
                        </Button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[#333] text-[10px] font-bold uppercase tracking-widest italic px-1">
                      Unassigned
                    </span>
                  )}
                </div>
                <Select
                  className="w-full bg-[#050505] border border-white/10 rounded-[16px] px-4 py-3 text-xs text-white/70 focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                  onChange={(e) => {
                    const val = e.target.value;
                    const current = watch("sportTypes") || [];
                    if (val && !current.includes(val))
                      setValue("sportTypes", [...current, val]);
                    e.target.value = "";
                  }}
                >
                  <option value="" className="bg-background">
                    Add Sport...
                  </option>
                  {[
                    "Football",
                    "Cricket",
                    "Tennis",
                    "Badminton",
                    "Table Tennis",
                    "Basketball",
                    "Volleyball",
                    "Hockey",
                  ].map((s) => (
                    <option key={s} value={s} className="bg-background">
                      {s}
                    </option>
                  ))}
                </Select>
              </InputWrapper>

              <div className="grid grid-cols-2 gap-6">
                <InputWrapper label="Ground DNA" icon={Tag}>
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-[#050505] border border-white/10 rounded-[16px]">
                    {watch("groundTypes")?.length > 0 ? (
                      watch("groundTypes").map((ground) => (
                        <span
                          key={ground}
                          className="px-2 md:px-3 py-1 bg-white/5 text-white border border-white/10 rounded-[16px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/tag animate-scale-in"
                        >
                          {ground}
                          <Button
                            type="button"
                            onClick={() =>
                              setValue(
                                "groundTypes",
                                watch("groundTypes").filter((g) => g !== ground)
                              )
                            }
                            className="hover:text-primary transition-colors"
                          >
                            <X size={10} />
                          </Button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[#333] text-[10px] font-bold uppercase tracking-widest italic px-1">
                        Generic
                      </span>
                    )}
                  </div>
                  <Select
                    className="w-full bg-[#050505] border border-white/10 rounded-[16px] px-4 py-3 text-xs text-white/70 focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                    onChange={(e) => {
                      const val = e.target.value;
                      const current = watch("groundTypes") || [];
                      if (val && !current.includes(val))
                        setValue("groundTypes", [...current, val]);
                      e.target.value = "";
                    }}
                  >
                    <option value="" className="bg-background">
                      Add Type...
                    </option>
                    {[
                      "Natural Grass",
                      "Artificial Turf",
                      "Clay",
                      "Hard Court",
                      "Small Turf",
                      "Indoor Court",
                    ].map((g) => (
                      <option key={g} value={g} className="bg-background">
                        {g}
                      </option>
                    ))}
                  </Select>
                </InputWrapper>

                <InputWrapper label="Amenities" icon={Activity}>
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-[#050505] border border-white/10 rounded-[16px]">
                    {watch("facilities")?.length > 0 ? (
                      watch("facilities").map((facility) => (
                        <span
                          key={facility}
                          className="px-2 md:px-3 py-1 bg-card text-white/70 border border-white/10 rounded-[16px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/tag animate-scale-in"
                        >
                          {facility}
                          <Button
                            type="button"
                            onClick={() =>
                              setValue(
                                "facilities",
                                watch("facilities").filter(
                                  (f) => f !== facility
                                )
                              )
                            }
                            className="hover:text-white transition-colors"
                          >
                            <X size={10} />
                          </Button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[#333] text-[10px] font-bold uppercase tracking-widest italic px-1">
                        None
                      </span>
                    )}
                  </div>
                  <Select
                    className="w-full bg-[#050505] border border-white/10 rounded-[16px] px-4 py-3 text-xs text-white/70 focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                    onChange={(e) => {
                      const val = e.target.value;
                      const current = watch("facilities") || [];
                      if (val && !current.includes(val))
                        setValue("facilities", [...current, val]);
                      e.target.value = "";
                    }}
                  >
                    <option value="" className="bg-background">
                      Add Amenity...
                    </option>
                    {[
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
                    ].map((f) => (
                      <option key={f} value={f} className="bg-background">
                        {f}
                      </option>
                    ))}
                  </Select>
                </InputWrapper>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputWrapper
                label="Open Time"
                icon={Clock}
                error={errors.openTime?.message}
              >
                <Controller
                  control={control}
                  name="openTime"
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={60}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white focus:outline-none transition-all ${errors.openTime ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
                      filterTime={filterPassedTime}
                    />
                  )}
                />
              </InputWrapper>
              <InputWrapper
                label="Close Time"
                icon={Clock}
                error={errors.closeTime?.message}
              >
                <Controller
                  control={control}
                  name="closeTime"
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={60}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={`w-full bg-[#050505] border rounded-[16px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-white focus:outline-none transition-all ${errors.closeTime ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-primary/50"}`}
                      filterTime={filterCloseTime}
                      disabled={!getValues("openTime")}
                    />
                  )}
                />
              </InputWrapper>
            </div>
          </div>
        </div>

        <footer className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-white/10">
          <Button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-3 bg-card border border-white/10 text-white/70 font-bold uppercase text-[11px] tracking-widest rounded-[16px] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <X size={14} />
            Discard Changes
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-secondary to-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black font-bold uppercase text-[11px] tracking-widest rounded-[16px] hover:opacity-90 transition-all flex items-center justify-center gap-2 "
          >
            <Save size={14} />
            Commit Deployment
          </Button>
        </footer>
      </div>
    </form>
  );
};

export default EditTurfForm;
