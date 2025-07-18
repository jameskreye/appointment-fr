import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, { useState, useEffect, useCallback } from "react";
import { addMonths } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { submitBooking } from "../../availability/availabilityService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useBooking } from "../../../context/BookingContext";
import { Loader } from "@googlemaps/js-api-loader";
import debounce from "lodash.debounce";

const schema = z.object({
  fname: z.string().trim().min(1, "Please type your first name"),
  lname: z.string().nonempty("Please type your last name"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?[0-9]{7,15}$/, "Invalid phone number"),
  addressFrom: z.string().trim().min(1, "Address is required"),
  addressTo: z.string().trim().optional(),
  date: z.date({ required_error: "Date is required" }),
  images: z.array(z.any()).optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof schema>;

const BookingForm = () => {

  const navigate = useNavigate();
  const { bookingData, resetBooking } = useBooking();

  const [addressToError, setAddressToError] = useState<string | null>(null);

  const {
    register,
    control,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      images: [],
      addressFrom: "",
      addressTo: "",
    },
    mode: "onChange"
  });

  //const imageFiles = watch("images") || [];
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [suggestionsFrom, setSuggestionsFrom] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [suggestionsTo, setSuggestionsTo] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);

  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [placesLib, setPlacesLib] = useState<google.maps.PlacesLibrary | null>(
    null
  );
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    const loadPlacesLib = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_G_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      await loader.load();

      const lib = (await google.maps.importLibrary(
        "places"
      )) as google.maps.PlacesLibrary;
      setPlacesLib(lib);
      setSessionToken(new lib.AutocompleteSessionToken());
    };

    loadPlacesLib();
  }, []);
  
  
  useEffect(() => {
    if (bookingData.categoryId !== "PICKUP") {
      setValue("addressTo", "", { shouldValidate: false });
      setAddressToError(null);
    } else {
      setValue("addressTo", "", { shouldValidate: true });
    }
  }, [bookingData.categoryId, setValue]);

  const extractCityAndZip = (
    components: google.maps.places.AddressComponent[] = []
  ) => {
    let localCity = "";
    let localZip = "";
    for (const comp of components) {
      if (
        comp.types.includes("locality") ||
        comp.types.includes("administrative_area_level_3")
      ) {
        localCity = comp.longText;
      }
      if (comp.types.includes("postal_code")) {
        localZip = comp.longText;
      }
    }
    setCity(localCity);
    setZipCode(localZip);
  };

  const fetchSuggestions = useCallback(
    debounce(
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
      300
    ),
    [placesLib, sessionToken]
  );

  const handleSuggestionSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
    fieldName: "addressFrom" | "addressTo"
  ) => {
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["formattedAddress", "addressComponents"],
    });
    setValue(fieldName, place.formattedAddress || "", { shouldValidate: true });
    extractCityAndZip(place.addressComponents);
    if (fieldName === "addressFrom") setSuggestionsFrom([]);
    else setSuggestionsTo([]);
  };

  const mutation = useMutation({
    mutationFn: submitBooking,
    onSuccess: () => {
      toast.success("Booking confirmed!");
      reset();

      resetBooking();
      navigate("/thank-you");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length !== files.length) {
      alert("Only image files are allowed!");
      return;
    }

    setValue("images", validImages);
    const previews = validImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const onFormSubmit = (data: BookingFormData) => {
    // Check for addressTo when in PICKUP mode
    console.log("Form submitted with data:", data, "Category:", bookingData.categoryId);
    
    if (bookingData.categoryId === "PICKUP" && !data.addressTo?.trim()) {
      console.log("Validation failed: Delivery address required");
      setAddressToError("Delivery address is required");
      toast.error("Delivery address is required for pickup service");
      return;
    }
    
    // Clear any previous errors
    setAddressToError(null);
    
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("name", data.fname + " " + data.lname);

    if (bookingData.zipcode) formData.append("zipcode", bookingData.zipcode);
    if (bookingData.serviceId)
      formData.append("service", bookingData.serviceId);

    const appointmentDate = data.date.toISOString().split("T")[0]; // yyyy-mm-dd
    const appointmentTime = data.date.toTimeString().split(" ")[0]; // hh:mm:ss

    formData.append("appointment_date", appointmentDate);
    formData.append("appointment_time", appointmentTime);

    data?.images?.forEach((img) => formData.append("images", img));
    if (data.notes) formData.append("message", data.notes);

    formData.append("address_from", data.addressFrom);
    if (data.addressTo && bookingData.categoryId === "PICKUP") formData.append("address_to", data.addressTo);

    console.log("FormData values:", data);
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, value.name, value.size, value.type);
      } else {
        console.log(`${key}:`, value);
      }
    }

    mutation.mutate(formData);
  };

  // Validate form before submission
  const validateForm = async () => {
    // Check if the form is valid according to Zod schema
    const isFormValid = await trigger();
    
    // Additional validation for addressTo when in PICKUP mode
    if (bookingData.categoryId === "PICKUP" && !watch("addressTo")?.trim()) {
      setAddressToError("Delivery address is required");
      return false;
    }
    
    return isFormValid;
  };
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    
    if (isValid) {
      handleSubmit(onFormSubmit)(e);
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow"
    >
      <h2 className="text-2xl font-bold mb-6">Finalize your Booking</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">First name <span className="text-red-500">*</span></label>
          <input
            type="fname"
            placeholder="Enter your first name"
            {...register("fname" as const)}
            onBlur={(e) => setValue("fname", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.fname && (
            <p className="text-red-500 text-sm mt-1">{errors.fname.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Last name <span className="text-red-500">*</span></label>
          <input
            type="lname"
            placeholder="Enter your last name"
            {...register("lname" as const)}
            onBlur={(e) => setValue("lname", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.lname && (
            <p className="text-red-500 text-sm mt-1">{errors.lname.message}</p>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            placeholder="Enter your email"
            {...register("email" as const)}
            onBlur={(e) => setValue("email", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Phone Number <span className="text-red-500">*</span></label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            {...register("phone" as const)}
            onBlur={(e) => setValue("phone", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">{bookingData.categoryId === "PICKUP" ? "Pickup Address" : "Address"} <span className="text-red-500">*</span></label>
        <Controller
          name="addressFrom"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <input
                {...field}
                type="text"
                placeholder="Enter address"
                onChange={(e) => {
                  field.onChange(e);
                  fetchSuggestions(e.target.value, setSuggestionsFrom);
                }}
                className={`w-full p-3 border rounded-md ${
                  errors.addressFrom ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.addressFrom && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.addressFrom.message}
                </p>
              )}

              {suggestionsFrom.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full shadow-md max-h-60 overflow-auto">
                  {suggestionsFrom.map((s) => (
                    <li
                      key={s.placePrediction.placeId}
                      onClick={() => handleSuggestionSelect(s, "addressFrom")}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {s.placePrediction.text.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
      </div>

      {bookingData.categoryId === "PICKUP" && (  
      <div className="mb-4">
        <label className="block mb-1 font-medium">Delivery Address <span className="text-red-500">*</span></label>
        <Controller
          name="addressTo"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <input
                {...field}
                type="text"
                placeholder="Enter delivery address"
                onChange={(e) => {
                  field.onChange(e);
                  fetchSuggestions(e.target.value, setSuggestionsTo);
                  if (e.target.value.trim()) {
                    setAddressToError(null);
                  }
                }}
                className={`w-full p-3 border rounded-md ${
                  addressToError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {addressToError && (
                <p className="text-red-500 text-sm mt-1">
                  {addressToError}
                </p>
              )}

              {suggestionsTo.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full shadow-md max-h-60 overflow-auto">
                  {suggestionsTo.map((s) => (
                    <li
                      key={s.placePrediction.placeId}
                      onClick={() => handleSuggestionSelect(s, "addressTo")}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {s.placePrediction.text.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
      </div>
      )}  

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Preferred Date & Time <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePicker
                {...field}
                showTimeSelect
                selected={field.value}
                dateFormat="Pp"
                minDate={new Date()}
                maxDate={addMonths(new Date(), 6)}
                className="w-full p-3 border border-gray-300 rounded-md"
                autoComplete="off"
              />
            )}
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Upload Images
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full"
        />
        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {imagePreviews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt="Preview"
              className="rounded-lg shadow h-32 object-cover"
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Additional Notes</label>
        <textarea
          {...register("notes")}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
        disabled={mutation.status === "pending"}
      >
        {mutation.status === "pending" ? "Submitting..." : "Confirm Booking"}
      </button>
    </form>
  );
};

export default BookingForm;
