import { useState } from "react";
import { checkAvailability } from "../availabilityService";
import type { AvailabilityResponse  } from "../../types";

interface ZipCodeFormProps {
  onSubmit?: (available: boolean, zipcode: string) => void;
}

const ZipCodeForm = ({onSubmit}: ZipCodeFormProps) => {

    const [zipcode, setZipCode] = useState("");
    const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
    const [error, setError] = useState<string | null>(null);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try{
            const data = await checkAvailability(zipcode);
            setAvailability(data);
            if (onSubmit) {
              onSubmit(data.available, zipcode);
            }
        } catch(err) {
            console.error("Error checking availability:", err);
            setError("Failed to check availability.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Check Service Availability</h1>
    
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                value={zipcode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP code"
                className="w-full sm:w-2/3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="submit"
                className="w-full sm:w-1/3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition duration-200"
              >
                Search
              </button>
            </form>
    
            {availability && (
              <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-800">
                <p><strong>Available:</strong> {availability.available ? "Yes" : "No"}</p>
                <p><strong>From:</strong> {availability.from}</p>
                <p><strong>To:</strong> {availability.to}</p>
                <p><strong>Distance:</strong> {availability.distance_km} km</p>
              </div>
            )}
    
            {error && <p className="mt-4 text-red-500">{error}</p>}
          </div>
        </div>
    );
};


export default ZipCodeForm;