import axioClient from "../../api/axioClient";
import type { AvailabilityResponse, CategoriesResponse, CategoryResponse, BookingResponse  } from "../types";

export async function checkAvailability(zipcode:string): Promise<AvailabilityResponse> {
    const response = await axioClient.get<AvailabilityResponse>(`/availability?zipcode=${zipcode}`);
    return response.data;
    
}

export async function getServiceByCategory(category:string | null): Promise<CategoryResponse> {
    const response = await axioClient.get<CategoryResponse>(`/services/category?category=${category}`);
    return response.data;
}

export async function getAllCategories(): Promise<CategoriesResponse> {
    const response = await axioClient.get<CategoriesResponse>(`/services/categories`);
    return response.data;
}

export const submitBooking = async (formData: FormData): Promise<BookingResponse> => {
  const response = await axioClient.post("/appointments", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

