import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Modal, NativeModules, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import LoadingState from "../../components/LoadingState";
import SafeScreen from "../../components/SafeScreen";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import type { ChallengeBrowserProps } from "./ChallengeBrowser";
import { allowsNavigation, pickClearance, type NativeCookie } from "./challengeBrowserRules";

/**
 * F100 — navegador visible para el reto de Cloudflare. Seguridad: sin puente JS
 * (`onMessage`), sin scripts inyectados, sin ventanas nuevas, solo https y la
 * navegación principal limitada a los dominios del módulo.
 *
 * Lectura de `cf_clearance` (HttpOnly) con `@react-native-cookies/cookies`. Ese
 * módulo nativo **no está en Expo Go**: sin él se degrada al «modo tarro»
 * (`cfClearance: null`): el usuario toca «Listo», se guarda solo el User-Agent y
 * la cookie sigue en el tarro de Android (compartido con `fetch`, por medir).
 */

interface CookieManagerLike {
  get(url: string, useWebKit: boolean): Promise<Record<string, NativeCookie>>;
  set(
    url: string,
    cookie: { name: string; value: string; expires: string; domain?: string },
    useWebKit: boolean,
  ): Promise<boolean>;
  flush(): Promise<void>;
}

// Se lee de NativeModules (no con import) para no romper el arranque en Expo Go.
const cookies = (NativeModules as { RNCookieManagerAndroid?: CookieManagerLike })
  .RNCookieManagerAndroid;

/** Caduca en el WebView las cookies del host del reto, ya copiadas al almacén seguro. */
async function forgetCookies(
  manager: CookieManagerLike,
  url: string,
  host: string,
  domains: readonly string[],
): Promise<void> {
  const current = await manager.get(url, false);
  const past = new Date(0).toUTCString();
  // Android no dice el dominio de cada cookie: se caduca la del host y la de cada dominio del módulo que lo cubre.
  const scopes = [
    undefined,
    ...domains.filter((d) => host === d || host.endsWith(`.${d}`)).map((d) => `.${d}`),
  ];
  await Promise.all(
    Object.keys(current).flatMap((name) =>
      scopes.map((domain) =>
        manager.set(
          url,
          { name, value: "", expires: past, ...(domain === undefined ? {} : { domain }) },
          false,
        ),
      ),
    ),
  );
  await manager.flush();
}

export default function ChallengeBrowser({ url, host, domains, onFinish }: ChallengeBrowserProps) {
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const done = useRef(false);

  const finish = (solution: Parameters<typeof onFinish>[0]) => {
    if (done.current) return;
    done.current = true;
    onFinish(solution);
  };

  // El mismo User-Agent del WebView se fija explícito y se guarda: Cloudflare lo exige igual.
  useEffect(() => {
    let alive = true;
    const fail = () => {
      if (alive && !done.current) {
        done.current = true;
        onFinish(null);
      }
    };
    Constants.getWebViewUserAgentAsync()
      .then((agent) => (agent === null ? fail() : alive && setUserAgent(agent)))
      .catch(fail);
    return () => {
      alive = false;
    };
  }, [onFinish]);

  /** Busca la cookie; con ella, la guarda y limpia el WebView. */
  const tryRead = async (): Promise<boolean> => {
    if (cookies === undefined || userAgent === null) return false;
    try {
      const clearance = pickClearance(await cookies.get(url, false));
      if (clearance === null) return false;
      await forgetCookies(cookies, url, host, domains);
      finish({
        cfClearance: clearance.value,
        userAgent,
        ...(clearance.expiresAt === undefined ? {} : { expiresAt: clearance.expiresAt }),
      });
      return true;
    } catch {
      return false;
    }
  };

  const onDone = async () => {
    if (userAgent === null) return finish(null);
    if (cookies === undefined) return finish({ cfClearance: null, userAgent });
    if (!(await tryRead())) finish(null);
  };

  const onCancel = async () => {
    if (cookies !== undefined) await forgetCookies(cookies, url, host, domains).catch(() => {});
    finish(null);
  };

  return (
    <Modal visible animationType="none" onRequestClose={onCancel}>
      <SafeScreen>
        <View style={styles.bar} testID="challenge-browser">
          <Text accessibilityRole="header" style={styles.title}>
            {t("challenge.browser.title", { host })}
          </Text>
          <Text style={styles.hint}>{t("challenge.browser.hint")}</Text>
          <View style={styles.actions}>
            <Button variant="secondary" label={t("confirm.cancel")} onPress={onCancel} />
            <Button label={t("challenge.browser.done")} onPress={onDone} testID="challenge-done" />
          </View>
        </View>
        {userAgent === null ? (
          <LoadingState title={t("challenge.browser.title", { host })} />
        ) : (
          <WebView
            source={{ uri: url }}
            userAgent={userAgent}
            originWhitelist={["https://*"]}
            onShouldStartLoadWithRequest={(request) =>
              !request.isTopFrame || allowsNavigation(request.url, domains)
            }
            onLoadEnd={() => void tryRead()}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            allowFileAccess={false}
            allowsLinkPreview={false}
            mixedContentMode="never"
            style={styles.web}
          />
        )}
      </SafeScreen>
    </Modal>
  );
}

const colors = dragonNightColors;

const styles = StyleSheet.create({
  bar: { padding: spacing.md, gap: spacing.xs, backgroundColor: colors.bg },
  title: { ...textStyle(typography.titleLg), color: colors.textPrimary },
  hint: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  web: { flex: 1 },
});
