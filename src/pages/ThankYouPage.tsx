import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { resetBooking } = useBooking();
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      resetBooking();
      localStorage.clear();
      navigate("/");
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate, resetBooking]);

  return (
    <div className="max-w-xl mx-auto mt-20 text-center bg-white p-8 rounded shadow">
      <h1 className="text-3xl font-bold text-green-700 mb-4">🎉 Booking Confirmed</h1>
      <p className="text-gray-700 text-lg">
        Your appointment has been successfully booked.
      </p>
      <p className="text-gray-500 mt-4">
        You will be redirected in <span className="font-semibold">{secondsLeft}</span> seconds...
      </p>

      <button
        onClick={() => {
          resetBooking();
          localStorage.clear();
          navigate("/");
        }}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Start New Booking Now
      </button>
    </div>
  );
};

export default ThankYouPage;
