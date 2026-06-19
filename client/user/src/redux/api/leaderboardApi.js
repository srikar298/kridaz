import { baseApi } from "./baseApi";

export const leaderboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query({
      query: ({ sport, category }) =>
        `/api/user/leaderboard?sport=${sport.toLowerCase()}&category=${category}`,
      providesTags: ["User"],
    }),
  }),
});

export const { useGetLeaderboardQuery, useLazyGetLeaderboardQuery } =
  leaderboardApi;
