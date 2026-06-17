import React, { useState, useEffect } from "react";
import { Search, Plus, Copy } from "lucide-react";
import toast from "react-hot-toast";
import useAddVenueInvite from "./useAddVenueInvite";

const AddVenueInvite = () => {
  const {
    register,
    handleSubmit,
    errors,
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
    generatedSlots,
    toggleSlotActive,
    updateSlotPrice,
    loading,
    magicLink
  } = useAddVenueInvite();

  const [currentStep, setCurrentStep] = useState(1);
  const watchedFacilityCategory = watch("facilityCategory") || "Turf";

  const sportsOptions = ["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"];
  const groundTypeOptions = ["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"];
  const facilitiesOptions = ["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"];

  const copyMagicLink = () => {
    navigator.clipboard.writeText(magicLink);
    toast.success("Magic Link copied to clipboard!");
  };

  if (magicLink) {
    return (
      <div className="h-full custom-scrollbar bg-[#000000] text-white p-6 md:p-12 animate-fade-in flex flex-col items-center justify-center">
        <div className="bg-[#121212] border border-[#B3DC26]/40 p-8 rounded-[24px] shadow-[0_8px_32px_rgba(179,220,38,0.15)] text-center max-w-lg w-full">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#55DEE8] to-[#B3DC26] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(179,220,38,0.4)]">
            <span className="text-black text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Invite Created Successfully</h2>
          <p className="text-white/70 text-sm mb-8">The magic link has been generated. Send this link to the venue owner.</p>
          
          <div className="bg-[#1B1B1B] border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between group hover:border-[#B3DC26]/40 transition-colors">
            <span className="text-[#B3DC26] font-mono text-xs truncate max-w-[80%]">{magicLink}</span>
            <button 
              onClick={copyMagicLink}
              className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Copy size={18} />
            </button>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 rounded-[16px] bg-[#1B1B1B] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#2A2A2A] transition-all"
            >
              Send Another
            </button>
            <button 
              onClick={copyMagicLink}
              className="flex-1 px-6 py-3 rounded-[16px] bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 shadow-[0_8px_24px_rgba(179,220,38,0.15)] transition-all"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="px-4 lg:px-8 lg:pt-6 lg:pb-8 space-y-4 md:space-y-8 animate-fade-in pt-4 pb-4 h-full relative max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-black tracking-tight text-white uppercase whitespace-nowrap">
                INVITE <span className="text-[#B3DC26]">VENUE OWNER</span>
              </h2>
            </div>
            <p className="text-white/70 text-[12px] md:text-[16px] mt-1 md:mt-2 ml-1 font-light">
              Create a venue outline and send a magic link
            </p>
          </div>
        </header>

        {/* Step Indicators */}
        <div className="flex items-center justify-center relative z-10 mb-12 max-w-lg mx-auto">
          {[1, 2].map((step) => (
            <div key={step} className={`flex-1 flex flex-col items-center gap-3 relative ${currentStep === step ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg z-10 ${currentStep === step ? 'bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black shadow-[0_0_15px_rgba(204,255,0,0.5)]' : 'bg-[#121212] border border-white/10 text-white'}`}>
                {step}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-center">
                {step === 1 ? 'Venue Details' : 'Slots & Contact'}
              </span>
              {step === 1 && (
                <div className={`absolute top-6 left-[50%] w-full h-[2px] ${currentStep > step ? 'bg-[#B3DC26]' : 'bg-[#1B1B1B]'}`} />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, (errs) => {
            console.log("Validation errors:", errs);
            toast.error("Please fill all required fields correctly.");
          })}
          className="grid grid-cols-1 gap-6 md:gap-12 bg-[#000000] px-4 py-6 md:p-12 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B3DC26]/5 blur-[120px] pointer-events-none" />

          {/* STEP 1: General Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10 animate-fade-in">
              <div className="form-control col-span-1 md:col-span-2">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">{watchedFacilityCategory} Name</span></label>
                <input type="text" placeholder={`${watchedFacilityCategory} Name`} {...register("name")} className={`w-full bg-[#121212] border ${errors.name ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
                {errors.name && <span className="text-[#B3DC26] text-xs font-bold mt-2 block ml-1">{errors.name.message}</span>}
              </div>
              
              <div className="form-control col-span-1">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Sport Arsenal</span></label>
                <select className="w-full bg-[#121212] border border-white/10 text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all appearance-none" onChange={(e) => addSportType(e.target.value)} value="">
                  <option value="" disabled>Select Sports</option>
                  {sportsOptions.map(o => <option key={o} value={o} disabled={sportTypes.includes(o)}>{o}</option>)}
                </select>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sportTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] text-black font-bold rounded-[16px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                      {type} <button type="button" onClick={() => removeSportType(type)} className="hover:text-white transition-colors"><Plus size={12} className="rotate-45" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Facility Category</span></label>
                <select {...register("facilityCategory")} className={`w-full bg-[#121212] border border-white/10 text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all appearance-none`}>
                  <option value="Turf">Venue</option>
                  <option value="Ground">Ground</option>
                  <option value="Court">Court</option>
                  <option value="Stadium">Stadium</option>
                </select>
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Ground Composition</span></label>
                <select className="w-full bg-[#121212] border border-white/10 text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all appearance-none" onChange={(e) => addGroundType(e.target.value)} value="">
                  <option value="" disabled>Select Ground Types</option>
                  {groundTypeOptions.map(o => <option key={o} value={o} disabled={groundTypes.includes(o)}>{o}</option>)}
                </select>
                <div className="mt-4 flex flex-wrap gap-2">
                  {groundTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1.5 bg-[#1B1B1B] border border-white/10 text-white font-bold rounded-[16px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                      {type} <button type="button" onClick={() => removeGroundType(type)} className="hover:text-[#B3DC26] transition-colors"><Plus size={12} className="rotate-45" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Facilities</span></label>
                <select className="w-full bg-[#121212] border border-white/10 text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all appearance-none" onChange={(e) => addFacility(e.target.value)} value="">
                  <option value="" disabled>Select Facilities</option>
                  {facilitiesOptions.map(o => <option key={o} value={o} disabled={facilities.includes(o)}>{o}</option>)}
                </select>
                <div className="mt-4 flex flex-wrap gap-2">
                  {facilities.map((type, index) => (
                    <span key={index} className="px-3 py-1.5 bg-[#1B1B1B] border border-white/10 text-[#B3DC26] font-bold rounded-[16px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                      {type} <button type="button" onClick={() => removeFacility(type)} className="hover:text-white transition-colors"><Plus size={12} className="rotate-45" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-control col-span-2">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Facility Description</span></label>
                <textarea {...register("description")} className={`w-full bg-[#121212] border ${errors.description ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-24 rounded-[16px] p-4 transition-all`}></textarea>
              </div>

              <div className="form-control col-span-1">
                <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Location Address</span></label>
                <input type="text" placeholder="Full Address" {...register("location")} className={`w-full bg-[#121212] border ${errors.location ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-1">
                <div className="form-control">
                  <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">City</span></label>
                  <input type="text" placeholder="City" {...register("city")} className={`w-full bg-[#121212] border ${errors.city ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
                </div>
                <div className="form-control">
                  <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">State</span></label>
                  <input type="text" placeholder="State" {...register("state")} className={`w-full bg-[#121212] border ${errors.state ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Slots & Contacts */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10 animate-fade-in">
              <div className="space-y-8">
                <h3 className="text-sm font-bold text-[#B3DC26] border-b border-white/10 pb-3 uppercase tracking-[3px]">Contact Info</h3>
                <div className="form-control">
                  <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Owner Email</span></label>
                  <input type="email" placeholder="owner@example.com" {...register("email")} className={`w-full bg-[#121212] border ${errors.email ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
                  {errors.email && <span className="text-[#B3DC26] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.email.message}</span>}
                </div>
                <div className="form-control">
                  <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Owner Phone</span></label>
                  <input type="text" placeholder="10-digit phone" {...register("phone")} className={`w-full bg-[#121212] border ${errors.phone ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
                  {errors.phone && <span className="text-[#B3DC26] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.phone.message}</span>}
                  <p className="text-white/40 text-xs mt-3 ml-1">Provide either email or phone to send the magic link.</p>
                </div>

                <h3 className="text-sm font-bold text-[#B3DC26] border-b border-white/10 pb-3 uppercase tracking-[3px] mt-8">Time Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Opening Time</span></label>
                    <input type="time" {...register("openTime")} className={`w-full bg-[#121212] border ${errors.openTime ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all [color-scheme:dark]`} />
                  </div>
                  <div className="form-control">
                    <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Closing Time</span></label>
                    <input type="time" {...register("closeTime")} disabled={!openTime} className={`w-full bg-[#121212] border ${errors.closeTime ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all disabled:opacity-50 [color-scheme:dark]`} />
                  </div>
                  <div className="form-control">
                    <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Slot Duration</span></label>
                    <select {...register("slotDuration")} className="w-full bg-[#121212] border border-white/10 text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all appearance-none">
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label mb-2"><span className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Hourly Rate (INR)</span></label>
                    <input type="number" placeholder="Hourly Rate (INR)" {...register("pricePerHour")} className={`w-full bg-[#121212] border ${errors.pricePerHour ? 'border-red-500' : 'border-white/10'} text-white focus:border-[#B3DC26]/60 focus:outline-none text-sm h-12 rounded-[16px] px-4 transition-all`} />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                  <h3 className="text-sm font-bold text-[#B3DC26] border-b border-white/10 pb-3 mb-6 uppercase tracking-[3px]">Slot Preview</h3>
                  {generatedSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {generatedSlots.map((slot, index) => (
                          <div 
                            key={index} 
                            className={`group p-4 rounded-[16px] border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${ 
                              slot.isActive 
                                ? "bg-[#121212] border-[#B3DC26]/40 shadow-[0_4px_20px_-4px_rgba(191,243,103,0.1)]" 
                                : "bg-[#121212] border-white/10 opacity-60" 
                            }`}
                          >
                            <div className="flex justify-between items-center mb-4 relative z-10">
                              <span className={`text-xs font-bold font-mono tracking-tight ${slot.isActive ? 'text-white' : 'text-white/70'}`}>
                                {slot.startTime} <span className="text-white/70 font-light mx-1">→</span> {slot.endTime}
                              </span>
                              <input 
                                type="checkbox" 
                                className="toggle toggle-sm bg-[#1B1B1B] border-none checked:bg-[#B3DC26]" 
                                checked={slot.isActive} 
                                onChange={() => toggleSlotActive(index)} 
                              />
                            </div>
                            <div className={`flex items-center gap-2 rounded-xl p-2 border ${slot.isActive ? 'bg-[#1B1B1B] border-white/10' : 'bg-transparent border-transparent'}`}>
                              <span className={`text-sm font-black ${slot.isActive ? 'text-white/40' : 'text-[#444]'}`}>₹</span>
                              <input 
                                type="number" 
                                value={slot.price} 
                                onChange={(e) => updateSlotPrice(index, Number(e.target.value))} 
                                disabled={!slot.isActive} 
                                className={`w-full bg-transparent text-lg font-black focus:outline-none font-mono ${slot.isActive ? 'text-[#B3DC26]' : 'text-[#444]'}`} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-white/10 rounded-[24px] bg-[#121212]">
                        <span className="text-[#444] text-xs font-bold uppercase tracking-[4px]">Set times to view slots</span>
                      </div>
                    )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex items-center mt-8 pt-6 border-t border-white/10 relative z-10 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setCurrentStep(1); }}
                className="px-8 py-3 rounded-[16px] font-bold text-sm uppercase tracking-wider bg-[#1B1B1B] text-white hover:bg-[#2A2A2A] transition-all"
              >
                Back
              </button>
            )}
            
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setCurrentStep(2); }}
                className="px-10 py-3 rounded-[16px] bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 shadow-[0_8px_24px_rgba(179,220,38,0.15)] transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`px-12 py-3 rounded-[16px] bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] text-black font-bold text-sm uppercase tracking-wider shadow-[0_8px_24px_rgba(179,220,38,0.15)] transition-all flex items-center gap-2 ${loading ? "opacity-70" : "hover:opacity-90"}`}
              >
                {loading ? "Sending..." : "Send Invite & Create"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVenueInvite;
