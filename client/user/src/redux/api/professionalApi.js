import { baseApi } from "./baseApi";

export const professionalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleOnline: builder.mutation({
      query: (body) => ({
        url: "/api/professional/toggle-online",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    createMatchRequest: builder.mutation({
      query: (body) => ({
        url: "/api/professional/match-request",
        method: "POST",
        body,
      }),
    }),
    acceptOffer: builder.mutation({
      query: (offerId) => ({
        url: `/api/professional/offers/${offerId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Booking"],
    }),
    rejectOffer: builder.mutation({
      query: (offerId) => ({
        url: `/api/professional/offers/${offerId}/reject`,
        method: "POST",
      }),
    }),
    verifyOTP: builder.mutation({
      query: ({ bookingId, otp }) => ({
        url: `/api/professional/bookings/${bookingId}/verify-otp`,
        method: "POST",
        body: { otp },
      }),
      invalidatesTags: ["Booking"],
    }),
    completeProfessionalBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/api/professional/bookings/${bookingId}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["Booking", "User"],
    }),
    getMyOnDemandBookings: builder.query({
      query: () => "/api/professional/on-demand-bookings",
      providesTags: ["Booking"],
    }),
    getUserOnDemandBookings: builder.query({
      query: () => "/api/professional/user-on-demand-bookings",
      providesTags: ["Booking"],
    }),
    getDashboardStats: builder.query({
      query: () => "/api/professional/dashboard-stats",
      providesTags: ["Booking", "User"],
    }),
    getProfessionalsList: builder.query({
      query: (params) => ({
        url: "/api/professional/list",
        params,
      }),
      providesTags: ["User"],
    }),
    getTrustScoreHistory: builder.query({
      query: () => "/api/professional/trust-score-history",
      providesTags: ["Booking", "User"],
    }),
  }),
});

export const {
  useToggleOnlineMutation,
  useCreateMatchRequestMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useVerifyOTPMutation,
  useGetMyOnDemandBookingsQuery,
  useGetUserOnDemandBookingsQuery,
  useGetDashboardStatsQuery,
  useGetProfessionalsListQuery,
  useGetTrustScoreHistoryQuery,
  useCompleteProfessionalBookingMutation,
} = professionalApi;
