import { useState, useEffect } from "react";
import TeamSidebar from "../components/TeamSidebar";
import TeamDetails from "../components/TeamDetails";
import CreateTeamModal from "../components/CreateTeamModal";
import InviteMemberModal from "../components/InviteMemberModal";
import { useSearchParams } from "react-router-dom";
import { useGetMyTeamsQuery } from "@redux/api/teamApi";

const MyTeams = () => {
  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: teamData } = useGetMyTeamsQuery(undefined, {
    pollingInterval: 15000,
  });

  // Sync selected team with data if it changes
  useEffect(() => {
    if (selectedTeam && teamData) {
      const updatedTeam = teamData.teams?.find(
        (t) => t._id === selectedTeam._id
      );
      if (
        updatedTeam &&
        JSON.stringify(updatedTeam) !== JSON.stringify(selectedTeam)
      ) {
        setSelectedTeam(updatedTeam);
      }
    }
  }, [teamData, selectedTeam]);

  // Handle URL param selection
  useEffect(() => {
    if (teamIdParam && teamData) {
      const team = teamData.teams?.find((t) => t._id === teamIdParam);
      if (team) setSelectedTeam(team);
    }
  }, [teamIdParam, teamData]);

  return (
    <div
      className="h-[calc(100dvh-140px)] lg:h-[100dvh] flex bg-[#0a0a0a] overflow-hidden w-full"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* Sidebar */}
      <div
        className={`${selectedTeam ? "hidden md:block" : "block"} w-full md:w-80 h-full shrink-0`}
      >
        <TeamSidebar
          onSelectTeam={setSelectedTeam}
          selectedTeamId={selectedTeam?._id}
          onCreateTeam={() => setIsCreateModalOpen(true)}
        />
      </div>

      {/* Details Window */}
      <div
        className={`${selectedTeam ? "block" : "hidden md:block"} flex-1 h-full`}
      >
        <TeamDetails
          team={selectedTeam}
          onBack={() => setSelectedTeam(null)}
          onInviteClick={() => setIsInviteModalOpen(true)}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newTeam) => {
          setSelectedTeam(newTeam);
          setIsInviteModalOpen(true);
        }}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamId={selectedTeam?._id}
        teamName={selectedTeam?.name}
      />
    </div>
  );
};

export default MyTeams;
