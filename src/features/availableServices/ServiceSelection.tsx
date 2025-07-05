
import { useState, useEffect } from "react";
import type { Category, CategoriesResponse } from "../types";
import { getAllCategories } from "../availability/availabilityService";

interface ServiceSelectionProps {
  onNext: () => void;
  onSelectCategory: (id: string) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ServiceSelection = ({
  onNext,
  onSelectCategory,
}: ServiceSelectionProps) => {
  
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch service", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, []);

   const handleSelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    onNext();
  };

  if (loading) return <p>Loading service...</p>;

   return (
    <div className="min-h-screen bg-[#f9f6f2] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center">
          What type of service do you need?
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Choose a service category to get started.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories?.categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition cursor-pointer flex flex-col items-center text-center"
              onClick={() => handleSelect(category.id)}
            >
              <img
                src={`${API_BASE_URL}/static/${category.image_url}`}
                alt={category.title}
                className="h-28 w-28 object-contain mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.services.length} services available</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;
