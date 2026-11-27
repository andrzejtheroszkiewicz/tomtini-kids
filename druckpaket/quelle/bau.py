# Baut das Tomtini-Druckpaket als HTML (A4), das anschließend mit Chromium zu PDF wird.
import os
F = '/home/claude/tomtini-kids/fonts/'

def seite(titel, wann, inhalt, hinweis=''):
    h = f'<p class="hinweis">{hinweis}</p>' if hinweis else ''
    return f'''<section class="seite"><header><span class="marke">Tomtini · Druckpaket</span><span class="wann">{wann}</span></header>
<h1>{titel}</h1>{h}<div class="inhalt">{inhalt}</div></section>'''

def zettel(text, von):
    return f'<div class="zettel schnitt"><p>{text}</p><p class="von">{von}</p></div>'

# Ziffern 3x5 als Noppenraster
Z = {'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],
     '3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
     '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],
     '9':['111','101','111','001','111']}
def ziffer(d):
    zellen = ''.join(f'<i class="{"an" if c=="1" else ""}"></i>' for r in Z[d] for c in r)
    return f'<figure class="ziff"><div class="raster">{zellen}</div><figcaption>{d}</figcaption></figure>'

def tanne(schlitz):  # Steck-Tanne, Maße in mm
    s = ('<rect x="49.4" y="8" width="1.2" height="66" fill="#0f1430"/>' if schlitz == 'oben'
         else '<rect x="49.4" y="74" width="1.2" height="66" fill="#0f1430"/>')
    return f'''<svg viewBox="0 0 100 150" width="100mm" height="150mm" class="schnitt-svg">
<path d="M50 4 L74 40 L64 40 L86 76 L74 76 L96 116 L58 116 L58 146 L42 146 L42 116 L4 116 L26 76 L14 76 L36 40 L26 40 Z" fill="#3f7a52" stroke="#0f1430" stroke-width=".6" stroke-dasharray="2 1.4"/>{s}</svg>'''

def stern(r):
    import math
    pts = []
    for i in range(10):
        a = -math.pi/2 + i*math.pi/5; rr = r if i % 2 == 0 else r*0.45
        pts.append(f'{r+rr*math.cos(a):.2f},{r+rr*math.sin(a):.2f}')
    return f'<svg viewBox="0 0 {2*r} {2*r}" width="{2*r}mm" height="{2*r}mm"><polygon points="{" ".join(pts)}" fill="none" stroke="#0f1430" stroke-width=".5" stroke-dasharray="2 1.4"/></svg>'

def karton():  # Faltschachtel 60 x 40 x 40 mm, Maße in mm
    L, B, H, k = 60, 40, 40, 10
    x0, y0 = 50, 50  # Boden oben links
    linie = 'stroke="#0f1430" stroke-width=".5" fill="none"'
    schnitt = f'{linie} stroke-dasharray="2 1.4"'
    falz = 'stroke="#0f1430" stroke-width=".35" stroke-dasharray=".6 1.2" fill="none"'
    p = []
    # Flächen (Falzlinien innen)
    p.append(f'<rect x="{x0}" y="{y0}" width="{L}" height="{B}" fill="#f4ead6" {falz}/>')                      # Boden
    p.append(f'<rect x="{x0}" y="{y0+B}" width="{L}" height="{H}" fill="#e9d8b8" {falz}/>')                    # Vorderseite
    p.append(f'<rect x="{x0}" y="{y0-H}" width="{L}" height="{H}" fill="#e9d8b8" {falz}/>')                    # Rückseite
    p.append(f'<rect x="{x0}" y="{y0-H-B}" width="{L}" height="{B}" fill="#f4ead6" {falz}/>')                  # Deckel
    p.append(f'<rect x="{x0-H}" y="{y0}" width="{H}" height="{B}" fill="#e9d8b8" {falz}/>')                    # links
    p.append(f'<rect x="{x0+L}" y="{y0}" width="{H}" height="{B}" fill="#e9d8b8" {falz}/>')                    # rechts
    # Laschen
    def lasche(x, y, w, h, richtung):
        if richtung == 'l': return f'<path d="M{x} {y} L{x-k} {y+3} L{x-k} {y+h-3} L{x} {y+h}" fill="#fff" {schnitt}/>'
        if richtung == 'r': return f'<path d="M{x} {y} L{x+k} {y+3} L{x+k} {y+h-3} L{x} {y+h}" fill="#fff" {schnitt}/>'
        if richtung == 'o': return f'<path d="M{x} {y} L{x+4} {y-k} L{x+w-4} {y-k} L{x+w} {y}" fill="#fff" {schnitt}/>'
    p.append(lasche(x0, y0+B, 0, H, 'l')); p.append(lasche(x0+L, y0+B, 0, H, 'r'))
    p.append(lasche(x0, y0-H, 0, H, 'l')); p.append(lasche(x0+L, y0-H, 0, H, 'r'))
    p.append(lasche(x0, y0-H-B, L, 0, 'o'))
    # Außenkontur Schnitt
    p.append(f'<path d="M{x0} {y0-H-B} L{x0+L} {y0-H-B} M{x0+L} {y0} L{x0+L+H} {y0} L{x0+L+H} {y0+B} L{x0+L} {y0+B} M{x0} {y0+B+H} L{x0+L} {y0+B+H} M{x0} {y0} L{x0-H} {y0} L{x0-H} {y0+B} L{x0} {y0+B}" {schnitt}/>')
    # Beschriftung
    p.append(f'<text x="{x0+L/2}" y="{y0+B+H/2-2}" text-anchor="middle" font-family="Switzer" font-weight="800" font-size="7" fill="#0f1430">UMZUG</text>')
    p.append(f'<text x="{x0+L/2}" y="{y0+B+H/2+7}" text-anchor="middle" font-family="Caveat" font-size="6" fill="#db3820">Tomte · bitte nicht kippen</text>')
    p.append(f'<text x="{x0+L+H/2}" y="{y0+B/2+2}" text-anchor="middle" font-family="Caveat" font-size="5.5" fill="#0f1430">oben ↑</text>')
    return f'<svg viewBox="0 0 160 150" width="160mm" height="150mm">{"".join(p)}</svg>'

