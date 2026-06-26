const fs = require('fs');

const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/features/networking/pages/FindPlayers.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldPlayerCardStart = content.indexOf('const PlayerCard = ({ player, navigate }) => {');
const nextComponentStart = content.indexOf('const TeamCard = ({ team, navigate }) => {');

const newPlayerCard = `const PlayerCard = ({ player, navigate }) => {
  const { followingIds } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const playerId = player.id || player._id;
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();
  
  const handleFollowToggle = async (id) => {
    try {
      if (followingIds.includes(id)) {
        await unfollowUser(id).unwrap();
        dispatch(removeFollowing(id));
      } else {
        await followUser(id).unwrap();
        dispatch(addFollowing(id));
      }
    } catch (error) {
      console.error("Failed to toggle follow status", error);
    }
  };

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
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
          display:
            player.profilePicture || player.profileImage ? "none" : "flex",
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
            className={\`flex-1 h-8 rounded-[8px] text-[11px] font-bold transition-all active:scale-[0.98] flex items-center justify-center \${
              isFollowing
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-primary text-black hover:brightness-110"
            }\`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              gateInteraction(() => navigate(\`/messages?userId=\${playerId}\`));
            }}
            className="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center shrink-0"
            title="Message"
          >
            <MessageCircle size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

`;

content = content.substring(0, oldPlayerCardStart) + newPlayerCard + content.substring(nextComponentStart);
fs.writeFileSync(path, content);
console.log('PlayerCard replaced successfully');
