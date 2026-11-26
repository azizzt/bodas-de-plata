/* ==========================================================================
   CONFIGURACIÓN DE LA INVITACIÓN
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que normalmente necesitas editar.
   ========================================================================== */

window.INVITACION_CONFIG = {
  /* URL del Web App de Google Apps Script (termina en /exec).
     Pégala aquí después de desplegar apps-script/Code.gs (ver README.md).
     Mientras esté vacía, el formulario funciona en "modo demo" (no guarda). */
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwWCTRIarxZPWbHYUFX983_k5pZELgZ12CFDOyKaIm6M5YK60Lojch83YyMQx_Aksyb7w/exec",

  /* Fecha y hora de la misa con zona horaria de Oaxaca (UTC-06:00, sin horario de verano). */
  EVENT_DATE: "2026-12-28T14:00:00-06:00",

  /* Fin aproximado del evento (para el archivo de calendario). */
  EVENT_END: "2026-12-29T01:00:00-06:00",

  /* WhatsApp de contacto: código de país (52) + 10 dígitos, sin espacios ni signos. */
  WHATSAPP_NUMBER: "529511856686",
  WHATSAPP_MESSAGE: "¡Hola! Tengo una duda sobre la celebración de las Bodas de Plata de Eloísa y José Luis.",

  /* Límite del selector de asistentes por registro. */
  MAX_GUESTS: 10,
};
