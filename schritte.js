/* Generator in Schritten (Variante zum Vergleich): eine Frage pro Bildschirm, Weiter/Zurück, Fortschritt sichtbar.
   Muster aus der Bibliothek: „Ein Entscheid pro Bildschirm“ (Take Me To Christmas, Cartier Find Your Love).
   Aktiv nur mit ?schritte in der Adresse oder window.TOMTINI_SCHRITTE = true; sonst bleibt alles wie bisher. */
(function () {
  var an = window.TOMTINI_SCHRITTE === true || /(^|[?&])schritte\b/.test(location.search);
  if (!an) return;
  var form = document.getElementById('form'), mehr = document.getElementById('mehrFelder');
  if (!form || !mehr) return;

  function feld(sel) { var el = form.querySelector(sel); return el ? el.closest('.field') : null; }
  var GRUPPEN = [
    { frage: 'Wie heißen eure Kinder?', felder: [feld('#kinder')] },
    { frage: 'Wie alt ist das jüngste Kind, und wie nennt Tomte euch?', felder: [feld('input[name=alter]'), feld('#eltern')] },
    { frage: 'Wann zieht Tomte ein, und wie viel Zeit habt ihr abends?', felder: [feld('#start'), feld('input[name=aufwand]')] },
    { frage: 'Wie frech darf Tomte sein?', felder: [feld('input[name=streichPlan]')] },
    { frage: 'Was gibt es bei euch?', felder: [feld('#nikolaus'), feld('#tafel')] },
    { frage: 'Wie lange bleibt Tomte, und was mögt ihr?', felder: [feld('input[name=bleibt]'), feld('#essen'), feld('#ritual')] }
  ];
  var go = document.getElementById('go');
  var hinweis = go.nextElementSibling;

  var box = document.createElement('div'); box.className = 'wiz';
  box.innerHTML = '<div class="wiz-kopf"><span id="wizZahl"></span><button type="button" class="wiz-gleich" id="wizGleich">Gleich Plan erstellen</button></div>' +
    '<div class="wiz-balken"><span id="wizFill"></span></div>';
  var steps = GRUPPEN.map(function (g, i) {
    var s = document.createElement('div'); s.className = 'wiz-step'; s.hidden = i > 0;
    s.innerHTML = '<h3 class="wiz-frage">' + g.frage + '</h3>';
    g.felder.forEach(function (f) { if (f) s.appendChild(f); });
    box.appendChild(s); return s;
  });
  var nav = document.createElement('div'); nav.className = 'wiz-nav';
  nav.innerHTML = '<button type="button" class="btn btn-ghost" id="wizZurueck">Zurück</button><button type="button" class="btn btn-primary" id="wizWeiter">Weiter</button>';
  box.appendChild(nav);
  form.insertBefore(box, form.firstChild);
  mehr.hidden = true;
  nav.appendChild(go);
  form.classList.add('wiz-an');

  var i = 0, N = steps.length;
  function zeigen(neu, scrollen) {
    steps[i].hidden = true; i = neu; steps[i].hidden = false;
    document.getElementById('wizZahl').textContent = 'Schritt ' + (i + 1) + ' von ' + N;
    document.getElementById('wizFill').style.width = ((i + 1) / N * 100) + '%';
    document.getElementById('wizZurueck').style.visibility = i === 0 ? 'hidden' : 'visible';
    document.getElementById('wizWeiter').hidden = i === N - 1;
    go.hidden = i !== N - 1;
    document.getElementById('wizGleich').hidden = i === N - 1;
    if (scrollen) {
      var r = form.getBoundingClientRect();
      if (r.top < 60 || r.top > innerHeight * .5) window.scrollTo({ top: scrollY + r.top - 80, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      var f = steps[i].querySelector('input[type=text],input[type=date]');
      if (f && matchMedia('(hover: hover)').matches) f.focus({ preventScroll: true });
    }
  }
  document.getElementById('wizWeiter').addEventListener('click', function () { if (i < N - 1) zeigen(i + 1, true); });
  document.getElementById('wizZurueck').addEventListener('click', function () { if (i > 0) zeigen(i - 1, true); });
  var sofort = false;
  document.getElementById('wizGleich').addEventListener('click', function () { sofort = true; if (form.requestSubmit) form.requestSubmit(go); else go.click(); sofort = false; });
  /* Enter in einem Textfeld führt zum nächsten Schritt, erst im letzten entsteht der Plan */
  document.addEventListener('submit', function (e) {
    if (e.target !== form) return;
    if (i < N - 1 && !sofort && !window.__tomtiniSofort) { e.preventDefault(); e.stopImmediatePropagation(); zeigen(i + 1, true); }
  }, true);
  if (hinweis && hinweis.classList.contains('help')) form.appendChild(hinweis);
  zeigen(0, false);
})();
