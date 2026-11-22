// G6 — React Native crea OkHttp sin límites de tiempo, así que una conexión que el
// servidor cerró tras unos minutos sin tráfico se reutiliza y la petición espera
// ~2,5 min hasta que TCP la da por muerta (medido en el POCO con m440). El ping
// la descarta en segundos. Plugin de Expo: no corre en Expo Go, solo en builds.
const { withMainApplication } = require("expo/config-plugins");

const ANCHOR = "super.onCreate()";
const MARKER = "OkHttpClientProvider.setOkHttpClientFactory";

// `createClientBuilder(this)` conserva la caché de 10 MB y las cookies de RN.
const FACTORY = `
    com.facebook.react.modules.network.${MARKER} {
      com.facebook.react.modules.network.OkHttpClientProvider.createClientBuilder(this)
        .pingInterval(10, java.util.concurrent.TimeUnit.SECONDS)
        .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .build()
    }`;

function addOkHttpFactory(source) {
  if (source.includes(MARKER)) {
    return source;
  }
  if (!source.includes(ANCHOR)) {
    throw new Error(`withOkHttpPing: no se encontró ${ANCHOR} en MainApplication`);
  }
  return source.replace(ANCHOR, ANCHOR + FACTORY);
}

function withOkHttpPing(config) {
  return withMainApplication(config, (mod) => {
    if (mod.modResults.language !== "kt") {
      throw new Error("withOkHttpPing: MainApplication debe ser Kotlin");
    }
    mod.modResults.contents = addOkHttpFactory(mod.modResults.contents);
    return mod;
  });
}

module.exports = withOkHttpPing;
module.exports.addOkHttpFactory = addOkHttpFactory;
