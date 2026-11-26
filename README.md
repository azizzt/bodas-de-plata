# Invitación digital · Bodas de Plata de Eloísa y José Luis

Invitación web Mobile-First + sobre en PDF + registro de asistencia (RSVP) en Google Sheets.
**Costo: $0 MXN.** Sin servidores ni bases de datos de pago.

```
Invitacion/
├── index.html              ← Página de la invitación
├── css/styles.css          ← Estilos (paleta, tipografía, animaciones)
├── js/config.js            ← ⚙️ ÚNICO archivo que necesitas editar (URL del script, fecha, WhatsApp)
├── js/main.js              ← Cuenta regresiva, animaciones, formulario RSVP
├── assets/
│   ├── og-image.jpg        ← Imagen de vista previa al compartir por WhatsApp (1200×630)
│   └── favicon.svg
├── apps-script/Code.gs     ← Backend gratuito (Google Apps Script)
├── sobre/
│   ├── sobre.html          ← Plantilla del sobre (108×192 mm, vertical para celular)
│   ├── generar-pdf.ps1     ← Exporta el sobre a PDF con el enlace correcto
│   └── Sobre-Bodas-de-Plata.pdf  ← PDF de muestra (enlace provisional)
└── tools/og-image.html     ← Plantilla de la imagen de vista previa
```

## Cómo funciona

```
Invitado (WhatsApp) ──► Sobre PDF ──"Abrir invitación"──► Página web (GitHub Pages / Netlify)
                                                              │  POST del formulario
                                                              ▼
                                               Google Apps Script (Web App) ──► Google Sheets
```

Para 10–20 usuarios simultáneos y ~300 visitas al mes, todas las capas gratuitas sobran:
GitHub Pages/Netlify sirven archivos estáticos sin límite práctico para este tráfico, y
Apps Script permite miles de ejecuciones diarias (cada confirmación es una sola).

---

## Paso 1 · Backend: Google Sheets + Apps Script (≈10 min)

1. Entra a <https://sheets.new> con tu cuenta de Google. Nombra la hoja, por ejemplo
   **"RSVP Bodas de Plata"**.
2. Menú **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega **todo** el archivo `apps-script/Code.gs`. Guarda (💾).
4. En la barra superior elige la función **`setup`** y pulsa **▶ Ejecutar**.
   - Google pedirá permisos: **Revisar permisos → tu cuenta → Configuración avanzada →
     Ir a (nombre del proyecto) → Permitir**. Es tu propio script; el aviso es normal.
   - Se crean las hojas **Confirmaciones** (con encabezados) y **Resumen** (totales automáticos).
5. Pulsa **Implementar → Nueva implementación**.
   - ⚙️ Tipo: **Aplicación web**
   - Descripción: `RSVP v1`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (o "Cualquier persona"; es necesario para que los invitados
     puedan enviar sin iniciar sesión. Solo podrán *agregar* registros, no ver la hoja).
6. Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
7. Ábrela en el navegador: debe mostrar `{"ok":true,"service":"RSVP Bodas de Plata","status":"activo"}`.
8. Pega la URL en `js/config.js`:

   ```js
   SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
   ```

> **Si cambias el código del script después:** Implementar → **Administrar implementaciones** →
> ✏️ Editar → Versión: **Nueva versión** → Implementar. Así la URL **no cambia**.
> (Si haces "Nueva implementación" obtendrás otra URL y tendrías que actualizar `config.js`.)

**Qué se guarda en cada fila:** Fecha/Hora de registro · Nombre de la familia · Número de asistentes ·
Mensaje para los novios · (ID y Dispositivo en columnas ocultas, para evitar duplicados).

**Protecciones incluidas:** validación de datos (1–10 asistentes), bloqueo para envíos simultáneos,
descarte de envíos duplicados, campo trampa anti-bots y protección contra inyección de fórmulas.

---

## Paso 2 · Publicar la página gratis

### Opción A — GitHub Pages (recomendada)

1. Crea una cuenta en <https://github.com> y un repositorio **público** llamado, por ejemplo,
   `bodas-de-plata`.
2. **Add file → Upload files** y arrastra el contenido de esta carpeta
   (`index.html`, `css/`, `js/`, `assets/`; `sobre/`, `tools/` y `apps-script/` son opcionales). Commit.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
4. En 1–2 minutos tu invitación estará en: `https://TU-USUARIO.github.io/bodas-de-plata/`

### Opción B — Netlify Drop (sin cuenta de GitHub, 1 minuto)

