import React from "react";
import lovensTate from '../../assets/lovensTate.jpg';

interface HeaderProps {
    progress: number; // e.g. 0.25 for 25%
}

const Header: React.FC<HeaderProps> = ({ progress }) => {
    return (
      
      <header className="bg-white shadow-sm p-2">
        <div className="flex items-center justify-between">
          <img src={lovensTate} alt="Logo" className="h-25" />
        </div>
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-black transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>
    );
};

export default Header;

