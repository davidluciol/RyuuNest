import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { StatusBar } from "expo-status-bar";
import { gunzipSync, gzipSync, strFromU8, strToU8 } from "fflate";
import { parseDocument } from "htmlparser2";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// T05: app de calibración. Shell mínimo para medir el arranque y la memoria y
// comprobar que las tres librerías JS puras del núcleo corren en React Native.

// Se captura al cargar el bundle (lo más cerca posible del arranque de la app).
const moduleLoadAt = Date.now();

// Vector conocido: SHA-256 de "abc".
const SHA256_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

type CheckResult = { name: string; ok: boolean; detail: string };

function check(name: string, run: () => boolean): CheckResult {
  try {
    const ok = run();
    return { name, ok, detail: ok ? "ok" : "resultado inesperado" };
  } catch (error) {
    return { name, ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

function runChecks(): CheckResult[] {
  return [
    check("@noble/hashes · sha256", () => bytesToHex(sha256(strToU8("abc"))) === SHA256_ABC),
    check("fflate · gzip round-trip", () => {
      const original = "RyuuNest";
      return strFromU8(gunzipSync(gzipSync(strToU8(original)))) === original;
    }),
    check("htmlparser2 · parse", () => parseDocument("<h1>RyuuNest</h1>").children.length === 1),
  ];
}

export default function App() {
  const checks = useMemo(runChecks, []);
  const [firstRenderAt] = useState(() => Date.now());
  const bootMs = firstRenderAt - moduleLoadAt;
  const passed = checks.filter((item) => item.ok).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calibración RyuuNest (T05)</Text>
      <Text style={styles.subtitle}>
        Módulo cargado +{bootMs} ms · {passed}/{checks.length} comprobaciones
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {checks.map((item) => (
          <Text key={item.name} style={styles.row}>
            {item.ok ? "OK  " : "FALLO  "}
            {item.name}
            {item.ok ? "" : ` — ${item.detail}`}
          </Text>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  list: { alignItems: "flex-start" },
  row: { fontSize: 14, marginBottom: 6 },
});
