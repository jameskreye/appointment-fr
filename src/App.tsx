import { Route, Routes } from 'react-router-dom';
import MainFlow from './pages/MainFlow';
import EmailFallbackForm from './pages/EmailFallbackForm';
import ThankYouPage from './pages/ThankYouPage';
import { BookingProvider } from './context/BookingContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<MainFlow />} />
          <Route path="/unavailable" element={<EmailFallbackForm />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </BookingProvider>
    </QueryClientProvider>
  );
}

export default App