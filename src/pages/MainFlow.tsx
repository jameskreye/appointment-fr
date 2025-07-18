import { useEffect, useState } from "react";
import Header from "../components/ui/Header";
import ZipCodeForm from "../features/availability/components/ZipCodeForm";
import EmailFallbackForm from "./EmailFallbackForm";
import ServiceSelection from "../features/availableServices/ServiceSelection";
import SelectedService from "../features/availableServices/SelectedService";
import BookingForm from "../features/appointments/components/BookingForm";
import { useBooking } from "../context/BookingContext";

const MainFlow = () => {

  const { updateBooking } = useBooking();
 

  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem("step");
    return saved ? parseInt(saved) : 1;
  });

  const [isAvailable, setIsAvailable] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  useEffect(() => {
    localStorage.setItem("step", step.toString());
  }, [step, selectedCategoryId]);


  const handleZipSubmit = (available: boolean, zipcode: string) => {
    setIsAvailable(available);
    updateBooking({zipcode})
    setStep(available ? 2 : 99); // 99 = unavailable page
  };

  const back = () => setStep((prev) => prev - 1);
  const next = () => setStep((prev) => prev + 1);
  const progress = step === 99 ? 1 : step / 5;

  const handleSelectedService = (serviceId: string | null) => {
    const categoryId = selectedCategoryId === import.meta.env.VITE_CATEGORY_TYPE ? 'PICKUP': 'OTHER'
    updateBooking({serviceId, categoryId})
  }

  return (
    <div>
      <Header progress={progress} />

      {step === 1 && <ZipCodeForm onSubmit={handleZipSubmit} />}
      {step === 2 && (
        <ServiceSelection
          onNext={next}
          onSelectCategory={(id) => setSelectedCategoryId(id)}
        />
      )}
       {step === 3 && selectedCategoryId && (
        <SelectedService onNext={next} onBack={back} category_id={selectedCategoryId} 
        onSelectedService={handleSelectedService}
        />
      )}
      {step === 4 && <BookingForm />}
      {step === 99 && <EmailFallbackForm />}
    </div>
  );
};

export default MainFlow;
