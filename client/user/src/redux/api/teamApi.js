import { baseApi } from "./baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTeam: builder.mutation({
      query: (body) => ({
        url: "/api/team",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Team"],
    }),
    getMyTeams: builder.query({
      query: () => "/api/team",
      providesTags: ["Team"],
    }),
    getTeamById: builder.query({
      query: (id) => `/api/team/${id}`,
      providesTags: (result, error, id) => [{ type: "Team", id }],
    }),
    inviteMembers: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/team/${id}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Team", id },
        "Team",
      ],
    }),
    joinTeam: builder.mutation({
      query: (token) => ({
        url: `/api/team/join/${token}`,
        method: "POST",
      }),
      invalidatesTags: ["Team"],
    }),
    getAllTeams: builder.query({
      query: (params) => ({
        url: "/api/team/all",
        params,
      }),
      providesTags: ["Team"],
    }),
    findTeamByCode: builder.query({
      query: (code) => `/api/team/find-by-code/${code}`,
    }),
    requestOpponent: builder.mutation({
      query: ({ teamId, targetTeamId }) => ({
        url: `/api/team/${teamId}/request-opponent`,
        method: "POST",
        body: { targetTeamId },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: "Team", id: teamId },
        "Team",
      ],
    }),
    handleOpponentRequest: builder.mutation({
      query: ({ teamId, requestId, action }) => ({
        url: `/api/team/${teamId}/handle-opponent-request`,
        method: "POST",
        body: { requestId, action },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: "Team", id: teamId },
        "Team",
      ],
    }),
    getOpponentTeams: builder.query({
      query: () => "/api/team/opponents",
      providesTags: ["Team"],
    }),
    getNetwork: builder.query({
      query: () => "/api/user/players/network",
    }),
    requestToJoin: builder.mutation({
      query: (id) => ({
        url: `/api/team/join-request/${id}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Team", id }, "Team"],
    }),
    handleJoinRequest: builder.mutation({
      query: ({ teamId, userId, action }) => ({
        url: `/api/team/${teamId}/handle-join-request`,
        method: "POST",
        body: { userId, action },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: "Team", id: teamId },
        "Team",
      ],
    }),
    searchPlayers: builder.query({
      query: (params) => ({
        url: "/api/user/players/search",
        params: typeof params === "string" ? { query: params } : params,
      }),
    }),
    inviteMember: builder.mutation({
      query: ({ teamId, userId }) => ({
        url: `/api/team/${teamId}/invite`,
        method: "POST",
        body: { invitees: [{ userId }] },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: "Team", id: teamId },
        "Team",
      ],
    }),
    addCustomMember: builder.mutation({
      query: ({ teamId, name, phone }) => ({
        url: `/api/team/${teamId}/invite`,
        method: "POST",
        body: { invitees: [{ name, phone }] },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: "Team", id: teamId },
        "Team",
      ],
    }),
  }),
});

export const {
  useCreateTeamMutation,
  useGetMyTeamsQuery,
  useGetTeamByIdQuery,
  useInviteMembersMutation,
  useJoinTeamMutation,
  useGetAllTeamsQuery,
  useFindTeamByCodeQuery,
  useLazyFindTeamByCodeQuery,
  useRequestOpponentMutation,
  useHandleOpponentRequestMutation,
  useGetOpponentTeamsQuery,
  useGetNetworkQuery,
  useRequestToJoinMutation,
  useHandleJoinRequestMutation,
  useSearchPlayersQuery,
  useLazySearchPlayersQuery,
  useInviteMemberMutation,
  useAddCustomMemberMutation,
} = teamApi;
