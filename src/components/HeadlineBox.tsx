"use client"
import React, { ReactNode } from "react";

interface HeadlineBoxProps {
  children: ReactNode;
}

const HeadlineBox: React.FC<HeadlineBoxProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-r-2xl px-4 py-4 text-gray-800 font-medium mr-2">
      <h4>
        {children}
      </h4>
    </div>
  );
};

export default HeadlineBox; 