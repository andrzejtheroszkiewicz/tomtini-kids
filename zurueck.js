/* „Zurück zu Tomtini“ auf den Unterseiten (Werkstatt, Tomtes Haus, Papierhaus):
   Kam man von der Startseite, geht es einen Schritt zurück, genau an die Stelle, an der man war.
   Kam man direkt (geteilter Link, Lesezeichen), führt der Link zum passenden Abschnitt der Startseite, nicht zum Hero. */
(function(){
  var start=new URL('../',location.href).pathname;
  document.querySelectorAll('a[data-zurueck]').forEach(function(a){
    a.addEventListener('click',function(e){
      var vonStart=false;
      try{ var u=new URL(document.referrer); vonStart=u.origin===location.origin&&(u.pathname===start||u.pathname===start+'index.html'); }catch(err){}
      if(vonStart&&history.length>1){ e.preventDefault(); history.back(); }
    });
  });
})();
