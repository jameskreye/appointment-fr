import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface AddressAutocompleteProps {
  onPlaceSelected: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
}

const AddressAutocomplete = ({ onPlaceSelected }: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create a single loader instance to prevent multiple loads
  const loader = useRef(
    new Loader({
      apiKey: import.meta.env.G_API_KEY,
      version: "weekly",
      libraries: ["places"],
    })
  );

  useEffect(() => {
    // Check if Google Maps is already loaded to avoid duplicate loading
    if (window.google?.maps?.places) {
      initializeAutocomplete();
      return;
    }

    loader.current
      .load()
      .then(async () => {
        await google.maps.importLibrary("places");
        initializeAutocomplete();
      })
      .catch((err) => {
        setError("Failed to load address autocomplete. Please try again.");
        console.error("Error loading Google Maps API:", err);
      });

    function initializeAutocomplete() {
      if (inputRef.current && !autocompleteRef.current) {
        // Create the PlaceAutocompleteElement
        autocompleteRef.current = document.createElement(
          "gmp-place-autocomplete"
        ) as google.maps.places.PlaceAutocompleteElement;
        autocompleteRef.current.setAttribute("placeholder", "Enter your address");
        // Restrict to US addresses
        autocompleteRef.current.setAttribute("component-restrictions", JSON.stringify({ country: "us" }));

        // Replace the input with the web component
        const container = document.createElement("div");
        inputRef.current.parentNode?.replaceChild(container, inputRef.current);
        container.appendChild(autocompleteRef.current);

        // Add an input element for user typing
        const input = document.createElement("input");
        input.type = "text";
        input.className = "w-full p-3 border border-gray-300 rounded-md";
        input.placeholder = "Enter your address";
        autocompleteRef.current.appendChild(input);

        // Listen for place selection
        autocompleteRef.current.addEventListener("gmp-place-changed", () => {
          const place = autocompleteRef.current?.place;
          if (!place || !place.address_components) {
            console.warn("No valid place selected");
            return;
          }

          let street = "";
          let city = "";
          let state = "";
          let zip = "";

          // Parse address components
          place.address_components.forEach((component) => {
            const types = component.types;
            if (types.includes("street_number")) {
              street = component.long_name;
            }
            if (types.includes("route")) {
              street = street ? `${street} ${component.long_name}` : component.long_name;
            }
            if (types.includes("locality")) {
              city = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (types.includes("postal_code")) {
              zip = component.long_name;
            }
          });

          // Filter for addresses only (since types attribute is not supported)
          if (place.types.includes("street_address") || place.types.includes("premise")) {
            if (street && city && state && zip) {
              onPlaceSelected({ street, city, state, zip });
            } else {
              console.warn("Incomplete address selected:", { street, city, state, zip });
            }
          } else {
            console.warn("Selected place is not a valid address:", place.types);
          }
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current.removeEventListener("gmp-place-changed", () => {});
        autocompleteRef.current = null;
      }
    };
  }, [onPlaceSelected]);

  return (
    <div className="mb-4">
      <input ref={inputRef} type="text" className="w-full p-3 border border-gray-300 rounded-md" />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default AddressAutocomplete;