/* Tag und Nacht: Die Seite ist hell zwischen Sonnenaufgang und Sonnenuntergang und nachts dunkel (Nachtblau mit Gold).
   Die Sonnenzeiten werden hier selbst berechnet, für Mitteleuropa (Köln), ohne Standortabfrage.
   Wer mit dem Mond-Knopf umschaltet, behält seine Wahl bis zum nächsten Wechsel von Tag zu Nacht; danach gilt wieder die Automatik.
   Ein Wechsel bei offener Seite blendet in 1 Sekunde über (nicht bei „Bewegung reduzieren“).
   Wird im <head> geladen, damit die Seite nicht erst im falschen Modus aufblitzt. */
(function () {
  var LAT = 50.94, LON = 6.96, KEY = 'tomtiniModus2', html = document.documentElement;
  try { localStorage.removeItem('tomtiniModus'); } catch (e) {}   /* alte Dauer-Einstellung ablösen */

  function sonne(t) {   /* [Aufgang, Untergang] als Zeitstempel für den Tag von t (NOAA-Näherung, genau auf wenige Minuten) */
    var d = new Date(t), y = d.getFullYear(), rad = Math.PI / 180;
    var mitternacht = Date.UTC(y, d.getMonth(), d.getDate());
    var tag = Math.round((mitternacht - Date.UTC(y, 0, 0)) / 864e5);
    var g = 2 * Math.PI / 365 * (tag - 1 + 0.5);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dek = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(dek)) - Math.tan(LAT * rad) * Math.tan(dek)) / rad;
    var mittag = mitternacht + (720 - 4 * LON - eq) * 60000;
    return [mittag - ha * 4 * 60000, mittag + ha * 4 * 60000];
  }
  function nacht(t) { var s = sonne(t); return t < s[0] || t >= s[1]; }
  function naechsterWechsel(t) {
    var s = sonne(t); if (t < s[0]) return s[0]; if (t < s[1]) return s[1];
    var m = new Date(t); m.setDate(m.getDate() + 1); m.setHours(12); return sonne(m.getTime())[0];
  }
  function gewuenscht() {
    var t = Date.now(), o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (o && o.bis > t) return o.m === 'dunkel';
    return nacht(t);
  }
  function ist() { return html.classList.contains('dunkel'); }
  function setzen(dunkel, sanft) {
    if (dunkel === ist()) return;
    if (sanft && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      html.classList.add('modus-wechsel');
      clearTimeout(setzen.t); setzen.t = setTimeout(function () { html.classList.remove('modus-wechsel'); }, 1100);
    }
    html.classList.toggle('dunkel', dunkel);
    try { document.dispatchEvent(new CustomEvent('tomtini-modus', { detail: { dunkel: dunkel } })); } catch (e) {}
  }
  var timer;
  function pruefen() { setzen(gewuenscht(), true); planen(); }
  function planen() { clearTimeout(timer); timer = setTimeout(pruefen, Math.max(1000, Math.min(naechsterWechsel(Date.now()) - Date.now() + 1000, 60000))); }

  window.tomtiniModus = {
    ist: ist,
    umschalten: function () {
      var neu = !ist();
      try { localStorage.setItem(KEY, JSON.stringify({ m: neu ? 'dunkel' : 'hell', bis: naechsterWechsel(Date.now()) })); } catch (e) {}
      setzen(neu, true);
    },
    sonne: sonne
  };
  setzen(gewuenscht(), false);
  planen();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) pruefen(); });
})();
