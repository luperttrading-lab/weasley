# Standort-Uhr — Projektübergabe

**Stand:** App v0.45 fertig und im Einsatz · Firebase-Sync geplant, noch nicht gebaut · Hardware in Planung
**Für:** Weiterarbeit in Claude Code
**Wichtig:** Dieses Dokument ersetzt nicht die Datei. Gib Claude Code **immer auch die aktuelle `index.html`** dazu — dort steht die Wahrheit, hier nur das Warum.

---

## 0. Was das Projekt ist

Eine Familien-Standortuhr nach dem Vorbild der Weasley-Uhr aus Harry Potter, für fünf Personen: **Claudia, Lutz, Anton, Emilia, Leander**. Jede Person hat einen Zeiger mit ihrem Porträt-Medaillon; der Zeiger steht auf dem Ort, an dem sie gerade ist.

Das Projekt hat drei Ausbaustufen:

| Stufe | Zustand | Was sie leistet |
|---|---|---|
| **A · Web-App** | fertig (v0.45) | Einzelne HTML-Datei, läuft auf jedem iPhone. Jeder sieht nur seine eigene Uhr. |
| **B · Firebase-Sync** | geplant | Gemeinsame Datenbank → aus fünf Einzeluhren wird eine Familienuhr |
| **C · Physische Uhr** | in Planung | Holz-Standuhr mit fünf Motoren, liest aus derselben Datenbank |

Eine **native App (Capacitor)** ist ebenfalls angedacht — sie ist der einzige Weg zu automatischem Melden im Hintergrund. Apple-Entwicklerkonto ist vorhanden, aber noch nicht eingerichtet.

**Zentrale Einsicht zur Reihenfolge:** Stufe B ist Voraussetzung für alles Weitere. Auch die native App und die physische Uhr brauchen die gemeinsame Datenbank — Geofencing ersetzt nur den *Auslöser* des Meldens, nicht die Übertragung.

---

## 1. Arbeitsweise mit Lutz — bitte übernehmen

Diese Regeln haben sich über viele Sitzungen etabliert und sollten weitergelten:

### Kommunikation
- **Deutsch, per Du.** Lutz diktiert oft per Sprache → mit Erkennungsfehlern rechnen, lieber kurz nachfragen als Unsinn übernehmen (Beispiel aus der Praxis: „Feier Base" = Firebase, „Cloud Code" = Claude Code).
- **Nie mit Zustimmung starten.** Erster Satz: Annahme hinterfragen, Lücke aufzeigen oder Rückfrage. Unbequeme Wahrheit zuerst, nicht in Absatz drei.
- **Aussagen markieren:** `[Sicher]`, `[Wahrscheinlich]`, `[Vermutung]`. Nichts erfinden — keine Quellen, Zahlen, APIs, Tool-Features.
- **Fakt / Interpretation / Empfehlung sichtbar trennen.**
- Lutz ist Trader, Statistiker und Finanzmathematiker — mathematisch präzise erklären, gern mit Zahlenbeispielen.
- **Bewährte Arbeitsteilung:** Lutz gibt Richtung und logische Prüfung, Claude liefert Breite und Umsetzung.

