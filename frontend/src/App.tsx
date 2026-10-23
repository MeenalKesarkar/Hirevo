import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import SplashScreen from "./components/SplashScreen";

export default function App() {
  const [splashComplete, setSplashComplete] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSplashComplete(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!splashComplete) {
    return <SplashScreen />;
  }

  return <Outlet />;
}
