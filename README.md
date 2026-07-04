# Dienstplan

Werkzeug zur Erstellung wöchentlicher Dienstpläne (Montag–Freitag).
Die Daten verbleiben lokal im Browser und werden nicht an einen Server gesendet.

## Features

- **Dienstplan-Tabelle** mit Mitarbeiterzeilen und Tagesspalten (Mo–Fr)
- **Eintragstypen**: Dienst (mit Start-/Endzeit), Urlaub, Krank, Feiertag
- **Pausenregel**: automatische 30-min Abzug bei über 6 Stunden
- **Ereignisse**: ganztägige oder zeitgebundene Ereignisse pro Tag
- **Stundensumme** pro Mitarbeiter
- **Woche-Navigation**: Vor/Zurück-Buttons + Kalenderwochen-Auswahl
- **Smart Endzeit**: automatisch Start + 7,8h + 30min Pause beim Setzen der Startzeit
- **Member-Autocomplete**: bereits eingegebene Namen erscheinen als Vorschlag
- **Auf alle Tage anwenden**: ein Eintrag für alle 5 Tage in einem Submit
- **Zell-Highlight**: Klick auf eine Zelle markiert sie; erneuter Klick entfernt die Markierung
- **Flash-Feedback**: eingetragene Zellen blinken grün nach dem Hinzufügen
- **Tastatur-Shortcuts**: Esc = Formular zurücksetzen, Ctrl/Cmd+Backspace = Woche leeren
- **Zeit-Validierung**: roter Rahmen bei Endzeit < Startzeit
- **CSV-Import/Export**: mit automatischer Dateinamen-Übernahme; ausgewählte Formular-Edits werden vor Export/Speichern übernommen
- **Speichern**: schreibt in unterstützten Browsern zurück in die importierte CSV-Datei; sonst Save-As/Download mit aktuellem Dateinamen
- **PDF-Export**: A4 Landscape mit Skalierung
- **Kompakte Toolbar**: feste Icon-Leiste für Leeren, PDF, CSV, Import, Speichern und Dateiname
- **Druckoptimierte Darstellung**: Formular und Toolbar werden im Druck ausgeblendet
- **Legende/Zusatzinfos**: bearbeitbarer Bereich unter der Tabelle

## Dateistruktur

```
dienstplan/
├── index.html          CSS, HTML, und <script>-Tags
├── js/
│   ├── time.js         Zeit-Parsing und Formatierung
│   ├── break-rules.js  Pausenregel-Logik (Abzug, Block-Erkennung)
│   ├── csv.js          CSV-Erzeugung, Parsing, HTML-Escaping
│   ├── week.js         ISO-Woche-Navigation, Datumsformatierung
│   ├── export.js       PDF-Export-Vorbereitung, Dateinamen-Hilfsfunktionen
│   ├── state.js        Schedule-Daten, Edit-State, Active-Cell-Tracking
│   ├── form.js         Formular-Reset, Validierung, Mode-Toggling
│   ├── render.js       Tabellen-Rendering, Flash-Animation
│   ├── import.js       CSV-Import-Verarbeitung
│   └── app.js          Event-Listener, Initialisierung (Einstiegspunkt)
└── LICENSE
```

## Architektur

Die App verwendet ein IIFE-Modul-Pattern mit gemeinsamem Namespace
`window.Dienstplan`. Jede Datei ist ein sofort-ausgeführter Funktionsausdruck
(IIFE), der seine API an den Namespace exportiert.

```js
// js/time.js
(function (D) {
  "use strict";

  function parseTimeToMinutes(value) { ... }
  function formatHours(minutes) { ... }

  D.Time = { parseTimeToMinutes, formatHours, ... };
})(window.Dienstplan || (window.Dienstplan = {}));
```

### Module

| Modul          | Datei               | Verantwortung                                                                                                                                                       |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D.Time`       | `js/time.js`        | `parseTimeToMinutes`, `calculateDurationMinutes`, `formatHours`, `formatHoursDecimal`, `formatHoursDecimalInput`, `formatTimeFromMinutes`                           |
| `D.BreakRules` | `js/break-rules.js` | `DEFAULT_FULL_DAY_MINUTES`, `absenceTypes`, `getEntryWindowMinutes`, `applyBreakRule`, `calculateDayTotals`, `isAbsenceEntry`, `isTimedEntry`                       |
| `D.Csv`        | `js/csv.js`         | `generateCsvContent`, `parseCsvText`, `parseCsvLine`, `escapeCsvValue`, `escapeHtml`, `formatEventTitle`                                                            |
| `D.Week`       | `js/week.js`        | `parseWeekValue`, `getIsoWeekStartDate`, `formatDate`, `updateWeekdayHeaders`, `getIsoWeeksInYear`, `shiftWeek`, `weekDays`                                         |
| `D.Export`     | `js/export.js`      | `getExportFilename`, `getExportBaseName`, `getPixelsPerMillimeter`, `preparePdfExport`, `syncLegendPrintState`                                                      |
| `D.State`      | `js/state.js`       | `schedule`, `allDayEvents`, `eventEditState`, `entryEditState`, `addEntry`, `addAllDayEvent`, `setActiveCell`, `clearActiveCell`, `parseHoursToMinutes`             |
| `D.Form`       | `js/form.js`        | `resetFormExceptMember`, `updateMemberDatalist`, `updateDeleteButtonState`, `updateEntryTypeMode`, `updateSubmitButtonText`, `toggleEventMode`, `validateTimeRange` |
| `D.Render`     | `js/render.js`      | `renderTable` (mit `renderEventsRow`, `renderMemberRow`, `renderEntryCell`), `flashSubmittedCells`                                                                  |
| `D.Import`     | `js/import.js`      | `processImportedFile`                                                                                                                                               |
| Einstiegspunkt | `js/app.js`         | DOM-Referenzen, alle Event-Listener, Tastatur-Shortcuts, Initialisierung                                                                                            |

### Abhängigkeiten

```
app.js → alle Module
render.js → Time, BreakRules, Csv, Week
import.js → BreakRules, Csv, Week, State, Render, Export
form.js → BreakRules, State
state.js → BreakRules
csv.js → Time, BreakRules, Week
```

Module hängen ihre öffentlichen APIs an `window.Dienstplan` und greifen über den
gemeinsamen Namespace (`D.Time`, `D.Csv` usw.) auf andere Module zu. Nur `app.js`
hält direkte DOM-Referenzen
(`getElementById` etc.).

## Verwendung

Die App ist eine einzelne HTML-Datei ohne Build-Step oder Server.
Einfach `index.html` im Browser öffnen (Chrome, Edge, Firefox, Safari).

Direktes Überschreiben einer importierten CSV-Datei nutzt die File System Access
API. Das funktioniert vor allem in Chrome/Edge und in der Regel nur über einen
sicheren Kontext wie `localhost` oder HTTPS. Ohne diese API speichert die App
per Save-As-Dialog oder Download-Fallback.

## Technologie

- **Bootstrap 5.3.2** (via CDN) für Layout und Formulare
- **Space Grotesk** + **IBM Plex Mono** (via Google Fonts)
- **Keine Build-Tools, keine Dependencies, kein Framework**
- **Keine Server-Persistenz** — alle Daten leben im Speicher und müssen per CSV gespeichert werden
