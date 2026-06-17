import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronLeft, Calendar, Users, MapPin, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { 
  useCreateTournamentMutation, 
  useUpdateTournamentMutation, 
  useGetTournamentByIdQuery 
} from '../../../redux/api/tournamentApi';

// Sub-components for each step
import Step1Cover from '../components/Step1Cover';
import Step2Config from '../components/Step2Config';
import Step3Dates from '../components/Step3Dates';
import Step4Venues from '../components/Step4Venues';
import Step5Teams from '../components/Step5Teams';
import Step6Officials from '../components/Step6Officials';
import Step7Awards from '../components/Step7Awards';
import Step8Review from '../components/Step8Review';

const STEPS = [
  { id: 1, title: 'Basic Details', icon: <Trophy size={16} /> },
  { id: 2, title: 'Configuration', icon: <CheckCircle2 size={16} /> },
  { id: 3, title: 'Dates & Limits', icon: <Calendar size={16} /> },
  { id: 4, title: 'Venues', icon: <MapPin size={16} /> },
  { id: 5, title: 'Teams & Fees', icon: <Users size={16} /> },
  { id: 6, title: 'Officials', icon: <ShieldCheck size={16} /> },
  { id: 7, title: 'Prizes & Awards', icon: <Trophy size={16} /> },
  { id: 8, title: 'Publish', icon: <CheckCircle2 size={16} /> }
];

const TournamentWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [tournamentId, setTournamentId] = useState(null);
  
  const [createTournament, { isLoading: isCreating }] = useCreateTournamentMutation();
  const [updateTournament, { isLoading: isUpdating }] = useUpdateTournamentMutation();

  // Load existing data if we have an ID
  const { data: tournamentRes, isLoading: isFetching } = useGetTournamentByIdQuery(tournamentId, {
    skip: !tournamentId
  });

  const tournament = tournamentRes?.data;

  // Local form state
  const [formData, setFormData] = useState({
    name: '',
    sport: 'Cricket',
    format: 'T20',
    details: {
      about: '',
      awards: '',
      facilities: '',
      refreshments: '',
    },
    entryFee: 0,
    advanceFee: 0,
    prizePool: 0,
  });

  // Sync state when fetching completes
  useEffect(() => {
    if (tournament) {
      setFormData(prev => ({
        ...prev,
        ...tournament,
        details: { ...prev.details, ...(tournament.details || {}) }
      }));
      // Optional: Auto-jump to their last saved step
      // if (tournament.currentStep > currentStep) setCurrentStep(tournament.currentStep);
    }
  }, [tournament]);

  const handleNext = async (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    try {
      if (currentStep === 1 && !tournamentId) {
        // Create draft
        const res = await createTournament(updatedData).unwrap();
        setTournamentId(res.data.id);
      } else if (tournamentId) {
        // Update draft
        await updateTournament({ 
          id: tournamentId, 
          ...updatedData, 
          currentStep: currentStep + 1 
        }).unwrap();
      }
      
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/host-game');
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      onNext: handleNext,
      onBack: handleBack,
      isLoading: isCreating || isUpdating,
      tournamentId
    };

    switch (currentStep) {
      case 1: return <Step1Cover {...stepProps} />;
      case 2: return <Step2Config {...stepProps} />;
      case 3: return <Step3Dates {...stepProps} />;
      case 4: return <Step4Venues {...stepProps} />;
      case 5: return <Step5Teams {...stepProps} />;
      case 6: return <Step6Officials {...stepProps} />;
      case 7: return <Step7Awards {...stepProps} />;
      case 8: return <Step8Review {...stepProps} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white/90">
                {tournamentId ? 'Edit Tournament' : 'Create Tournament'}
              </h1>
              <p className="text-[10px] text-white/50">{STEPS[currentStep - 1].title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-[#BFF367]">
              {currentStep}
            </span>
            <span className="text-xs text-white/30">/ {STEPS.length}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-[2px] bg-white/5 w-full">
          <div 
            className="h-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TournamentWizard;
