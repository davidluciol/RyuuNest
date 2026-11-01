import { Navigate, Route, Routes, useNavigate } from "react-router";

import AppShell from "./shell/AppShell";
import EmptyScreen from "./screens/EmptyScreen";

/**
 * F24 — rutas del cliente web sobre el marco (`AppShell`). Las pantallas con
 * datos reales llegan por corte en F25; mientras, cada pestaña muestra su estado
 * vacío real (sin datos de ejemplo, P-113).
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRoute />} />
        <Route path="library" element={<LibraryRoute />} />
        <Route path="discover" element={<DiscoverRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function HomeRoute() {
  const navigate = useNavigate();
  return (
    <EmptyScreen
      screenId="home"
      titleKey="state.empty.home.title"
      messageKey="state.empty.home.message"
      actionKey="actions.addRepository"
      onAction={() => navigate("/sources")}
    />
  );
}

function LibraryRoute() {
  const navigate = useNavigate();
  return (
    <EmptyScreen
      screenId="library"
      titleKey="state.empty.library.title"
      messageKey="state.empty.library.message"
      actionKey="actions.addRepository"
      onAction={() => navigate("/sources")}
    />
  );
}

function DiscoverRoute() {
  const navigate = useNavigate();
  return (
    <EmptyScreen
      screenId="discover"
      titleKey="state.empty.discover.title"
      messageKey="state.empty.discover.message"
      actionKey="actions.addRepository"
      onAction={() => navigate("/sources")}
    />
  );
}
