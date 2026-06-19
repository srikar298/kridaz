import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuggestedPlayers: builder.query({
      query: (params) => ({
        url: "/api/user/players",
        params,
      }),
      providesTags: ["User"],
    }),
    getUserBookings: builder.query({
      query: () => "/api/user/booking/get-bookings",
      providesTags: ["Booking"],
    }),
    getUserWallet: builder.query({
      query: () => "/api/user/wallet/data",
      providesTags: ["User"],
    }),
    getPlayerDetails: builder.query({
      query: (id) => `/api/user/players/${id}`,
      providesTags: ["User"],
    }),
    getNotifications: builder.query({
      query: (prefix) => prefix,
      providesTags: ["User"],
    }),
    markNotificationRead: builder.mutation({
      query: ({ prefix, id }) => ({
        url: `${prefix}/${id}/mark-read`,
        method: "PUT",
      }),
      invalidatesTags: ["User"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: (prefix) => ({
        url: `${prefix}/mark-all-read`,
        method: "PUT",
      }),
      invalidatesTags: ["User"],
    }),
    clearAllNotifications: builder.mutation({
      query: (prefix) => ({
        url: `${prefix}/clear`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    followPlayer: builder.mutation({
      query: (playerId) => ({
        url: `/api/user/players/${playerId}/follow`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    unfollowPlayer: builder.mutation({
      query: (playerId) => ({
        url: `/api/user/players/${playerId}/unfollow`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetSuggestedPlayersQuery,
  useGetUserBookingsQuery,
  useGetUserWalletQuery,
  useGetPlayerDetailsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearAllNotificationsMutation,
  useFollowPlayerMutation,
  useUnfollowPlayerMutation,
} = userApi;