seiten = []
seiten.append(f'''<section class="seite deck"><p class="marke">Tomtini · Druckpaket</p>
<h1 class="gross">Alles zum Ausdrucken.</h1>
<p class="lead">Normales Druckerpapier, in Farbe, Originalgröße. Gestrichelt heißt schneiden, gepunktet heißt falten. Was ihr gerade nicht braucht, kommt in die Tomte-Kiste.</p>
<table><thead><tr><th>Seite</th><th>Was</th><th>Wann</th></tr></thead><tbody>
<tr><td>2</td><td>Graue Mimi, Namensschild</td><td>Einzug, Tag 2</td></tr>
<tr><td>3</td><td>Mimi zum Ausmalen</td><td>Tag 3</td></tr>
<tr><td>4</td><td>Tomtes Stube, Tomtes Werkstatt</td><td>Tag 5, Tag 7</td></tr>
<tr><td>5</td><td>Zettel von Tomte und Mimi</td><td>Tag 5, 10, Januar, Notfall</td></tr>
<tr><td>6</td><td>Karte für Tomte</td><td>Tag 12</td></tr>
<tr><td>7</td><td>Steck-Tanne</td><td>Tag 15</td></tr>
<tr><td>8</td><td>Rubi im Schnee</td><td>Tag 16</td></tr>
<tr><td>9</td><td>Stern</td><td>Tag 21</td></tr>
<tr><td>10</td><td>Abschiedsbild</td><td>Tag 22</td></tr>
<tr><td>11</td><td>Umzugskarton</td><td>Tag 23</td></tr>
<tr><td>12</td><td>Puzzle Tomtes Vorgarten</td><td>Kleinigkeiten (Tag 5–24)</td></tr>
<tr><td>13</td><td>Ziffern 0–9 für Klemmbausteine</td><td>Zahlentafel</td></tr>
<tr><td>14</td><td>Gute Besserung, Tunnelbild</td><td>Notfall</td></tr>
</tbody></table></section>''')

seiten.append(seite('Graue Mimi und Namensschild', 'Einzug · Tag 2',
  '<div class="paar"><figure class="schnitt frei"><img src="mimi-grau.png" style="width:75mm"><figcaption>Einzug: ausschneiden, schlafend auf den Briefkasten legen.</figcaption></figure>'
  '<figure><div class="schild schnitt"><span>Tomte</span></div><figcaption>Tag 2: ausschneiden und vor die Tür legen. Die Kinder kleben es über die Tür.</figcaption></figure></div>'))

seiten.append(seite('Mimi zum Ausmalen', 'Tag 3', '<img class="ausmal" src="mimi-linie.png">',
  'Ab morgen liegt die bunte Mimi auf dem Briefkasten, die graue wandert in die Kiste.'))

seiten.append(seite('Tomtes Stube und Tomtes Werkstatt', 'Tag 5 · Tag 7',
  '<figure class="bild schnitt"><img src="stube.jpg"><figcaption>Tag 5: Tomtes Stube</figcaption></figure>'
  '<figure class="bild schnitt"><img src="werkstatt.jpg"><figcaption>Tag 7: Tomtes Werkstatt</figcaption></figure>'))

