"use client"
import React, { createContext, useContext, useState, ReactNode } from "react";

// Types for the context
type AccordionContextType = {
  openAccordionId: string | null;
  openAccordion: (id: string) => void;
  closeAccordion: () => void;
  isAccordionOpen: (id: string) => boolean;
};

// Create the context
const AccordionContext = createContext<AccordionContextType>({
  openAccordionId: null,
  openAccordion: () => {},
  closeAccordion: () => {},
  isAccordionOpen: () => false,
});

// Hook to use the accordion context
export const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an AccordionProvider');
  }
  return context;
};

// Provider component props
interface AccordionProviderProps {
  children: ReactNode;
  type?: string; // Optional type to group accordions
}

// Provider component
export const AccordionProvider: React.FC<AccordionProviderProps> = ({
  children,
  type = "default"
}) => {
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  const openAccordion = (id: string) => {
    // If the same accordion is clicked, close it
    if (openAccordionId === id) {
      setOpenAccordionId(null);
    } else {
      // Otherwise, close any open accordion and open the new one
      setOpenAccordionId(id);
    }
  };

  const closeAccordion = () => {
    setOpenAccordionId(null);
  };

  const isAccordionOpen = (id: string) => {
    return openAccordionId === id;
  };

  const contextValue = {
    openAccordionId,
    openAccordion,
    closeAccordion,
    isAccordionOpen,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      {children}
    </AccordionContext.Provider>
  );
}; 