import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";
import { addMonths } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { submitBooking } from "../../availability/availabilityService"
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useBooking } from "../../../context/BookingContext";
import AddressAutocomplete from "./AddressAutocomplete";

const usStates = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const schema = z.object({
  fname: z.string().trim().min(1, "Please type your first name"),
  lname: z.string().nonempty("Please type your last name"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?[0-9]{7,15}$/, "Invalid phone number"),
  date: z.date({ required_error: "Date is required" }),
  images: z.array(z.any()).optional(),
  notes: z.string().optional(),
  street: z.string().nonempty("Street address is required"),
  city: z.string().nonempty("City is required"),
  state: z.string().refine((val) => usStates.includes(val.toUpperCase()), {
  message: "Invalid U.S. state abbreviation",
}),
zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
});

type BookingFormData = z.infer<typeof schema>;

const BookingForm = () => {
  const navigate = useNavigate();
  const { bookingData, resetBooking } = useBooking();

  const {
    register,
    control,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      images: [],
    },
  });

  //const imageFiles = watch("images") || [];
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("name", data.fname + " " + data.lname)

    if (bookingData.zipcode) formData.append("zipcode", bookingData.zipcode);
    if (bookingData.serviceId) formData.append("service", bookingData.serviceId);

    const appointmentDate = data.date.toISOString().split("T")[0]; // yyyy-mm-dd
    const appointmentTime = data.date.toTimeString().split(" ")[0]; // hh:mm:ss

    formData.append("appointment_date", appointmentDate);
    formData.append("appointment_time", appointmentTime);

    data?.images?.forEach((img) => formData.append("images", img));
    if (data.notes) formData.append("message", data.notes);

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

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow"
    >
      <h2 className="text-2xl font-bold mb-6">Finalize your Booking</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">First name</label>
          <input
            type="fname"
            {...register("fname" as const)}
            onBlur={(e) => setValue("fname", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.fname && (
            <p className="text-red-500 text-sm mt-1">{errors.fname.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Last name</label>
          <input
            type="lname"
            {...register("lname" as const)}
            onBlur={(e) => setValue("lname", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.lname && (
            <p className="text-red-500 text-sm mt-1">{errors.lname.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="font-medium block mb-1">Address</label>
        <AddressAutocomplete
          onPlaceSelected={({ street, city, state, zip }) => {
            setValue("street", street, { shouldValidate: true });
            setValue("city", city, { shouldValidate: true });
            setValue("state", state, { shouldValidate: true });
            setValue("zip", zip, { shouldValidate: true });
          }}
        />
        {/* Hidden fields */}
        <input type="hidden" {...register("street")} />
        <input type="hidden" {...register("city")} />
        <input type="hidden" {...register("state")} />
        <input type="hidden" {...register("zip")} />
        {(errors.street || errors.city || errors.state || errors.zip) && (
          <p className="text-red-500 text-sm mt-1">
            {errors.street?.message ||
              errors.city?.message ||
              errors.state?.message ||
              errors.zip?.message}
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            {...register("email" as const)}
            onBlur={(e) => setValue("email", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Phone Number</label>
          <input
            type="tel"
            {...register("phone" as const)}
            onBlur={(e) => setValue("phone", e.target.value.trim())}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Preferred Date & Time
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
          Upload Images (optional)
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
