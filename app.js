(function(){
  const C = window.TOMTINI;
  const $ = s => document.querySelector(s);
  const state = { modes: {}, dayLevel: {}, done: {}, answers: {} };
  const MON = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const MONL = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const WD = ["So","Mo","Di","Mi","Do","Fr","Sa"];
  const KEY = "tomtini-plan-v3";
  const PROPFREI = new Set([4,5,9,12,14,16,18]); // Briefe, die ohne Requisite funktionieren

  function toast(t){ const el=$('#toast'); el.textContent=t; el.style.display="block"; clearTimeout(el._t); el._t=setTimeout(()=>el.style.display="none",2200); }

  // ---- Zustand ----
  const F = { kinder:'#kinder', eltern:'#eltern', start:'#start', ritual:'#ritual', essen:'#essen' };
  function formState(){ const o={}; for(const k in F) o[k]=$(F[k]).value; o.aufwand=val('aufwand'); o.alter=val('alter'); o.nikolaus=$('#nikolaus').checked; o.lego=$('#lego').checked; o.figur=$('#figur').checked; o.haustier=$('#haustier').checked; o.klein=$('#klein').checked; o.suess=$('#suess').checked; o.tafel=$('#tafel').value; o.bleibt=val('bleibt'); o.modes=state.modes; o.dayLevel=state.dayLevel; o.done=state.done; o.answers=state.answers; o.nope=state.nope||{}; return o; }
  function val(n){ const r=document.querySelector('input[name='+n+']:checked'); return r?r.value:""; }
  function setRadio(n,v){ const r=document.querySelector('input[name='+n+'][value="'+v+'"]'); if(r) r.checked=true; }
  function applyState(o){ if(!o) return; try{ for(const k in F) if(o[k]!=null) $(F[k]).value=o[k]; if(o.aufwand) setRadio('aufwand',o.aufwand); if(o.alter) setRadio('alter',o.alter); if(o.bleibt) setRadio('bleibt',o.bleibt); if(o.tafel) $('#tafel').value=o.tafel; ['nikolaus','lego','figur','haustier','klein','suess'].forEach(k=>{ if(typeof o[k]==="boolean") $('#'+k).checked=o[k]; }); state.modes=o.modes||{}; state.dayLevel=o.dayLevel||{}; state.done=o.done||{}; state.answers=o.answers||{}; state.nope=o.nope||{}; }catch(e){} }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(formState())); }catch(e){} }
  function load(){ try{ const h=location.hash; if(h.startsWith('#p=')){ applyState(JSON.parse(decodeURIComponent(escape(atob(h.slice(3).replace(/-/g,'+').replace(/_/g,'/')))))); return true; } }catch(e){}
    try{ const o=JSON.parse(localStorage.getItem(KEY)||"null"); if(o){ applyState(o); return !!o.kinder; } }catch(e){} return false; }
  function planLink(){ const b=btoa(unescape(encodeURIComponent(JSON.stringify(formState())))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); return location.origin+location.pathname+"#p="+b; }

  // ---- Helfer ----
  function startDate(){ const v=$('#start').value; return v ? new Date(v+"T00:00:00") : new Date(2026,11,1); }
  function dateOf(i){ const d=new Date(startDate()); d.setDate(d.getDate()+i); return d; }
  function fmt(d){ return WD[d.getDay()]+" "+d.getDate()+". "+MON[d.getMonth()]; }
  function isWE(d){ return d.getDay()===0||d.getDay()===6; }
  let onlyName=null;
  function vonName(v){ return v==="rubi"?"Rubi":v==="mimi"?"Mimi":v==="eltern"?"den Großen":"Tomte"; }
  function allNames(){ return $('#kinder').value.split(/[,;]+/).map(s=>s.trim()).filter(Boolean); }
  function nameList(){ return onlyName?[onlyName]:allNames(); }
  function plural(){ return nameList().length!==1; }
  function joinNames(a){ if(!a.length) return "ihr Lieben"; if(a.length===1) return a[0]; return a.slice(0,-1).join(", ")+" und "+a[a.length-1]; }
  function names(){ return joinNames(nameList()); }
  function verdreht(n){ const m={a:"u",e:"i",i:"e",o:"a",u:"o",ä:"ö",ö:"ü",ü:"ä"}; let done=false; let out=n.split("").map(ch=>{ const l=ch.toLowerCase(); if(!done && m[l]){ done=true; const r=m[l]; return ch===l? r : r.toUpperCase(); } return ch; }).join(""); if(out===n) out=n.slice(0,-1)+"o"; return out; }
  function namesFalsch(){ const a=nameList(); return a.length? joinNames(a.map(verdreht)) : "Kind und Kind"; }
  function eltern(){ return $('#eltern').value.trim()||val('elternChip')||"die Großen"; }
  function finaleStr(){ const d=dateOf(23); return d.getDate()+". "+MONL[d.getMonth()]; }
  function fill(t){ const pl=plural();
    return t.replace(/\{([^{}|]*)\|([^{}|]*)\}/g,(m,a,b)=>pl?a:b)
      .replace(/\{kinderfalsch\}/g,namesFalsch()).replace(/\{kinder\}/g,names()).replace(/\{eltern\}/g,eltern())
      .replace(/\{essen\}/g,$('#essen').value.trim()||(pl?"das, was ihr mir gesagt habt":"das, was du mir gesagt hast"))
      .replace(/\{ritual\}/g,$('#ritual').value.trim()||(pl?"das, was ihr mir erzählt habt":"das, was du mir erzählt hast")).replace(/\{finale\}/g,finaleStr()); }
  function kurz(){ return val('alter')==="3"; }
  function showPS(){ return kurz() && plural(); }
  function wantsExtra(i){ if(state.dayLevel[i]) return state.dayLevel[i]==="we"; return val('aufwand')==="we" && isWE(dateOf(i)); }
  function todayIndex(){ const t=new Date(); t.setHours(0,0,0,0); return Math.round((t-startDate())/86400000); }

  // ---- Kalender ----
  function buildCal(){ const cal=$('#cal'); cal.innerHTML="";
    for(let i=0;i<24;i++){ const d=dateOf(i); const b=document.createElement('button'); b.type="button"; b.dataset.mode=state.modes[i]||"";
      b.innerHTML=`<span>${d.getDate()}</span><small>${WD[d.getDay()]}</small>`; b.title=["normal","wenig Zeit","unterwegs"][["","wenig","reise"].indexOf(b.dataset.mode)];
      b.onclick=()=>{ const seq=["","wenig","reise"]; const n=seq[(seq.indexOf(state.modes[i]||"")+1)%3]; if(n) state.modes[i]=n; else delete state.modes[i]; buildCal(); rerender(); };
      cal.appendChild(b); } }

  // ---- Bausteine ----
  function briefParas(day,i){ const k=kurz(); let paras;
    if(day.variante==="nikolaus"){ const d=dateOf(i); const isNik=$('#nikolaus').checked && d.getMonth()===11 && d.getDate()===6; paras = isNik ? (k&&day.kurz?day.kurz:day.brief) : (k&&day.kurzAlt?day.kurzAlt:day.briefAlt); }
    else paras=(k&&day.kurz)?day.kurz:day.brief;
    if(state.nope&&state.nope[i-1]&&day.ohne){ paras=paras.slice(); paras[1]=day.ohne; }
    if(day.januarZusatz&&val('bleibt')!=="24"){ paras=paras.slice(); paras.splice(paras.length-2,0,day.januarZusatz); }
    return paras; }
  function vorabendParas(){ const v=C.vorabend; if($('#figur').checked && !kurz()) return v.briefFigur; return kurz()&&v.kurz?v.kurz:v.brief; }
  function letterHTML(paras,ps){ return `<div class="letter">${paras.map(p=>`<p>${fill(p)}</p>`).join("")}</div>`+(ps&&showPS()?`<div class="ps">${fill(ps)}</div>`:""); }
  function zettelHTML(z){ return `<div class="zettel"><span class="who ${z.von}">${z.von.charAt(0).toUpperCase()+z.von.slice(1)}</span><em>„${fill(z.text)}“</em></div>`; }
  function lego(x){ if($('#lego').checked) return x; return x.replace(/Klemmbausteine/g,"Pappe oder Schachteln").replace(/Bausteinen/g,"Schachteln").replace(/Bausteine/g,"Schachteln"); }
  const BAUTEILE=new Set([15,17,19,21]);
  function tafelObj(){ const id=$('#tafel').value; return C.tafel.find(t=>t.id===id)||C.tafel[0]; }
  function zahlHTML(day){ const t=tafelObj();
    return `<div class="zug"><span class="t">Zahlentafel: heute die ${day.n} <span class="minbadge">1 Min · nachts</span></span><span>${day.n===1?"Die 1 steht seit dem JA-Abend. Ab heute jede Nacht die neue Zahl: "+t.t.toLowerCase()+".":"Zahl auf "+day.n+" wechseln ("+t.t.toLowerCase()+"). Das ist das Türchen, Tomte hat nachts gebaut."}</span></div>`; }
  function suessHTML(day){ if(!$('#suess').checked) return ""; const x=C.suess.tage[day.n]; if(!x) return "";
    return `<div class="zug"><span class="t">Etwas Süßes <span class="minbadge">dazu</span></span><span>${x}${plural()?" Bei mehreren Kindern pro Kind dasselbe.":""} Steht nicht im Brief.</span></div>`; }
  function basisHTML(day,i){ const b=day.basis; if(!b) return ""; const mode=state.modes[i];
    if(val('aufwand')==="briefe"&&!mode&&day.n){ return `<div class="zug"><span class="t">Nur-Briefe-Modus <span class="minbadge">1 Min · abends</span></span><span>Brief hinlegen, Zahl umstecken, fertig. Die Requisite dieses Tages entfällt, der Brief funktioniert ohne.${BAUTEILE.has(day.n)?" Dieser Tag hat ein Bauteil fürs Finale ("+b.t+"); freiwillig, das Finale geht auch ohne: Dann ist die Chronik allein das Geschenk.":""}</span></div>`; }
    let x=lego(b.x); const pf = PROPFREI.has(day.n);
    let head = `<span class="t">Das braucht der Brief: ${b.t} <span class="minbadge">${b.min} Min · ${b.zeit}</span></span>`;
    if(mode==="wenig") head += pf ? `<span class="m">Wenig Zeit: Dieser Brief funktioniert auch ganz ohne Vorbereitung.</span>` : `<span class="m">Wenig Zeit: Heute nur das Nötigste, kein Extra.</span>`;
    return `<div class="zug">${head}<span>${x}</span><span class="m">Material: ${lego(b.m)}</span></div>`; }
  function extraHTML(day,i){ const e=day.extra; if(!e||!wantsExtra(i)||state.modes[i]) return ""; return `<div class="zug"><span class="t">Wochenend-Zugabe: ${e.t} <span class="minbadge">${e.min} Min · tagsüber</span></span><span>${lego(e.x)}</span><span class="m">Material: ${lego(e.m)}</span></div>`; }
  function haustierHint(day){ if(!$('#haustier').checked) return ""; const h={1:"Haustier: Mehlspur auf einem Tablett oder Regalbrett, nicht auf dem Boden. Hunde lecken Mehl weg.",2:"Haustier: kein Salzteig (giftig für Hunde), keine Kleinteile auf dem Boden.",4:"Haustier: Mehlspur erhöht legen, Feder außer Reichweite.",6:"Haustier: Zapfen außer Reichweite verstecken, keine Nüsse.",7:"Haustier: Socke und Watte sofort in die Kiste, nicht liegen lassen.",8:"Haustier: Socken vor der Tür sind für Hunde eine Einladung. Hinlegen, wenn die Kinder schon wach sind.",10:"Haustier: Essbares erst morgens hinlegen, Kekse nicht vor die Tür.",15:"Haustier: Kleine Bausteine abends in die Kiste.",17:"Haustier: Laterne erhöht stellen, Katzen stoßen sie um. Nur Batterie-Licht.",20:"Haustier: Mimi nicht in Hausschuhe verstecken, die der Hund kennt.",24:"Haustier: Mimis Bett und das Geschenk erhöht, auf einem Regalbrett neben der Tür."}; return h[day.n]?`<p class="tipp"><b>Haustier:</b> ${h[day.n].replace("Haustier: ","")}</p>`:""; }
  function doneBtn(i){ return `<button type="button" class="done-btn" data-done="${i}" aria-pressed="${!!state.done[i]}">${state.done[i]?"Vorbereitet ✓":"Als vorbereitet markieren"}</button>`; }
  function answerHTML(i,label){ return `<div class="antwort"><label for="a${i}">${label}</label><textarea id="a${i}" data-ans="${i}" placeholder="Für die Chronik am Ende: was die Kinder geantwortet, gemalt oder gesagt haben">${state.answers[i]||""}</textarea></div>`; }
  function dayBody(day,i){ let h=""; const mode=state.modes[i];
    if(day.brief) h+=letterHTML(briefParas(day,i),day.ps);
    if(day.zettelDoppel) h+=day.zettelDoppel.map(zettelHTML).join(""); else if(day.zettel) h+=zettelHTML(day.zettel);
    if(mode==="reise"){ const r=C.notfall.find(n=>n.id==="reise"); h+=`<div class="zug"><span class="t">Ihr seid unterwegs. Tomte reist mit.</span><span>Diesen Brief am Abend vor der Abfahrt legen. Unterwegs reicht eine kleine Spur pro Abend. Dieser Tag entfällt sonst.</span></div>`+letterHTML(kurz()&&r.kurz?r.kurz:r.brief); }
    else { h+=zahlHTML(day)+basisHTML(day,i)+extraHTML(day,i); }
    const nxt=C.tage[i+1]; if(nxt&&nxt.ohne){ h+=`<p class="tipp"><b>Keine Lust gehabt?</b> Nicht gemacht heißt: nichts passiert, Tomte erwähnt es nicht. <button type="button" class="btn btn-ghost btn-mini" data-nope="${i}">${state.nope&&state.nope[i]?"Morgen-Brief ohne Dank ✓":"Morgen-Brief ohne Dank"}</button></p>`; }
    h+=suessHTML(day); if($('#klein').checked&&C.klein[day.n]) h+=`<div class="zug"><span class="t">Kleinigkeit <span class="minbadge">Türchen ${day.n}</span></span><span>${lego(C.klein[day.n])}${plural()?" Bei mehreren Kindern: pro Kind eins.":""} Ohne Begründung hinlegen, Tomte erwähnt sie nicht.</span></div>`;
    h+=`<p class="tipp"><b>Für euch:</b> ${day.tipp}</p>`+haustierHint(day); return h; }

  function januarList(){ const b=val('bleibt'); if(b==="24") return []; return C.januar.filter(j=>b==="31"||j.datum<="01-06"); }
  function janDate(j){ const y=startDate().getFullYear()+1; const [m,d]=j.datum.split("-"); return new Date(y,+m-1,+d); }
  function januarHTML(){ const L=januarList(); if(!L.length) return ""; let h=`<div class="kap"><h3>Nachspiel · Januar, Tomte ist müde</h3></div>`;
    L.forEach((j,k)=>{ const key="j"+k; let paras=(kurz()&&j.kurz?j.kurz:j.brief).slice(); if(j.briefEnde&&val('bleibt')==="6") paras.push(j.briefEnde); h+=`<div class="day ${state.done[key]?"done":""}"><div class="day-head"><span class="num">☾</span><h4>${j.titel}</h4><span class="date">${fmt(janDate(j))} · von ${j.von==="rubi"?"Rubi":"Tomte"}</span></div>${letterHTML(paras)}<div class="zug"><span class="t">${j.basis.t} <span class="minbadge">${j.basis.min} Min · ${j.basis.zeit}</span></span><span>${j.basis.x}</span><span class="m">Material: ${j.basis.m}</span></div><p class="tipp"><b>Für euch:</b> ${j.tipp}</p>${doneBtn(key)}</div>`; });
    return h; }

  // ---- Geschichte und Medien ----
  function buildGeschichte(){
    var G=C.geschichte; if(!G) return;
    $('#gTitel').textContent=G.titel; $('#gUnter').textContent=G.unter;
    $('#gKapitel').innerHTML=G.kapitel.map(function(k){
      return '<details class="kap-item"><summary><span class="num">'+k.n+'</span><span>'+k.t+'</span><span class="wann">'+k.wann+'</span></summary>'+
             '<div class="kap-text">'+k.text.map(function(t){return '<p>'+t+'</p>';}).join("")+'</div></details>';
    }).join("");
    $('#gEltern').innerHTML='<b>Für euch:</b> '+G.eltern;
    $('#gPrint').onclick=function(){
      var cells=C.geschichte.kapitel.map(function(k){
        return '<div class="sheet"><p class="eyebrow">Kapitel '+k.n+' · vorlesen '+k.wann+'</p><h3 class="pt">'+k.t+'</h3>'+
               k.text.map(function(t){return '<p class="gp">'+t+'</p>';}).join("")+'</div>';
      }).join("");
      openPV(C.geschichte.titel,'<style>.gp{font-size:12pt;line-height:1.75;margin:0 0 9pt;max-width:38em}</style>'+cells,
        "Sieben Seiten. Am Abend vor dem Einzug vorlesen, oder eines pro Tag in der ersten Woche.");
    };
  }
  const MED=(C.medien||[]).filter(function(m){return m.status!=="fertig";});
  function buildMedien(){
    if(!C.medien) return;
    $('#medienGrid').innerHTML=MED.map(function(m,i){
      var fertig=m.status==="fertig";
      return '<div class="med"><span class="typ">'+m.typ+'</span><h4>'+m.t+'</h4><p>'+m.x+'</p>'+
        '<p class="wann">'+m.wann+'</p>'+
        '<div class="acts">'+
          (fertig?'<a class="btn btn-ghost" href="'+m.datei+'" target="_blank" rel="noopener">Öffnen</a>'
                 :'<button type="button" class="btn btn-ghost" data-skript="'+i+'">Text zeigen</button><span class="tag">Aufnahme folgt</span>')+
        '</div><div id="sk'+i+'"></div></div>';
    }).join("");
    $('#medienGrid').querySelectorAll('[data-skript]').forEach(function(b){
      b.onclick=function(){
        var i=+b.dataset.skript, box=$('#sk'+i), m=MED[i];
        if(box.innerHTML){ box.innerHTML=""; b.textContent="Text zeigen"; return; }
        box.innerHTML='<div class="skript">'+m.skript.join("\n")+'</div><p class="tipp" style="margin-top:9px"><b>Für euch:</b> '+m.eltern+'</p>';
        b.textContent="Text verbergen";
      };
    });
  }

  // ---- Render ----
  function heuteHTML(){ const ti=todayIndex(); // ti = Index des Briefs, der heute Morgen lag; heute Abend bereiten wir ti+1 vor
    if(ti < -2){ const n=-ti-1; return `<div class="heute"><p class="eyebrow">Heute</p><h3>Noch ${n} ${n===1?"Tag":"Tage"} bis zum Einzug</h3><p>Bis dahin: Tür und Briefkasten besorgen oder basteln, Mehl, Backpapier und ein LED-Teelicht mit verschraubtem Batteriefach bereitlegen, Druckpaket drucken, Tomte-Kiste anlegen.</p></div>`; }
    if(ti > 23) return "";
    const prep = ti+1; // -1 = Vorabend vorbereiten (am Abend davor)
    let inner="";
    if(prep===-1){ const v=C.vorabend; inner=`<p class="eyebrow">Heute Abend vorbereiten · Vorabend, ${fmt(dateOf(-1))}</p><h3>${v.titel}</h3>${letterHTML(vorabendParas())}${basisHTML(v,-1)}<p class="tipp"><b>Für euch:</b> ${v.tipp}</p>${doneBtn("v")}`; }
    else if(prep<=23){ const day=C.tage[prep]; inner=`<p class="eyebrow">Heute Abend vorbereiten · Brief für morgen früh, ${fmt(dateOf(prep))}</p><h3>Tag ${day.n} · ${fill(day.titel)}</h3>${dayBody(day,prep)}${doneBtn(prep)}`; }
    else { inner=`<p class="eyebrow">Heute</p><h3>Der letzte Brief lag heute Morgen da.</h3><p>Mimi schläft vor der Tür. Am 6. Januar zieht sie ins Winterquartier.</p>`; }
    const lag = ti>=0 ? `<p class="help">Heute Morgen lag: Tag ${C.tage[ti].n} · ${fill(C.tage[ti].titel)}</p>` : (ti===-1?`<p class="help">Heute Morgen lag: der Zettel von Rubi.</p>`:"");
    return `<div class="heute">${inner}${lag}</div>`; }

  function render(){ buildNotfall(); const out=$("#out"); out.dataset.built="1"; 
    const kapNames={1:"Kapitel 1 · Einzug",2:"Kapitel 2 · Hilfe, die schiefgeht",3:"Kapitel 3 · Tomtes Geheimnis",4:"Kapitel 4 · Abschied"};
    let html=`<div class="out-head"><div><p class="eyebrow">Euer Plan</p><h3>24 Tage für ${names()}</h3></div><div class="actions"><button class="btn btn-primary" id="pBriefe">Briefe drucken</button><button class="btn btn-ghost" id="pPlan">Elternplan</button><button class="btn btn-ghost" id="pChronik">Chronik</button><button class="btn btn-ghost" id="pLink">Plan-Link</button></div></div>`;
    html+=heuteHTML();
    const v=C.vorabend; const vd=dateOf(-1);
    html+=`<div class="kap"><h3>Vorabend · ${fmt(vd)}</h3><div class="day ${state.done.v?"done":""}"><div class="day-head"><span class="num">0</span><h4>${v.titel}</h4><span class="date">Zettel von Rubi</span></div>${letterHTML(vorabendParas())}${basisHTML(v,-1)}${wantsExtra(-1)||val('aufwand')==="we"?`<div class="zug"><span class="t">Wochenend-Zugabe: ${v.extra.t} <span class="minbadge">${v.extra.min} Min · tagsüber</span></span><span>${v.extra.x}</span><span class="m">Material: ${v.extra.m}</span></div>`:""}<div class="zug"><span class="t">${v.ja.t} <span class="minbadge">${v.ja.min} Min · ${v.ja.zeit}</span></span><span>${lego(v.ja.x)}</span><span class="m">Material: ${lego(v.ja.m)}</span></div><p class="tipp"><b>Vorher vorlesen:</b> „Wie Tomte zu euch kam“, Kapitel 1, 2, 3 und 6 (<a href="#geschichte">hier</a>). Danach weiß das Kind, wer da fragt und warum ihn niemand sehen darf.</p><p class="tipp"><b>Wenn das Kind Nein sagt oder zögert:</b> Rubis Warte-Zettel hinlegen, nichts montieren, später oder nächstes Jahr wieder fragen. Zettel: „${fill(v.nein.text)}“</p><p class="tipp"><b>Für euch:</b> ${v.tipp}</p>${doneBtn("v")}</div></div>`;
    let kap=0;
    C.tage.forEach((day,i)=>{ const d=dateOf(i), mode=state.modes[i];
      if(day.kap!==kap){ kap=day.kap; html+=`<div class="kap"><h3>${kapNames[kap]}</h3></div>`; }
      html+=`<div class="day ${mode==="reise"?"reise":""} ${state.done[i]?"done":""}"><div class="day-head"><span class="num">${day.n}</span><h4>${fill(day.titel)}</h4><span class="date">${fmt(d)}${mode==="wenig"?" · wenig Zeit":mode==="reise"?" · unterwegs":""}</span>`;
      if(!mode && day.extra){ const on=wantsExtra(i); html+=`<span class="mode"><button type="button" data-i="${i}" data-l="basis" aria-pressed="${!on}">Nötiges</button><button type="button" data-i="${i}" data-l="we" aria-pressed="${on}">+ Zugabe</button></span>`; }
      html+=`</div>`+dayBody(day,i)+answerHTML(i,"Antwort der Kinder (für die Chronik)")+doneBtn(i)+`</div>`; });
    html+=januarHTML();
    out.innerHTML=html;
    out.querySelectorAll('.mode button').forEach(b=>b.onclick=()=>{ state.dayLevel[b.dataset.i]=b.dataset.l; rerender(); });
    out.querySelectorAll('[data-nope]').forEach(b=>b.onclick=()=>{ state.nope=state.nope||{}; const k=b.dataset.nope; if(state.nope[k]) delete state.nope[k]; else state.nope[k]=1; rerender(); });
    out.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{ const k=b.dataset.done; if(state.done[k]) delete state.done[k]; else state.done[k]=1; rerender(); });
    out.querySelectorAll('textarea[data-ans]').forEach(t=>t.addEventListener('input',()=>{ state.answers[t.dataset.ans]=t.value; save(); }));
    $('#pBriefe').onclick=()=>printBriefe(); $('#pPlan').onclick=()=>printPlan(); $('#pChronik').onclick=()=>printChronik();
    $('#pLink').onclick=()=>{ const l=planLink(); showLink(l); if(navigator.clipboard) navigator.clipboard.writeText(l).then(()=>toast("Plan-Link kopiert")).catch(()=>{}); };
    save(); }
  function showLink(l){ $('#linkField').value=l; $('#linkDlg').classList.add('open'); $('#linkField').focus(); $('#linkField').select(); }
  function rerender(){ buildNotfall(); if($('#out').dataset.built) render(); else save(); }
  $('#form').addEventListener('submit',e=>{ e.preventDefault(); render(); $('#out').scrollIntoView({behavior:"smooth",block:"start"}); });
  document.querySelectorAll('input[name=aufwand],input[name=alter],input[name=bleibt],input[name=elternChip],#nikolaus,#lego,#figur,#haustier,#klein,#suess,#tafel').forEach(el=>el.addEventListener('change',()=>{ if(el.name==="elternChip") $('#eltern').value=""; rerender(); }));
  ['kinder','eltern','ritual','essen'].forEach(id=>$('#'+id).addEventListener('input',()=>{ if(id==="eltern"&&$('#eltern').value) document.querySelectorAll('input[name=elternChip]').forEach(r=>r.checked=false); rerender(); }));
  $('#start').addEventListener('change',()=>{ buildCal(); rerender(); });

  // ---- Notfall ----
  function buildTafel(){ const sel=$('#tafel'); if(sel.options.length) return;
    sel.innerHTML=C.tafel.map(t=>`<option value="${t.id}">${t.t}</option>`).join("");
    const upd=()=>{ const t=tafelObj(); $('#tafelHelp').innerHTML=t.x+' <span class="wer">'+t.wer+'</span>'; };
    sel.onchange=()=>{ upd(); rerender(); }; upd(); }
  function buildNotfall(){ const grid=$('#notfallGrid'); grid.innerHTML="";
    const mk=(id,list)=>{ const g=$(id); g.innerHTML=""; list.forEach(n=>{ if(n.id==="streit"&&!plural()) return; const b=document.createElement('button'); b.innerHTML=`<span>${n.titel}</span><small>Brief von ${vonName(n.von)}</small>`; b.onclick=()=>openNotfall(n); g.appendChild(b); }); };
    mk('#tagGrid',C.tagsueber); mk('#hilfeGrid',C.hilfe);
  C.notfall.forEach(n=>{ if(n.id==="geschwister"&&!plural()) return; const b=document.createElement('button'); b.innerHTML=`<span>${n.titel}</span><small>Brief von ${vonName(n.von)}</small>`; b.onclick=()=>openNotfall(n); grid.appendChild(b); }); } buildTafel(); buildNotfall(); buildGeschichte(); buildMedien();
  function nfParas(n){ return kurz()&&n.kurz?n.kurz:n.brief; }
  function openNotfall(n,who){ const all=allNames(); if(n.einzeln&&all.length>1&&!who){ who=all[0]; } onlyName=who||null;
    $('#ovTitle').textContent=n.titel;
    let sel=""; if(n.einzeln&&all.length>1){ sel=`<p class="tipp" style="margin-bottom:12px"><b>An:</b> ${all.map(x=>`<button type="button" class="btn btn-ghost btn-mini" data-who="${x.replace(/"/g,'')}" aria-pressed="${x===who}">${x}</button>`).join(" ")} <span>Dieser Brief richtet sich an ein einzelnes Kind.</span></p>`; }
    $('#ovLetter').innerHTML=sel+nfParas(n).map(p=>`<p>${fill(p)}</p>`).join("")+(n.auszug?`<p class="tipp"><b>Auszugs-Zettel (wenn das Kind es möchte):</b> ${fill(n.auszug.text)}</p>`:"");
    $('#ovTipp').innerHTML=(n.elternskript?`<b>Zuerst ohne Tomte, außerhalb der Geschichte:</b> ${n.elternskript}<br><br>`:"")+(n.morgen?`<b>Morgens:</b> ${n.morgen}<br><br>`:"")+`<b>Für euch:</b> ${n.tipp}`;
    $('#ovLetter').querySelectorAll('[data-who]').forEach(b=>b.onclick=()=>openNotfall(n,b.dataset.who));
    $('#ov').classList.add('open'); $('#ovPrint').onclick=()=>{ $('#ov').classList.remove('open'); const paras=nfParas(n); printSingle(n.titel+(who?" · für "+who:""),paras,n.von); onlyName=null; }; }
  $('#ovClose').onclick=()=>{ onlyName=null; $('#ov').classList.remove('open'); };
  $('#ov').addEventListener('click',e=>{ if(e.target.id==="ov"){ onlyName=null; $('#ov').classList.remove('open'); } });

  // ---- Druck ----
  function openPV(title,pagesHTML){ $('#pvTitle').textContent=title; $('#pvPages').innerHTML=pagesHTML; $('#pv').classList.add('open'); window.scrollTo(0,0); }
  $('#pvClose').onclick=()=>$('#pv').classList.remove('open');
  $('#pvPrint').onclick=()=>{ let ok=false; try{ const before=Date.now(); window.print(); ok=(Date.now()-before)>150 || !window.frameElement; }catch(e){ ok=false; } if(!ok){ $('#pvHint').style.display="block"; } };
  function cell(tag,paras,note,small,ps){ return `<div class="cell"><div class="tag"><span>${tag}</span><span>Tomtini</span></div><div class="body ${small?"small":""}">${paras.map(p=>`<p>${fill(p)}</p>`).join("")}${ps&&showPS()?`<p style="font-size:11pt;margin-top:2mm">${fill(ps)}</p>`:""}</div>${note?`<div class="note"><b>${vonName(note.von)}</b>„${fill(note.text)}“</div>`:""}</div>`; }
  function sheets(cells,cut){ let out=""; for(let i=0;i<cells.length;i+=4){ const chunk=cells.slice(i,i+4); while(chunk.length<4) chunk.push(`<div class="cell empty"></div>`); out+=`<div class="sheet"><div class="cut">${cut}</div><div class="grid4">${chunk.join("")}</div></div>`; } return out; }
  function printBriefe(){ const cells=[]; cells.push(cell("Vorabend · von Rubi",vorabendParas(),null,false));
    C.tage.forEach((day,i)=>{ const paras=briefParas(day,i); const long=paras.join(" ").length>520;
      if(day.zettelDoppel){ cells.push(cell("Tag "+day.n,paras,null,false)); cells.push(cell("Tag "+day.n+" · Zettel von Mimi",[day.zettelDoppel[0].text],null)); cells.push(cell("Tag "+day.n+" · Zettel von Rubi",[day.zettelDoppel[1].text],null)); return; }
      cells.push(cell("Tag "+day.n,paras,day.zettel||null,long,day.ps)); });
    januarList().forEach(j=>{ let ps=(kurz()&&j.kurz?j.kurz:j.brief).slice(); if(j.briefEnde&&val('bleibt')==="6") ps.push(j.briefEnde); cells.push(cell("Januar · "+j.titel,ps,null,false)); });
    const pushN=(tag,n)=>{ const all=allNames(); if(n.einzeln&&all.length>1){ all.forEach(w=>{ onlyName=w; cells.push(cell(tag+" · "+n.titel+" · für "+w,nfParas(n),null,false)); }); onlyName=null; } else cells.push(cell(tag+" · "+n.titel,nfParas(n),null,false)); if(n.auszug){ cells.push(cell(tag+" · Auszugs-Zettel",[n.auszug.text],null)); } };
    if(C.vorabend.nein) cells.push(cell("Vorabend · Rubis Warte-Zettel (bei Nein)",[C.vorabend.nein.text],null));
    C.notfall.forEach(n=>{ if(n.id==="geschwister"&&!plural()) return; pushN("Notfall",n); });
    C.tagsueber.forEach(n=>pushN("Tagsüber",n));
    C.hilfe.forEach(n=>{ if(n.id==="streit"&&!plural()) return; pushN("Tomte erzählt",n); });
    openPV("Briefe von Tomte",sheets(cells,"An den gestrichelten Linien schneiden, vier Briefe pro Blatt. Ohne Datum, damit nichts verrutscht. Notfall-, Tagsüber- und Hilfe-Briefe kommen in die Tomte-Kiste, für den passenden Moment.")); }
  function printSingle(title,paras,von){ openPV(title,sheets([cell(title+" · von "+vonName(von),paras,null,false)],"Notfall-Brief: ausschneiden und hinlegen.")); }
  function printPlan(){ const rows=[]; const v=C.vorabend;
    const row=(d,label,b,e,mode,n)=>{ const mins=(b?b.min:0)+(e?e.min:0); return `<tr><td class="ck"><span></span></td><td class="d">${fmt(d)}</td><td><strong>${label}</strong>${mode?` <em>(${mode==="wenig"?"wenig Zeit":"unterwegs"})</em>`:""}<div class="mat">${b?b.t+" · "+b.zeit:""}${e?" · Zugabe: "+e.t:""}</div></td><td class="mat">${lego((b?b.m:"")+(e?" · "+e.m:""))}</td><td>${mins}</td></tr>`; };
    rows.push(row(dateOf(-1),"Vorabend · "+v.titel,v.basis,(val('aufwand')==="we"?v.extra:null),null,0));
    rows.push(row(dateOf(-1),"Nach dem JA · "+v.ja.t,v.ja,null,null,0));
    rows.push(row(dateOf(-2),"Vorlesen · "+C.geschichte.titel,{t:"Kapitel 1, 2, 3 und 6",x:"Am Abend davor vorlesen: Woher Tomte kommt, warum ihn niemand sehen darf, wie die Tür entsteht. Kapitel 4 und 5 (Mimi und Rubi) kommen an Tag 2 bis 4 dazu, Kapitel 7 an Tag 1.",m:"Ausdruck oder Bildschirm",min:8,zeit:"zwei Abende vorher"},null,null,0));
    const kl=$('#klein').checked; C.tage.forEach((day,i)=>rows.push(row(dateOf(i),day.n+" · "+fill(day.titel),day.basis,(wantsExtra(i)&&!state.modes[i]?day.extra:null),state.modes[i],day.n)+(kl&&C.klein[day.n]?`<tr><td></td><td></td><td class="mat" colspan="3">Kleinigkeit: ${lego(C.klein[day.n])}</td></tr>`:"")));
    januarList().forEach(j=>rows.push(row(janDate(j),"Januar · "+j.titel,j.basis,null,null,0)));
    const total=rows.length; const head=`<h3 class="pt">Elternplan · 24 Tage mit Tomte</h3><p class="pt-sub">Für ${names()} · Minuten sind ehrlich geschätzt, „abends vorher“ heißt: am Abend vor dem Brief. Vergessen? Notfall-Brief aus der Kiste. Kalender nie verschieben: Tag = Datum.</p>`;
    const table=r=>`<table><thead><tr><th></th><th>Datum</th><th>Brief und Vorbereitung</th><th>Material</th><th>Min</th></tr></thead><tbody>${r.join("")}</tbody></table>`;
    openPV("Elternplan",`<div class="sheet">${head}${table(rows.slice(0,13))}</div><div class="sheet"><h3 class="pt">Elternplan · Teil 2</h3><p class="pt-sub">Ab Tag 13. Alles ab Tag 15 bleibt neben der Tür oder in der Kiste. Chronik an Tag 21 drucken, Finale an Tag 22 packen, der 23. bleibt leicht.</p>${table(rows.slice(13))}</div>${medienSheet()}${hilfeSheet()}<div class="sheet"><h3 class="pt">Einkaufsliste · einmal, nicht 24-mal</h3><p class="pt-sub">Alles andere ist Papier, Drucker und Wohnung. Haken, was schon da ist.</p>${einkauf()}</div>`); }
  function medienSheet(){
    const o=MED.map(m=>`<tr><td><strong>${m.t}</strong></td><td class="mat">${m.wann}</td><td class="mat">${m.typ}</td></tr>`).join("");
    return `<div class="sheet"><h3 class="pt">Hören und sehen</h3><p class="pt-sub">Kein Konto, keine App. Das Handy liegt neben der Tür, der Bildschirm zeigt keine Knöpfe. Erst ab 5 Jahren, nicht bei Kindern, die abends ängstlich sind. Auf tomtini.kids stehen außerdem drei Textstücke: das Fenster in Tomtes Werkstatt, das Suchbild „Wo ist Mimi?“ und sein Notizbuch.</p><table><thead><tr><th>Text fertig, Aufnahme folgt</th><th>Wann</th><th>Was</th></tr></thead><tbody>${o}</tbody></table></div>`; }
  function hilfeSheet(){ const t=C.tagsueber.map(n=>`<tr><td><strong>${n.titel}</strong></td><td class="mat">${n.tipp}</td></tr>`).join(""); const h=C.hilfe.filter(n=>!(n.id==="streit"&&!plural())).map(n=>`<tr><td><strong>${n.titel}</strong></td><td class="mat">${n.tipp}</td></tr>`).join(""); const e=C.notfall.filter(n=>n.elternskript&&!(n.id==="geschwister"&&!plural())).map(n=>`<tr><td><strong>${n.titel}</strong></td><td class="mat">${n.elternskript}</td></tr>`).join(""); return `<div class="sheet"><h3 class="pt">Briefe für zwischendurch</h3><p class="pt-sub">Nicht an Tage gebunden. Liegen gedruckt in der Kiste. Grundsatz: Tomte ist ein guter Wichtel, immer. Er droht nie, meldet nichts, prüft nichts, erzieht nicht. Ein Nein des Kindes hat nie eine Folge.</p><table><thead><tr><th>Tagsüber (am Nachmittag hinlegen)</th><th>Wann</th></tr></thead><tbody>${t}</tbody></table><table style="margin-top:6mm"><thead><tr><th>Tomte erzählt</th><th>Wie, und was nicht</th></tr></thead><tbody>${h}</tbody></table><table style="margin-top:6mm"><thead><tr><th>Wenn ein Kind fragt oder sieht</th><th>Zuerst ohne Tomte sprechen</th></tr></thead><tbody>${e}</tbody></table></div>`; }
  function einkauf(){ const items=[["Portal oder Tür","Klemmbaustein-Portal nach Anleitung (Druckpaket), Papiervorlage oder gekaufte Tür, ca. 10–12 cm.","nach dem JA"],["Zahlentafel","Grüne 8er-Platte plus helle 1×2/1×3-Steine für die Ziffern (Muster 0–9 im Druckpaket) oder Zahlenkarten aus Papier.","nach dem JA"],["Mehl, Backpapier, eine Gabel","Für die wenigen Spur-Tage (Vorabend, Tag 1, Tag 4).","Vorabend"],["Ein Blatt Watte oder ein Wattepad, ein alter Socken","Wird an Tag 7 gesammelt und am Ende Mimis Bett.","Tag 7"],["Klemmbausteine (vorhandene)","Für Tomtes Baum an Tag 15. Standardsteine, keine Neukäufe.","Tag 15"],["Batterie-Teelicht","Laterne an Tag 17. Keine Knopfzelle offen liegen lassen, kein echtes Feuer.","Tag 17"],["Packpapier, mindestens 50 × 70 cm","Aus einem Paket. Das Kinderpapier für das Finale, Tag 19.","Tag 19"],["Ein kleiner Stern","Aus Pappe oder Holz, passt oben auf den Baum. Tag 21.","Tag 21"],["Ein Tannenzapfen, eine Feder","Von draußen. Tage 6 und 24.","Tag 6"],["Etwas Süßes, einmal","Ein Keks oder Ähnliches, Tag 10.","Tag 10"]]; if($('#suess').checked) items.push(["Etwas Süßes (Schalter an)","Schokotaler, Lebkuchen, Gummibärchen, Mandarinen, ein Mini-Riegel, Marshmallows. An 12 von 24 Tagen, nie als Belohnung.","Tag 1"]); if($('#klein').checked) items.push(["Kleinigkeiten (Schalter an)","Aufkleber, Radiergummi, Buntstifte, bunte Socken, Fensterkreide, Mandarinen, Wachsmaler, Goldfolie, ein besonderer Baustein. Das Puzzle kommt aus dem Druckpaket.","Tag 1"]); return `<table><thead><tr><th></th><th>Was</th><th>Wofür</th><th>Bis</th></tr></thead><tbody>${items.map(x=>`<tr><td class="ck"><span></span></td><td><strong>${lego(x[0])}</strong></td><td class="mat">${lego(x[1])}</td><td class="mat">${x[2]}</td></tr>`).join("")}</tbody></table>`; }
  function printChronik(){ let pages=`<div class="sheet chron" style="justify-content:center;text-align:center"><p class="eyebrow">Tomtini</p><h3 class="pt" style="font-size:30pt">Unsere Geschichte</h3><p class="pt-sub">24 Tage mit Tomte, Mimi und Rubi · für ${names()} · ${MONL[startDate().getMonth()]} ${startDate().getFullYear()}</p><p style="font-family:var(--hand);font-size:16pt;color:#2b2a52;margin-top:10mm">„Ich habe ${plural()?"euch":"dich"} nie gesehen. Und ${plural()?"ihr":"du"} mich nicht. Und trotzdem kennen wir uns jetzt.“</p></div>`;
    C.tage.slice(0,21).forEach((day,i)=>{ const paras=briefParas(day,i); pages+=`<div class="sheet chron"><p class="eyebrow">Tag ${day.n} · ${fmt(dateOf(i))}</p><h3 class="pt" style="font-size:18pt">${fill(day.titel)}</h3><div class="cl">${paras.map(p=>`<p>${fill(p)}</p>`).join("")}</div><div class="ca"><b>${plural()?"Eure":"Deine"} Hälfte</b>${state.answers[i]?state.answers[i].replace(/</g,"&lt;"):"<span style='color:#8a8494'>Hier klebt euer Bild oder eure Antwort.</span>"}</div><div class="night"><b>Tomtes Nachtseite</b>${nightText(day)}</div></div>`; }); for(let k=22;k<=24;k++){ pages+=`<div class="sheet chron"><p class="eyebrow">Tag ${k}</p><h3 class="pt" style="font-size:18pt">Hier schreibt ${plural()?"ihr":"du"}</h3><div class="ca" style="min-height:60%"><span style='color:#8a8494'>Was an diesem Tag passiert ist. Bild, Satz oder beides.</span></div></div>`; }
    openPV("Chronik",pages); }
  function nightText(day){ const n={1:"Tomte hat die Tür dreimal geprüft, ob sie wirklich nur von innen aufgeht. Dann ist er davor eingeschlafen.",2:"Rubi hat das Schild rückwärts gelesen. Tomte hat es dreimal umgedreht, bis es stimmte.",3:"Mimi lag auf dem Brief. Eine Stunde Suche, drei Zentimeter entfernt.",4:"Rubi hat den Hund noch zweimal größer gemacht, bis Mimi eingeschlafen ist.",5:"Tomte hat nachts versucht, den Kühlschrank zu schrumpfen. Der Kühlschrank hat gebrummt.",6:"Mimi hat den Zapfen versteckt und sofort vergessen, wo. Tomte auch.",7:"Die weichen Sachen wurden gewogen, gefaltet und für wichtig befunden.",8:"Tomte hat Socken sortiert. Nach Farbe. Rubi hat dreimal geseufzt.",9:"Hausschuhe zu zweit. Tomte war so stolz, dass er Rubi geweckt hat.",10:"Der Toaster hat geknurrt. Tomte hat zurückgeknurrt. Mimi hat auf seinem Rücken geschlafen. Der Toaster hat gewonnen.",11:"Mimi war nachts wach. Alle haben es bemerkt.",12:"Mimi wollte wissen, wie das Gesicht war. Rubi hat es dreimal erzählt, jedes Mal größer.",13:"Die Girlande war zu kurz. Tomte hat den Türgriff dafür entschuldigt.",14:"Mimi und Rubi haben gestritten. Tomte hat gehämmert, damit er nichts hört.",15:"Der Baum steht. Rubi sitzt oben. Er sagt, er sieht alles.",16:"Rubi hat in der Tanne geschimpft. Der Schnee hat nicht zugehört.",17:"Zum ersten Mal Licht in der Werkstatt. Tomte hat gesehen, wie unordentlich es ist, und die halbe Nacht aufgeräumt.",18:"Tomte hat lange über das Lieblingsbild nachgedacht. Dann hat er es eingeklebt.",19:"Das bunte Papier wurde glatt gestrichen. Zwölfmal.",20:"Mimi lag im Warmen und hat nichts von alledem mitbekommen.",21:"Der Stern passte nicht durch die Tür. Tomte hat ihn draußen gelassen, für den Baum.",22:"Tomte hat gepackt. Dann wieder ausgepackt. Dann gepackt.",23:"Rubi: siebenmal Schrank. Tomte hat mitgezählt und nichts gesagt.",24:"Das Licht ging aus. Mimi hat sich in die Socke gekuschelt. Tomte ist losgegangen, und das Haus hat geschlafen."}; return n[day.n]||""; }

  window.TOMTINI_APP={ openPV:openPV, fill:fill, tag:function(i){ return briefParas(C.tage[i],i); }, zettel:function(i){ return C.tage[i].zettel; } };
  // ---- Start ----
  const had=load(); buildCal(); if(had){ render(); if(location.hash.startsWith('#p=')) toast("Plan geladen"); }
})();
