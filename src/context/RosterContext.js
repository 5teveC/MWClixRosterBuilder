"use client"

import { createContext, useContext, useEffect, useState } from "react";

const RosterContext = createContext();

export function RosterProvider({ children }) {
  const [roster, setRoster] = useState([]);
  const [gamePoints, setGamePoints] = useState(300);

  // Load from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("roster");
    if (saved) setRoster(JSON.parse(saved));
    const savedPts = localStorage.getItem("gamePoints");
    if (savedPts) setGamePoints(Number(savedPts));
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("roster", JSON.stringify(roster));
  }, [roster]);

  useEffect(() => {
    localStorage.setItem("gamePoints", String(gamePoints));
  }, [gamePoints]);

  return (
    <RosterContext.Provider value={{ roster, setRoster, gamePoints, setGamePoints }}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  return useContext(RosterContext);
}
