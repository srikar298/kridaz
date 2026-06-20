import { baseApi } from "./baseApi";

export const reelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReelsFeed: builder.query({
      query: (arg) => {
        const { cursor, initialId } = arg || {};
        let url = "/api/reels/feed?";
        if (cursor) url += `cursor=${cursor}&`;
        if (initialId) url += `initialId=${initialId}&`;
        return url;
      },
      providesTags: ["Reel"],
      // Merge logic for infinite scroll
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems, { arg }) => {
        // If it's a fresh fetch (no cursor), replace the cache
        if (!arg?.cursor) {
          return newItems;
        }

        if (!currentCache) return newItems;

        // Pagination: combine and deduplicate on Prisma `id` field (UUID)
        const combinedReels = [...currentCache.reels, ...newItems.reels];
        const uniqueReels = combinedReels.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );

        return {
          ...newItems,
          reels: uniqueReels,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    uploadReel: builder.mutation({
      query: (formData) => ({
        url: "/api/reels/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Reel"],
    }),
    getReelUploadUrl: builder.query({
      query: (params) => ({
        url: "/api/reels/upload-url",
        params,
      }),
    }),
    confirmReelUpload: builder.mutation({
      query: (data) => ({
        url: "/api/reels/confirm-upload",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Reel"],
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          if (result.success && result.reel) {
            const state = /** @type {any} */ (getState());
            const loggedInUser = state.auth?.user;

            // Format the newly created reel to match the populated creator structure
            const formattedReel = {
              ...result.reel,
              creatorId: loggedInUser
                ? {
                    id: loggedInUser.id,
                    name: loggedInUser.name,
                    username: loggedInUser.username,
                    profilePicture: loggedInUser.profilePicture,
                  }
                : result.reel.creatorId,
              stats: {
                likes: 0,
                comments: 0,
                views: 0,
                shares: 0,
              },
            };

            const patchFeed = (queryArg) => {
              dispatch(
                reelsApi.util.updateQueryData(
                  "getReelsFeed",
                  queryArg,
                  (draft) => {
                    if (!draft) return;
                    if (!draft.reels) draft.reels = [];
                    // Check for duplicates
                    const exists = draft.reels.some(
                      (r) =>
                        (r.id || r._id) ===
                        (formattedReel.id || formattedReel._id)
                    );
                    if (!exists) {
                      draft.reels.unshift(formattedReel);
                    }
                  }
                )
              );
            };

            patchFeed(undefined);
          }
        } catch (err) {
          console.error("[CONFIRM_REEL_UPLOAD_ON_QUERY_STARTED_FAILED]", err);
        }
      },
    }),
    interactWithReel: builder.mutation({
      query: ({ reelId, ...data }) => ({
        url: `/api/reels/${reelId}/interact`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted({ reelId, type }, { dispatch, queryFulfilled }) {
        // Optimistic update for likes — Prisma UUID is `id`, not `_id`
        if (type === "LIKE" || type === "UNLIKE") {
          const delta = type === "LIKE" ? 1 : -1;
          const patchFeed = (queryArg) => {
            return dispatch(
              reelsApi.util.updateQueryData(
                "getReelsFeed",
                queryArg,
                (draft) => {
                  if (!draft?.reels) return;
                  const reel = draft.reels.find((r) => r.id === reelId);
                  if (reel) {
                    if (reel.stats) {
                      reel.stats.likes = Math.max(
                        0,
                        (reel.stats.likes || 0) + delta
                      );
                    }
                    reel.likes = Math.max(0, (reel.likes || 0) + delta);
                    reel.likesCount = Math.max(
                      0,
                      (reel.likesCount || 0) + delta
                    );
                    reel.isLiked = type === "LIKE";
                  }
                }
              )
            );
          };
          const p1 = patchFeed(undefined);
          try {
            await queryFulfilled;
          } catch {
            p1.undo();
          }
        }
      },
    }),
    getReelComments: builder.query({
      query: (reelId) => `/api/reels/${reelId}/comments`,
      providesTags: (result, error, reelId) => [
        { type: "ReelComments", id: reelId },
      ],
    }),
    addReelComment: builder.mutation({
      query: ({ reelId, ...data }) => ({
        url: `/api/reels/${reelId}/comment`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { reelId }) => [
        { type: "ReelComments", id: reelId },
      ],
      async onQueryStarted({ reelId }, { dispatch, queryFulfilled }) {
        const patchFeed = (queryArg) => {
          return dispatch(
            reelsApi.util.updateQueryData("getReelsFeed", queryArg, (draft) => {
              if (!draft?.reels) return;
              // Prisma UUID is `id`, not Mongo `_id`
              const reel = draft.reels.find((r) => r.id === reelId);
              if (reel) {
                if (reel.stats) reel.stats.comments += 1;
                if (typeof reel.comments === "number") reel.comments += 1;
              }
            })
          );
        };
        const p1 = patchFeed(undefined);
        try {
          await queryFulfilled;
        } catch {
          p1.undo();
        }
      },
    }),
    deleteReel: builder.mutation({
      query: (reelId) => ({
        url: `/api/reels/${reelId}`,
        method: "DELETE",
      }),
      async onQueryStarted(reelId, { dispatch, queryFulfilled }) {
        const patchFeed = (queryArg) => {
          return dispatch(
            reelsApi.util.updateQueryData("getReelsFeed", queryArg, (draft) => {
              if (!draft?.reels) return;
              // Prisma UUID is `id`, not Mongo `_id`
              draft.reels = draft.reels.filter((r) => r.id !== reelId);
            })
          );
        };
        const p1 = patchFeed(undefined);
        try {
          await queryFulfilled;
        } catch {
          p1.undo();
        }
      },
    }),
    getCreatorAnalytics: builder.query({
      query: () => "/api/reels/analytics",
    }),
    getRecommendedReels: builder.query({
      query: (cursor) =>
        `/api/reels/recommended${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: ["Reel"],
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems;
        const combinedReels = [...currentCache.reels, ...newItems.reels];
        const uniqueReels = combinedReels.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );
        return {
          ...newItems,
          reels: uniqueReels,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    trackHeartbeat: builder.mutation({
      query: ({ reelId, ...data }) => ({
        url: `/api/reels/${reelId}/heartbeat`,
        method: "POST",
        body: data,
      }),
    }),
    reportReel: builder.mutation({
      query: ({ reelId, reason }) => ({
        url: `/api/reels/${reelId}/report`,
        method: "POST",
        body: { reason },
      }),
    }),
    getReelReports: builder.query({
      query: () => "/api/reels/reports",
      providesTags: ["ReelReport"],
    }),
  }),
});

export const {
  useGetReelsFeedQuery,
  useGetRecommendedReelsQuery,
  useUploadReelMutation,
  useGetReelUploadUrlQuery,
  useLazyGetReelUploadUrlQuery,
  useConfirmReelUploadMutation,
  useInteractWithReelMutation,
  useGetReelCommentsQuery,
  useAddReelCommentMutation,
  useDeleteReelMutation,
  useGetCreatorAnalyticsQuery,
  useTrackHeartbeatMutation,
  useReportReelMutation,
  useGetReelReportsQuery,
} = reelsApi;
