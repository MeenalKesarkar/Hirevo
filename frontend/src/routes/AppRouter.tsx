
import { useEffect, useState, useSyncExternalStore } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import App from "../App";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ProfilePage from "../pages/ProfilePage";
import { isAuthenticated, subscribeToAuthChanges } from "../services/api";

function RequireAuth() {
  const authenticated = useSyncExternalStore(subscribeToAuthChanges, isAuthenticated, () => false);
  const location = useLocation();
  return authenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function PublicOnly() {
  const authenticated = useSyncExternalStore(subscribeToAuthChanges, isAuthenticated, () => false);
  if (authenticated) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function SignupOnly() {
  const location = useLocation();
  const navigate = useNavigate();
  const enteredFromLogin = (location.state as { enterSignup?: boolean } | null)?.enterSignup === true;
  const [authorized] = useState(enteredFromLogin);

  useEffect(() => {
    if (authorized) navigate("/signup", { replace: true, state: null });
  }, [authorized, navigate]);

  if (!authorized) return <Navigate to="/login" replace />;
  return <SignupPage />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/login" element={<PublicOnly />} />
          <Route path="/signup" element={<SignupOnly />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
