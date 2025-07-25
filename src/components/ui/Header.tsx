import React from "react";
import lovensTate from '../../assets/lovensTate.jpg';

interface HeaderProps {
    progress: number; // e.g. 0.25 for 25%
}

const Header: React.FC<HeaderProps> = ({ progress }) => {
    return (
      
      <header className="bg-white shadow-sm p-2">
        <div className="flex items-center justify-between">
          <img src={lovensTate} alt="Logo" className="h-25 filter hue-rotate-90 saturate-75 brightness-110" />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>
    );
};

export default Header;

