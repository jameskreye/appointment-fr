import { Route, Routes } from 'react-router-dom';
import MainFlow from './pages/MainFlow';
import EmailFallbackForm from './pages/EmailFallbackForm';
import ThankYouPage from './pages/ThankYouPage';
import { BookingProvider } from './context/BookingContext';

function App() {
  return (
    <Routes>
      <Route path='/' element={<BookingProvider><MainFlow/></BookingProvider>}/>
      <Route path="/unavailable" element={<EmailFallbackForm />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
    </Routes>
  );
}

export default App