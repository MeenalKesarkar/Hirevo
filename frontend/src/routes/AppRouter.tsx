
import { useSyncExternalStore } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import App from "../App";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import { isAuthenticated, subscribeToAuthChanges } from "../services/api";

function RequireAuth() {
  const authenticated = useSyncExternalStore(subscribeToAuthChanges, isAuthenticated, () => false);
  const location = useLocation();
  return authenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function PublicOnly() {
  const authenticated = useSyncExternalStore(subscribeToAuthChanges, isAuthenticated, () => false);
  return authenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/login" element={<PublicOnly />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
