const fs = require('fs');

const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/features/networking/pages/FindPlayers.jsx';
let content = fs.readFileSync(path, 'utf8');

const playerCardRegex = /const PlayerCard = \(\{[\s\S]*?\}\) => \{[\s\S]*?return \([\s\S]*?<\/motion\.div>\s*?\);\s*?};/;
const teamCardRegex = /const TeamCard = \(\{ team, navigate \}\) => \{[\s\S]*?return \([\s\S]*?<\/motion\.div>\s*?\);\s*?};/;

const newPlayerCard = `const PlayerCard = ({
  player,
  followingIds = [],
  handleFollowToggle,
  handleAvatarClick,
  navigate,
  gateInteraction,
}) => {
  const playerId = player.id || player._id;
  const isFollowing = followingIds.includes(playerId);
  const initials =
    player.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const city = player.city ? player.city.split(",")[0].trim() : "Nearby";
  const locationText = city;
  const primarySport =
    player.preferredSport ||
    (player.sportTypes && player.sportTypes[0]) ||
    (player.interests && player.interests[0]) ||
    "Athlete";

  return (
    <div
      onClick={() => navigate(\`/profile/\${playerId}\`)}
      className="shrink-0 w-full h-[220px] snap-start relative rounded-[16px] border border-white/5 bg-card overflow-hidden transition-all duration-300 group hover:border-primary/30 cursor-pointer"
    >
      {/* Background Image or Initials */}
      {player.profilePicture || player.profileImage ? (
        <img
          src={player.profilePicture || player.profileImage}
          alt={player.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextElementSibling.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className="absolute inset-0 flex items-center justify-center bg-white/5"
        style={{
          display: player.profilePicture || player.profileImage ? "none" : "flex",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-10">
          <span className="text-primary font-bold text-xl tracking-wider">
            {initials}
          </span>
        </div>
      </div>

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent" />

      {/* Primary Sport badge - Top Right */}
      <div
        className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary bg-black/60 backdrop-blur-md border border-primary/20 z-10"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {primarySport}
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col z-10">
        {/* Player Name */}
        <h3
          className="text-white text-sm font-bold line-clamp-1 mb-0.5"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {player.name || "Anonymous"}
        </h3>

        {/* Location: City */}
        <p
          className="text-white/60 text-xs font-medium line-clamp-1 mb-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {locationText}
        </p>

        {/* Follow / Message Row */}
        <div className="w-full flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFollowToggle(playerId);
            }}
            className={\`flex-1 h-8 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center \${
              isFollowing
                ? "text-white bg-white/10 border border-white/10 hover:bg-white/20"
                : "text-background bg-primary hover:brightness-110"
            }\`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              gateInteraction(() => navigate(\`/messages?userId=\${playerId}\`));
            }}
            className="w-8 h-8 rounded-lg text-white bg-white/10 border border-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center shrink-0"
            title="Message"
          >
            <MessageCircle size={14} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};`;

const newTeamCard = `const TeamCard = ({ team, navigate }) => {
  const sportBanners = {
    Cricket: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop",
    Football: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop",
    Basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop",
    default: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop",
  };
  const banner = sportBanners[team.sportType] || sportBanners.default;

  return (
    <div
      onClick={() => navigate(\`/team/\${team._id}\`)}
      className="shrink-0 w-full h-[220px] snap-start relative rounded-[16px] border border-white/5 bg-card overflow-hidden transition-all duration-300 group hover:border-primary/30 cursor-pointer"
    >
      {/* Banner */}
      <img
        src={banner}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-[#000000]/10" />

      {/* Sport chip - Top Left */}
      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary bg-black/60 backdrop-blur-md border border-primary/20 z-10"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {team.sportType || "Team"}
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col z-10">
        <div className="flex items-center gap-3 mb-2">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full border border-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {team.logo ? (
              <img src={team.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-lg">
                {team.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3
              className="text-white text-sm font-bold line-clamp-1 mb-0.5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {team.name}
            </h3>
            <p
              className="text-white/60 text-xs font-medium line-clamp-1 flex items-center gap-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <MapPin size={10} className="text-primary" />
              {team.city || "N/A"}
            </p>
          </div>
        </div>

        {/* Stats inline row */}
        <div className="flex items-center gap-2 text-[10px] font-medium text-white/60 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span><span className="text-white font-bold">{team.memberCount || 1}</span> Members</span>
          <span className="text-white/20">•</span>
          <span><span className="text-white font-bold">{team.matchesPlayed || 0}</span> Matches</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(\`/team/\${team._id}\`);
            }}
            className="h-8 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 text-background bg-primary hover:brightness-110"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <UserPlus size={12} strokeWidth={2.5} />
            Join
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(\`/team/\${team._id}\`);
            }}
            className="h-8 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 text-white bg-white/10 border border-white/10 hover:bg-white/20"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <Swords size={12} />
            Challenge
          </button>
        </div>
      </div>
    </div>
  );
};`;

if (playerCardRegex.test(content) && teamCardRegex.test(content)) {
  content = content.replace(playerCardRegex, newPlayerCard);
  content = content.replace(teamCardRegex, newTeamCard);
  fs.writeFileSync(path, content);
  console.log('Cards replaced successfully.');
} else {
  console.log('Could not match regex.');
}
