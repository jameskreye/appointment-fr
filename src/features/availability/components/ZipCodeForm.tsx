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
    const [loading, setLoading] = useState(false);
    const [zipError, setZipError] = useState<string | null>(null);


    const validateZipCode = (zip: string) => {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zip.trim()) {
            setZipError("ZIP code is required");
            return false;
        }
        if (!zipRegex.test(zip)) {
            setZipError("Please enter a valid ZIP code (e.g., 12345)");
            return false;
        }
        setZipError(null);
        return true;
    };

    const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setZipCode(value);
        if (value && zipError) {
            validateZipCode(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!validateZipCode(zipcode)) return;
        
        setLoading(true);
        try{
            const data = await checkAvailability(zipcode);
            setAvailability(data);
            if (onSubmit) {
              onSubmit(data.available, zipcode);
            }
        } catch(err) {
            console.error("Error checking availability:", err);
            setError("Failed to check availability. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 sm:p-10">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-800">Professional Services at Your Doorstep</h1>
              <p className="text-gray-600 text-lg mb-2">Quick, reliable, and trusted by thousands</p>
              <p className="text-sm text-gray-500">Enter your ZIP code to see if we service your area</p>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center items-center gap-6 mb-8 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>500+ Locations</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Same Day Service</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Licensed & Insured</span>
              </div>
            </div>
    
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={zipcode}
                  onChange={handleZipChange}
                  placeholder="Enter your ZIP code (e.g., 12345)"
                  className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-2 text-base text-center ${zipError ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-green-400'}`}
                  disabled={loading}
                />
                {zipError && <p className="mt-2 text-red-500 text-sm text-center">{zipError}</p>}
              </div>
              
              <button
                type="submit"
                disabled={loading || !!zipError}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Checking...
                  </>
                ) : (
                  'Check Availability'
                )}
              </button>
            </form>
    
            {availability && (
              <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-800">
                <div className="text-center mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${availability.available ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {availability.available ? '✓ Service Available' : '✗ Not Available'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <p><strong>From:</strong> {availability.from}</p>
                  <p><strong>To:</strong> {availability.to}</p>
                  <p><strong>Distance:</strong> {availability.distance_km} km</p>
                </div>
              </div>
            )}
    
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-center">
                {error}
              </div>
            )}
          </div>
        </div>
    );
};


export default ZipCodeForm;