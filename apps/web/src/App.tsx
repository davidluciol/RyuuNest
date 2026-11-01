import { Navigate, Route, Routes, useNavigate } from "react-router";

import ServicesProvider from "./services/ServicesContext";
import AppShell from "./shell/AppShell";
import EmptyScreen from "./screens/EmptyScreen";
import SourcesScreen from "./screens/sources/SourcesScreen";

/**
 * F24/F25 — rutas del cliente web sobre el marco (`AppShell`), con los
 * servicios reales (sql.js + IndexedDB) compartidos por contexto. Las
 * pantallas que faltan muestran su estado vacío real (sin datos de ejemplo).
 */
export default function App() {
  return (
    <ServicesProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomeRoute />} />
          <Route path="library" element={<LibraryRoute />} />
          <Route path="discover" element={<DiscoverRoute />} />
          <Route path="sources" element={<SourcesScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ServicesProvider>
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
