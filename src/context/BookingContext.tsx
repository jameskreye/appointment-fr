import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface BookingData {
  name: string;
  email: string;
  phone: string;
  zipcode: string;
  notes?: string;
  images?: File[];
  date: Date | null;
  serviceId: string | null;
  categoryId: string | null; 
}

const defaultBookingData: BookingData = {
  name: "",
  email: "",
  phone: "",
  zipcode: "",
  notes: "",
  images: [],
  date: null,
  serviceId: "",
  categoryId: ""
};

interface BookingContextType {
  bookingData: BookingData;
  updateBooking: (updates: Partial<BookingData>) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
};

export const BookingProvider = ({ children }: {children: ReactNode}) => {
    const [bookingData, setData] = useState<BookingData>(defaultBookingData);

    const updateBooking = (updates: Partial<BookingData>) => {
        setData((prev) => ({...prev, ...updates}));
    }

    const resetBooking = () => setData(defaultBookingData);

    return (
        <BookingContext.Provider value={{bookingData, updateBooking, resetBooking}}>
            {children}
        </BookingContext.Provider>
    );
};

