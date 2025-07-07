import { useMutation } from "@tanstack/react-query";
import { submitBooking } from "../features/availability/availabilityService"


export const useSubmitBooking = () => {
  return useMutation({
    mutationFn: submitBooking,
  });
};
