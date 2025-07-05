import { useForm, Controller } from "react-hook-form";
import type {ControllerRenderProps} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";
import { addMonths } from "date-fns";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?\d{7,15}$/, "Invalid phone number"),
  date: z.date({ required_error: "Date is required" }),
  images: z.array(z.any()).optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof schema>;

const BookingForm = ({ onSubmit }: { onSubmit: (data: BookingFormData) => void }) => {
  const {
    register,
    control,
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

  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow"
    >
      <h2 className="text-2xl font-bold mb-6">Finalize your Booking</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            {...register("email")}
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
            {...register("phone")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Preferred Date & Time</label>
        <Controller
          control={control}
          name="date"
          render={({
            field,
          }: {
            field: ControllerRenderProps<BookingFormData, "date">;
          }) => (
            <DatePicker
              {...field}
              showTimeSelect
              selected={field.value}
              dateFormat="Pp"
              minDate={new Date()}
              maxDate={addMonths(new Date(), 6)}
              className="w-full p-3 border border-gray-300 rounded-md"
              calendarClassName="rounded-lg shadow-lg border border-gray-200"
            />
          )}
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
        )}
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
      >
        Confirm Booking
      </button>
    </form>
  );
};

export default BookingForm;
