import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StartScoringModal from "../components/StartScoringModal";

const StartScoringPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state?.startScoringInitialData || location.state?.initialGameData || null;

  return (
    <div className="min-h-screen bg-background relative z-[9999]">
      <StartScoringModal
        isOpen={true}
        onClose={() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate("/my-teams");
          }
        }}
        onSuccess={() => navigate("/my-teams", { state: { activeTab: "scoringMatches" } })}
        initialData={initialData}
      />
    </div>
  );
};

export default StartScoringPage;
