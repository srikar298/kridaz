import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react';

const Step3Dates = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    startDate: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : '',
    endDate: formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : '',
    registrationStartDate: formData.registrationStartDate ? new Date(formData.registrationStartDate).toISOString().split('T')[0] : '',
    registrationEndDate: formData.registrationEndDate ? new Date(formData.registrationEndDate).toISOString().split('T')[0] : '',
    details: {
      matchTimings: formData.details?.matchTimings || '',
      weekendOnly: formData.details?.weekendOnly || false
    }
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalData(prev => ({
      ...prev,
      details: { ...prev.details, [name]: type === 'checkbox' ? checked : value }
    }));
  };

  const submit = () => {
    // Convert back to ISO string for backend
    onNext({
      startDate: localData.startDate ? new Date(localData.startDate).toISOString() : null,
      endDate: localData.endDate ? new Date(localData.endDate).toISOString() : null,
      registrationStartDate: localData.registrationStartDate ? new Date(localData.registrationStartDate).toISOString() : null,
      registrationEndDate: localData.registrationEndDate ? new Date(localData.registrationEndDate).toISOString() : null,
      details: localData.details
    });
  };

  const isValid = localData.startDate && localData.registrationEndDate;

  const renderDateInput = (label, name, value, required = false) => (
    <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between group focus-within:border-[#BFF367] transition-colors">
      <div className="flex flex-col">
        <span className="text-xs text-white/50 mb-1">{label} {required && <span className="text-red-500">*</span>}</span>
        <input
          type="date"
          name={name}
          value={value}
          onChange={handleDateChange}
          className="bg-transparent text-white font-bold text-sm focus:outline-none [color-scheme:dark]"
        />
      </div>
      <Calendar size={18} className="text-white/20 group-focus-within:text-[#BFF367] transition-colors" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} className="text-[#55DEE8]" />
          Tournament Dates
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {renderDateInput('Start Date', 'startDate', localData.startDate, true)}
          {renderDateInput('End Date (Optional)', 'endDate', localData.endDate)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={16} className="text-[#BFF367]" />
          Registration Dates
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {renderDateInput('Registration Start', 'registrationStartDate', localData.registrationStartDate)}
          {renderDateInput('Registration End', 'registrationEndDate', localData.registrationEndDate, true)}
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Clock size={16} className="text-[#FFD700]" />
          Match Timings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-2">Preferred Match Timings</label>
            <input
              type="text"
              name="matchTimings"
              value={localData.details.matchTimings}
              onChange={handleDetailsChange}
              placeholder="e.g. 6 PM - 11 PM"
              className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#BFF367] transition-colors"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-[#111] rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="weekendOnly"
                checked={localData.details.weekendOnly}
                onChange={handleDetailsChange}
                className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-transparent checked:bg-[#BFF367] checked:border-[#BFF367] transition-all"
              />
              <div className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Weekend Only</p>
              <p className="text-xs text-white/40">Matches will only be scheduled on Saturday & Sunday</p>
            </div>
          </label>
        </div>
      </section>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#000] via-[#000]/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <button
            onClick={submit}
            disabled={!isValid || isLoading}
            className="flex items-center gap-2 bg-[#BFF367] text-black font-black px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs"
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Step3Dates;
