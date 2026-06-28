import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Plus, User, Video } from "lucide-react";
import {
  useGetStoriesFeedQuery,
  useDeleteStoryMutation,
} from "@redux/api/communityApi";
import { useNavigate } from "react-router-dom";
import StoryViewer from "./StoryViewer";
import toast from "react-hot-toast";

/** Returns a renderable image URL for a story thumbnail, or null if only HLS video. */
const getStoryThumb = (story) => {
  if (!story) return null;
  if (story.thumbnailUrl) return story.thumbnailUrl;
  if (story.mediaUrl && !story.mediaUrl.includes(".m3u8"))
    return story.mediaUrl;
  return null; // HLS-only video — no image to render
};

const StoriesSection = ({ user, isLoggedIn, isAdmin, gateInteraction }) => {
  const navigate = useNavigate();
  const userLocation = useSelector((state) => state.ui.userLocation);
  const currentUserId = user?._id || user?.id;

  const { data: storiesData, isLoading: storiesLoading } = useGetStoriesFeedQuery(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
    { skip: !isLoggedIn }
  );

  const [deleteStory] = useDeleteStoryMutation();

  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);

  useEffect(() => {
    const handleOpenCreateStory = () => {
      gateInteraction(() => navigate("/create-story"));
    };
    window.addEventListener("openCreateStory", handleOpenCreateStory);
    return () =>
      window.removeEventListener("openCreateStory", handleOpenCreateStory);
  }, [gateInteraction]);

  const hasSeenGroup = (group) => {
    if (!currentUserId) return false;
    return group.stories.every((story) =>
      story.viewers?.some(
        (viewer) => (viewer.id || viewer._id || viewer) === currentUserId
      )
    );
  };

  const stories = storiesData?.stories || [];
  const myStoryGroup = currentUserId
    ? stories.find(
        (group) => (group.user?._id || group.user?.id) === currentUserId
      )
    : null;
  const otherStories = currentUserId
    ? stories.filter(
        (group) => (group.user?._id || group.user?.id) !== currentUserId
      )
    : stories;

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    try {
      await deleteStory(storyId).unwrap();
      toast.success("Story deleted");
      setSelectedStoryGroup(null);
    } catch (error) {
      toast.error(
        error?.data?.message || error.message || "Failed to delete story"
      );
    }
  };

  const handleNextUser = () => {
    const getUserId = (g) => g?.user?._id || g?.user?.id;
    const isMyStory =
      myStoryGroup && getUserId(selectedStoryGroup) === getUserId(myStoryGroup);

    if (isMyStory) {
      setSelectedStoryGroup(null);
      return;
    }

    const currentIndex = otherStories.findIndex(
      (g) => getUserId(g) === getUserId(selectedStoryGroup)
    );
    if (currentIndex !== -1 && currentIndex < otherStories.length - 1) {
      setSelectedStoryGroup(otherStories[currentIndex + 1]);
    } else {
      setSelectedStoryGroup(null);
    }
  };

  const handlePrevUser = () => {
    const getUserId = (g) => g?.user?._id || g?.user?.id;
    const isMyStory =
      myStoryGroup && getUserId(selectedStoryGroup) === getUserId(myStoryGroup);

    if (isMyStory) return;

    const currentIndex = otherStories.findIndex(
      (g) => getUserId(g) === getUserId(selectedStoryGroup)
    );
    if (currentIndex > 0) {
      setSelectedStoryGroup(otherStories[currentIndex - 1]);
    }
  };

  return (
    <div className="pb-1 px-2">
      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth items-center pb-2">
        {/* Add/View Your Story */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 group relative">
          <div
            className="w-[72px] h-[72px] rounded-full relative shrink-0"
            style={{
              padding: "1.5px",
              background: myStoryGroup && hasSeenGroup(myStoryGroup)
                ? "rgba(255, 255, 255, 0.2)"
                : "linear-gradient(149.28deg, #55DEE8 13.25%, #BFF367 83.54%)"
            }}
          >
            <div
              onClick={() => {
                if (myStoryGroup) {
                  setSelectedStoryGroup(myStoryGroup);
                } else {
                  gateInteraction(() => navigate("/create-story"));
                }
              }}
              className="w-full h-full rounded-full bg-background p-[2px] cursor-pointer"
            >
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-card">
                {myStoryGroup && getStoryThumb(myStoryGroup.stories[0]) ? (
                  <img
                    src={getStoryThumb(myStoryGroup.stories[0])}
                    className={`w-full h-full object-cover ${
                      myStoryGroup.stories.some(
                        (s) =>
                          s.status === "pending" || s.status === "processing"
                      )
                        ? "blur-sm opacity-50"
                        : ""
                    }`}
                    alt="Your story"
                  />
                ) : myStoryGroup &&
                  myStoryGroup.stories[0].mediaType === "video" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-card to-card">
                    <Video size={24} className="text-primary mb-1" />
                    <span className="text-[7px] font-bold text-white/40 uppercase tracking-wider">
                      Video
                    </span>
                  </div>
                ) : myStoryGroup && myStoryGroup.stories[0].content ? (
                  <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-primary font-bold bg-card">
                    {myStoryGroup.stories[0].content?.slice(0, 15)}
                  </div>
                ) : user?.profilePicture || user?.profileImage ? (
                  <>
                    <img
                      src={user.profilePicture || user.profileImage}
                      className="w-full h-full object-cover opacity-60"
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling.style.display =
                          "flex";
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-card">
                      <User size={32} className="text-gray-600" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-card">
                    <User size={32} className="text-gray-600" />
                  </div>
                )}
              </div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                gateInteraction(() => navigate("/create-story"));
              }}
              className="absolute bottom-0 right-0 w-[24px] h-[24px] bg-gradient-to-r from-primary to-primary rounded-full flex items-center justify-center border-2 border-background cursor-pointer hover:scale-110 transition-transform z-10 shadow-lg"
            >
              <Plus size={14} strokeWidth={3} className="text-black" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-white/80 group-hover:text-primary transition-colors truncate max-w-[68px]">
            Your Story
          </span>
        </div>

        {/* Render Other Stories */}
        {storiesLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`skel-${i}`} className="flex flex-col items-center gap-2.5 shrink-0">
                <div className="w-[72px] h-[72px] rounded-full bg-[#161616] animate-pulse border border-white/5 shrink-0" />
                <div className="w-12 h-2.5 bg-[#161616] animate-pulse rounded-full" />
              </div>
            ))}
          </>
        ) : (
          otherStories.map((group, idx) => (
            <div
              key={group._id}
              onClick={() => setSelectedStoryGroup(group)}
              className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
            >
              <div
                className="w-[72px] h-[72px] rounded-full relative shrink-0"
                style={{
                  padding: "1.5px",
                  background: hasSeenGroup(group)
                    ? "rgba(255, 255, 255, 0.2)"
                    : "linear-gradient(149.28deg, #55DEE8 13.25%, #BFF367 83.54%)"
                }}
              >
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-card">
                    {getStoryThumb(group.stories[0]) ? (
                      <img
                        src={getStoryThumb(group.stories[0])}
                        alt=""
                        className={`w-full h-full object-cover ${
                          group.stories.some(
                            (s) =>
                              s.status === "pending" || s.status === "processing"
                          )
                            ? "blur-sm opacity-50"
                            : ""
                        }`}
                      />
                    ) : group.stories[0].mediaType === "video" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-card to-card">
                        <Video size={24} className="text-primary mb-1" />
                        <span className="text-[7px] font-bold text-white/40 uppercase tracking-wider">
                          Video
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-primary font-bold bg-card">
                        {group.stories[0].content?.slice(0, 15)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white/80 group-hover:text-primary transition-colors truncate max-w-[68px]">
                {group.user?.name?.split(" ")[0] || "Player"}
              </span>
            </div>
          ))
        )}
      </div>

      {selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          onClose={() => setSelectedStoryGroup(null)}
          onDelete={handleDeleteStory}
          currentUser={user}
          isAdmin={isAdmin}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
        />
      )}
    </div>
  );
};

export default StoriesSection;
