import { Loader } from "@googlemaps/js-api-loader";
import debounce from "lodash.debounce";

// Load Google Maps Places API
export const loadPlacesAPI = async (apiKey: string) => {
  const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places"],
  });

  await loader.load();
  const lib = (await google.maps.importLibrary(
    "places"
  )) as google.maps.PlacesLibrary;
  
  return {
    placesLib: lib,
    sessionToken: new lib.AutocompleteSessionToken(),
  };
};

// Extract city and zip code from address components
export const extractAddressComponents = (
  components: google.maps.places.AddressComponent[] = []
) => {
  let city = "";
  let zipCode = "";
  
  for (const comp of components) {
    if (
      comp.types.includes("locality") ||
      comp.types.includes("administrative_area_level_3")
    ) {
      city = comp.longText;
    }
    if (comp.types.includes("postal_code")) {
      zipCode = comp.longText;
    }
  }
  
  return { city, zipCode };
};

// Create a debounced function for fetching suggestions
export const createDebouncedSuggestionsFetcher = (
  placesLib: google.maps.PlacesLibrary | null,
  sessionToken: google.maps.places.AutocompleteSessionToken | null,
  delay = 300
) => {
  return debounce(
    async (
      inputVal: string,
      setSuggestions: React.Dispatch<
        React.SetStateAction<google.maps.places.AutocompleteSuggestion[]>
      >
    ) => {
      if (!placesLib || !sessionToken || !inputVal.trim()) {
        setSuggestions([]);
        return;
      }
      
      const { suggestions } =
        await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: inputVal,
          sessionToken,
          includedRegionCodes: ["US"],
        });
        
      setSuggestions(suggestions);
    },
    delay
  );
};