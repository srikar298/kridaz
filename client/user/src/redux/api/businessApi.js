import { baseApi } from "./baseApi";

export const businessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestUpgrade: builder.mutation({
      query: (formData) => ({
        url: "/api/user/auth/upgrade-request",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useRequestUpgradeMutation } = businessApi;
