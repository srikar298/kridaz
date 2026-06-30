import { baseApi } from "./baseApi";

export const tournamentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTournament: builder.mutation({
      query: (data) => ({
        url: "/api/tournament",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tournament"],
    }),
    getMyTournaments: builder.query({
      query: () => "/api/tournament/my-tournaments",
      providesTags: ["Tournament"],
    }),
    getTournamentById: builder.query({
      query: (id) => `/api/tournament/${id}`,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    updateTournament: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/tournament/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tournament", id },
        "Tournament",
      ],
    }),
    uploadTournamentPoster: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/tournament/${id}/poster`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tournament", id }],
    }),
    uploadTournamentLogo: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/tournament/${id}/logo`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tournament", id }],
    }),
    getPublicTournament: builder.query({
      query: (id) => `/api/tournament/public/${id}`,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    registerForTournament: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/tournament/${id}/register`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tournament", id },
        "Tournament",
      ],
    }),
    autoScheduleGroupStage: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/tournament/${id}/schedule/auto`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tournament", id }],
    }),
    manualSchedule: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/tournament/${id}/schedule/manual`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tournament", id }],
    }),
    getStandings: builder.query({
      query: (id) => `/api/tournament/${id}/standings`,
      providesTags: (result, error, id) => [{ type: "Standings", id }],
    }),
    getTournamentMatches: builder.query({
      query: (id) => `/api/tournament/${id}/matches`,
      providesTags: (result, error, id) => [{ type: "TournamentMatches", id }],
    }),
    // Edge Case 24 — Tournament cancellation with bulk refund
    cancelTournament: builder.mutation({
      query: (id) => ({
        url: `/api/tournament/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Tournament", id },
        "Tournament",
      ],
    }),
    // Team withdrawal + walkover generation + optional partial refund
    withdrawTeam: builder.mutation({
      query: ({ tournamentId, teamId, refundAmount }) => ({
        url: `/api/tournament/${tournamentId}/teams/${teamId}/withdraw`,
        method: "POST",
        body: { refundAmount },
      }),
      invalidatesTags: (result, error, { tournamentId }) => [
        { type: "Tournament", id: tournamentId },
        "Tournament",
      ],
    }),
  }),
});

export const {
  useCreateTournamentMutation,
  useGetMyTournamentsQuery,
  useGetTournamentByIdQuery,
  useUpdateTournamentMutation,
  useUploadTournamentPosterMutation,
  useUploadTournamentLogoMutation,
  useGetPublicTournamentQuery,
  useRegisterForTournamentMutation,
  useAutoScheduleGroupStageMutation,
  useManualScheduleMutation,
  useGetStandingsQuery,
  useGetTournamentMatchesQuery,
  useCancelTournamentMutation,
  useWithdrawTeamMutation,
} = tournamentApi;
