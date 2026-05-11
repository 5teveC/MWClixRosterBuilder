import "./globals.css";
import { RosterProvider } from "../context/RosterContext";
import BackgroundProvider from "./components/BackgroundProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BackgroundProvider />
        <RosterProvider>
          {children}
        </RosterProvider>
      </body>
    </html>
  );
}
