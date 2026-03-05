"use client";

import { createContext, useContext } from "react";
import type { ScrollSequenceContextValue } from "./types";

export const ScrollSequenceContext =
  createContext<ScrollSequenceContextValue | null>(null);

export function useScrollSequence(): ScrollSequenceContextValue {
  const value = useContext(ScrollSequenceContext);
  if (value == null) {
    throw new Error(
      "useScrollSequence must be used inside ScrollSequenceEngine"
    );
  }
  return value;
}
