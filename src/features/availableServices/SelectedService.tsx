import { useState, useEffect } from "react";
import type { CategoryResponse } from "../types";
import { getServiceByCategory } from "../availability/availabilityService";
import { ArrowLeft } from "lucide-react";

interface SelectedServiceProps {
    onNext: () => void;
    onBack: () => void;
    category_id : string | null;
    onSelectedService: (id: string | null) => void;
}

  const SelectedService = ({ onNext, onBack, category_id, onSelectedService }: SelectedServiceProps) => {
    const [service, setService] = useState<CategoryResponse | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchService = async () => {
        try {
          const data = await getServiceByCategory(category_id);
          setService(data);
        } catch (error) {
          console.error("Failed to fetch service", error);
        } finally {
          setLoading(false);
        }
      };

      if (category_id) fetchService();
    }, [category_id]);

    const handleServiceSelect = (id: string) => {
      setSelectedServiceId(id);
      
    };

    const handleSelectedService = () => {
      onSelectedService(selectedServiceId);
      onNext()
    }

    if (loading || !service) return <p className="text-center mt-10">Loading...</p>;

    return (
      <div className="min-h-screen bg-[#f9f6f2] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-green-700 font-medium mb-6 hover:underline"
          >
            <ArrowLeft className="mr-2" size={18} />
            Back to services
          </button>

          <h3 className="text-3xl font-bold mb-2 text-center">
            What type of {service?.category.title} service are you interested in?
          </h3>

          <div className="space-y-4 mt-6">
            {service?.category.services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`cursor-pointer border-2 rounded-xl p-5 transition-all ${
                  selectedServiceId === service.id
                    ? "border-green-800 bg-white"
                    : "border-gray-300 bg-white hover:border-green-600"
                }`}
              >
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handleSelectedService}
            disabled={!selectedServiceId}
            className={`mt-8 w-full bg-green-700 text-white font-semibold py-3 px-6 rounded-full transition ${
              selectedServiceId
                ? "hover:bg-green-800"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };
  
  export default SelectedService;