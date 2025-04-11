"use client"
import React, { ReactNode } from "react";

interface HeadlineBoxProps {
  children: ReactNode;
}

const HeadlineBox: React.FC<HeadlineBoxProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-r-4xl px-8 py-6 border-y border-r border-[var(--color-border)]">
      {children}
    </div>
  );
};

export default HeadlineBox; 