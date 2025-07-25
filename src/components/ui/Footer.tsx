import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>&copy; 2024 LovensState. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-green-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-green-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-green-600 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;