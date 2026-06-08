import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client/web';

// Función estricta evita inyección XSS
const sanitizeInput = (str: string) => {
  return str.replace(/[&<>"']/g, (match) => {
    const escape: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escape[match] || match;
  });
};

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const data = await request.formData();
    
    const rawNombre = data.get('nombre')?.toString().trim();
    const rawEmail = data.get('email')?.toString().trim();
    const rawMensaje = data.get('mensaje')?.toString().trim();

    if (!rawNombre || !rawEmail || !rawMensaje) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios." }), { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return new Response(JSON.stringify({ error: "Email inválido." }), { status: 400 });
    }

    if (rawMensaje.length > 2000) {
      return new Response(JSON.stringify({ error: "Mensaje demasiado largo." }), { status: 400 });
    }

    const nombre = sanitizeInput(rawNombre);
    const email = rawEmail; 
    const mensaje = sanitizeInput(rawMensaje);

    const turso = createClient({
      url: import.meta.env.TURSO_DATABASE_URL,
      authToken: import.meta.env.TURSO_AUTH_TOKEN,
    });

    await turso.execute({
      sql: 'INSERT INTO feedback (nombre, email, mensaje, fecha) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      args: [nombre, email, mensaje]
    });

    const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**Nuevo mensaje de Portfolio**\n**De:** ${nombre} (${email})\n**Mensaje:**\n> ${mensaje}`
        })
      }).catch(err => console.error("Fallo al enviar notificación:", err)); 
    }

    return redirect('/?success=true', 303);

  } catch (error) {
    console.error("Error en la API de contacto:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor." }), { status: 500 });
  }
};
