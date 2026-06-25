import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronLeft,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useCreateTournamentMutation,
  useUpdateTournamentMutation,
  useGetTournamentByIdQuery,
  useUploadTournamentLogoMutation,
  useUploadTournamentPosterMutation,
} from "../../../redux/api/tournamentApi";

// Sub-components for each step
import Step1Cover from "../components/Step1Cover";
import Step2Organizer from "../components/Step2Organizer";
import Step3Config from "../components/Step3Config";
import Step4Dates from "../components/Step4Dates";
import Step5Venues from "../components/Step5Venues";
import Step6Teams from "../components/Step6Teams";
import Step7Officials from "../components/Step7Officials";
import Step8Awards from "../components/Step8Awards";
import Step9Review from "../components/Step9Review";
import { Button } from "@kridaz/ui";

const STEPS = [
  { id: 1, title: "Basic Details", icon: <Trophy size={16} /> },
  { id: 2, title: "Organizer Info", icon: <Users size={16} /> },
  { id: 3, title: "Configuration", icon: <CheckCircle2 size={16} /> },
  { id: 4, title: "Dates & Limits", icon: <Calendar size={16} /> },
  { id: 5, title: "Venues", icon: <MapPin size={16} /> },
  { id: 6, title: "Teams & Fees", icon: <Users size={16} /> },
  { id: 7, title: "Officials", icon: <ShieldCheck size={16} /> },
  { id: 8, title: "Prizes & Awards", icon: <Trophy size={16} /> },
  { id: 9, title: "Publish", icon: <CheckCircle2 size={16} /> },
];

const TournamentWizard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialStep = parseInt(searchParams.get("step")) || 1;
  const initialId = searchParams.get("id") || null;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [tournamentId, setTournamentId] = useState(initialId);

  // Sync state changes back to URL without adding to browser history
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    if (tournamentId && params.get("id") !== tournamentId) {
      params.set("id", tournamentId);
      changed = true;
    }
    if (params.get("step") !== currentStep.toString()) {
      params.set("step", currentStep.toString());
      changed = true;
    }
    if (changed) {
      setSearchParams(params, { replace: true });
    }
  }, [currentStep, tournamentId, setSearchParams, searchParams]);

  const [createTournament, { isLoading: isCreating }] =
    useCreateTournamentMutation();
  const [updateTournament, { isLoading: isUpdating }] =
    useUpdateTournamentMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] =
    useUploadTournamentLogoMutation();
  const [uploadPoster, { isLoading: isUploadingPoster }] =
    useUploadTournamentPosterMutation();

  // Load existing data if we have an ID
  const { data: tournamentRes, isLoading: isFetching } =
    useGetTournamentByIdQuery(tournamentId, {
      skip: !tournamentId,
    });

  const tournament = tournamentRes?.data;

  // Local form state
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: null,
    posterUrl: null,
    organizerName: "",
    organizerNumber: "",
    organizerEmail: "",
    category: "Open",
    ballType: "Tennis",
    pitchType: "Turf",
    matchType: "Limited Overs",
    sport: "Cricket",
    format: "T20",
    startDate: null,
    endDate: null,
    maxTeams: 16,
    entryFee: 0,
    advanceFee: 0,
    prizePool: 0,
    details: {
      about: "",
      awards: "",
      facilities: "",
      refreshments: "",
      contactMethod: "WhatsApp",
      matchesOn: "Weekends",
      matchTiming: "Day",
      durationDays: 2,
      matchesPerDay: 4,
      budgetRange: "10k - 50k",
      winningPrize: "Cash",
      groundId: null,
      customLocation: null,
      officials: [],
    },
  });

  // Sync state when fetching completes
  useEffect(() => {
    if (tournament) {
      setFormData((prev) => ({
        ...prev,
        ...tournament,
        details: { ...prev.details, ...(tournament.details || {}) },
      }));
      // Auto-jump to their last saved step if no step is in URL
      if (tournament.currentStep && !searchParams.has("step") && tournament.currentStep > currentStep) {
        setCurrentStep(tournament.currentStep);
      }
    }
  }, [tournament, searchParams]);

  const handleNext = async (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    try {
      // Create a clean payload without file objects and previews
      const payload = { ...updatedData };
      delete payload.logoFile;
      delete payload.posterFile;
      delete payload.logoPreview;
      delete payload.posterPreview;

      let currentId = tournamentId;
      if (currentStep === 1 && !tournamentId) {
        // Create draft
        const res = await createTournament(payload).unwrap();
        currentId = res.data.id;
        setTournamentId(currentId);
      } else if (tournamentId) {
        // Update draft
        await updateTournament({
          id: tournamentId,
          ...payload,
          currentStep: currentStep + 1,
        }).unwrap();
      }

      // Handle image uploads if they exist
      if (stepData.logoFile && currentId) {
        const formDataPayload = new FormData();
        formDataPayload.append("image", stepData.logoFile);
        await uploadLogo({ id: currentId, formData: formDataPayload }).unwrap();
      }

      if (stepData.posterFile && currentId) {
        const formDataPayload = new FormData();
        formDataPayload.append("image", stepData.posterFile);
        await uploadPoster({ id: currentId, formData: formDataPayload }).unwrap();
      }

      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } catch (err) {
      console.error("Failed to save progress", err);
      let errorMessage = err?.data?.message || err?.message || "Failed to save progress";
      if (err?.data?.errors && Array.isArray(err.data.errors)) {
        errorMessage = err.data.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
      }
      toast.error(errorMessage);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/host-game");
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      onNext: handleNext,
      onBack: handleBack,
      isLoading: isCreating || isUpdating || isUploadingLogo || isUploadingPoster,
      tournamentId,
    };

    switch (currentStep) {
      case 1:
        return <Step1Cover {...stepProps} />;
      case 2:
        return <Step2Organizer {...stepProps} />;
      case 3:
        return <Step3Config {...stepProps} />;
      case 4:
        return <Step4Dates {...stepProps} />;
      case 5:
        return <Step5Venues {...stepProps} />;
      case 6:
        return <Step6Teams {...stepProps} />;
      case 7:
        return <Step7Officials {...stepProps} />;
      case 8:
        return <Step8Awards {...stepProps} />;
      case 9:
        return <Step9Review {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white/90">
                {tournamentId ? "Edit Tournament" : "Create Tournament"}
              </h1>
              <p className="text-[10px] text-white/50">
                {STEPS[currentStep - 1].title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-primary">
              {currentStep}
            </span>
            <span className="text-xs text-white/30">/ {STEPS.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-[2px] bg-white/5 w-full">
          <div
            className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500 ease-out"
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
