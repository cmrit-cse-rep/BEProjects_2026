import type { Libraries } from "@react-google-maps/api";

/**
 * Shared Google Maps API libraries configuration.
 * 
 * IMPORTANT: All components using Google Maps must use this exact array.
 * The Google Maps loader does not allow different library configurations.
 * 
 * Libraries included:
 * - 'places': For Places Autocomplete functionality
 * - 'marker': For AdvancedMarkerElement (new marker API)
 */
export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places", "marker"];

