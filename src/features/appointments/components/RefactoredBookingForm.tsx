import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { FormField } from "../../../components/FormField";
import { AddressField } from "../../../components/AddressField";
import {
  loadPlacesAPI,
  extractAddressComponents,
  createDebouncedSuggestionsFetcher,
} from "../../../utils/addressUtils";

import BackButton from "../../../components/ui/BackButton";
import { Calendar, Upload, X } from "lucide-react";

// Form schema
const schema = z.object({
  fname: z.string().trim().min(1, "First name is required"),
  lname: z.string().nonempty("Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?[0-9]{7,15}$/, "Invalid phone number"),
  addressFrom: z.string().trim().min(1, "Address is required"),
  addressTo: z.string().trim().optional(),
  receiverName: z.string().trim().min(1, "Receiver name is required"),
  receiverPhone: z.string().regex(/^[+]?[0-9]{7,15}$/, "Invalid phone number"),
  date: z.date({ required_error: "Date is required" }),
  images: z.array(z.any()).optional(),
  notes: z.string().optional(),
});

interface bookingFormProps {
  onBackToServices: () => void;
}

type BookingFormData = z.infer<typeof schema>;

const BookingForm = ({ onBackToServices }: bookingFormProps) => {
  const navigate = useNavigate();
  const { bookingData, resetBooking } = useBooking();
  const [addressToError, setAddressToError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  // Google Maps states
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

  // Form setup
  const {
    register,
    control,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      images: [],
      addressFrom: "",
      addressTo: "",
    },
    mode: "onChange",
  });

  // Load Google Maps Places API
  useEffect(() => {
    const initPlaces = async () => {
      const { placesLib: lib, sessionToken: token } = await loadPlacesAPI(
        import.meta.env.VITE_G_API_KEY
      );
      setPlacesLib(lib);
      setSessionToken(token);
    };

    initPlaces();
  }, []);

  // Handle addressTo field validation based on category
  useEffect(() => {
    if (bookingData.categoryId !== "PICKUP") {
      setValue("addressTo", "", { shouldValidate: false });
      setAddressToError(null);
    } else {
      setValue("addressTo", "", { shouldValidate: true });
    }
  }, [bookingData.categoryId, setValue]);

  // Create debounced suggestions fetcher
  const fetchSuggestions = useCallback(
    createDebouncedSuggestionsFetcher(placesLib, sessionToken),
    [placesLib, sessionToken]
  );

  // Handle suggestion selection
  const handleSuggestionSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
    fieldName: "addressFrom" | "addressTo"
  ) => {
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["formattedAddress", "addressComponents"],
    });
    setValue(fieldName, place.formattedAddress || "", { shouldValidate: true });

    const { city: extractedCity, zipCode: extractedZip } =
      extractAddressComponents(place.addressComponents);
    setCity(extractedCity);
    setZipCode(extractedZip);

    if (fieldName === "addressFrom") setSuggestionsFrom([]);
    else {
      setSuggestionsTo([]);
      setAddressToError(null);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    setImageError(null);
    
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setImageError("Only PNG, JPG, JPEG, and GIF files are allowed");
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setImageError("Files must be smaller than 10MB");
      return;
    }

    const currentImages = watch("images") || [];
    const newImages = [...currentImages, ...files];
    setValue("images", newImages);
    
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Form submission
  const onFormSubmit = (data: BookingFormData) => {
    // Check for addressTo when in PICKUP mode
    if (bookingData.categoryId === "PICKUP" && !data.addressTo?.trim()) {
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
    if (data.addressTo && bookingData.categoryId === "PICKUP")
      formData.append("address_to", data.addressTo);

    mutation.mutate(formData);
  };

  // Mutation setup
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

  // Validate form before submission
  const validateForm = async () => {
    const isFormValid = await trigger();

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
    <div className="max-w-3xl mx-auto px-6 mt-3 mb-8">
      <BackButton onClick={onBackToServices} />

      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded-xl shadow"
      >
        <h2 className="text-2xl font-bold mb-6">Finalize your Booking</h2>

        {bookingData.categoryId === "PICKUP" ? (
          <>
            {/* Sender Information */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Pickup Information</h3>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="fname"
                  label="First name"
                  placeholder="Enter your first name"
                  required
                  register={register}
                  error={errors.fname?.message}
                  onBlur={(e) => setValue("fname", e.target.value.trim())}
                />
                <FormField
                  name="lname"
                  label="Last name"
                  placeholder="Enter your last name"
                  required
                  register={register}
                  error={errors.lname?.message}
                  onBlur={(e) => setValue("lname", e.target.value.trim())}
                />
              </div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  register={register}
                  error={errors.email?.message}
                  onBlur={(e) => setValue("email", e.target.value.trim())}
                />
                <FormField
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone number"
                  required
                  register={register}
                  error={errors.phone?.message}
                  onBlur={(e) => setValue("phone", e.target.value.trim())}
                />
              </div>
              <AddressField
                name="addressFrom"
                label="Pickup Address"
                placeholder="Enter pickup address"
                required
                control={control}
                error={errors.addressFrom?.message}
                onChange={(e) => fetchSuggestions(e.target.value, setSuggestionsFrom)}
                suggestions={suggestionsFrom}
                onSuggestionSelect={(s) => handleSuggestionSelect(s, "addressFrom")}
              />
            </div>

            {/* Receiver Information */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Delivery Information</h3>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="receiverName"
                  label="Receiver Full Name"
                  placeholder="Enter receiver full name"
                  required
                  register={register}
                  error={errors.receiverName?.message}
                  onBlur={(e) => setValue("receiverName", e.target.value.trim())}
                />
                <FormField
                  name="receiverPhone"
                  label="Receiver Phone Number"
                  type="tel"
                  placeholder="Enter receiver phone number"
                  required
                  register={register}
                  error={errors.receiverPhone?.message}
                  onBlur={(e) => setValue("receiverPhone", e.target.value.trim())}
                />
              </div>
              <AddressField
                name="addressTo"
                label="Delivery Address"
                placeholder="Enter delivery address"
                required
                control={control}
                error={addressToError}
                onChange={(e) => {
                  fetchSuggestions(e.target.value, setSuggestionsTo);
                  if (e.target.value.trim()) {
                    setAddressToError(null);
                  }
                }}
                suggestions={suggestionsTo}
                onSuggestionSelect={(s) => handleSuggestionSelect(s, "addressTo")}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="fname"
                label="First name"
                placeholder="Enter your first name"
                required
                register={register}
                error={errors.fname?.message}
                onBlur={(e) => setValue("fname", e.target.value.trim())}
              />
              <FormField
                name="lname"
                label="Last name"
                placeholder="Enter your last name"
                required
                register={register}
                error={errors.lname?.message}
                onBlur={(e) => setValue("lname", e.target.value.trim())}
              />
            </div>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                required
                register={register}
                error={errors.email?.message}
                onBlur={(e) => setValue("email", e.target.value.trim())}
              />
              <FormField
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                required
                register={register}
                error={errors.phone?.message}
                onBlur={(e) => setValue("phone", e.target.value.trim())}
              />
            </div>
            <AddressField
              name="addressFrom"
              label="Address"
              placeholder="Enter address"
              required
              control={control}
              error={errors.addressFrom?.message}
              onChange={(e) => fetchSuggestions(e.target.value, setSuggestionsFrom)}
              suggestions={suggestionsFrom}
              onSuggestionSelect={(s) => handleSuggestionSelect(s, "addressFrom")}
            />
          </>
        )}

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="flex items-center mb-1 font-medium">
            
              Preferred Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DatePicker
                selected={watch("date")}
                onChange={(date) => setValue("date", date as Date)}
                showTimeSelect
                dateFormat="Pp"
                minDate={new Date()}
                maxDate={addMonths(new Date(), 6)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-md"
                autoComplete="off"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center mb-1 font-medium">
            <Upload className="mr-2" size={16} />
            Upload Images (optional)
          </label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
          {errors.images && (
            <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
          )}
          {imageError && (
            <p className="text-red-500 text-sm mt-1">{imageError}</p>
          )}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={src}
                    alt="Preview"
                    className="rounded-lg shadow h-32 w-full object-contain bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newPreviews = imagePreviews.filter((_, i) => i !== idx);
                      setImagePreviews(newPreviews);
                      const currentImages = watch("images") || [];
                      const newImages = currentImages.filter((_, i) => i !== idx);
                      setValue("images", newImages);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default BookingForm;
