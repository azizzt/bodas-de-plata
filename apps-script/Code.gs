/**
 * ============================================================================
 *  BODAS DE PLATA · Backend RSVP (Google Apps Script + Google Sheets)
 * ----------------------------------------------------------------------------
 *  Recibe el POST del formulario de la invitación y guarda cada confirmación
 *  en la hoja "Confirmaciones". También mantiene una hoja "Resumen" con el
 *  total de familias y de asistentes.
 *
 *  Columnas guardadas:
 *    Fecha/Hora de registro | Nombre de la familia | Número de asistentes |
 *    Mensaje para los novios | ID | Dispositivo
 *
 *  DESPLIEGUE (resumen; ver README.md para el paso a paso):
 *    1. Crea una hoja de cálculo en Google Sheets.
 *    2. Extensiones → Apps Script → pega este archivo completo.
 *    3. Ejecuta una vez la función  setup  (autoriza los permisos).
 *    4. Implementar → Nueva implementación → Tipo: Aplicación web
 *         Ejecutar como: Yo   |   Quién tiene acceso: Cualquier usuario
 *    5. Copia la URL que termina en /exec y pégala en js/config.js (SCRIPT_URL).
 * ============================================================================
 */

/** Configuración */
var SHEET_NAME = 'Confirmaciones';
var SUMMARY_NAME = 'Resumen';
var MAX_GUESTS = 10;      // Debe coincidir con MAX_GUESTS de js/config.js
var TIMEZONE = 'America/Mexico_City';
var HEADERS = [
  'Fecha/Hora de registro',
  'Nombre de la familia',
  'Número de asistentes',
  'Mensaje para los novios',
  'ID',
  'Dispositivo'
];

/* --------------------------------------------------------------------------
 *  POST: registra una confirmación
 * ------------------------------------------------------------------------ */
function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    // Evita que dos envíos simultáneos escriban en la misma fila.
    lock.waitLock(15000);

    var data = parseRequest_(e);

    // Campo trampa anti-spam: si viene lleno, es un bot. Se responde "ok" sin guardar.
    if (data.website) return json_({ ok: true });

    // --- Validación ---
    var familia = clean_(data.familia, 100);
    var asistentes = parseInt(data.asistentes, 10);
    var mensaje = clean_(data.mensaje, 500);
    var id = clean_(data.id, 64);
    var agente = clean_(data.userAgent, 150);

    if (familia.length < 3) {
      return json_({ ok: false, error: 'El nombre de la familia es obligatorio.' });
    }
    if (isNaN(asistentes) || asistentes < 1 || asistentes > MAX_GUESTS) {
      return json_({ ok: false, error: 'El número de asistentes debe estar entre 1 y ' + MAX_GUESTS + '.' });
    }

    var sheet = getSheet_();

    // --- Evita duplicados (reintentos del mismo envío) ---
    if (id && isDuplicate_(sheet, id)) {
      return json_({ ok: true, duplicate: true });
    }

    sheet.appendRow([
      new Date(),
      safe_(familia),
      asistentes,
      safe_(mensaje),
      id,
      safe_(agente)
    ]);

    return json_({ ok: true });

  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Error del servidor. Intenta de nuevo.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* --------------------------------------------------------------------------
 *  GET: permite comprobar desde el navegador que el Web App funciona
 * ------------------------------------------------------------------------ */
function doGet() {
  return json_({ ok: true, service: 'RSVP Bodas de Plata', status: 'activo' });
}

/* --------------------------------------------------------------------------
 *  setup(): ejecútala UNA VEZ desde el editor para crear las hojas,
 *  encabezados, formato y el resumen automático.
 * ------------------------------------------------------------------------ */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TIMEZONE);

  // Hoja de confirmaciones
  var sheet = getSheet_();
  var header = sheet.getRange(1, 1, 1, HEADERS.length);
  header.setValues([HEADERS])
        .setFontWeight('bold')
        .setFontColor('#FAF6EE')
        .setBackground('#0B1A33');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  sheet.getRange('C:C').setHorizontalAlignment('center');
  sheet.getRange('D:D').setWrap(true);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 260);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 360);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 200);
  sheet.hideColumns(5, 2); // ID y Dispositivo: técnicos, ocultos por comodidad

  // Hoja de resumen con fórmulas que se actualizan solas
  var summary = ss.getSheetByName(SUMMARY_NAME) || ss.insertSheet(SUMMARY_NAME);
  summary.clear();
  summary.getRange('A1:B1').setValues([['Resumen de confirmaciones', '']])
         .setFontWeight('bold').setFontSize(14).setFontColor('#0B1A33');
  summary.getRange('A3:B5').setValues([
    ['Familias / registros', '=COUNTA(' + SHEET_NAME + '!B2:B)'],
    ['Total de asistentes', '=SUM(' + SHEET_NAME + '!C2:C)'],
    ['Último registro', '=IFERROR(MAX(' + SHEET_NAME + '!A2:A),"—")']
  ]);
  summary.getRange('B5').setNumberFormat('dd/mm/yyyy hh:mm');
  summary.getRange('A3:A5').setFontWeight('bold');
  summary.getRange('B3:B5').setFontSize(13).setHorizontalAlignment('left');
  summary.setColumnWidth(1, 220);
  summary.setColumnWidth(2, 180);

  SpreadsheetApp.flush();
  Logger.log('Listo. Ahora ve a Implementar → Nueva implementación → Aplicación web.');
}

/* --------------------------------------------------------------------------
 *  Prueba manual desde el editor (opcional): Ejecutar → testPost
 * ------------------------------------------------------------------------ */
function testPost() {
  var res = doPost({
    parameter: { familia: 'Familia de Prueba', asistentes: '3', mensaje: '¡Felicidades!', id: 'test-' + Date.now() }
  });
  Logger.log(res.getContent());
}

/* ============================================================================
 *  Funciones auxiliares (privadas: terminan en "_")
 * ========================================================================== */

/** Acepta form-urlencoded (lo que envía la invitación) o JSON. */
function parseRequest_(e) {
  var data = {};
  if (e && e.parameter) {
    for (var k in e.parameter) data[k] = e.parameter[k];
  }
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      var body = JSON.parse(e.postData.contents);
      for (var j in body) data[j] = body[j];
    } catch (ignore) {}
  }
  return data;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Busca el ID en la columna E para no guardar dos veces el mismo envío. */
function isDuplicate_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var found = sheet.getRange(2, 5, last - 1, 1)
                   .createTextFinder(id)
                   .matchEntireCell(true)
                   .findNext();
  return found !== null;
}

/** Limpia espacios y recorta longitud. */
function clean_(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Evita "inyección de fórmulas": si el texto empieza con = + - @ se antepone un apóstrofo. */
function safe_(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
