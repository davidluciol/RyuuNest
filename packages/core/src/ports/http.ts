/** Inicio de petición del puerto `Http`. */
export interface HttpRequest {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** Respuesta del puerto `Http`. */
export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  /** URL final tras seguir las redirecciones. Si falta, se entiende que fue la pedida. */
  url?: string;
  /** Cuerpo como texto (JSON, HTML). */
  text(): Promise<string>;
  /** Cuerpo como bytes (paquetes `.zip` e imágenes): nunca pasa por UTF-8. */
  bytes(): Promise<Uint8Array>;
}

/**
 * Puerto `Http` (SPEC §5.3): toda la red pasa por aquí. Cliente nativo en móvil y
 * TV; mensajes a la extensión en web (SPEC §10). Sin dependencias de plataforma.
 */
export interface Http {
  request(url: string, init?: HttpRequest): Promise<HttpResponse>;
}
