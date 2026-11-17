/*! tomtini.kids · anonymer Zähler. Keine Cookies, keine Kennungen, keine Eingaben aus dem Generator. Respektiert „Do Not Track“ und Global Privacy Control. */
(function () {
  "use strict";
  try {
    var nav = navigator, host = location.hostname;
    if (host !== "tomtini.kids" && host !== "www.tomtini.kids") return;
    // Gezählt wird bei fundini.kids (Schwesterprojekt, gleicher Betreiber); dort liegt der gemeinsame Monitor.
    var ZIEL = "https://fundini.kids/api/t";

    // Eigene Geräte des Betreibers: tomtini.kids/#nicht-zaehlen schaltet die Zählung auf diesem Gerät ab,
    // tomtini.kids/#zaehlen wieder an. Nur dafür wird ein Merker im Browser abgelegt, bei Besuchern nie.
    var MERKER = "tomtini-eigen";
    function eigenesGeraet() {
      var h = location.hash;
      if (h !== "#nicht-zaehlen" && h !== "#zaehlen") return;
      try { if (h === "#zaehlen") localStorage.removeItem(MERKER); else localStorage.setItem(MERKER, "1"); } catch (e) {}
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      var t = document.getElementById("toast");
      if (t) { t.textContent = h === "#zaehlen" ? "Dieses Gerät zählt wieder mit." : "Dieses Gerät wird nicht mehr mitgezählt."; t.style.display = "block"; clearTimeout(t._t); t._t = setTimeout(function () { t.style.display = "none"; }, 5000); }
    }
    eigenesGeraet();
    window.addEventListener("hashchange", eigenesGeraet);
    function aus() { try { return localStorage.getItem(MERKER) === "1"; } catch (e) { return false; } }
    if (aus()) return;
    if (nav.doNotTrack === "1" || window.doNotTrack === "1" || nav.globalPrivacyControl === true) return;

    function refOf() {
      try {
        var q = new URLSearchParams(location.search).get("utm_source");
        if (q) { q = q.toLowerCase(); if (/^(instagram|facebook|whatsapp|pinterest|google|newsletter|linkedin|x|tiktok|youtube|fundini)$/.test(q)) return q; }
      } catch (e) {}
      var r = document.referrer;
      if (!r) return "direkt";
      var h = ""; try { h = new URL(r).hostname.replace(/^www\./, ""); } catch (e) { return "direkt"; }
      if (h === "tomtini.kids" || h === location.hostname) return "direkt";
      if (h === "fundini.kids") return "fundini";
      if (/(^|\.)instagram\.com$/.test(h)) return "instagram";
      if (/(^|\.)google\./.test(h)) return "google";
      if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(h)) return "facebook";
      if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(h)) return "whatsapp";
      if (/(^|\.)pinterest\./.test(h)) return "pinterest";
      if (/(^|\.)bing\.com$/.test(h)) return "bing";
      if (/(^|\.)duckduckgo\.com$/.test(h)) return "duckduckgo";
      if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(h)) return "x";
      if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(h)) return "linkedin";
      if (/(^|\.)tiktok\.com$/.test(h)) return "tiktok";
      if (/(^|\.)(youtube\.com|youtu\.be)$/.test(h)) return "youtube";
      return "andere";
    }
    var w = window.innerWidth || 1024;
    var R = refOf(), D = w < 600 ? "mobil" : w < 1024 ? "tablet" : "desktop";
    var G = ((nav.language || "").slice(0, 2) || "x").toLowerCase();

    // Gesendet wird nur: Ereignisname, festes Label, Herkunft, Gerätegröße, Browsersprache. Nie der Link (#p=…) und nie eine Eingabe.
    function send(n, l, beimGehen) {
      if (aus()) return;
      var body = JSON.stringify({ n: n, l: l || "", r: R, d: D, g: G });
      function bake() { try { return !!(nav.sendBeacon && nav.sendBeacon(ZIEL, new Blob([body], { type: "text/plain" }))); } catch (e) { return false; } }
      if (beimGehen && bake()) return;
      try { fetch(ZIEL, { method: "POST", body: body, keepalive: true, mode: "no-cors", credentials: "omit", headers: { "Content-Type": "text/plain" } }).catch(function () {}); }
      catch (e) { if (!beimGehen) bake(); }
    }
    // Jeden Schritt nur einmal pro Seitenaufruf zählen
    var done = {};
    function once(n, l) { var k = n + ":" + (l || ""); if (done[k]) return; done[k] = 1; send(n, l); }

    send("pv");

    // Plan im Bild: neu erstellt, vom letzten Besuch noch auf dem Gerät oder über einen Plan-Link geöffnet
    var planDa = false;
    function plan(l) { if (planDa) return; planDa = true; send("plan", l); }
    var out = document.getElementById("out");
    if (out && out.dataset.built) plan(location.hash.indexOf("#p=") === 0 ? "link" : "wieder");
    var form = document.getElementById("form");
    if (form) form.addEventListener("submit", function () { plan("neu"); });

    var art = "";
    function vorschau(a) { art = a; once("vorschau", a); }
    document.addEventListener("click", function (e) {
      var t = e.target; if (!t || !t.closest) return;
      if (t.closest("#kal [data-open]")) return once("tag");
      if (t.closest("#pBriefe")) return vorschau("briefe");
      if (t.closest("#pPlan")) return vorschau("plan");
      if (t.closest("#pChronik")) return vorschau("chronik");
      if (t.closest("#gPrint")) return vorschau("geschichte");
      if (t.closest("#ovPrint")) return vorschau("notfall");
      if (t.closest("#pvPrint")) { if (art) once("druck", art); return; }
      if (t.closest("#pLink")) return once("planlink");
      if (t.closest("#notfallGrid button")) return once("notfall", "nacht");
      if (t.closest("#tagGrid button")) return once("notfall", "tag");
      if (t.closest("#hilfeGrid button")) return once("notfall", "hilfe");
    }, true);

    // Gewählte Streich-Stufe: einmal, wenn die Seite mit einem Plan verlassen wird
    function gehen() {
      if (!planDa || done.streich) return;
      var r = document.querySelector("input[name=streichPlan]:checked");
      if (!r) return;
      done.streich = 1; send("streich", r.value, true);
    }
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") gehen(); });
    window.addEventListener("pagehide", gehen);
  } catch (e) {}
})();
