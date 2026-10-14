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
  text(): Promise<string>;
}

/**
 * Puerto `Http` (SPEC §5.3): toda la red pasa por aquí. Cliente nativo en móvil y
 * TV; mensajes a la extensión en web (SPEC §10). Sin dependencias de plataforma.
 */
export interface Http {
  request(url: string, init?: HttpRequest): Promise<HttpResponse>;
}
