# Standort-Uhr — Projektübergabe

**Stand:** App v0.61 mit Firebase-Sync **im Einsatz** (14.09.2026 auf Lutz' Geraet verifiziert) · Hardware in Planung
**Für:** Weiterarbeit in Claude Code
**Wichtig:** Dieses Dokument ersetzt nicht die Datei. Gib Claude Code **immer auch die aktuelle `index.html`** dazu — dort steht die Wahrheit, hier nur das Warum.

---

## 0. Was das Projekt ist

Eine Familien-Standortuhr nach dem Vorbild der Weasley-Uhr aus Harry Potter, für fünf Personen: **Claudia, Lutz, Anton, Emilia, Leander**. Jede Person hat einen Zeiger mit ihrem Porträt-Medaillon; der Zeiger steht auf dem Ort, an dem sie gerade ist.

Das Projekt hat drei Ausbaustufen:

| Stufe | Zustand | Was sie leistet |
|---|---|---|
| **A · Web-App** | fertig (v0.61) | Einzelne HTML-Datei, läuft auf jedem iPhone. |
| **B · Firebase-Sync** | fertig und eingerichtet | Gemeinsame Datenbank → aus fünf Einzeluhren wird eine Familienuhr |
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

## 2. Teil A — Die Web-App (v0.60)

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
| 0 | ZU HAUSE | die Wohnadresse |
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

### 2.5 GPS-Zonen — seit v0.50 in der Datenbank

**Die Koordinaten stehen nicht mehr in `index.html`.** Sie liegen in der Realtime
Database unter `/zonen` und sind nur für angemeldete Geräte lesbar, die auf der
Whitelist stehen.

**Warum der Umzug zwingend war:** Das Repo ist öffentlich, und hinter Sektor 0
steht die Wohnadresse. Das Repo privat zu stellen hätte nichts gebracht — GitHub Pages
liefert die `index.html` ohnehin öffentlich aus, die Koordinaten standen im
JavaScript, das jeder Browser herunterlädt. (Zusätzlich: Pages mit privatem Repo
gibt es erst ab GitHub Pro.) Der einzige Weg war, sie hinter das Login zu legen.

**Konzept unverändert:** Pro Ort eine **Liste von Zonen**, **ohne Personenbindung**.
Wer in irgendeiner Schul-Zone steht, bekommt SCHULE. `ortAusGPS()` nimmt die
nächstgelegene Zone im Radius; kein Treffer → `SEK_UNTERWEGS`.
Die Funktion akzeptiert Arrays **und** Objekte, weil Firebase je nach
Schlüssellage das eine oder andere liefert.

Struktur in der Datenbank:

```
/zonen/0/0  { lat, lon, r }     ZU HAUSE (1 Zone)
/zonen/1/0..1                   SCHULE (2 Zonen)
/zonen/2/0..3                   SCHWIMMBAD (4 Zonen)
/zonen/3/0..2                   TISCHTENNIS (3 Zonen)
```

Orte 4 (BEI FREUNDEN), 5 (UNTERWEGS), 6, 7 haben bewusst keine Zonen.

**Engste Paarung:** Tischtennis 3 liegt nur **1117 m** von Sektor 0 entfernt.
Bei Radien 250+200 bleiben 667 m Luft — Obergrenze für spätere Erhöhungen.

**Radius-Faustwerte:** Gebäude 120–180 m, Schule mit Hof 200 m, weitläufiges
Gelände 250–300 m.

### 2.6 GPS-Logik (Lutz' Entwurf)

| Situation | Ergebnis |
|---|---|
| Signal + bekannte Zone | Person auf diesen Ort |
| Signal, keine Zone | „unterwegs" |
| **kein Standortsignal** (err.code 2) | **„verschollen"** |
| **Zeitüberschreitung** (err.code 3) | **„verschollen"** |
| Freigabe verweigert (err.code 1) | **Zeiger bleibt stehen** + Hinweistext |

Der letzte Fall ist bewusst ausgenommen: Fehlende Ortungserlaubnis ist ein Einstellungsproblem, kein verschollener Mensch.

**Geändert in v0.50:** Die Notlösung aus v0.45 — „beim Messen alle anderen auf
verschollen setzen" — ist **entfernt**. Ein Gerät setzt jetzt ausschließlich die
eigene Person; wo die anderen stehen, sagt die Datenbank. Bei fehlender
Ortungsfreigabe (`err.code 1`) wird weiterhin gar nichts gemeldet, der Zeiger
bleibt stehen.

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

## 3. Teil B — Firebase-Sync (in v0.50 gebaut)

### 3.1 Projekt

Firebase-Projekt `standort-uhr`, Spark-Plan (kostenlos), Realtime Database in
**europe-west1 (Belgien)**, Anmeldung per E-Mail/Passwort. Das Config-Objekt
steht offen in `index.html` — das ist bei Web-Apps so vorgesehen, der Schutz
kommt über die Zugriffsregeln.

### 3.2 Datenmodell

```
/erlaubt/<uid>          true    Whitelist — wer hier nicht steht, sieht nichts
/status/<0..4>/sektor   0..7    eine Person, ein Sektor
/status/<0..4>/ts       Server-Zeitstempel
/status/<0..4>/quelle   'gps' | 'hand'   gemessen oder von Hand gesetzt
/zonen/<0..3>/<n>       { lat, lon, r }
```

Personen werden über den **Index 0–4** adressiert (Reihenfolge im `personen`-Array:
Claudia, Lutz, Anton, Emilia, Leander). Keine Koordinaten in der Datenbank außer
den Zonen — es steht nur „Person 3 → Sektor 2 → Zeitstempel".

### 3.3 Warum `auth != null` als Regel nicht reicht

**Zentraler Sicherheitsbefund:** Mit aktiviertem E-Mail/Passwort-Login kann sich
**jeder**, der den `apiKey` aus der öffentlichen `index.html` liest, selbst ein
Konto anlegen. Er wäre dann `auth != null` und käme an die Zonen — also an die
Wohnadresse. Die naheliegende Regel ist damit wertlos.

**Lösung:** Die Regeln prüfen zusätzlich, ob die uid unter `/erlaubt` steht.
Ein fremdes Konto ist zwar angemeldet, aber nicht freigeschaltet und sieht nichts.
`/erlaubt` selbst ist für Clients weder les- noch schreibbar — nur über die
Konsole pflegbar. Sicherheitsregeln dürfen den Knoten trotzdem lesen.

Die vollständigen Regeln liegen als **`firebase-rules.json`** im Repo. Sie
validieren zusätzlich: Sektor 0–7, Personenindex 0–4, Zeitstempel muss der
Serverzeit entsprechen (keine gefälschten Alter), keine Fremdfelder.

### 3.4 Was v0.50 kann

1. **Einmaliges Login** (`browserLocalPersistence`) — danach nie wieder Passwort
2. **Gemeinsamer Stand:** jedes Gerät schreibt nur die eigene Person, liest alle
3. **Live** ohne Neuladen (`onValue`)
4. **Automatisch messen** (seit v0.52 ausgebaut, siehe 3.6)
5. **Zeitstempel pro Person:** „Anton ist im Schwimmbad · vor 1 Std"
6. **Verschollen-Automatik:** `VERSCHOLLEN_NACH_MS` (3 h). Ältere Meldung → der
   Zeiger rutscht auf verschollen. Wird alle 30 s neu bewertet.
7. **Zonen aus der Datenbank** statt aus dem öffentlichen Repo

**Die „alle anderen auf verschollen"-Notlösung aus v0.45 ist raus.** Sie war nur
nötig, solange ein Gerät nichts über die anderen wissen konnte.

### 3.5 Architektur in der Datei

Zwei getrennte Script-Blöcke, die ausschließlich über `window.UHR` reden:

- **klassisches `<script>`** — baut die Uhr wie bisher, kennt kein Firebase
- **`<script type="module">`** — Firebase-SDK v12.10.0 per CDN von gstatic

Grund für die Trennung: Das SDK ist ESM, der bestehende Code ist es nicht.
Die Modul-Version ist **fest gepinnt** — gstatic liefert für falsche Versionen
404, was einen stillen Totalausfall bedeutet. Vor jeder Änderung der Version
prüfen, dass `firebase-app.js`, `firebase-auth.js` und `firebase-database.js`
unter der neuen Nummer wirklich existieren.

**Wächter:** Lädt das Modul nicht (kein Netz, CDN blockiert, Browser ohne
ES-Module), meldet die App nach 9 s „keine Verbindung zur Datenbank". Die
Startwerte aller fünf Personen stehen auf **verschollen** — die Uhr behauptet
nie etwas, was sie nicht weiß.

**Zeiger-Einblendung:** `#zeiger` startet mit `opacity:0` und erscheint erst,
wenn der erste Stand da ist oder der Wächter zuschlägt. Ohne das blitzen beim
Laden fünf übereinanderliegende „verschollen"-Medaillons auf — fünf Medaillons
(r≈34) passen bei R_ZEIGER=121 rechnerisch nicht nebeneinander in einen
45°-Sektor, dafür bräuchte man ~32° je Medaillon.

### 3.6 Gemessen oder behauptet (v0.54)

Ein Gerät kann **nur die eigene Person messen**. Schiebt jemand einen fremden
Zeiger auf dem Zifferblatt, landet das als ganz normale Meldung in der Datenbank
— alle fünf Uhren zeigen es dann. Das ist gewollt, sonst käme „IN GEFAHR" nie auf
die anderen Uhren.

**Das Problem dabei:** Bis v0.53 stand in der Statuszeile „gerade eben", auch wenn
niemand gemessen, sondern nur jemand geschoben hatte. Die Uhr behauptete damit
etwas, das sie nicht wusste — genau das, was sonst überall vermieden wird.

Seit v0.54 trägt jede Meldung ein Feld `quelle`:

| Auslöser | quelle |
|---|---|
| GPS-Messung (auch fehlgeschlagene → verschollen) | `gps` |
| Medaillon ziehen, Sektor antippen | `hand` |

Die Statuszeile zeigt dann „von Hand gesetzt · vor 7 Min" statt nur „vor 7 Min".

**Feinheit:** Hat die Verschollen-Automatik den Sektor überschrieben (Meldung
älter als 3 h), wird `quelle` auf `null` gesetzt. Die alte Quelle sagt über den
angezeigten Zustand nichts mehr aus, und „verschollen · von Hand gesetzt" wäre
irreführend.

⚠️ **Die Sicherheitsregeln müssen mitziehen.** `"$sonst": {".validate": false}`
lehnt jedes unbekannte Feld ab — ohne den `quelle`-Eintrag in den Regeln kann
**kein Gerät mehr melden**. Regeln immer **vor** der App ausliefern. Umgekehrt
ist es unkritisch: `quelle` ist optional, eine alte App ohne das Feld bleibt gültig.

### 3.7 Automatisches Nachmessen (v0.52)

`getCurrentPosition` ist eine **Einzelmessung**, kein `watchPosition`. Bis v0.51
gab es nur drei Auslöser (nach dem Login, Knopfdruck, Gerätezuordnung) — dazwischen
stand der eigene Zeiger still.

**Der eigentliche Mangel war subtiler:** iOS lädt die Homescreen-App beim
Zurückholen aus dem App-Umschalter **nicht neu**. Wer die App nach der Ankunft
öffnete, bekam also nicht einmal dann eine frische Messung und konnte trotz
offener App auf „verschollen" rutschen.

Jetzt:

```
MESS_TAKT_MS       = 2 min    Takt, solange die App im Vordergrund ist
MESS_MINDEST_MS    = 60 s     nie zwei Messungen dichter beieinander
MELDE_AUFFRISCH_MS = 20 min   Zeitstempel spätestens so oft erneuern
```

`autoMessen()` prüft der Reihe nach: Gerät zugeordnet? Zonen da? Sichtbar?
Läuft keine Messung? Mindestabstand eingehalten? Ausgelöst von
`visibilitychange`, `pageshow` (bfcache) und dem Takt.

**Geschrieben wird nicht bei jeder Messung**, sondern nur bei Ortswechsel, wenn
der Zeitstempel älter als 20 Minuten ist, oder bei Knopfdruck. Das senkt die
Schreiblast von ~30 auf ~3 Vorgänge je Gerät und Stunde, hält den Zeitstempel
aber frisch genug für die Verschollen-Automatik.

**Fehlgeschlagene Taktmessungen ändern nichts.** Wer vor zwei Minuten Empfang
hatte, ist nicht verschollen; der Zeitstempel altert, die 3-Stunden-Regel greift
bei Bedarf von allein. Nur ein manueller Knopfdruck setzt bei fehlendem Signal
sofort auf verschollen.

Automatische Messungen ändern außerdem **nicht** die Chip-Auswahl und melden nur
dann in der Textzeile, wenn sich der Ort tatsächlich geändert hat.

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

### Erledigt am 14.09.2026
Firebase-Projekt eingerichtet, gemeinsames Konto `uhr@standort-uhr.de`, uid auf
der Whitelist, zehn Zonen importiert, Regeln veröffentlicht, v0.50 auf `main`
und über GitHub Pages ausgeliefert. Auf Lutz' Gerät verifiziert: Anmeldung,
Zonenabruf, GPS-Messung (Sektor 0, 10 m zur Ortsmitte bei ±9 m Genauigkeit),
Schreiben nach `/status/1`.

### Als Nächstes
1. **Die anderen vier Geräte einrichten** — dieselbe E-Mail, dasselbe Passwort,
   nur die Personenwahl bei „Wem gehört dieses Gerät?" unterscheidet sich.
2. **Gedränge-Problem** (siehe unten) beobachten und entscheiden
3. **„Bei Freunden"-Koordinaten** — fehlender Ort. Bei eng beieinanderliegenden
   Adressen Radius auf 120–150 m senken.
4. Bestellung Block A (ESP32, Breadboard, USB-**Daten**kabel)

### Gedränge im selben Sektor — offenes Designproblem
Sobald mehrere Personen auf demselben Ort stehen, überlappen die Medaillons und
die Gravur-Namen stapeln sich zu einem unleserlichen Klumpen. Beim ersten Start
mit vier Verschollenen sofort sichtbar.

**Das ist kein Randfall:** abends sind alle fünf zu Hause. Vor v0.50 fiel es
nicht auf, weil jedes Gerät gestreute Startwerte zeigte.

Rechnerisch lässt es sich in der jetzigen Geometrie nicht auflösen: Ein
Medaillon (r≈34) belegt bei R_ZEIGER=121 rund 32° Bogen, ein Sektor hat 45°.
Mehr als zwei passen nebeneinander nicht — `targets()` fächert aktuell mit
maximal 18° auf.

**Radiale Staffelung ist durchgerechnet und scheidet aus** (14.09.2026, von
Lutz vermutet, dann gemessen). Die Gravur füllt die Strecke Nabe → Medaillon:

    zielL(r) = (r - MED_R*KOPF_K) - R_NABE - 8 = r - 62,08

Gegenprobe bei r=121: 58,92 — deckt sich mit der Messung im Browser.
Gemessene Schriftgrößen heute: LUTZ/ANTON/EMILIA 15,5 (ungeschrumpft),
CLAUDIA 12,69, LEANDER 12,1. Die beiden Siebenbuchstaber schöpfen den
Puffer also bereits aus.

Da die Schrift proportional mitschrumpft, wird LEANDER bei r=100 auf 7,8 px
gestaucht, bei r=90 auf 5,7 px, bei r=80 auf 3,7 px. Die SVG wird auf dem
iPhone praktisch 1:1 dargestellt, die Lesbarkeitsgrenze liegt bei etwa
r = 96. Nutzbarer Spielraum: 121 bis 96 = **25 px** bei 68 px
Medaillondurchmesser — die Medaillons überlappen danach praktisch unverändert,
die Namen sind aber hin. Preis bezahlt, Leistung nicht geliefert.

**Seit v0.61: Stapel antippen (Lutz' Idee vom 18.9., zuerst als eigenes
HTML-Demo „Zeigerwechsel" vorgeführt).** Ein Tipp auf den Stapel holt die
nächste Person nach vorn, die bisherige Vorderste rutscht ganz nach hinten;
Chip und Statuszeile folgen der Vordersten. Kostet keine Geometrie: nur die
DOM-Reihenfolge in `#zeiger` wechselt (`naechsteNachVorn`, `stapelVon`).
Tipp = `pointerdown`/`pointerup` ohne Bewegung (<4 px) — Ziehen bleibt
unverändert, ein Tipp auf eine Einzelperson sortiert nichts um. Gemessen:
vier Tipps drehen einen Vierer-Stapel einmal komplett durch, Sektoren
bleiben dabei unverändert, Ziehen aus dem Stapel funktioniert weiter.
Ein automatischer Wechsel im Takt (Demo: jede Sekunde) ist als Schalter
vorbereitet, `STAPEL_TAKT_MS` (0 = aus); er pausiert beim Ziehen, bei
verborgener Seite und 3 Takte nach einem Tipp. Bewusst aus, weil eine
stille Uhr nicht von selbst zappeln soll — Lutz fand Tippen „reicht
eventuell". Die feste Z-Ordnung `[4,1,2,0,3]` gilt nur noch als Startwert.
Der Textklumpen der Gravur-Namen bleibt (Auswege 2–4 unten weiter offen).

Verbleibende Auswege:
1. ~~Radial staffeln~~ — siehe Rechnung oben, erledigt.
2. **Namen ausblenden**, sobald mehr als eine Person im Sektor steht — löst den
   Textklumpen, nicht die verdeckten Gesichter. Kostet nichts an Geometrie und
   ist der billigste wirksame Eingriff. Überlappende Gesichter liest man noch
   als „da sind mehrere", überlappender Text ist reiner Schmutz.
3. **Medaillons schrumpfen** proportional zur Belegung des Sektors.
4. **Stapel zusammenfassen** zu einem Medaillon mit Zähler — verliert die
   Einzelgesichter, widerspricht der Projektidee.

### Später
8. Nischenmaße, Steckdose, WLAN-Test (5.2)
9. Holz-Entscheidung: Eigenbau oder Objektrahmen (5.4)
10. Zifferblatt-PDF in der finalen Größe
11. Native App mit Geofencing (Apple-Konto einrichten)
12. Hall-Sensoren für automatische Referenzfahrt
13. Eigenes Konto mit Nur-Lese-Rechten für die physische Uhr

### Zu entscheiden
14. **Verschollen-Schwelle:** aktuell 3 h (`VERSCHOLLEN_NACH_MS`). Da nur beim
    Öffnen der App gemessen wird, ist das knapp — wer morgens losgeht und die App
    nicht öffnet, gilt mittags als verschollen. Das ist ehrlich, aber vielleicht
    zu streng. Kandidaten: 6 h oder 12 h.
15. **Fünf Einzelkonten statt einem Familienkonto?** Erlaubt die Regel „nur die
    eigene Person schreiben". Kostet fünf Konten Verwaltung und Passwörter bei
    den Kindern; der Gewinn ist gering, weil Zeiger ohnehin von Hand gezogen
    werden dürfen.
16. Chips unten als **Mini-Gesichter** statt Farbkreise
17. Doppel-Lieferung (`index.html` + versionierte Kopie) beibehalten oder
    durch Git-Tags ersetzen?

## 7. Fallen und Lehren

Diese Punkte haben im Projekt jeweils Stunden gekostet.

### Der Overlay-Schleier (wichtigste Lehre)
Alle Render-Kontrollbilder waren über Tage hinweg **abgedunkelt**, weil das Geräte-Overlay („Wem gehört dieses Gerät?", 78 % dunkel) bei jedem frischen Laden ohne gespeicherte Zuordnung erscheint. Auf dem iPhone war die Wahl gespeichert, im Testbrowser nie.

→ **In jedem Render-Skript `localStorage.setItem('uhr_geraet','1')` per `add_init_script` setzen.**

Die Sitzung hat davor eine lange Fehlersuche am „dunklen Gradienten" betrieben — es gab nie einen Fehler in der App. Lehre: Wenn eine Messung unerklärlich ist, erst prüfen, ob das **Messverfahren** stimmt.

### Attribute gemessen statt der gerenderten Lage (18.9.)
Die Gravur saß in der rechten Uhrhälfte richtig, in der linken um gut 7 Einheiten
verschoben. Der Fehler: Die Schrift wird auf `y = Mitte + 0,37 × Schriftgrad`
gesetzt (SVG-`y` ist die **Grundlinie**, nicht die Mitte), und `setRot` drehte sie
in der linken Hälfte um genau diesen Punkt. Eine 180°-Drehung um die Grundlinie
verschiebt den Text um das Doppelte des Abstands zur optischen Mitte.

Nicht aufgefallen ist es, weil die Prüfung die **Attributwerte** verglich
(`y` minus `0,37 × font-size` gegen die Schildmitte) — und die stimmten. Die
Drehung kommt erst danach. Gemessen werden muss die **gerenderte Lage**:
`getScreenCTM()` auf Text und Schildmitte anwenden und den Abstand im
Bildschirmraum bilden. Damit fiel der Fehler sofort auf und die Korrektur war
nachweisbar (Abstand überall unter 0,4 px, in beiden Hälften).

→ Dasselbe Muster wie beim Overlay-Schleier: Wenn eine Messung die Annahme des
geprüften Codes teilt, bestätigt sie nur sich selbst.

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

### Playwright im Container
Die vorinstallierte Chromium-Version passt nicht zur frisch per pip installierten
Playwright-Version. **Kein `playwright install`** — stattdessen
`launch(executable_path="/opt/pw-browsers/chromium", args=["--no-sandbox"])`.

### Testkopie veraltet
Beim Vorher/Nachher-Vergleich über einen lokalen HTTP-Server lief der Test gegen
eine Kopie, die vor den letzten Änderungen erstellt worden war — das Ergebnis sah
nach einem Bug in der App aus, war aber eine alte Datei. Vor jedem Lauf neu kopieren.

### gstatic-Versionen prüfen, nicht raten
`https://www.gstatic.com/firebasejs/<version>/firebase-app.js` liefert für falsche
Versionen 404. Im Browser ist das ein **stiller** Totalausfall: Das Modul läuft
nicht, die Uhr zeigt einfach ihre Startwerte. Gegenprobe mit einer garantiert
ungültigen Nummer (99.0.0) gehört dazu — sonst weiß man nicht, ob der Test
überhaupt etwas prüft.

### Selbst gebaut, obwohl es Bewährtes gab
v0.53 bekam einen eigenen Update-Mechanismus, obwohl im Wetter-Projekt einer
seit über dreißig Fassungen lief — mit dokumentierten Lehren, die hier fehlten
(kein 10-Minuten-Takt, Vergleich auf „anders" statt „höher", `location.href`
statt der nackten Adresse, kein Rückfall). Lutz hat es gemerkt. Seit v0.55 ist
der Wetter-Mechanismus übernommen. **Vor dem Bauen erst in den Schwesterprojekten
nachsehen** — die Repos liegen alle unter `luperttrading-lab`.

### `maximumAge` ist kein Detail
`getCurrentPosition` mit `maximumAge: 30000` darf eine **bis zu 30 Sekunden alte**
Position aus dem Cache liefern. Bei 50 km/h sind das über 400 m — mehr als jeder
Zonenradius. Im Test mit simuliertem GPS sah es so aus, als reagiere die App nicht
auf Positionswechsel; tatsächlich gab der Browser brav den Cache zurück.

Seit v0.52: `maximumAge: 0` für Erstmessung, Knopfdruck und
Sichtbarkeitswechsel — Ankunft ist der Moment, auf den es ankommt. Nur der
2-Minuten-Takt nimmt 30000, weil dort ohnehin laufend gemessen wird.

### Race Condition zwischen Zonen und erster Messung
Bis v0.51 löste das Sync-Modul die erste Messung mit `setTimeout(…, 1200)` aus,
während die Zonen asynchron über `onValue` eintrafen. Ein Rennen gegen das Netz:
Bei langsamer Verbindung wurde ohne Zonen gemessen und jeder Ort als „unterwegs"
gewertet. Seit v0.52 hängt die erste Messung am Zonen-Listener, nicht an einer Uhr.

### Container-Resets
Die Arbeitsumgebung wird zwischen Sitzungen zurückgesetzt. Fonts (Cinzel.ttf, EBGaramond.ttf) mussten mehrfach neu geladen werden. Die Arbeitsdatei lässt sich aus der letzten Auslieferung wiederherstellen.

---

## 8. Deploy-Ablauf (bewährt)

### Versionierung — an GENAU EINER Stelle

```html
<div id="verzeile" class="ver">v0.55</div>
```

Von dort lesen **alle drei** Beteiligten: die Versionsprüfung im Skript
(`eigeneVersion()`), der Workflow `version.yml` und die Live-Kontrolle per curl.
Es gibt keine zweite Stelle mehr, die auseinanderlaufen könnte.

Bei jeder Lieferung, die `index.html` anfasst: **Minor um 1 erhöhen.**

⚠️ **Minor immer zweistellig** (`v0.55`, nicht `v0.6`). Die Prüfung rechnet
`major*1000 + minor`; `v0.6` ergäbe 6 und läge damit *unter* `v0.55` (55) —
kein Gerät würde aktualisieren. Nach `.99` auf die nächste Major (`v1.00`).

### version.json braucht keine Pflege

Der Workflow `.github/workflows/version.yml` schreibt sie bei jedem Push auf
`main`, der `index.html` berührt, und committet sie auf `main`. Nicht von Hand
ändern. Fehlt sie oder ist sie veraltet, liest die App die Nummer als Rückfall
aus der Seite selbst.

**Konsequenz:** Der Bot-Commit liegt danach auf `main`. Vor dem nächsten Push
also `git fetch origin main` und darauf aufsetzen — sonst wird der Push
abgelehnt.

### Der Mechanismus (übernommen aus dem Wetter-Projekt)

Dort seit v2.53 im Einsatz und über Dutzende Fassungen nachgeschärft. Die
Lehren daraus, die hier direkt eingeflossen sind:

- **Nur bei HÖHERER Nummer laden**, nie bei bloßem Unterschied — eine
  veraltete `version.json` löst sonst Reloads auf die alte Fassung aus.
- **Erst die nackte Adresse mit `cache:"reload"` holen, dann zu `?v=…`
  springen.** Das erste erneuert den Cache-Eintrag, den der nächste
  Homescreen-Start benutzt; das zweite garantiert, dass die jetzige Ladung
  frisch ist. Eines allein reicht nicht (Wetter v3.37).
- **Alle 10 Minuten prüfen, solange die App offen liegt.** Nur beim Start und
  beim Sichtbarwerden zu prüfen hieß im Wetter-Projekt „manchmal schon,
  manchmal nicht" — je nachdem, ob man zwischendurch die App gewechselt hatte
  (Wetter v3.60).
- **Beide Nummern nennen**: „Du hast v0.55 · neu ist v0.56". Nur die neue zu
  zeigen ließ Leute nach Änderungen suchen, die noch gar nicht geladen waren
  (Wetter v3.66).
- **Rückfall auf die Seite selbst**, wenn `version.json` fehlt.

Abweichung von Wetter, auf Lutz' Wunsch: Dort steht ein Knopf „Neu laden",
hier lädt die App nach 1,2 s **von selbst**. Deshalb der Schleifenschutz über
`sessionStorage` — dieselbe Zielversion wird je Sitzung nur einmal
angefahren, danach steht „App schließen und neu öffnen".

### Vier Bausteine aus dem Projekt Zettel (v0.56)

Lutz hat die Doku `UPDATE-MECHANIK.md` aus `luperttrading-lab/Zettel`
beigesteuert. Übernommen:

1. **Service Worker `sw.js`, „Netz zuerst"** — der strukturelle Fix für
   „wegwischen und neu öffnen bringt die alte Fassung". Jeder Start fragt mit
   `cache:'no-cache'` beim Server nach; unverändert kommt 304. `skipWaiting()`
   und `clients.claim()` sind Pflicht, sonst wartet der neue Worker, bis alle
   Fenster zu sind (auf dem iPhone: nie).
   **Bewusste Abweichung:** Zettels Worker cacht auch fremde Dateien „Cache
   zuerst". Hier laufen über fremde Adressen die Firebase-Verbindungen — ein
   gecachter Datenbank-Abruf wäre fatal. Unser Worker fasst **nur eigene
   Dateien** an (`origin`-Prüfung), alles andere läuft unberührt durch.
   `sw.js` gehört ins Repo-Root neben `index.html`.
2. **Kein Neuladen, während jemand tippt oder zieht** (`beschaeftigt()`):
   Anmeldemaske mit halbem Passwort, Zeiger in der Hand. Die Leiste sagt dann
   „wird geladen, sobald du fertig bist"; der Schleifenschutz wird dabei
   **nicht** gesetzt, die nächste Prüfung versucht es erneut.
3. **Tipp auf die Versionszeile prüft von Hand** und meldet auch „ist aktuell"
   oder „Offline" — sonst weiß man nie, ob die Prüfung arbeitet oder schweigt.
   Seit v0.58 mit Doppellauf-Schutz (`pruefungLaeuft`, Zettels `checking`) und
   **zwei Banner-Zuständen** wie in Zettel: hervorgehoben mit Knopf „Jetzt laden"
   für eine wartende Version (`.neuver.neu`), gedämpft für bloße Auskunft.
4. **Nach einem Update einmal „Version vX ist geladen"** (`localStorage`
   `uhr_gesehen`), 4 s, beim allerersten Start still. Seit v0.57 wie in Zettel
   **antippbar**: eine Info verschwindet, eine wartende Version — auch im
   Aufschub — wird sofort geladen. Beim ersten Start von v0.56 war die
   Meldung still, weil keine ältere Fassung `uhr_gesehen` je gesetzt hatte. Kam in Zettel am 12.9. dazu,
   nachdem Lutz die klein gesetzte Nummer nicht wahrgenommen hatte — dieselbe
   Rückmeldung wie hier bei v0.53.

### Nachtrag aus der Zettel-Doku vom 15.9. (v0.59)

5. **Das Banner überlagert, es schiebt nicht.** `#neuver` liegt seit v0.59
   `position:fixed` direkt im `<body>` (nicht mehr im `.wrap`), oben mit
   `top:max(env(safe-area-inset-top),12px)`, `z-index:70` — also **über** der
   Anmeldemaske (60), damit „wird geladen, sobald du fertig bist" beim Tippen
   sichtbar bleibt. Im Fluss hätte es beim Erscheinen die ganze Uhr nach unten
   geschoben. Gemessen (393×852): Uhr-Position und Scrollhöhe sind ohne Banner,
   mit Auskunft und mit Update-Banner identisch (Prüfliste 8).
6. **Der Auslöser ist die untere Versionsnummer — und nur sie.** Gepunktet
   unterstrichen (ein `title`-Attribut sieht auf dem iPhone niemand). v0.59
   hatte zusätzlich eine Nummer oben neben dem Untertitel und den Titel als
   Auslöser — **von Lutz am 15.9. verworfen**: „zerstört das Bild der App".
   Der Kopf bleibt, wie er war. Folge: auf Displays ≤700 px (Versionszeile
   ausgeblendet) gibt es keine Handprüfung; die Familiengeräte sind größer.
7. **Antwort an der Kante des Auslösers** (`bannerAnKante`): Tipp auf die
   Nummer unten → Banner unten (`.neuver.unten`); Meldungen der App selbst
   (Start, Takt, Sichtbarwerden) → fester Ort oben (Prüfliste 9).
   **Beides als Überblendung** (`.neuver` opacity 0 → `.an` 1, 0,35 s; `hidden`
   nur als Endzustand nach dem Ausblenden) — Lutz' Vorgabe: einblenden, ohne
   das Bild zu verschieben. Gemessen: Uhr-Position und Scrollhöhe bleiben in
   jedem Zustand gleich; Deckkraft 0,09 nach 60 ms, 1,00 nach 560 ms.
8. **Takt bewusst beibehalten — Abweichung von Zettel.** Zettel hat den
   60-s-Takt nach 3.36 ausgebaut, weil jede Prüfung dort die ganze `index.html`
   holt (~87 KB, ~5 MB/h). Bei uns sind es 20 Bytes je Prüfung — 0,02 % davon,
   rund 18 KB/h. Lutz hatte am 14.9. ausdrücklich das Verhalten „auch bei
   offener App" gewünscht. Zettels Prüfliste 7 („es darf nichts fließen")
   gilt hier deshalb nicht; wer den Takt streichen will: `VER_TAKT_MS`.
9. **Die Zettel-Doku wurde zurückkorrigiert** (15.9., Fassung im Scratchpad an
   Lutz geliefert für `Zettel/docs/UPDATE-MECHANIK.md`): Auslöser bleibt, wo das
   Design ihn hat; Banner antwortet an seiner Kante; Überblendung als
   Anforderung; Takt-Hinweis relativiert (billig mit `version.json`); Warnung
   vor Cache-zuerst bei fremden Datenadressen; Hinweis, dass die erste
   nachgerüstete Fassung noch kein „ist geladen" zeigt.

Nicht übernommen, weil unseres besser ist: Zettel vergleicht Zeichenketten auf
*ungleich* (die Doku nennt die Schwäche selbst) und lädt zur Prüfung die ganze
`index.html` — bei uns 210 KB alle 60 s. Wir bleiben bei numerisch *höher* und
`version.json` (20 Bytes). Takt seit v0.58 **jede Minute** wie in Zettel — Lutz hat dort
beobachtet, dass ein Update bei offener App binnen einer Minute kommt; mit 5 Minuten
hätte er es hier für kaputt gehalten. Gemessen: 53 s nach Erscheinen der neuen Nummer.

### Veröffentlichen

- **Repo:** GitHub Pages unter `luperttrading-lab`, Settings → Pages → main → root.
  Vier Dateien gehören ins Root: `index.html`, `sw.js`, `version.json`,
  `apple-touch-icon-v3.png`.
- **Ablauf:** auf `main` pushen → Live-Kontrolle:
  `curl -s https://luperttrading-lab.github.io/weasley/ | grep -o 'class="ver">v[0-9.]*'`
  (Pages braucht 1–2 Minuten). Die Geräte holen sich die Fassung dann selbst.
- **Erstinstallation / hängende Fassung:** Homescreen-App komplett schließen und
  neu öffnen. Reicht das nicht (Cache `max-age=600` der Homescreen-App, getrennt
  von Safari): Icon löschen, in Safari laden, neu zum Homescreen.
- **Icon-Wechsel:** Der Dateiname `-v3` ist Absicht — iOS und Pages cachen Icons
  hartnäckig. Altes Icon vom Homescreen löschen und neu hinzufügen.

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
