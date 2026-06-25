import axios from "axios";

const BASE_URL = "https://countriesnow.space/api/v0.1/countries";

export const fetchCountryCodes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/codes`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching country codes:", error);
    return [];
  }
};

export const fetchStates = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/states`, {
      country: "India",
    });
    return response.data.data.states.map((s) => s.name);
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
};

export const fetchCities = async (state) => {
  try {
    const response = await axios.post(`${BASE_URL}/state/cities`, {
      country: "India",
      state: state,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching cities for ${state}:`, error);
    return [];
  }
};

export const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 5,
          countrycodes: "in",
        },
      }
    );
    return response.data.map((item) => ({
      display_name: item.display_name,
      address: item.address,
      city:
        item.address.city ||
        item.address.town ||
        item.address.village ||
        item.address.suburb ||
        "",
      state: item.address.state || "",
      country: item.address.country || "India",
      postcode: item.address.postcode || "",
      suburb: item.address.suburb || item.address.neighbourhood || "",
      road: item.address.road || "",
      lat: item.lat,
      lon: item.lon,
    }));
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
};

export const formatLocation = (suggestion) => {
  if (!suggestion) return "";
  
  if (typeof suggestion === "string") {
    return suggestion;
  }

  const addr = suggestion.address || {};
  
  // Find a generalized city/district candidate
  const city = addr.city || 
               addr.town || 
               addr.village || 
               addr.municipality || 
               addr.district ||
               addr.county || 
               addr.state_district || 
               "";
               
  const state = addr.state || suggestion.state || "";
  const country = addr.country || suggestion.country || "India";
  
  if (city && state) {
    return `${city}, ${state}, ${country}`;
  }
  
  if (suggestion.display_name) {
    const parts = suggestion.display_name.split(",").map(p => p.trim());
    const filteredParts = parts.filter(p => !/^\d{5,6}$/.test(p));
    
    if (filteredParts.length >= 3) {
      const countryPart = filteredParts[filteredParts.length - 1];
      const statePart = filteredParts[filteredParts.length - 2];
      const cityPart = filteredParts[filteredParts.length - 3];
      return `${cityPart}, ${statePart}, ${countryPart}`;
    } else {
      return filteredParts.join(", ");
    }
  }
  
  return [city, state, country].filter(Boolean).join(", ");
};

export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat,
          lon,
          format: "json",
          addressdetails: 1,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};
export const extractLocationFromGoogleMapsUrl = (url) => {
  if (!url) return null;

  // Match @lat,lng format
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = url.match(regex);
  if (match) {
    return { lat: match[1], lon: match[2] };
  }

  // Match q=lat,lng format
  const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const qMatch = url.match(qRegex);
  if (qMatch) {
    return { lat: qMatch[1], lon: qMatch[2] };
  }

  // Match query=lat,lng format
  const queryRegex = /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const queryMatch = url.match(queryRegex);
  if (queryMatch) {
    return { lat: queryMatch[1], lon: queryMatch[2] };
  }

  return null;
};
