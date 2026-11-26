/* ==========================================================================
   BODAS DE PLATA · Lógica de la invitación
   - Animaciones al hacer scroll (IntersectionObserver)
   - Cuenta regresiva
   - Botones de calendario y WhatsApp
   - Formulario RSVP → Google Apps Script → Google Sheets
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.INVITACION_CONFIG || {};
  var STORAGE_KEY = "bodas-plata-rsvp";

  document.documentElement.classList.remove("no-js");

  /* ------------------------------------------------------------------------
     1. Aparición al hacer scroll
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");

    // Retraso escalonado para elementos hermanos dentro de la misma sección
    items.forEach(function (el) {
      var siblings = el.parentElement.querySelectorAll(":scope > .reveal");
      var idx = Array.prototype.indexOf.call(siblings, el);
      if (idx > 0) el.style.setProperty("--reveal-delay", Math.min(idx * 0.12, 0.6) + "s");
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     2. Barra de progreso de lectura
     ------------------------------------------------------------------------ */
  function initProgress() {
    var bar = document.getElementById("progressBar");
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------------
     3. Cuenta regresiva
     ------------------------------------------------------------------------ */
  function initCountdown() {
    var target = new Date(CFG.EVENT_DATE).getTime();
    var end = new Date(CFG.EVENT_END || CFG.EVENT_DATE).getTime();
    var box = document.getElementById("countdown");
    var done = document.getElementById("countdownDone");
    if (!box || isNaN(target)) return;

    var nodes = {};
    box.querySelectorAll("[data-unit]").forEach(function (n) { nodes[n.dataset.unit] = n; });

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function set(unit, value) {
      var node = nodes[unit];
      if (node.textContent !== value) {
        node.textContent = value;
        node.classList.remove("tick");
        void node.offsetWidth; // reinicia la animación
        node.classList.add("tick");
      }
    }

    function tick() {
      var now = Date.now();
      var diff = target - now;

      if (diff <= 0) {
        box.hidden = true;
        done.hidden = false;
        done.textContent = now < end ? "¡Hoy es el gran día!" : "¡Gracias por acompañarnos!";
        clearInterval(timer);
        return;
      }

      var s = Math.floor(diff / 1000);
      set("days", String(Math.floor(s / 86400)));
      set("hours", pad(Math.floor((s % 86400) / 3600)));
      set("minutes", pad(Math.floor((s % 3600) / 60)));
      set("seconds", pad(s % 60));
    }

    var timer = setInterval(tick, 1000);
    tick();
  }

  /* ------------------------------------------------------------------------
     4. Calendario (Google Calendar + archivo .ics para iPhone/Outlook)
     ------------------------------------------------------------------------ */
  function toUTCStamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function initCalendar() {
    var start = new Date(CFG.EVENT_DATE);
    var end = new Date(CFG.EVENT_END);
    var title = "Bodas de Plata · Eloísa & José Luis";
    var details = "Renovación de votos por sus 25 años de unión.\n14:00 h Misa: Parroquia San Lorenzo Diácono y Mártir.\nRecepción: Jardín La Gloria.\n\nInvitación: " + location.href.split("#")[0];
    var place = "Parroquia San Lorenzo Diácono y Mártir, Calle Constituyentes S/N, 68263 San Lorenzo Cacaotepec, Oax.";

    var gcal = document.getElementById("gcalBtn");
    if (gcal) {
      gcal.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(title) +
        "&dates=" + toUTCStamp(start) + "/" + toUTCStamp(end) +
        "&details=" + encodeURIComponent(details) +
        "&location=" + encodeURIComponent(place);
    }

    var ics = document.getElementById("icsBtn");
    if (ics) {
      ics.addEventListener("click", function () {
        var esc = function (s) { return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); };
        var body = [
          "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BodasDePlata//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          "UID:bodas-plata-20261228@invitacion",
          "DTSTAMP:" + toUTCStamp(new Date()),
          "DTSTART:" + toUTCStamp(start),
          "DTEND:" + toUTCStamp(end),
          "SUMMARY:" + esc(title),
          "DESCRIPTION:" + esc(details),
          "LOCATION:" + esc(place),
          "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + esc(title), "END:VALARM",
          "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");
        var blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "bodas-de-plata.ics";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      });
    }
  }

  /* ------------------------------------------------------------------------
     5. WhatsApp
     ------------------------------------------------------------------------ */
  function initWhatsApp() {
    var btn = document.getElementById("whatsappBtn");
    if (!btn) return;
    btn.href = "https://wa.me/" + CFG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(CFG.WHATSAPP_MESSAGE || "");
  }

  /* ------------------------------------------------------------------------
     6. Formulario RSVP
     ------------------------------------------------------------------------ */
  function initRSVP() {
    var form = document.getElementById("rsvpForm");
    if (!form) return;

    var nameInput = document.getElementById("familia");
    var nameError = document.getElementById("familiaError");
    var guests = document.getElementById("asistentes");
    var message = document.getElementById("mensaje");
    var honeypot = document.getElementById("website");
    var submitBtn = document.getElementById("submitBtn");
    var status = document.getElementById("formStatus");
    var success = document.getElementById("rsvpSuccess");
    var successText = document.getElementById("successText");
    var another = document.getElementById("anotherBtn");
    var minus = form.querySelector('[data-step="-1"]');
    var plus = form.querySelector('[data-step="1"]');
    var MAX = Number(CFG.MAX_GUESTS) || 10;

    guests.max = MAX;

    /* --- Selector numérico --- */
    function clampGuests() {
      var v = parseInt(guests.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > MAX) v = MAX;
      guests.value = v;
      minus.disabled = v <= 1;
      plus.disabled = v >= MAX;
      return v;
    }
    form.querySelectorAll(".stepper__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        guests.value = (parseInt(guests.value, 10) || 1) + Number(b.dataset.step);
        clampGuests();
        if (navigator.vibrate) navigator.vibrate(8);
      });
    });
    guests.addEventListener("change", clampGuests);
    guests.addEventListener("blur", clampGuests);
    clampGuests();

    /* --- Validación --- */
    function validate() {
      var name = nameInput.value.trim().replace(/\s+/g, " ");
      if (name.length < 3) {
        nameInput.setAttribute("aria-invalid", "true");
        nameError.textContent = "Por favor escribe el nombre de tu familia o tu nombre completo.";
        nameInput.focus();
        return null;
      }
      nameInput.removeAttribute("aria-invalid");
      nameError.textContent = "";
      return name;
    }
    nameInput.addEventListener("input", function () {
      if (nameInput.getAttribute("aria-invalid")) validate();
    });

    /* --- Estado visual --- */
    function setLoading(on) {
      submitBtn.classList.toggle("is-loading", on);
      submitBtn.disabled = on;
      submitBtn.querySelector(".btn__label").textContent = on ? "Enviando…" : "Confirmar asistencia";
    }
    function setStatus(text, type) {
      status.textContent = text || "";
      status.className = "form-status" + (type ? " is-" + type : "");
    }
    function showSuccess(name, n) {
      form.hidden = true;
      success.hidden = false;
      successText.textContent = "Registramos a " + name + " con " + n + (n === 1 ? " persona" : " personas") +
        ". Nos hace muy felices que nos acompañen.";
      success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    /* Si este dispositivo ya confirmó antes, se muestra el mensaje directamente */
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.familia) {
        form.hidden = true;
        success.hidden = false;
        successText.textContent = "Ya registramos a " + saved.familia + " con " + saved.asistentes +
          (saved.asistentes === 1 ? " persona" : " personas") + ". ¡Gracias!";
      }
    } catch (e) { /* localStorage no disponible: se ignora */ }

    another.addEventListener("click", function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      form.reset();
      clampGuests();
      setStatus("");
      success.hidden = true;
      form.hidden = false;
      nameInput.focus();
    });

    /* --- Envío --- */
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      setStatus("");

      var name = validate();
      if (!name) return;
      var n = clampGuests();

      // Bot detectado por el campo trampa: fingimos éxito sin enviar.
      if (honeypot.value) { showSuccess(name, n); return; }

      var payload = {
        id: makeId(),                 // evita registros duplicados si se reintenta
        familia: name,
        asistentes: n,
        mensaje: message.value.trim().slice(0, 500),
        userAgent: navigator.userAgent.slice(0, 150)
      };

      // Modo demo: aún no se configuró la URL del Apps Script.
      if (!CFG.SCRIPT_URL) {
        setLoading(true);
        setTimeout(function () {
          setLoading(false);
          console.warn("[RSVP] Modo demo: configura SCRIPT_URL en js/config.js para guardar en Google Sheets.", payload);
          finish(payload);
        }, 900);
        return;
      }

      setLoading(true);
      sendRSVP(payload)
        .then(function () { finish(payload); })
        .catch(function (err) {
          console.error("[RSVP]", err);
          setStatus("No pudimos registrar tu confirmación. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.", "error");
        })
        .then(function () { setLoading(false); });
    });

    function finish(payload) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ familia: payload.familia, asistentes: payload.asistentes }));
      } catch (e) {}
      showSuccess(payload.familia, payload.asistentes);
      confetti();
    }
  }

  /* Envía los datos al Web App de Google Apps Script.
     Se usa application/x-www-form-urlencoded (petición "simple") para evitar
     el preflight CORS, que Apps Script no soporta. */
  function sendRSVP(payload) {
    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });

    return fetch(CFG.SCRIPT_URL, { method: "POST", body: body, redirect: "follow" })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || data.ok !== true) throw new Error((data && data.error) || "Respuesta inválida");
        return data;
      })
      .catch(function (err) {
        // Si la respuesta no se pudo leer (p. ej. bloqueo CORS de algún navegador),
        // se reintenta en modo "no-cors". El servidor descarta duplicados por "id".
        if (err instanceof TypeError) {
          return fetch(CFG.SCRIPT_URL, { method: "POST", body: body, mode: "no-cors" });
        }
        throw err;
      });
  }

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /* Pequeña lluvia de confeti dorado y plateado al confirmar */
  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var colors = ["#D4B57A", "#EAD9B0", "#C5CAD3", "#F4F5F7", "#A8864A"];
    for (var i = 0; i < 46; i++) {
      var p = document.createElement("span");
      p.className = "confetti";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 2.2 + Math.random() * 2 + "s";
      p.style.animationDelay = Math.random() * 0.6 + "s";
      p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      document.body.appendChild(p);
      p.addEventListener("animationend", function () { this.remove(); });
    }
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initProgress();
    initCountdown();
    initCalendar();
    initWhatsApp();
    initRSVP();
  });
})();
