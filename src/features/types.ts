import { z } from "zod";

export interface AvailabilityResponse {
    available: boolean
    distance_km: string
    from: string
    to: string
}

export interface ServiceResponse {
    category_id: string,
    category_name: string,
    services: Service[];
}

interface Service {
    id: string, 
    category_id: string,
    description: string,
    name: string;
}

export interface Category {
    id: string,
    name: string,
    image_url: string,
    title: string,
    services: Service[];

}

export interface CategoriesResponse {
    categories: Category[];
}

export interface CategoryResponse {
    category: Category;
}

export interface BookingResponse {
    message: string
}


export interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
}

export const schema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?\d{7,15}$/, "Invalid phone number"),
  date: z.date({ required_error: "Date is required" }),
  images: z.array(z.any()).optional(),
  notes: z.string().optional(),
});

export type BookingFormData = z.infer<typeof schema>;