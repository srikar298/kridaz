import { baseApi } from "./baseApi";

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommunityFeed: builder.query({
      query: (params) => ({
        url: "/api/user/community",
        params,
      }),
      providesTags: ["Community"],
    }),
    getPostById: builder.query({
      query: (postId) => `/api/user/community/${postId}`,
      providesTags: (result, error, id) => [{ type: "Community", id }],
    }),
    getStoriesFeed: builder.query({
      query: (params) => ({
        url: "/api/user/stories/feed",
        params,
      }),
      providesTags: ["Stories"],
    }),
    getCommunityStats: builder.query({
      query: () => "/api/user/community/stats",
      providesTags: ["Community"],
    }),
    createPost: builder.mutation({
      query: (formData) => ({
        url: "/api/user/community",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Community"],
    }),
    updatePost: builder.mutation({
      query: ({ postId, formData }) => ({
        url: `/api/user/community/${postId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Community"],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/community/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),
    reportPost: builder.mutation({
      query: ({ postId, reason }) => ({
        url: `/api/user/community/${postId}/report`,
        method: "POST",
        body: { reason },
      }),
    }),
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/community/${postId}/like`,
        method: "POST",
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        // Optimistic update for likes
        const patchResult = dispatch(
          communityApi.util.updateQueryData(
            "getCommunityFeed",
            undefined,
            (draft) => {
              const post = draft.posts.find((p) => p._id === postId);
              // This is a simplified optimistic update; real implementation depends on user state
              if (post) {
                // We don't have the user ID easily here without extra logic,
                // but we can increment length as a placeholder or wait for response.
                // For now, let's wait for queryFulfilled for likes as it's more complex (add/remove).
              }
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Community"],
    }),
    addPostComment: builder.mutation({
      query: ({ postId, text }) => ({
        url: `/api/user/community/${postId}/comment`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Community"],
    }),
    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/api/user/community/${postId}/comment/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),
    getCommunityUploadUrl: builder.query({
      query: (params) => ({
        url: "/api/user/community/upload-url",
        params,
      }),
    }),
    confirmCommunityPost: builder.mutation({
      query: (data) => ({
        url: "/api/user/community/confirm-post",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(data, { dispatch, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          // After successful confirmation, add the post to the top of the feed immediately
          if (result.success && result.post) {
            dispatch(
              communityApi.util.updateQueryData(
                "getCommunityFeed",
                undefined,
                (draft) => {
                  if (!draft.posts) draft.posts = [];
                  // Check if post already exists (to avoid duplicates from refetch)
                  const exists = draft.posts.some(
                    (p) =>
                      (p._id || p.id) === (result.post._id || result.post.id)
                  );
                  if (!exists) {
                    draft.posts.unshift(result.post);
                  }
                }
              )
            );
          }
        } catch (err) {
          // If it fails, the refetch will handle it or tags will handle it
        }
      },
      invalidatesTags: ["Community"],
    }),
    getStoryUploadUrl: builder.query({
      query: (params) => ({
        url: "/api/user/stories/upload-url",
        params,
      }),
    }),
    confirmStoryUpload: builder.mutation({
      query: (data) => ({
        url: "/api/user/stories/confirm-upload",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Stories"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          if (result.success && result.story) {
            dispatch(
              communityApi.util.updateQueryData(
                "getStoriesFeed",
                undefined,
                (draft) => {
                  if (draft.stories) {
                    // Find or create group for the author (using userId field from backend)
                    const author = result.story.userId;
                    const groupIndex = draft.stories.findIndex(
                      (g) =>
                        (g.author._id || g.author.id) ===
                        (author._id || author.id)
                    );
                    if (groupIndex !== -1) {
                      draft.stories[groupIndex].stories.unshift(result.story);
                    } else {
                      draft.stories.unshift({
                        author: author,
                        stories: [result.story],
                      });
                    }
                  }
                }
              )
            );
          }
        } catch (err) {
          /* ignore */
        }
      },
    }),
    getUserStories: builder.query({
      query: (userId) => `/api/user/community/user-stories/${userId}`,
    }),
    uploadStory: builder.mutation({
      query: (formData) => ({
        url: "/api/user/stories",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Stories"],
    }),
    deleteStory: builder.mutation({
      query: (storyId) => ({
        url: `/api/user/stories/${storyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Stories"],
    }),
    getPostReports: builder.query({
      query: (params) => ({
        url: "/api/community/admin/reports",
        params,
      }),
      providesTags: ["Community"],
    }),
    deleteAdminPost: builder.mutation({
      query: (postId) => ({
        url: `/api/community/admin/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),
  }),
});

export const {
  useGetCommunityFeedQuery,
  useLazyGetCommunityFeedQuery,
  useGetPostByIdQuery,
  useGetStoriesFeedQuery,
  useGetCommunityStatsQuery,
  useCreatePostMutation,
  useGetCommunityUploadUrlQuery,
  useLazyGetCommunityUploadUrlQuery,
  useConfirmCommunityPostMutation,
  useGetStoryUploadUrlQuery,
  useLazyGetStoryUploadUrlQuery,
  useConfirmStoryUploadMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useReportPostMutation,
  useLikePostMutation,
  useAddPostCommentMutation,
  useDeleteCommentMutation,
  useGetUserStoriesQuery,
  useUploadStoryMutation,
  useDeleteStoryMutation,
  useGetPostReportsQuery,
  useDeleteAdminPostMutation,
} = communityApi;
