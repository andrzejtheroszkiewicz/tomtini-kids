/* Variante „Zwei Wege“: der Generator steht direkt unter dem Hero und beginnt mit einer Wahl.
   „Bin müde“  → nur der Name, danach sofort die drei Drucksachen; der Rest der Seite bleibt zu.
   „Entdecken“ → der Generator in Schritten, danach die ganze Seite wie gewohnt.
   Muster aus der Bibliothek: Einstieg als große Wahl (Persona Kids Clinic) und „Ein Entscheid pro Bildschirm“.
   Aktiv nur mit ?wege in der Adresse oder window.TOMTINI_WEGE = true. */
(function () {
  var an = window.TOMTINI_WEGE === true || /(^|[?&])wege\b/.test(location.search);
  if (!an) return;
  var gen = document.getElementById('generator'), hero = document.getElementById('top'), kinder = document.getElementById('kinder');
  if (!gen || !hero || !kinder) return;
  hero.insertAdjacentElement('afterend', gen);           // Generator direkt unter den Hero
  var wrap = gen.querySelector('.wrap'), box = gen.querySelector('.gen'), sub = gen.querySelector('.sub');
  if (sub) sub.textContent = 'Zwei Wege, derselbe Zauber.';

  var w = document.createElement('div'); w.className = 'wege-box';
  w.innerHTML =
    '<div class="wahl" role="group" aria-label="Wie wollt ihr anfangen?">' +
      '<button type="button" class="wahl-k" data-weg="muede"><b>Feierabend</b><span>Ihr seid müde? Dann geht es hier ganz schnell.</span><i class="btn btn-primary wahl-pfeil" aria-hidden="true">→</i></button>' +
      '<button type="button" class="wahl-k" data-weg="entdecken"><b>Abenteuer</b><span>Alles, mit allem Drum und Dran.</span><i class="btn btn-primary wahl-pfeil" aria-hidden="true">→</i></button>' +
    '</div>' +
    '<div class="muede" hidden>' +
      '<label class="muede-l" for="muedeName">Namen der Kinder</label>' +
      '<input type="text" id="muedeName" placeholder="z. B. Lina, Paul" autocomplete="off">' +
      '<div class="muede-druck">' +
        '<button type="button" class="btn btn-primary" data-druck="pBriefe">Alle 24 Briefe drucken</button>' +
        '<button type="button" class="btn btn-primary" data-druck="pPlan">Elternplan drucken</button>' +
        '<a class="btn btn-primary" href="papierhaus/tomtes-haus-papier-boegen.pdf" download>Bastelbögen Tomtes Haus (PDF)</a>' +
        '<a class="btn btn-primary" href="druckpaket/tomtini-druckpaket.pdf" download>Druckpaket (PDF)</a>' +
      '</div>' +
      '<p class="muede-fuss"><button type="button" class="wege-link" data-weg="entdecken">Doch alles ansehen</button> · <button type="button" class="wege-link" data-weg="zurueck">Andere Wahl</button></p>' +
    '</div>' +
    '<p class="wege-zurueck" hidden><button type="button" class="wege-link" data-weg="zurueck">‹ Andere Wahl</button></p>';
  wrap.insertBefore(w, box);
  box.hidden = true;

  var wege = w.querySelector('.wahl'), muede = w.querySelector('.muede'), zur = w.querySelector('.wege-zurueck'), name = w.querySelector('#muedeName');
  function sanft(el) {
    var r = el.getBoundingClientRect();
    if (r.top < 60 || r.top > innerHeight * .6) window.scrollTo({ top: scrollY + r.top - 80, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function setze(weg) {
    document.body.classList.toggle('weg-muede', weg === 'muede');
    wege.hidden = weg !== 'zurueck';
    muede.hidden = weg !== 'muede';
    box.hidden = weg !== 'entdecken';
    zur.hidden = weg !== 'entdecken';
    if (weg === 'muede') { name.value = kinder.value; sanft(gen); if (matchMedia('(hover: hover)').matches) name.focus({ preventScroll: true }); }
    if (weg === 'entdecken') { sanft(gen); }
    if (weg === 'zurueck') { sanft(gen); }
  }
  w.addEventListener('click', function (e) {
    var b = e.target.closest('[data-weg]'); if (b) { setze(b.dataset.weg); return; }
    var d = e.target.closest('[data-druck]'); if (!d) return;
    if (!name.value.trim()) { name.focus(); name.classList.add('fehlt'); return; }
    var out = document.getElementById('out');
    if (!out.dataset.built || !document.getElementById(d.dataset.druck)) {   /* Plan einmal still erzeugen, ohne dass die Seite springt */
      var y = scrollY, form = document.getElementById('form'), go = document.getElementById('go');
      window.__tomtiniSofort = true; if (form.requestSubmit) form.requestSubmit(go); else go.click(); window.__tomtiniSofort = false;
      window.scrollTo({ top: y, behavior: 'instant' });
    }
    var k = document.getElementById(d.dataset.druck); if (k) k.click();
  });
  name.addEventListener('input', function () {
    name.classList.remove('fehlt');
    kinder.value = name.value;
    kinder.dispatchEvent(new Event('input', { bubbles: true }));
    kinder.dispatchEvent(new Event('change', { bubbles: true }));
  });
  /* Wer im müden Weg doch das Menü benutzt, bekommt die ganze Seite zurück */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && document.body.classList.contains('weg-muede') && a.getAttribute('href') !== '#generator') setze('entdecken');
  }, true);
  setze('zurueck');
})();
