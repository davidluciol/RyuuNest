import { Navigate, Route, Routes } from "react-router";

import ServicesProvider from "./services/ServicesContext";
import AppShell from "./shell/AppShell";
import DiagnosticsScreen from "./screens/diagnostics/DiagnosticsScreen";
import DiscoverScreen from "./screens/discover/DiscoverScreen";
import HomeScreen from "./screens/home/HomeScreen";
import LibraryScreen from "./screens/library/LibraryScreen";
import ReaderScreen from "./screens/reader/ReaderScreen";
import SeriesScreen from "./screens/series/SeriesScreen";
import SettingsScreen from "./screens/settings/SettingsScreen";
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
          <Route index element={<HomeScreen />} />
          <Route path="library" element={<LibraryScreen />} />
          <Route path="discover" element={<DiscoverScreen />} />
          <Route path="sources" element={<SourcesScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="series/:moduleId/:seriesId" element={<SeriesScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* Lector a pantalla completa, fuera del marco de pestañas (como en móvil). */}
        <Route path="reader/:moduleId/:seriesId/:chapterId" element={<ReaderScreen />} />
        {/* Diagnóstico con cabecera propia (volver a Ajustes), fuera del marco. */}
        <Route path="diagnostics" element={<DiagnosticsScreen />} />
      </Routes>
    </ServicesProvider>
  );
}


