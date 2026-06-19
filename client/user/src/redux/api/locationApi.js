import { baseApi } from "./baseApi";

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStatesList: builder.query({
      query: () => "/api/location/states",
      transformResponse: (response) => response.states || [],
      providesTags: ["User"],
    }),
    getCitiesList: builder.query({
      query: (stateName) => `/api/location/cities?state=${stateName}`,
      transformResponse: (response) => response.cities || [],
      providesTags: ["User"],
    }),
    reverseGeocode: builder.query({
      query: ({ lat, lng }) =>
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetStatesListQuery,
  useGetCitiesListQuery,
  useReverseGeocodeQuery,
} = locationApi;
