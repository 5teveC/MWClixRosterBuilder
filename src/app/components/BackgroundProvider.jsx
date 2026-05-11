"use client";
import { useEffect } from "react";

const BACKGROUNDS = [
  "/assets/backgrounds/bg1.png",
  "/assets/backgrounds/bg2.png",
  "/assets/backgrounds/bg3.png",
];

export default function BackgroundProvider() {
  useEffect(() => {
    // Pick once per browser session; same background across all pages until tab closes
    let chosen = sessionStorage.getItem("appBg");
    if (!chosen) {
      chosen = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
      sessionStorage.setItem("appBg", chosen);
    }
    document.body.style.backgroundImage = `url("${chosen}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  }, []);

  return null;
}
