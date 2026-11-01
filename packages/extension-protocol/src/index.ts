/**
 * F26/F27 — protocolo de mensajes entre la web y la extensión de navegador
 * (SPEC §10). Paquete puro y sin dependencias: lo importan `apps/extension`
 * (background, content script, opciones) y `apps/web` (puerto `Http`).
 */

export { base64ToBytes, bytesToBase64 } from "./base64.js";
export {
  EXTENSION_ERROR_CODES,
  HTTP_METHODS,
  PROTOCOL_CHANNEL,
  PROTOCOL_VERSION,
  isExtensionErrorCode,
  parseRequest,
  parseResponse,
  withEnvelope,
  type AckResponse,
  type BodyEncoding,
  type Envelope,
  type ErrorResponse,
  type ExtensionErrorCode,
  type HttpMethod,
  type HttpRequestMessage,
  type HttpResponseMessage,
  type OptionsOpenRequest,
  type PingRequest,
  type PongResponse,
  type RequestMessage,
  type ResponseMessage,
} from "./messages.js";
export { hostOf, originPatternFor } from "./url.js";
