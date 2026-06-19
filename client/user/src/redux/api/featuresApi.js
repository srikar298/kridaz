import { baseApi } from "./baseApi";

export const featuresApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeaturesFlags: builder.query({
      query: () => "/api/features",
      providesTags: ["User"],
    }),
    getMarketingContent: builder.query({
      query: () => "/api/features/marketing",
      providesTags: ["User"],
    }),
  }),
});

export const { useGetFeaturesFlagsQuery, useGetMarketingContentQuery } =
  featuresApi;