1. Entra a <https://app.netlify.com/drop> y arrastra la carpeta completa del proyecto.
2. Crea una cuenta gratuita para que el sitio no expire y, en **Site configuration → Change site name**,
   ponle un nombre bonito: `https://bodas-plata-eloisa-joseluis.netlify.app`.

### Opción C — Vercel

<https://vercel.com/new> → importa el repositorio de GitHub → Framework: **Other** → Deploy.

---

## Paso 3 · Vista previa bonita en WhatsApp

WhatsApp necesita URLs **absolutas**. En `index.html` reemplaza las 2 apariciones de `https://TU-SITIO/`
por tu dirección real:

```html
<meta property="og:url"   content="https://TU-USUARIO.github.io/bodas-de-plata/" />
<meta property="og:image" content="https://TU-USUARIO.github.io/bodas-de-plata/assets/og-image.jpg" />
```

> WhatsApp guarda en caché la vista previa. Haz este cambio **antes** de compartir el enlace por primera vez.

---

## Paso 4 · Generar el sobre PDF con tu enlace definitivo

**Automático** (Windows, con Chrome o Edge instalado), desde la carpeta del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File sobre\generar-pdf.ps1 -Url "https://TU-USUARIO.github.io/bodas-de-plata/"
```

Se crea `sobre/Sobre-Bodas-de-Plata.pdf`; el sobre y el botón **"Abrir invitación"** son enlaces clicables.

**Manual:** abre `sobre/sobre.html?url=https://tu-sitio/` en Chrome → `Ctrl + P` → Guardar como PDF →
Márgenes: **Ninguno** → activa **Gráficos de fondo** → desactiva **Encabezados y pies de página**.

Envía el PDF por WhatsApp. Recomendación: en el mismo mensaje pega también el enlace en texto,
porque algunos visores de PDF en Android no abren enlaces directamente.

---

## Paso 5 · Probar antes de enviar

1. Abre tu sitio en el celular, confirma con "Familia de Prueba" y verifica que aparezca en la hoja
   **Confirmaciones**.
2. Borra esa fila de prueba.
3. Revisa el botón de WhatsApp, los dos botones de "Cómo llegar" y la cuenta regresiva.

> Mientras `SCRIPT_URL` esté vacío, el formulario funciona en **modo demo**: muestra la confirmación
> pero no guarda nada. Útil para revisar el diseño.
>
> Cada celular recuerda que ya confirmó y muestra "¡Gracias por confirmar!". Para registrar a otra
> familia desde el mismo teléfono, usa el enlace **"Registrar otra familia"**.

## Consultar las confirmaciones

- Hoja **Confirmaciones**: una fila por familia, en orden de llegada.
- Hoja **Resumen**: total de familias y total de asistentes, actualizados al instante.
- Tip: instala la app de **Google Sheets** en tu celular y activa notificaciones
  (Herramientas → Reglas de notificación) para enterarte de cada nueva confirmación.

---

## Identidad visual

| Rol | Hex | Uso |
|---|---|---|
| Azul marino profundo | `#0B1A33` | Fondo principal |
| Azul marino medio | `#1B3560` | Degradados, tarjetas |
| Blanco marfil | `#FAF6EE` | Fondos claros, texto sobre azul |
| Marfil tostado | `#F1E9D8` | Detalles, botones del selector |
| Dorado champán | `#D4B57A` | Acentos y botones sobre azul (contraste 8.8:1) |
| Champán claro | `#EAD9B0` | Nombres y brillos |
| Dorado profundo | `#8C6A33` | Texto dorado sobre marfil (contraste 4.6:1, AA) |
| Plata | `#C5CAD3` | Anillo y confeti de plata |

**Tipografías (Google Fonts):** *Great Vibes* (caligráfica, nombres) · *Cormorant Garamond*
(serif, títulos y frases) · *Montserrat* (sans-serif, detalles, direcciones y formulario).

## Personalización rápida

| Qué | Dónde |
|---|---|
| URL del script, fecha, WhatsApp, máximo de asistentes | `js/config.js` |
| Fecha límite para confirmar ("antes del 15 de diciembre") | `index.html`, sección RSVP |
| Hora de la recepción ("Al concluir la misa") | `index.html`, sección Itinerario |
| Máximo de asistentes en el servidor | `MAX_GUESTS` en `apps-script/Code.gs` (igual que en `config.js`) |
| Colores | variables `:root` al inicio de `css/styles.css` |

Para ver la página en tu computadora sin publicarla: `python -m http.server 8080` dentro de la carpeta
y abre <http://localhost:8080>.