### Liefer-Regeln für Dateien
- **Doppel-Lieferung, byte-identisch:** `index.html` **und** `standort-uhr-vX.Y.html`, md5 prüfen und ausgeben.
- **Versionsnummer** steht im Header der Datei in einem `.ver`-Div und wird bei jeder Lieferung erhöht.
- **Alte Versionen aus dem Ausgabeordner löschen**, damit Lutz nie die falsche Datei hochlädt.
- **Bei Optionen: nummerierte Liste**, damit Lutz mit einer Zahl antworten kann.
- **Ab der zweiten Iteration am selben Detail:** nicht die nächste Variante derselben Idee bauen, sondern den Lösungsraum mit fundamental verschiedenen Konzepten aufmachen. (Lernmoment im Projekt: Drei Nadelformen hintereinander waren „immer schlimmer" — erst der Kategoriewechsel zum gerahmten Medaillon hat funktioniert.)
- **Ehrliche Aufwand/Nutzen-Einschätzung** statt Gefälligkeit.

### Verifikation
- Änderungen **messen, nicht behaupten.** Im bisherigen Ablauf über Playwright + Chromium: DOM-Werte auslesen, Pixel sampeln, Geometrie nachrechnen.
- **Tests dürfen nicht dieselbe Annahme treffen wie der geprüfte Code** — gegen unabhängig gerechnete Werte prüfen.
- Wenn eine geratene Annahme scheitert: **nicht die nächste Variante bauen**, sondern prüfen, ob die zugrundeliegende Regel überhaupt existiert.

---

## 2. Teil A — Die Web-App (v0.45)

### 2.1 Aufbau

Eine einzelne, selbstständige HTML-Datei, **209 KB**, ~570 Zeilen. Keine externen Abhängigkeiten außer Google-Fonts-CDN (Cinzel, EB Garamond). Die fünf Porträts sind als base64-WEBP eingebettet.

Deployment: GitHub Pages, Repo unter dem Handle `luperttrading-lab`. Lutz lädt `index.html` hoch, Settings → Pages → main → root.

Zusätzlich im Repo: **`apple-touch-icon-v3.png`** (180×180, Homescreen-Icon).

### 2.2 Geometrie (SVG, viewBox 400×400, Mittelpunkt 200/200)

```
R_OUT=176          äußerer Rahmenkreis
R_LAB_UP=164       Ortsnamen obere Hälfte (Textpfad-Radius)
R_LAB_LOW=171      Ortsnamen untere Hälfte
R_LAB_IN=150       innere Trennlinie des Ortsrings
R_TICK=140         Skalenstriche
R_NUM=124          Gradzahlen
R_HOUR=108         Stundenzahlen
R_ZEIGER=121       Zeigerlänge = Mittelpunkt des Medaillons
MED_R=24           Medaillon-Grundradius
R_NABE=20          Nabe
RAHMEN=1.2         Messingring-Stärke
KOPF_K={kreis:1, kamee:1.30, frei:1.42, rahmen:1.42}
```

Daraus abgeleitet: Kopfradius = `MED_R × KOPF_K` = **34,1**, Medaillon-Außenrand bei **r≈155,9**.
Gemessene Tinte der Ortsnamen beginnt bei **r≥163** → 7 Einheiten Luft, konfliktfrei.

**Farben:**
```
INK  = #46330f   Linien
INK2 = #34250b   Ortsnamen normal
BORD = #6e1a24   IN GEFAHR
NEBEL= #2f3a4a   VERSCHOLLEN
```

### 2.3 Die acht Sektoren

`STEP = 45°`, im Uhrzeigersinn ab 12 Uhr:

| Index | Ort | Besonderheit |
|---|---|---|
| 0 | ERLENTAL | Zuhause |
| 1 | SCHULE | |
| 2 | SCHWIMMBAD | |
| 3 | TISCHTENNIS | |
| 4 | BEI FREUNDEN | noch keine Koordinaten |
| 5 | UNTERWEGS | `SEK_UNTERWEGS` — Signal da, aber keine Zone getroffen |
| 6 | VERSCHOLLEN | `SEK_VERSCHOLLEN` — **gar kein Signal empfangen**, eigene Farbe (nebelblau), Sektorfläche `rgba(47,58,74,.20)` |
| 7 | IN GEFAHR | nie automatisch, Sektorfläche `rgba(138,22,40,.26)` |

**Leserichtung der Ortsnamen:** obere Hälfte (`mid>=270 || mid<90`) außen herum, untere Hälfte innen herum. VERSCHOLLEN (270°) läuft dadurch von unten nach oben — klassische Kartografen-Regel, symmetrisch zu SCHWIMMBAD gegenüber.

### 2.4 Die Personen

```js
const personen=[
  {name:'Claudia',ton:'#a8423f',sektor:0,bildFrei:'…'},
  {name:'Lutz',   ton:'#3f5e91',sektor:5,bild:'…',bildFrei:'…'},
  {name:'Anton',  ton:'#3c7d52',sektor:2,bildFrei:'…'},
  {name:'Emilia', ton:'#8a5a9e',sektor:1,bildFrei:'…'},
  {name:'Leander',ton:'#2f8a8a',sektor:4,bildFrei:'…'},
];
```

**Z-Ordnung bei Überlappung** (hinten → vorn), von Lutz festgelegt:
`[4,1,2,0,3]` → Leander, Lutz, Anton, Claudia, **Emilia ganz vorn**.
Wird beim Ziehen **nicht** umsortiert.

### 2.5 GPS-Zonen

Im Dateikopf, bewusst **nicht** in der App editierbar — damit alle fünf Geräte dieselben Zonen nutzen.

**Konzept (wichtig!):** Pro Ort ist eine **Liste von Zonen** erlaubt, **ohne Personenbindung**. Wer in irgendeiner Schul-Zone steht, bekommt SCHULE — egal ob Claudia oder Anton. Begründung von Lutz: In der Praxis taucht an einer bestimmten Schule ohnehin nur eine bestimmte Person auf.

```js
const ortGPS={
  0:[{lat:50.6479779, lon:8.6739803, r:250}],  // ERLENTAL (Wohnadresse!)
  1:[{lat:50.5968855, lon:8.6772881, r:200},   // SCHULE 1
     {lat:50.5916110, lon:8.8248888, r:200}],  // SCHULE 2
  2:[{lat:50.5931950, lon:8.6574002, r:200},   // SCHWIMMBAD 1
     {lat:50.5893294, lon:8.6848674, r:200},
     {lat:50.5440611, lon:8.7256671, r:200},
     {lat:50.6256405, lon:8.6292411, r:200}],
  3:[{lat:50.4526332, lon:7.6616858, r:200},   // TISCHTENNIS 1
     {lat:50.6798770, lon:8.8237347, r:200},
     {lat:50.6379399, lon:8.6745379, r:200}],
  4:null,  // BEI FREUNDEN — offen
  6:null, 7:null   // nie automatisch
};
```

`ortAusGPS()` akzeptiert sowohl Listen als auch Einzelobjekte. Gewinner ist die **nächstgelegene Zone im Radius**; kein Treffer → `SEK_UNTERWEGS`.

**Engste Paarung:** Tischtennis 3 liegt nur **1117 m** von Erlental entfernt. Bei Radien 250+200 bleiben 667 m Luft. Das ist die Obergrenze für spätere Radius-Erhöhungen.

**Radius-Faustwerte:** Gebäude 120–180 m, Schule mit Hof 200 m, weitläufiges Gelände 250–300 m. Zu großzügig ist weniger riskant als zu knapp, weil nur auf Knopfdruck gemessen wird.

⚠️ **Datenschutz-Hinweis:** Das Repo ist öffentlich, Erlental ist die Wohnadresse. Mit Firebase sollten die Zonen in die Datenbank wandern.

### 2.6 GPS-Logik (Lutz' Entwurf, in v0.45 umgesetzt)

| Situation | Ergebnis |
|---|---|
| Signal + bekannte Zone | Person auf diesen Ort |
| Signal, keine Zone | „unterwegs" |
| **kein Standortsignal** (err.code 2) | **„verschollen"** |
| **Zeitüberschreitung** (err.code 3) | **„verschollen"** |
| Freigabe verweigert (err.code 1) | **Zeiger bleibt stehen** + Hinweistext |

Der letzte Fall ist bewusst ausgenommen: Fehlende Ortungserlaubnis ist ein Einstellungsproblem, kein verschollener Mensch.

**Zusätzlich seit v0.45:** Beim erfolgreichen Messen werden **alle anderen Personen auf verschollen** gesetzt. Begründung von Lutz: Dieses Gerät kann nur die eigene Person messen, für die anderen liegen in diesem Moment keine Daten vor. Die Uhr zeigt damit ehrlich, was sie weiß. Bei komplettem Signalausfall stehen alle fünf auf verschollen.

Ziehen und Antippen funktionieren danach weiter — von Hand korrigierte Positionen bleiben bis zur nächsten Messung.

### 2.7 Bedienung

- **Medaillon greifen und ziehen** → Person auf anderen Ort
- **Chip antippen, dann Sektor auf dem Zifferblatt antippen** → dasselbe
- **„Standort erkennen"** → GPS-Messung für die Geräte-Person
- **Geräte-Zuordnung:** Beim Erststart Overlay „Wem gehört dieses Gerät?", gespeichert in `localStorage` unter `uhr_geraet`. Zeile unten: „Dieses Gerät: NAME · ändern".

⚠️ **iOS-Eigenheit:** Homescreen-App und Safari haben **getrennte** localStorage-Bereiche. Nach dem Hinzufügen zum Homescreen kommt die Abfrage einmal erneut. Im normalen Safari-Tab kann iOS Website-Daten nach ~7 Tagen Nichtnutzung löschen; bei der Homescreen-App nicht. → Alle fünf sollten die Uhr als Homescreen-Icon anlegen.

### 2.8 Layout

```css
html,body { height:100%; overflow:hidden; overscroll-behavior:none; }
html { background:#2c1f13; }              /* Statusleisten-Bereich */
.stage { width:min(98vw,540px); aspect-ratio:1/1; flex:none; }
.bgfix { background:
    linear-gradient(180deg,#2c1f13 0,#2c1f13 100px,rgba(44,31,19,0) 230px),
    radial-gradient(125% 95% at 50% 0%,#3a2a18 0%,#241810 55%,#120b05 100%); }
```

**Prinzip (von Lutz vorgegeben):** Die Uhr bleibt bei maximaler Größe, **der Text weicht.** Drei Kompaktstufen per `@media (max-height:…)`:
- **≤850px:** engere Abstände, kleinere Statuszeile
- **≤780px:** Untertitel und Bedienhinweis ausgeblendet
- **≤700px:** zusätzlich Versionszeile weg

Getestet 932 → 667 px: Uhr überall 382 px, nichts scrollt.

Die **flache Kopfzone** der ersten 100 px im `.bgfix` ist wichtig: Der radiale Schein ist in der Mitte heller als an den Ecken, deshalb kann eine einfarbige Statusleiste nie nahtlos anschließen. Lösung: oben flach, Schein erst darunter einblenden.

### 2.9 Porträts — Verarbeitungspipeline

Alle fünf Porträts hat Lutz als KI-generierte Bilder geliefert. Verarbeitung mit `rembg` + `Pillow` + `scipy`:

1. **Freistellen** mit `rembg.remove()`
2. **Kante 1 px zurücknehmen** (`binary_erosion` 3×3 bei Schwelle 110 + `GaussianBlur(0.9)`) — entfernt den hellen JPG-Saum
3. **Kernkopf-Normierung:** Zeilenbreiten der Silhouette messen, Kern = Zeilen breiter als **42 % der Maximalbreite** (schließt dünne Strähnen aus). Kernhöhe auf **84 %** der Quadrathöhe skalieren.
   → Ergebnis: alle Kopfhöhen 277–292 px statt vorher weit auseinander
4. **Farbangleichung — Reihenfolge ist kritisch:**
   - **erst** Sättigung vereinheitlichen (Ziel ~52 %, `ImageEnhance.Color`, Faktor 0.7 der Differenz)
   - **dann** Hautton angleichen (helle Gesichtspixel >140, Ziel R208/G155/B128, Stärke 0.8)
   - Umgekehrte Reihenfolge verschiebt die Hauttöne wieder!
   → Streuung von R190–225 auf R200–213 reduziert
5. **Claudia zusätzlich auf 90 % verkleinert** — ihre eng anliegende Frisur ließ das Gesicht bei gleicher Kopfhöhe größer wirken. Reine Vermessung konnte das nicht abfangen, nur das Auge.
6. **Claudia zusätzlich `UnsharpMask(1.4, 55, 3)`** — ihr Original ist mit 943 px das kleinste, Kantenschärfe lag bei 6,1 gegen 9,8 bei Emilia.

**Stil-Befund (nicht behoben, nicht behebbar):** Lutz und Claudia sind deutlich stärker stilisiert (Pixar-Look, große Augen, weiche Formen), Anton/Emilia/Leander fotorealistischer mit feiner Hauttextur. Das ist in den Bildern angelegt und lässt sich nicht nachbearbeiten. Empfehlung, falls es stört: die drei realistischen Porträts mit demselben Prompt neu erzeugen.

**Für neue Porträts:** PNG **mit echtem Alphakanal** liefern lassen. Alle bisherigen Uploads hatten das Schachbrettmuster als Pixel eingebrannt (auch die `.PNG`-Dateien waren RGB ohne Alpha) und mussten nachträglich freigestellt werden.

### 2.10 Designentscheidungen mit Historie

Diese Punkte wurden mehrfach durchgespielt. Bitte nicht ohne Not zurückdrehen:

| Entscheidung | Begründung |
|---|---|
| **Gerahmtes Medaillon** statt schwebendem Kopf | Ein körperloser Kopf auf einer Nadel liest sich als „aufgespießt", egal welche Nadelform darunter. Der Rahmen wechselt die Kategorie: aus Körperteil wird Bild. Das ist auch das Weasley-Prinzip. |
| **Namen auf den Zeigern** (Gravur, `textLength` gesperrt) | Waren zwischenzeitlich raus, Lutz wollte sie zurück |
| **Ortsnamen nach außen** (r=164/171) | Löst die Kollision mit den großen Medaillons |
| **Kein Schaft-Stummel** | Wenn Namen unterschiedlich lang sind, entstehen unterschiedlich lange Reststriche — sieht uneinheitlich aus |
| **IN GEFAHR rötlich hinterlegt**, VERSCHOLLEN nebelblau | Verschollen ist ungewiss, nicht alarmierend — soll nicht mit dem Rot konkurrieren |

**Nicht genommene Varianten** stecken teilweise noch als Schalter in der Datei: `window.MEDSTIL` kennt `kreis` / `kamee` / `frei` / `rahmen` (Standard), `window.NADELSTIL` kennt `schale` / `spitze` / `ohne`.

---

## 3. Teil B — Firebase-Sync (geplant, noch nicht gebaut)

### 3.1 Warum

Ohne Sync läuft die App auf jedem Handy für sich. Emilias GPS-Messung bewegt nur ihren Zeiger auf ihrem Gerät. Seit v0.45 macht die App das ehrlich sichtbar: Nach dem Messen stehen alle anderen auf verschollen.

### 3.2 Was Lutz tun muss (~15 Min, geht vom iPhone)

1. `console.firebase.google.com` → mit Google-Konto anmelden
2. „Projekt hinzufügen" → Name z. B. `standort-uhr`, Analytics abwählen
3. **Realtime Database** → „Datenbank erstellen" → Region **europe-west1** (Belgien, EU)
4. Sicherheitsregeln: erst „Gesperrt", die richtigen Regeln kommen später
5. Projektübersicht → Web-App registrieren (`</>`-Symbol)
6. Das Konfigurations-Objekt (`apiKey`, `databaseURL`, …) an Claude geben

**Kosten:** Spark-Plan ist kostenlos, 1 GB Speicher / 10 GB Download pro Monat. Fünf Personen erzeugen ein paar Kilobyte am Tag.

Das Config-Objekt ist zur Veröffentlichung in Web-Apps gedacht — der Schutz kommt über die Zugriffsregeln, nicht über Geheimhaltung des Keys.

### 3.3 Was gebaut werden soll

1. **Einmaliges Login** beim Einrichten, Token bleibt gespeichert, danach nie wieder (Lutz' ausdrücklicher Wunsch: nicht bei jedem App-Öffnen)
2. **Gemeinsame Datenbank:** jedes Gerät schreibt seinen Sektor, alle Uhren lesen
3. **Live-Aktualisierung** ohne Neuladen
4. **Automatisch messen beim Öffnen** — kein Knopfdruck mehr
5. **Zeitstempel pro Person:** „Anton · Schule · vor 25 Min"
6. **Verschollen-Automatik:** wer sich länger als X Stunden nicht gemeldet hat, rutscht auf verschollen
7. **Zonen in die Datenbank** statt ins öffentliche Repo

**Datensparsamkeit:** In der Datenbank steht nur `Person 3 → Sektor 2 → Zeitstempel`. Keine Koordinaten. Selbst wer mitliest, sieht „Emilia war um 15:40 im Schwimmbad" — nicht wo das Schwimmbad ist.

**Alternative, die erwogen wurde:** Cloudflare Worker + KV-Store mit geteiltem Schlüssel. Lutz hat mit Cloudflare Workers schon gearbeitet. Firebase gewinnt beim Live-Update (Push statt Polling), Cloudflare bei Schlankheit und Kontrolle.

---

## 4. Teil C — Native App (später)

**Der harte Fakt:** Web-Apps können den Standort **nur im Vordergrund** abrufen. Weder iOS noch Android erlauben Hintergrund-Ortung oder Geofencing in Web-Apps; der entsprechende Standard-Entwurf wurde aufgegeben. Auch der Service Worker, der Push-Nachrichten empfängt, hat **keinen Zugriff auf die Standort-API** — er könnte selbst geweckt nichts messen.

→ Solange die App geschlossen ist, meldet das Gerät nichts. Nur eine native App (Capacitor) löst das.

**Voraussetzung:** Apple-Entwicklerkonto (vorhanden, noch nicht eingerichtet), Xcode auf dem Mac mini.

⚠️ **Planungsgrenze:** iOS überwacht maximal **20 Geofence-Regionen gleichzeitig pro App** [zu verifizieren]. Aktuell sind 10 Zonen belegt, „Bei Freunden" kommt noch. Bei mehr Orten braucht es eine Umschaltlogik (nur die nächstgelegenen 20 aktiv).

**Zwischenlösung ohne native App:** iOS-Kurzbefehle mit Ortsautomation („Wenn ich am Schwimmbad ankomme, öffne diese Adresse"). Kostet nichts, muss jeder einmal einrichten, App blitzt kurz auf.

**Arbeitsteilung ändert sich hier:** Claude kann eine native App weder kompilieren noch laufen sehen. Code und Anleitung von Claude, Bauen und Testen von Lutz.

---

## 5. Teil D — Die physische Uhr

### 5.1 Grundkonzept

Fünf Motoren hinter einem Zifferblatt, ESP32 mit WLAN liest die Firebase-Datenbank und dreht jeden Zeiger auf den Sektor seiner Person. Die physische Uhr ist einfach ein weiterer Client — sie liest, schreibt nicht.

**Sie kann die App nicht ersetzen**, nur das Nachschauen am Handy. Die Positionsdaten kommen weiterhin von den fünf Telefonen.

### 5.2 Standort — entschieden

**Nische über dem Kühlschrank**, nicht an der Wand hängend, sondern **stehend**.

Konsequenzen:
- **Dauerstrom** über USB-Netzteil — die Steckdose des Kühlschranks ist direkt darunter, Kabel läuft an der Nischenkante herunter, weiß auf weiß
- **Die gesamte Akku-Diskussion ist damit erledigt** (siehe Abschnitt 5.5 für den Fall, dass der Standort doch wechselt)
- **Kein Deep Sleep nötig** → stehende Firebase-Verbindung → **Zeiger bewegen sich live**, nicht im 5-Minuten-Takt
- **Front 10–15° nach vorn geneigt**, weil die Nische über Kopfhöhe sitzt und alle schräg von unten schauen. Keilförmiger Standfuß.
- **Taster nach hinten** (nicht oben) — in der Nische drückt niemand mal eben drauf, er dient nur der Kalibrierung
- **Kabelausgang hinten unten mit Zugentlastung** (Kabel innen einmal um einen Steg führen)

**Noch offen — Lutz muss messen:**
1. Nischenmaße: Breite, Tiefe, Höhe **an beiden Seiten** (links drückt eine Dachschräge herunter)
2. Steckdose hinter/neben dem Kühlschrank frei?
3. WLAN-Test: iPhone in die Nische halten, Empfang prüfen

### 5.3 Bauteile — jetzt nötig (Block A, ~40 €)

| Teil | Anmerkung | Preis |
|---|---|---|
| **ESP32 DevKit** | WROOM-32, CP2102. Doppelpack sinnvoll (Reserve) | 10–15 € |
| **5× 28BYJ-48 + ULN2003** | Fasizi-Set, 5 V, **mit** Treiberplatinen | 14 € |
| **Breadboard + Jumperkabel** | M-M und M-F gemischt; Prototyp-Taster meist dabei | 8 € |
| **USB-Datenkabel** | **kein reines Ladekabel!** Klassische Anfängerfalle | 5 € |

### 5.4 Bauteile — für die fertige Uhr (Block B/C)

| Teil | Anmerkung | Preis |
|---|---|---|
| USB-Netzteil 5 V / 2 A | vorhandenes Handynetzteil | 0 € |
| Langes USB-Kabel weiß, 2–3 m | Weg hinter den Kühlschrank | 7 € |
| **ESP32 Terminal Breakout** | Schraubklemmen — macht die Verdrahtung **komplett lötfrei** | 8 € |
| Einbautaster (Rückseite) | | 2 € |
| Messing-Uhrzeiger + Adapterhülsen 5 mm | Motorwelle ist 5 mm | 10–15 € |
| Holz (Baumarkt-Zuschnitt) | **kein 3D-Druck** — Lutz mag die Plastikoptik nicht | 15–25 € |

**Motorbefestigung ohne Druckteile:** Die 28BYJ-48 haben zwei Befestigungslaschen und lassen sich mit je zwei kleinen Schrauben direkt auf eine Holz-Trägerplatte hinter dem Zifferblatt schrauben.

**Zifferblatt:** Design als PDF (gleiche Optik wie die App), gedruckt und auf dünne Holzplatte kaschiert, sechs Löcher gebohrt. Matter Klarlack veredelt den Papierdruck.

**Abkürzung für den Korpus:** fertiger tiefer Holz-Objektrahmen („Shadow Box", ~30×30 cm) — dann muss nur noch gebohrt werden.

⚠️ **Offene Frage an Lutz:** Werkzeug und Lust auf den Holzteil vorhanden, oder konsequent um den fertigen Objektrahmen herum konstruieren?

### 5.5 Stromversorgung — Analyse für den Fall eines Standortwechsels

Die Diskussion ist dokumentiert, falls die Uhr doch mal ohne Steckdose stehen soll.

**Zentrale Erkenntnis: Kapazität ist nicht der Engpass, die Wandler-Elektronik ist es.**

Alles mit eingebautem Dauerwandler scheidet aus:
- **Powerbanks** schalten bei Last unter 50–100 mA nach 30–60 s ab → ESP32 im Deep Sleep wacht nie wieder auf
- **USB-C-Mono-D-Zellen** (1,5 V mit internem Wandler): dasselbe Problem, dazu Spannungsprobleme bei Serienschaltung
- **Router-USV:** schaltet zwar nicht ab, aber ihr Wandler zieht 5–15 mA dauerhaft — **mehr als die Uhr selbst**

Was bleibt (Rechnung bei 5-Min-Takt, ~50 mAh/Tag):

| Variante | Laufzeit | Platz | Preis |
|---|---|---|---|
| Li-Ion 18650 + Halter am FireBeetle | 2–3 Monate | 80×25×22 mm | ~10 € + Board 15 € |
| **LiFePO4 32700 einzeln** + Lademodul | 4 Monate | 80×40×35 mm | ~22 € |
| LiFePO4 4er-Pack parallel | 15 Monate | 135×75×35 mm | 40–73 € |
| 3× Mono-D Alkaline | 8–12 Monate | 105×70×30 mm | 3 € + jährlich 7 € |

**Warum LiFePO4 elegant ist:** 3,2 V ist exakt die ESP32-Betriebsspannung → direkt an den 3V3-Pin, **kein Spannungsregler**, dessen Ruhestrom entfällt. Dazu thermisch die stabilste Li-Chemie, 2000+ Ladezyklen.

⚠️ **Falls jemals LiFePO4:** Die Ladeelektronik auf FireBeetle/Lolin lädt auf **4,2 V** — LiFePO4 braucht **3,65 V**. Nie Akku-Schalter EIN und Board-USB gleichzeitig. Separates TP5000-Lademodul nötig.

⚠️ **Bei konfektionierten Akkus mit Stecker: Polung messen**, bevor eingesteckt wird. Vertauschte JST-Kabel sind häufig und zerstören das Board.

**Kaufwarnungen aus der Recherche:** 32700-Zellen mit „30 Ah" auf dem Titel und „6 Ah" auf dem Etikett gesehen — physikalisch passen max. ~7 Ah in dieses Format. 18650 mit „9900 mAh" ist gelogen, max. ~3500. Seriös: NKON (nkon.nl), Enerprof, Akkuteile.de.

### 5.6 Bekannte Hardware-Probleme

**Nach Stromausfall wissen die Motoren nicht, wo ihre Zeiger stehen.** Für Version 1 per Software lösen: Position speichern, nach Ausfall einmal Taster drücken und Zeiger von Hand auf zwölf. Luxuslösung: fünf Hall-Sensoren + Magnete (~5 €) für automatische Referenzfahrt.

**Fünf konzentrische Achsen wie im Original sind Feinmechanik.** Bastler-Ausweg: Motoren **versetzt** hinter dem Zifferblatt, jeder Zeiger auf eigener kurzer Achse an leicht verschiedener Position. Sieht man kaum.

**Stromaufnahme:** Fünf Motoren gleichzeitig ~1,4 A — passt in ein 2-A-Netzteil. Spulen nach der Bewegung abschalten; das 1:64-Getriebe hält leichte Zeiger auch stromlos.

### 5.7 Empfohlener Vorgehensweg

1. **Ein-Motor-Prototyp:** Arduino-IDE auf dem Mac mini einrichten, ein Motor am Breadboard drehen lassen
2. Motor liest live aus Firebase und zeigt Lutz' Position
3. Erst danach auf fünf erweitern und ins Gehäuse

So merkt Lutz nach einem Abend, ob ihm das Hardware-Basteln liegt.

---

## 6. Offene Punkte

### Sofort machbar
1. **Bestellung Block A** (ESP32, Motoren hat Lutz gefunden; Breadboard und Datenkabel fehlen noch)
2. **Firebase einrichten** — die sechs Schritte aus 3.2, dann Config-Objekt an Claude
3. **„Bei Freunden"-Koordinaten** — fehlender Ort. Bei eng beieinanderliegenden Adressen Radius auf 120–150 m senken.

### Nach dem Prototyp
4. Nischenmaße, Steckdose, WLAN-Test (5.2)
5. Holz-Entscheidung: Eigenbau oder Objektrahmen (5.4)
6. Zifferblatt-PDF in der finalen Größe erzeugen

### Später
7. Native App mit Geofencing (Apple-Konto einrichten)
8. Hall-Sensoren für automatische Referenzfahrt

### Angeboten, unbeantwortet
9. Chips unten als **Mini-Gesichter** statt Farbkreise

---

## 7. Fallen und Lehren

Diese Punkte haben im Projekt jeweils Stunden gekostet.

### Der Overlay-Schleier (wichtigste Lehre)
Alle Render-Kontrollbilder waren über Tage hinweg **abgedunkelt**, weil das Geräte-Overlay („Wem gehört dieses Gerät?", 78 % dunkel) bei jedem frischen Laden ohne gespeicherte Zuordnung erscheint. Auf dem iPhone war die Wahl gespeichert, im Testbrowser nie.

→ **In jedem Render-Skript `localStorage.setItem('uhr_geraet','1')` per `add_init_script` setzen.**

Die Sitzung hat davor eine lange Fehlersuche am „dunklen Gradienten" betrieben — es gab nie einen Fehler in der App. Lehre: Wenn eine Messung unerklärlich ist, erst prüfen, ob das **Messverfahren** stimmt.

### `getComputedTextLength()` ignoriert `textLength`
Beim Sperren von Schrift auf eine feste Länge liefert `getComputedTextLength()` weiter die natürliche Länge. Echte visuelle Ausdehnung nur über `getStartPositionOfChar(0)` und `getEndPositionOfChar(n-1)` messbar.

### Messung erst nach dem Einhängen
`getComputedTextLength()` gibt 0 bzw. falsche Werte, solange das Element nicht im Dokument hängt. Einpassungs-Logik muss **nach** `svg.appendChild(gZeiger)` laufen.

### Geometrie-Bezugspunkte konsequent halten
Zwei Bugs entstanden dadurch, dass Schrift-Einpassung und -Positionierung vom **Medaillonrand** (r=97) ausgingen, der freigestellte Kopf aber bis **r=87** nach innen reicht. Ergebnis: verdeckte Buchstaben und zu weit außen sitzende Namen.
→ Kopfausdehnung immer als `MED_R * KOPF_K[stil]` rechnen, nie `MED_R` allein.

### Pixel-Messungen an Ringlinien
Beim radialen Sampeln von Textfarben fangen die Ringlinien bei r=150 und r=173 die Messung ab. Messband eng fassen (z. B. 152,5–171,5) und Textpixel über Helligkeitsschwelle filtern.

### Farbangleichung: Reihenfolge
Erst Sättigung, dann Hautton. Umgekehrt verschiebt die Sättigungskorrektur die gerade angeglichenen Hauttöne wieder.

### `min-height` vs. `height`
`body { min-height:100% }` erzeugte 8 px Überhang gegenüber dem Fenster → die Seite ließ sich minimal scrollen. Mit `height:100%` behoben.

### Container-Resets
Die Arbeitsumgebung wird zwischen Sitzungen zurückgesetzt. Fonts (Cinzel.ttf, EBGaramond.ttf) mussten mehrfach neu geladen werden. Die Arbeitsdatei lässt sich aus der letzten Auslieferung wiederherstellen.

---

## 8. Deploy-Ablauf (bewährt)

- **Repo:** GitHub Pages unter `luperttrading-lab`, Settings → Pages → main → root.
  Zwei Dateien gehören ins Root: `index.html` und `apple-touch-icon-v3.png`.
- **Ablauf:** neue `index.html` hochladen → ~1 Min warten (GitHub Pages baut) → auf dem iPhone die Homescreen-App **komplett schließen** (App-Umschalter, wegwischen) und neu öffnen. iOS hält Web-Apps gern im Speicher.
- **Icon-Wechsel:** Der neue Dateiname (`-v3`) ist Absicht — iOS und GitHub Pages cachen Icons hartnäckig. Altes Icon vom Homescreen löschen und neu hinzufügen.
- **`build_deliver.py`** ersetzte in der Chat-Umgebung lokale `@font-face`-Blöcke durch Google-CDN-Imports und erzeugte die Doppel-Lieferung. **In Claude Code entfällt das** — dort wird direkt an der `index.html` gearbeitet.

---

## 9. Für den Einstieg in Claude Code

**Was Claude Code mitbekommen sollte:**
1. Dieses Dokument
2. Die aktuelle `index.html` (v0.45) — am besten direkt aus dem Repo
3. `apple-touch-icon-v3.png`

**Was sich im Arbeitsablauf ändert:**
- Statt Upload/Download direkt Dateien im Repo bearbeiten, echtes Git mit Commits
- Rendering-Verifikation: Playwright lässt sich auch lokal installieren (`pip install playwright && playwright install chromium`), die Testmuster aus diesem Projekt sind übertragbar
- Der Sandbox-Zwang zur Doppel-Lieferung (`index.html` + versionierte Kopie) entfällt teilweise — Git-Tags leisten dasselbe sauberer. **Mit Lutz absprechen**, ob die Doppel-Lieferung bleiben soll.

**Erster sinnvoller Schritt in Claude Code:** Repo aufräumen und den Firebase-Sync als eigenen Branch anlegen, sobald das Config-Objekt vorliegt.
