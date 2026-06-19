import { baseApi } from "./baseApi";

export const turfApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTurfs: builder.query({
      query: (params) => ({
        url: "/api/user/turf/all",
        params,
      }),
      providesTags: ["Turf"],
    }),
    getSavedTurfs: builder.query({
      query: () => ({
        url: "/api/user/turf/user/likes",
      }),
      providesTags: ["Turf"],
    }),
    toggleTurfLike: builder.mutation({
      query: (turfId) => ({
        url: "/api/user/turf/user/like",
        method: "POST",
        body: { turfId },
      }),
      invalidatesTags: ["Turf"],
    }),
    getTurfDetails: builder.query({
      query: (id) => `/api/user/turf/details/${id}`,
      providesTags: ["Turf"],
    }),
    getTurfReviews: builder.query({
      query: (id) => `/api/user/review/${id}`,
      providesTags: ["Turf"],
    }),
  }),
});

export const {
  useGetTurfsQuery,
  useGetSavedTurfsQuery,
  useToggleTurfLikeMutation,
  useGetTurfDetailsQuery,
  useGetTurfReviewsQuery,
} = turfApi;
