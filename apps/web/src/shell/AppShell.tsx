import { t } from "@ryuunest/i18n";
import { defaultTheme, layoutForWidth } from "@ryuunest/ui-tokens";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";

import DragonMarker from "../components/DragonMarker";
import { Compass, Home, Layers, LibraryBig, Settings as SettingsIcon, type LucideIcon } from "../icons";
import { TAB_ROUTES, type TabIcon } from "../routes";
import "./shell.css";

/**
 * F24 — marco del cliente web: en escritorio (> 1024 px) riel lateral fijo de
 * 240 px con las 5 pestañas (SPEC §11.6, DESIGN.md Layout); por debajo, cabecera
 * superior + barra inferior flotante como en el móvil. El ancho decide con
 * `layoutForWidth` (tokens), igual que el resto de la app.
 */

const TAB_ICONS: Record<TabIcon, LucideIcon> = {
  home: Home,
  library: LibraryBig,
  compass: Compass,
  layers: Layers,
  settings: SettingsIcon,
};

/** Ancho de ventana con escucha de `resize` (el layout reacciona al tamaño). */
function useWindowWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function TabItems({ compact }: { compact: boolean }) {
  return (
    <>
      {TAB_ROUTES.map((route) => {
        const Icon = TAB_ICONS[route.icon];
        return (
          <NavLink
            key={route.id}
            to={route.path}
            end={route.path === "/"}
            className={({ isActive }) => `${compact ? "tab-item" : "rail-item"}${isActive ? " active" : ""}`}
            data-testid={`destination-${route.id}`}
          >
            <Icon size={compact ? 20 : 24} aria-hidden />
            <span className={compact ? "t-label-sm tab-label" : "t-body-md"}>{t(route.labelKey)}</span>
          </NavLink>
        );
      })}
    </>
  );
}

export default function AppShell() {
  const layout = layoutForWidth(useWindowWidth());
  const desktop = layout.rail > 0;
  return (
    <div className={desktop ? "shell shell-desktop" : "shell shell-compact"}>
      {desktop ? (
        <nav className="rail" aria-label={t("a11y.mainNav")}>
          <div className="rail-brand">
            <DragonMarker size={32} color={defaultTheme.colors.accent} />
            <span className="t-headline-sm brand-name">{t("shell.brand")}</span>
          </div>
          <TabItems compact={false} />
        </nav>
      ) : (
        <header className="topbar">
          <DragonMarker size={28} color={defaultTheme.colors.accent} />
          <span className="t-headline-sm brand-name">{t("shell.brand")}</span>
        </header>
      )}
      <main className="content">
        <Outlet />
      </main>
      {!desktop && (
        <nav className="bottom-nav" aria-label={t("a11y.mainNav")}>
          <TabItems compact />
        </nav>
      )}
    </div>
  );
}
