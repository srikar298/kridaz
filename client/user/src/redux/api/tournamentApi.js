import { baseApi } from "./baseApi";

export const tournamentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTournament: builder.mutation({
      query: (data) => ({
        url: "/tournament",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tournament"],
    }),
    getMyTournaments: builder.query({
      query: () => "/tournament/my-tournaments",
      providesTags: ["Tournament"],
    }),
    getTournamentById: builder.query({
      query: (id) => `/tournament/${id}`,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    updateTournament: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tournament/${id}`,
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
        url: `/tournament/${id}/poster`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tournament", id },
      ],
    }),
    getPublicTournament: builder.query({
      query: (id) => `/tournament/public/${id}`,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    registerForTournament: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tournament/${id}/register`,
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
        url: `/tournament/${id}/schedule/auto`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tournament", id },
      ],
    }),
    manualSchedule: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tournament/${id}/schedule/manual`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tournament", id },
      ],
    }),
    getStandings: builder.query({
      query: (id) => `/tournament/${id}/standings`,
      providesTags: (result, error, id) => [{ type: "Standings", id }],
    }),
    getTournamentMatches: builder.query({
      query: (id) => `/tournament/${id}/matches`,
      providesTags: (result, error, id) => [{ type: "TournamentMatches", id }],
    }),
  }),
});

export const {
  useCreateTournamentMutation,
  useGetMyTournamentsQuery,
  useGetTournamentByIdQuery,
  useUpdateTournamentMutation,
  useUploadTournamentPosterMutation,
  useGetPublicTournamentQuery,
  useRegisterForTournamentMutation,
  useAutoScheduleGroupStageMutation,
  useManualScheduleMutation,
  useGetStandingsQuery,
  useGetTournamentMatchesQuery,
} = tournamentApi;
