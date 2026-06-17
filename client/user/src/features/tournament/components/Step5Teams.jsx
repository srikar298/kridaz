import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Users, Coins, Percent, AlertCircle } from 'lucide-react';

const Step5Teams = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    entryFee: formData.entryFee || '',
    advanceFee: formData.advanceFee || '',
    discount: formData.discount || '',
    details: {
      allowWaitlist: formData.details?.allowWaitlist || false,
      ageLimit: formData.details?.ageLimit || 'Open',
      allowPros: formData.details?.allowPros ?? true
    }
  });

  const handleNumChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value ? Number(value) : '' }));
  };

  const handleDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalData(prev => ({
      ...prev,
      details: { ...prev.details, [name]: type === 'checkbox' ? checked : value }
    }));
  };

  const submit = () => {
    onNext(localData);
  };

  // Basic validation
  const isValid = localData.entryFee !== '' && localData.entryFee >= 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Coins size={16} className="text-[#FFD700]" />
          Entry Fees
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-2">Entry Fee per Team (â‚¹)</label>
            <input
              type="number"
              name="entryFee"
              value={localData.entryFee}
              onChange={handleNumChange}
              placeholder="e.g. 5000"
              className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFD700] transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-2">Advance Amount</label>
              <input
                type="number"
                name="advanceFee"
                value={localData.advanceFee}
                onChange={handleNumChange}
                placeholder="Required to book slot"
                className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Early Bird Discount</label>
              <div className="relative">
                <input
                  type="number"
                  name="discount"
                  value={localData.discount}
                  onChange={handleNumChange}
                  placeholder="Optional discount"
                  className="w-full bg-[#111] border border-white/5 rounded-xl pl-4 pr-10 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                />
                <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Users size={16} className="text-[#55DEE8]" />
          Waitlist
        </h2>
        
        <label className="flex items-center gap-3 p-4 bg-[#111] rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              name="allowWaitlist"
              checked={localData.details.allowWaitlist}
              onChange={handleDetailsChange}
              className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-transparent checked:bg-[#55DEE8] checked:border-[#55DEE8] transition-all"
            />
            <div className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Allow Waitlist if Slots Full</p>
            <p className="text-xs text-white/40">Teams can register interest if tournament is fully booked</p>
          </div>
        </label>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={16} className="text-[#BFF367]" />
          Rules & Requirements
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-2">Age Limit</label>
            <select
              name="ageLimit"
              value={localData.details.ageLimit}
              onChange={handleDetailsChange}
              className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#BFF367] transition-colors appearance-none"
            >
              <option value="Open">Open for All</option>
              <option value="U-14">Under 14</option>
              <option value="U-16">Under 16</option>
              <option value="U-19">Under 19</option>
              <option value="Corporate">Corporate Only</option>
              <option value="Veterans">Veterans (35+)</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-4 bg-[#111] rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="allowPros"
                checked={localData.details.allowPros}
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
              <p className="text-sm font-bold text-white">Allow Professional Players</p>
              <p className="text-xs text-white/40">Verified pro players can participate</p>
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

export default Step5Teams;
