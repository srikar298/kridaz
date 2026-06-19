import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  turfs: [],
  loading: true,
  error: null,
  filters: {
    searchTerm: "",
    sport: "",
    state: "",
    city: "",
    onlyAvailable: false,
    onlyFavorites: false,
    timingMorning: false,
    timingAfternoon: false,
    timingEvening: false,
    timingLateNight: false,
    minRating: 0.0,
    maxRating: 5.0,
  },
};

const turfSlice = createSlice({
  name: "turf",
  initialState,
  reducers: {
    setTurfs: (state, action) => {
      state.turfs = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const { setTurfs, setLoading, setError, setFilters, resetFilters } =
  turfSlice.actions;
export default turfSlice.reducer;