seiten.append(seite('Zettel', 'Tag 5 · Tag 10 · Januar · Notfall',
  '<div class="zettel-raster">' +
  zettel('Danke für das Möbelstück!', 'Tomte') + zettel('Danke!', 'Tomte') +
  zettel('Mehr ging nicht.', 'Tomte') + zettel('Mehr ging nicht.', 'Tomte') +
  zettel('Ich schlafe in der Kiste weiter, versprochen.', 'Mimi') + zettel('Angeguckt. Jetzt schlafe ich.', 'Mimi') +
  '</div>', 'Tag 5: Danke zum Möbelstück · Tag 10: Mehr ging nicht · 6. Januar: Mimi schläft weiter · Notfall Mimi wach: Angeguckt.'))

seiten.append(seite('Karte für Tomte', 'Tag 12',
  '<div class="karte"><div class="k-innen"></div><div class="k-falz">falten</div><div class="k-vorne"><span>Für Tomte</span></div></div>',
  'Ausschneiden, in der Mitte falten. Die Kinder malen sie, wenn sie mögen.'))

seiten.append(seite('Steck-Tanne', 'Tag 15',
  f'<div class="paar">{tanne("oben")}{tanne("unten")}</div>',
  'Beide Teile ausschneiden, die Schlitze einschneiden und die Teile ineinanderstecken. Am besten auf Papier ab 120 g drucken.'))

seiten.append(seite('Rubi im Schnee', 'Tag 16', '<img class="ausmal" src="rubi-linie.png">'))

seiten.append(seite('Stern', 'Tag 21', f'<div class="paar mitte">{stern(60)}{stern(32)}</div>',
  'Als Tomtes Plan vor die Tür legen. Tagsüber schneiden die Kinder ihn aus und bemalen ihn.'))

seiten.append(seite('Abschiedsbild', 'Tag 22',
  '<div class="abschied"><p class="hand gross-h">Gute Reise, Tomte!</p><div class="malfeld"></div><p class="hand">Von:</p></div>'))

seiten.append(seite('Umzugskarton', 'Tag 23', f'<div class="mitte">{karton()}</div>',
  'Außen ausschneiden, an den gepunkteten Linien falten, Laschen einkleben. Das Abschiedsbild passt gefaltet hinein.'))

seiten.append(seite('Puzzle: Tomtes Vorgarten', 'Kleinigkeiten · Tag 5, 9, 14, 18, 22, 24',
  '<div class="puzzle"><img src="vorgarten.jpg"><div class="schnitte"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>',
  'Auf festes Papier drucken und an den Linien in sechs Teile schneiden.'))

seiten.append(seite('Ziffern für die Zahlentafel', 'Klemmbausteine',
  '<div class="ziffern">' + ''.join(ziffer(str(d)) for d in range(10)) + '</div>',
  'Grüne 8er-Platte, jedes Feld ist eine Noppe. Die hellen Felder mit 1×2- und 1×3-Steinen belegen. Zwei Ziffern passen nebeneinander, mit einer Noppe Abstand.'))

seiten.append(seite('Gute Besserung und Tunnelbild', 'Notfall',
  '<div class="paar"><figure class="karte-gb schnitt"><img src="rubi-farbe.png"><p class="hand">Gute Besserung!</p><p class="von">Rubi hat es durchs Fenster gereicht.</p></figure>'
  '<figure class="schnitt"><img src="tunnel.jpg" style="width:70mm"><figcaption>Tunnelbild: hinter die Tür kleben, dann sieht man einen Gang statt der Wand.</figcaption></figure></div>'))

