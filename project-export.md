# Projekt‑Export‑Template für Coding Agents (tobrojekt.dev)

Dieses Template instruiert einen Coding‑Agenten in einem Fremd‑Repository, alle für tobrojekt.dev relevanten Projektdaten tech‑neutral zu erheben, zu validieren und als portables Export‑Artefakt bereitzustellen. Es richtet sich nach den Prinzipien und dem Content‑Modell aus `AGENTS.md`.

## 1) Ziel
- Erzeuge einen vollständigen, prüfbaren Projekt‑Export ohne Geheimnisse oder PII.
- Strukturiere den Export stabil, menschenlesbar und diff‑freundlich.
- Halte dich an die Minimalfelder und Konventionen aus `AGENTS.md`.

## 2) Eingabeparameter (vom Auftraggeber/Runner übergeben)
- `projectSource`: Repo‑URL oder lokaler Pfad.
- `visibility`: `public` | `private` (Default: `public`).
- `featured`: `true` | `false` (Default: `false`).
- `priority`: Zahl, niedriger = prominenter (Default: `999`).

## 3) Datenquellen (nicht‑invasiv, read‑only)
- README/Docs (H1, Intro, Features, Links), LICENSE, CHANGELOG/RELEASES.
- Repo‑Metadaten: Remote‑URL, Default‑Branch, Topics/Labels.
- Commit‑Historie: erster/letzter Commit für `dates`.
- Manifeste: z. B. `package.json`, `Cargo.toml`, `pyproject.toml` (für Tech‑Tags).
- Demo/Docs‑URLs aus README. Optional Metriken (nur stabil & zulässig).

## 4) Arbeitsanweisungen (Felder erheben und formen)
- `id`: Verwende `gh:<owner>/<repo>`; falls kein Remote, `local:<ordnername>`.
- `slug`: Aus `title`; lowercase, ASCII, hyphenated; stabil und kollisionsfrei.
- `title`: README‑H1 bevorzugen; sonst Repo‑Name in Title‑Case.
- `summary`: 1–2 prägnante Sätze (Outcome/Impact, klarer Nutzen).
- `description`: Kurzfassung in Markdown (ca. 120–300 Wörter, sachlich, keine PII).
- `status`: `planned` | `active` | `completed` | `archived` (herleiten und begründen).
- `tags`/`categories`: Aus Tech/Domain/Use‑Cases; 5–10 Tags, kurz und konsistent.
- `roles`/`skills`: Z. B. `engineering`, `design`, relevante Skills/Technologien.
- `links`: Mindestens `source`; optional `demo`, `docs`, `related` (Label + URL).
- `media`: Ein Social‑Bild für die Vorschau/Hero und optional 1–6 Galeriebilder.
  - `social_card`: Empfohlen 1200×630 (1.91:1), Alt‑Text erforderlich; `width`/`height` wenn verfügbar.
  - `images`: Zusätzliche Screenshots/Diagramme; Alt‑Text erforderlich; `width`/`height` wenn verfügbar.
- `dates`: ISO‑8601 (`YYYY-MM-DD`) für `created`, `updated`; optional `started`, `completed`.
- `metrics`: Nur stabile Zahlen (z. B. GitHub Stars) plus `collectedAt` Datum; sonst weglassen.
- `featured`/`priority`/`visibility`: aus Eingaben setzen; Defaults respektieren.
- Sicherheit/Privatsphäre: Keine Secrets sammeln; keine PII; externe Abfragen nur, wenn erlaubt.

## 5) Ausgabe‑Struktur
Lege Dateien relativ zum Arbeitsverzeichnis im folgenden Pfad an:

```
portfolio-export/<slug>/
  ├─ project.json
  ├─ social-card.png         (optional, empfohlen 1200×630)
  └─ media/                  (weitere Bilder/Assets)
```

- Referenziere Media in `project.json` relativ zu diesem Ordner (`media/...`).
- Wenn keine Bilder verfügbar sind, `media` leer lassen und `cover` auslassen.

