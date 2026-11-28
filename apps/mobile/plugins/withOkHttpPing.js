// G6 — React Native crea OkHttp sin límites de tiempo, así que una conexión que el
// servidor cerró tras unos minutos sin tráfico se reutiliza y la petición espera
// ~2,5 min hasta que TCP la da por muerta (medido en el POCO con m440). El ping
// la descarta en segundos. Plugin de Expo: no corre en Expo Go, solo en builds.
const { withMainApplication } = require("expo/config-plugins");

const ANCHOR = "super.onCreate()";
const MARKER = "OkHttpClientProvider.setOkHttpClientFactory";

// `createClientBuilder(this)` conserva la caché de 10 MB y las cookies de RN.
// Cookie del módulo (Models #30): el BridgeInterceptor de OkHttp *sustituye* la cabecera
// Cookie por la del tarro (WebView) en cuanto este tiene cookies del dominio, y se perdía
// p. ej. el `isAdult=1` de FanFox. Un interceptor de aplicación la aparta antes y uno de red
// la vuelve a unir, primero la del módulo (la que manda si hay nombres repetidos).
const FACTORY = `
    com.facebook.react.modules.network.${MARKER} {
      com.facebook.react.modules.network.OkHttpClientProvider.createClientBuilder(this)
        .pingInterval(10, java.util.concurrent.TimeUnit.SECONDS)
        .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .addInterceptor(okhttp3.Interceptor { chain ->
          val request = chain.request()
          val own = request.header("Cookie")
          if (own == null) chain.proceed(request)
          else chain.proceed(request.newBuilder().removeHeader("Cookie").header("X-RyuuNest-Cookie", own).build())
        })
        .addNetworkInterceptor(okhttp3.Interceptor { chain ->
          val request = chain.request()
          val own = request.header("X-RyuuNest-Cookie")
          if (own == null) {
            chain.proceed(request)
          } else {
            val jar = request.header("Cookie")
            val cookie = if (jar.isNullOrEmpty()) own else "$own; $jar"
            chain.proceed(request.newBuilder().removeHeader("X-RyuuNest-Cookie").header("Cookie", cookie).build())
          }
        })
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