css = f'''
@font-face{{font-family:"Switzer";src:url("{F}switzer.woff2") format("woff2");font-weight:100 900}}
@font-face{{font-family:"Caveat";src:url("{F}caveat-latin-wght-normal.woff2") format("woff2");font-weight:400 700}}
@font-face{{font-family:"Caveat";src:url("{F}caveat-latin-ext-wght-normal.woff2") format("woff2");font-weight:400 700;unicode-range:U+0100-02BA}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:Switzer,Helvetica,Arial,sans-serif;color:#0f1430}}
.seite{{width:210mm;height:297mm;padding:14mm 14mm 12mm;page-break-after:always;display:flex;flex-direction:column;overflow:hidden}}
.seite:last-child{{page-break-after:auto}}
header{{display:flex;justify-content:space-between;font-size:9pt;font-weight:700;border-bottom:1.5pt solid #0f1430;padding-bottom:3mm;margin-bottom:6mm}}
header .wann{{color:#db3820}}
h1{{font-size:24pt;line-height:1.05;letter-spacing:-.02em;margin:0 0 3mm;font-weight:800}}
.hinweis{{font-size:11pt;line-height:1.4;margin:0 0 6mm;max-width:165mm}}
.inhalt{{flex:1;display:flex;flex-direction:column;gap:7mm;justify-content:flex-start}}
.deck{{justify-content:flex-start}}
.deck .marke{{font-size:10pt;font-weight:700;color:#db3820;margin:0 0 30mm}}
.gross{{font-size:48pt;line-height:.95;letter-spacing:-.04em;margin:0 0 8mm}}
.lead{{font-size:13pt;line-height:1.45;max-width:160mm;margin:0 0 12mm}}
table{{border-collapse:collapse;width:100%;font-size:11pt}}
th{{text-align:left;font-size:9pt;border-bottom:1.5pt solid #0f1430;padding:2mm 0}}
td{{border-bottom:.5pt solid #c9ccd8;padding:2.2mm 0}} td:first-child{{width:16mm;font-weight:700}} td:last-child{{color:#555}}
.schnitt{{border:.6pt dashed #0f1430;padding:4mm}}
.frei{{border:none}}
figure{{margin:0}} figcaption{{font-size:10pt;line-height:1.35;margin-top:3mm;max-width:80mm}}
.paar{{display:flex;gap:10mm;align-items:flex-start;justify-content:space-around}}
.mitte{{justify-content:center;align-items:center;display:flex;flex:1}}
.paar.mitte{{gap:14mm}}
.schild{{width:100mm;height:36mm;display:flex;align-items:center;justify-content:center;background:#f4ead6;border:.6pt dashed #0f1430}}
.schild span{{font-family:Caveat;font-size:46pt;font-weight:700;color:#0f1430}}
.ausmal{{width:100%;max-height:220mm;object-fit:contain}}
.bild img{{width:100%;max-height:100mm;object-fit:cover;display:block}}
.bild{{padding:3mm}}
.zettel-raster{{display:grid;grid-template-columns:1fr 1fr;gap:6mm}}
.zettel{{height:52mm;display:flex;flex-direction:column;justify-content:center;background:#fffdf6}}
.zettel p{{font-family:Caveat;font-size:24pt;line-height:1.1;margin:0}} .zettel .von{{font-size:18pt;color:#db3820;margin-top:3mm;text-align:right}}
.karte{{border:.6pt dashed #0f1430;height:200mm;display:grid;grid-template-rows:1fr auto 1fr}}
.k-falz{{border-top:.5pt dotted #0f1430;font-size:8pt;color:#777;text-align:center;padding-top:1mm}}
.k-vorne{{display:flex;align-items:center;justify-content:center;margin:8mm;border:2pt solid #db3820}}
.k-vorne span{{font-family:Caveat;font-size:44pt;color:#db3820}}
.abschied{{flex:1;display:flex;flex-direction:column;gap:5mm}}
.hand{{font-family:Caveat;font-size:22pt;margin:0}} .gross-h{{font-size:40pt;color:#db3820}}
.malfeld{{height:190mm;border:2pt solid #0f1430}}
.puzzle{{position:relative;width:182mm}} .puzzle img{{width:100%;display:block}}
.schnitte{{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr}}
.schnitte i{{border:.7pt dashed #fff;outline:.4pt dashed #0f1430}}
.ziffern{{display:grid;grid-template-columns:repeat(5,1fr);gap:8mm 6mm}}
.ziff{{text-align:center}} .raster{{display:grid;grid-template-columns:repeat(3,9mm);grid-template-rows:repeat(5,9mm);gap:1mm;justify-content:center;background:#3f7a52;padding:2mm;border-radius:1mm;width:max-content;margin:0 auto}}
.raster i{{background:#356746;border-radius:50%;box-shadow:inset 0 0 0 .6mm #2c5a3c}} .raster i.an{{background:#f2ead2;border-radius:1mm;box-shadow:none}}
.ziff figcaption{{max-width:none;font-weight:800;font-size:13pt;margin-top:2mm}}
.karte-gb{{width:85mm;text-align:center;background:#fffdf6}} .karte-gb img{{width:60mm}} .karte-gb .von{{font-size:10pt;color:#555;margin:2mm 0 0}}
'''
html = f'<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Tomtini Druckpaket</title><style>{css}</style></head><body>{"".join(seiten)}</body></html>'
open('druckpaket.html', 'w').write(html)
print(len(seiten), 'Seiten')
