import { baseApi } from "./baseApi";

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyHostedGames: builder.query({
      query: () => "/api/hosted-game/my-hosted",
      providesTags: ["Games"],
    }),
    getMyJoinedGames: builder.query({
      query: () => "/api/hosted-game/my-joined",
      providesTags: ["Games"],
    }),
    listGames: builder.query({
      query: ({ city, state, gameType } = {}) => {
        let url = "/api/hosted-game/list?";
        if (city) url += `city=${city}&`;
        if (state) url += `state=${state}&`;
        if (gameType && gameType !== "All Sports")
          url += `gameType=${gameType}&`;
        return url;
      },
      providesTags: ["Games"],
    }),
    verifyInvite: builder.query({
      query: (token) => `/api/hosted-game/verify-invite?token=${token}`,
    }),
    getGrounds: builder.query({
      query: ({ city, state, sportType, query }) => {
        let url = "/api/hosted-game/grounds?";
        if (city) url += `city=${city}&`;
        if (state) url += `state=${state}&`;
        if (sportType) url += `sportType=${sportType}&`;
        if (query) url += `query=${query}&`;
        return url;
      },
    }),
    getUmpires: builder.query({
      query: ({ city, state, gameType, query }) => {
        let url = "/api/hosted-game/umpires?";
        if (city) url += `city=${city}&`;
        if (state) url += `state=${state}&`;
        if (gameType) url += `gameType=${gameType}&`;
        if (query) url += `query=${query}&`;
        return url;
      },
    }),
    getStreamers: builder.query({
      query: ({ city, state, gameType }) => {
        let url = "/api/hosted-game/streamers?";
        if (city) url += `city=${city}&`;
        if (state) url += `state=${state}&`;
        if (gameType) url += `gameType=${gameType}&`;
        return url;
      },
    }),
    createGame: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    joinGame: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/join",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    claimSlot: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/claim-slot",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    approvePlayer: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/approve",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    rejectPlayer: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/reject",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    cancelGame: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/cancel",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    leaveGame: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/leave",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    handleStreamerRequest: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/handle-streamer-request",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    handleUmpireRequest: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/handle-umpire-request",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
    handleScorerRequest: builder.mutation({
      query: (payload) => ({
        url: "/api/hosted-game/handle-scorer-request",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Games"],
    }),
  }),
});

export const {
  useGetMyHostedGamesQuery,
  useGetMyJoinedGamesQuery,
  useListGamesQuery,
  useLazyListGamesQuery,
  useVerifyInviteQuery,
  useLazyVerifyInviteQuery,
  useGetGroundsQuery,
  useLazyGetGroundsQuery,
  useGetUmpiresQuery,
  useLazyGetUmpiresQuery,
  useGetStreamersQuery,
  useLazyGetStreamersQuery,
  useCreateGameMutation,
  useJoinGameMutation,
  useClaimSlotMutation,
  useApprovePlayerMutation,
  useRejectPlayerMutation,
  useCancelGameMutation,
  useLeaveGameMutation,
  useHandleStreamerRequestMutation,
  useHandleUmpireRequestMutation,
  useHandleScorerRequestMutation,
} = gamesApi;
