# Lehrzeit

Responsiver Angular-Prototyp zur Erfassung und Auswertung der Arbeitszeit von Lehrkräften.

## Technischer Stand

- Angular 22, Standalone Components und Signals
- Optimus UI 2 mit Aura Theme
- responsive Desktop- und Mobile-Navigation
- manuelle Zeiterfassung und Stoppuhr
- Tätigkeitskategorien, Tagesübersicht und Auswertungsansichten
- lokale Persistenz im Browser über `localStorage`
- Unit-Tests mit Vitest
- Render-Blueprint für eine statische Bereitstellung

## Voraussetzungen

- Node.js 24.15 oder neuer (alternativ Node.js 22.22.3 oder neuer)
- npm 11

Angular 22 benötigt außerdem TypeScript 6.0.x. Die passenden Versionen sind im Projekt festgelegt.

## Lokal starten

```bash
npm ci
npm start
```

Danach ist die Anwendung unter `http://localhost:4200` erreichbar.

## Testen und bauen

```bash
npm test
npm run test:ci
npm run build
```

Der Production-Build wird unter `dist/lehrzeit-angular/browser` erzeugt.

## Render

Die Datei `render.yaml` enthält bereits:

- den Build-Befehl `npm ci && npm run build`
- den Publish-Pfad `dist/lehrzeit-angular/browser`
- eine Rewrite-Regel für clientseitiges Routing

Für die Bereitstellung das Repository zu GitHub oder GitLab pushen und in Render als Blueprint importieren. Aktuell speichert die App Einträge nur lokal im jeweiligen Browser. Für mehrere Geräte oder Benutzer wird im nächsten Schritt ein Backend mit Datenbank und Authentifizierung benötigt.

## Struktur

- `src/app/core/work-entry.model.ts`: Domänenmodell und Kategorien
- `src/app/core/work-time.store.ts`: Signal-basierter Zustand und Browser-Persistenz
- `src/app/app.ts`: Interaktionslogik
- `src/app/app.html`: responsive Oberfläche
- `src/app/app.scss`: visuelles Layout
- `render.yaml`: Render-Konfiguration
