import { createClient, type Client } from "@libsql/client";

const dbUrl = import.meta.env.TURSO_DATABASE_URL;
const dbToken = import.meta.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbToken) {
  throw new Error(
    "ERROR CRÍTICO DE CONFIGURACIÓN: Las variables de entorno TURSO_DATABASE_URL o TURSO_AUTH_TOKEN no están definidas en el archivo .env."
  );
}

export const turso: Client = createClient({
  url: dbUrl,
  authToken: dbToken,
});
