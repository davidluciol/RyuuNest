import { t } from "@ryuunest/i18n";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { openWebServices, type WebServices } from "../data/appServices";
import { locateSqlWasm } from "../data/sqlWasm";

/**
 * F25 — servicios de la app web (base sql.js + IndexedDB, puertos, registro de
 * módulos…): se abren una vez y se comparten por contexto. Al salir de la
 * página se fuerza el volcado de la base a IndexedDB.
 */
const ServicesContext = createContext<WebServices | null>(null);

export function useServices(): WebServices {
  const services = useContext(ServicesContext);
  if (services === null) throw new Error("useServices fuera de ServicesProvider");
  return services;
}

export default function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<WebServices | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void openWebServices({ locateFile: locateSqlWasm })
      .then((opened) => {
        if (cancelled) return;
        setServices(opened);
        window.addEventListener("beforeunload", () => void opened.flush());
        // La web depende de la extensión (SPEC §10): se comprueba al arrancar para avisar de inmediato.
        void opened.extension.detect();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <ErrorState
        title={t("state.error.library.title")}
        message={t("state.error.library.message")}
        actionLabel={t("actions.retry")}
        onAction={() => window.location.reload()}
        testID="services-error"
      />
    );
  }
  if (services === null) return <LoadingState label={t("state.loading.title")} />;
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
