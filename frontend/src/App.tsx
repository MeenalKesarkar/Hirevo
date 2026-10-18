import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import SplashScreen from "./components/SplashScreen";

export default function App() {
  const [splashComplete, setSplashComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashComplete(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!splashComplete) {
    return <SplashScreen />;
  }

  if (location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
