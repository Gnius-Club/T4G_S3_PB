/* ============================================================
   PLAYBOOKS DOCENTES · script.js v2
   Motor único para todos los Playbooks. Contrato con style.css v2.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Persistencia segura (localStorage puede no existir) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* noop */ } }
  };

  /* ---------- Dark mode ---------- */
  const themeInput = document.getElementById("toggle-theme");
  function applyTheme(dark) {
    document.body.classList.toggle("dark", dark);
    if (themeInput) themeInput.checked = dark;
  }
  applyTheme(store.get("pb-dark") === "1");
  if (themeInput) themeInput.addEventListener("change", () => {
    const dark = themeInput.checked;
    applyTheme(dark);
    store.set("pb-dark", dark ? "1" : "0");
  });

  /* ---------- Modo reloj (opcional, apagado por default) ---------- */
  const relojInput = document.getElementById("toggle-reloj");
  function applyReloj(on) {
    document.body.classList.toggle("reloj-on", on);
    if (relojInput) relojInput.checked = on;
  }
  applyReloj(store.get("pb-reloj") === "1");
  if (relojInput) relojInput.addEventListener("change", () => {
    const on = relojInput.checked;
    applyReloj(on);
    store.set("pb-reloj", on ? "1" : "0");
    if (!on) stopAllTimers();
  });

  /* ---------- Utilidades de tiempo ---------- */
  const fmt = (s) =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  /* ---------- Timer global (duración en data-duracion del span, default 40 min) ---------- */
  const gDisplay = document.getElementById("global-timer");
  const gStart = document.getElementById("global-start-stop");
  const gReset = document.getElementById("global-reset");
  let gTotal = gDisplay ? (parseInt(gDisplay.dataset.duracion, 10) || 2400) : 2400;
  let gLeft = gTotal, gInt = null;

  function gPaint() {
    if (!gDisplay) return;
    gDisplay.textContent = fmt(gLeft);
    gDisplay.style.color = gLeft <= 60 ? "var(--risk)" : gLeft <= 300 ? "var(--warn)" : "";
  }
  function gStop() {
    clearInterval(gInt); gInt = null;
    if (gStart) gStart.textContent = "Iniciar";
  }
  if (gStart) gStart.addEventListener("click", () => {
    if (gInt) { gStop(); return; }
    gStart.textContent = "Pausar";
    gInt = setInterval(() => {
      if (--gLeft <= 0) { gLeft = 0; gPaint(); gStop(); }
      else gPaint();
    }, 1000);
  });
  if (gReset) gReset.addEventListener("click", () => { gStop(); gLeft = gTotal; gPaint(); });
  gPaint();

  /* ---------- Timers por bloque ---------- */
  const activos = new Map();
  function stopBlockTimer(btn) {
    const st = activos.get(btn);
    if (st) { clearInterval(st.int); activos.delete(btn); }
    btn.classList.remove("running");
    btn.textContent = "Iniciar";
    const disp = btn.parentElement.querySelector(".timer-display");
    if (disp) { disp.textContent = fmt(parseInt(btn.dataset.duracion, 10) || 0); disp.style.color = ""; }
  }
  function stopAllTimers() {
    document.querySelectorAll(".timer-start-btn").forEach(stopBlockTimer);
    gStop();
  }
  document.querySelectorAll(".timer-start-btn").forEach((btn) => {
    const disp = btn.parentElement.querySelector(".timer-display");
    const dur = parseInt(btn.dataset.duracion, 10) || 0;
    if (disp) disp.textContent = fmt(dur);
    btn.addEventListener("click", () => {
      if (activos.has(btn)) { stopBlockTimer(btn); return; }
      let left = dur;
      btn.classList.add("running");
      btn.textContent = "Detener";
      const int = setInterval(() => {
        left--;
        if (disp) {
          disp.textContent = fmt(Math.max(left, 0));
          disp.style.color = left <= 30 ? "var(--risk)" : left <= 60 ? "var(--warn)" : "";
        }
        if (left <= 0) stopBlockTimer(btn);
      }, 1000);
      activos.set(btn, { int });
    });
  });

  /* ---------- Colapsables ---------- */
  document.querySelectorAll(".collapsible-button").forEach((b) => {
    b.addEventListener("click", () => {
      b.classList.toggle("open");
      const c = b.nextElementSibling;
      if (c) c.classList.toggle("active");
    });
  });

  /* ---------- Copiar prompt ---------- */
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pre = btn.parentElement.querySelector("pre");
      if (!pre) return;
      const done = () => {
        const orig = btn.innerHTML;
        btn.innerHTML = "Copiado";
        setTimeout(() => { btn.innerHTML = orig; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(done).catch(done);
      } else done();
    });
  });

  /* ---------- Navegación de la Ruta ---------- */
  const links = Array.from(document.querySelectorAll(".trail-link"));
  const cards = Array.from(document.querySelectorAll(".bloque-card"));
  const fill = document.querySelector(".progress-trail .fill");
  const prevBtns = document.querySelectorAll(".bloque-nav .prev");
  const nextBtns = document.querySelectorAll(".bloque-nav .next");
  let idx = 0;

  function show(i) {
    if (i < 0 || i >= cards.length) return;
    idx = i;
    cards.forEach((c, j) => c.classList.toggle("active", j === i));
    links.forEach((l, j) => {
      l.classList.toggle("active", j === i);
      l.classList.toggle("done", j < i);
    });
    if (fill) fill.style.width = (cards.length > 1 ? (i / (cards.length - 1)) * 100 : 100) + "%";
    document.querySelectorAll(".bloque-nav .prev").forEach((b) => (b.disabled = i === 0));
    document.querySelectorAll(".bloque-nav .next").forEach((b) => (b.disabled = i === cards.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  links.forEach((l, i) =>
    l.addEventListener("click", (e) => { e.preventDefault(); show(i); })
  );
  prevBtns.forEach((b) => b.addEventListener("click", () => show(idx - 1)));
  nextBtns.forEach((b) => b.addEventListener("click", () => show(idx + 1)));
  if (cards.length) show(0);
})();
