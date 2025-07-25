import { ArrowLeft } from "lucide-react";

interface backButtonProps {
  onClick: () => void;
}

const BackButton = ({ onClick }: backButtonProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        className="flex items-center px-4 py-2 text-green-700 bg-green-50 
        border border-green-200 rounded-lg font-medium mb-6 hover:bg-green-100
         hover:border-green-300 transition-colors duration-200"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back to services
      </button>
    </div>
  );
};

export default BackButton;
