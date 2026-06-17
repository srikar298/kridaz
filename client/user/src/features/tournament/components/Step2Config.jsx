import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Trophy, Flag, Shield, Activity, Minus, Plus } from 'lucide-react';

const SPORTS = ['Cricket', 'Football', 'Badminton', 'Kabaddi', 'Volleyball', 'Tennis', 'Others'];
const TYPES = ['Round Robin', 'Knockout', 'League + Knockout', 'Pool Based', 'Direct Final', 'Champions League Style'];
const FORMATS = {
  Cricket: ['T10', 'T15', 'T20', 'T30', 'ODI', 'Test'],
  Football: ['5A', '7A', '11A'],
  Others: ['Standard']
};
const BALL_TYPES = ['Leather', 'Tennis', 'Soft Tennis', 'Tape Ball', 'Plastic', 'Box Cricket'];

const Step2Config = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    sport: formData.sport || 'Cricket',
    type: formData.type || 'Knockout',
    format: formData.format || 'T20',
    ballType: formData.ballType || 'Tennis',
    maxTeams: formData.maxTeams || 8,
    minPlayersPerTeam: formData.minPlayersPerTeam || 11,
    maxPlayersPerTeam: formData.maxPlayersPerTeam || 15,
    numberOfWinners: formData.numberOfWinners || 1,
  });

  const updateField = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value,
      // Reset format if sport changes
      ...(field === 'sport' ? { format: FORMATS[value]?.[0] || FORMATS.Others[0] } : {})
    }));
  };

  const submit = () => {
    onNext(localData);
  };

  const renderSelectChips = (options, currentVal, field) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => updateField(field, opt)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
            currentVal === opt 
              ? 'bg-[#BFF367] text-black border-[#BFF367]' 
              : 'bg-[#111] text-white/70 border-white/10 hover:border-white/30'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const renderStepper = (label, field, min, max) => (
    <div className="flex items-center justify-between bg-[#111] border border-white/5 p-4 rounded-2xl">
      <span className="text-sm font-bold text-white/90">{label}</span>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => updateField(field, Math.max(min, localData[field] - 1))}
          className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          disabled={localData[field] <= min}
        >
          <Minus size={14} />
        </button>
        <span className="text-lg font-black w-8 text-center text-[#BFF367]">{localData[field]}</span>
        <button 
          onClick={() => updateField(field, Math.min(max, localData[field] + 1))}
          className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          disabled={localData[field] >= max}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-[#55DEE8]" />
          Sport
        </h2>
        {renderSelectChips(SPORTS, localData.sport, 'sport')}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={16} className="text-[#BFF367]" />
          Tournament Type
        </h2>
        {renderSelectChips(TYPES, localData.type, 'type')}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Flag size={16} className="text-[#55DEE8]" />
          Match Format
        </h2>
        {renderSelectChips(FORMATS[localData.sport] || FORMATS.Others, localData.format, 'format')}
      </section>

      {localData.sport === 'Cricket' && (
        <section className="space-y-4">
          <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} className="text-[#FFD700]" />
            Ball Type
          </h2>
          {renderSelectChips(BALL_TYPES, localData.ballType, 'ballType')}
        </section>
      )}

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest">Match Settings</h2>
        <div className="space-y-3">
          {renderStepper('Number of Teams', 'maxTeams', 2, 128)}
          {renderStepper('Number of Winners', 'numberOfWinners', 1, 8)}
          {renderStepper('Minimum Players per Team', 'minPlayersPerTeam', 1, 20)}
          {renderStepper('Maximum Players per Team', 'maxPlayersPerTeam', localData.minPlayersPerTeam, 30)}
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
            disabled={isLoading}
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

export default Step2Config;