## 6) JSON‑Skelett (ausfüllen)

```json
{
  "id": "gh:<owner>/<repo>",
  "slug": "<slug>",
  "title": "<Titel>",
  "summary": "<1–2 Sätze>",
  "description": "<Markdown>",
  "status": "planned|active|completed|archived",
  "tags": ["<tag1>", "<tag2>"],
  "categories": ["<cat1>"],
  "roles": ["engineering"],
  "skills": ["<skill1>", "<skill2>"],
  "links": {
    "source": "https://…",
    "demo": "https://…",
    "docs": "https://…",
    "related": [{ "label": "<Name>", "url": "https://…" }]
  },
  "media": {
    "social_card": {
      "src": "social-card.png",
      "alt": "<Alt-Text>",
      "width": 1200,
      "height": 630
    },
    "images": [
      { "src": "media/screenshot-1.png", "alt": "<Alt>", "width": 1600, "height": 900 },
      { "src": "media/screenshot-2.png", "alt": "<Alt>", "width": 1600, "height": 900 }
    ]
  },
  "dates": {
    "created": "YYYY-MM-DD",
    "updated": "YYYY-MM-DD",
    "started": "YYYY-MM-DD",
    "completed": "YYYY-MM-DD"
  },
  "metrics": {
    "stars": 0,
    "forks": 0,
    "downloads": 0,
    "collectedAt": "YYYY-MM-DD"
  },
  "featured": false,
  "priority": 999,
  "visibility": "public"
}
```

## 7) Heuristiken (Ableitungsregeln)
- Titel/Slug: README‑H1 bevorzugen; sonst Repo‑Name; Slug kollisionsfrei halten.
- Status: `completed` bei getaggtem Release und längerer Inaktivität; `archived` bei Archive‑Flag oder >18 Monate ohne geplante Arbeit; sonst `active`.
- Tags: Programmiersprachen, Frameworks, Domäne, Artefakt (CLI, Service, Website, Library).
- Dates: `created` = erster Commit; `updated` = letzter Commit auf Default‑Branch.
- Links: `source` ist Pflicht; `demo`/`docs` nur wenn stabil und öffentlich zugänglich.

## 8) Validierung (Checkliste vor Übergabe)
- Pflichtfelder gesetzt: `id`, `slug`, `title`, `summary`, `visibility`.
- URLs absolut und plausibel; externe Erreichbarkeit nicht hart voraussetzen.
- Alle `media.*.alt` nicht leer; Dimensionen, wenn eruierbar. `social_card` nach Möglichkeit 1200×630.
- ISO‑Datumformat; keine futuristischen Datumswerte.
- Keine Secrets/Keys im Exportordner.
- Wenn `metrics` gesetzt, dann inkl. `collectedAt` (ISO‑Datum).
- Sichtbarkeit respektiert: `private` Projekte nicht in öffentlichen Flächen listen.

## 9) Antwortformat (für die Rückmeldung des Agents)
- Kurze Projektzusammenfassung (3–5 Sätze, Outcome/Impact, Besonderheiten).
- Export‑Pfade: `portfolio-export/<slug>/project.json` und ggf. erzeugte Media.
- Validierungscheckliste mit Pass/Fail je Punkt (stichpunktartig).
- Offene Fragen/Risiken mit 1–2 Vorschlägen zur Klärung.

## 10) Hinweise zur Wartbarkeit
- Halte Slugs stabil; dokumentiere Redirects, falls ein Slug später angepasst wird.
- Vermeide flüchtige Metriken; ergänze Sammeldatum, wenn doch benötigt.
- Bevorzuge kleine, nachvollziehbare Änderungen; füge bei Modelländerungen kurze Migration‑Notizen bei.

---

Dieses Template ist technologie‑agnostisch. Stack‑spezifische Details (Build/Deploy, Befehle) gehören in separate, optionale Dokumente und dürfen die hier definierten Prinzipien nicht verwässern.
