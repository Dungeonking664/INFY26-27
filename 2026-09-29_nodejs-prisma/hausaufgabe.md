# Aufgabe — KM5-01 (Node.js + Prisma 7)

1. **Vorhersage** (vor dem Ausführen): erwartetes Ergebnis von Query 1 (Top-Künstler);
   begründe, warum `COUNT(*)` = 4, `COUNT(labelId)` aber 3 ergibt.
2. **Setup wiederholen:** `npm i prisma@7 @prisma/client@7 @prisma/adapter-better-sqlite3@7 dotenv`,
   `npm approve-scripts --all`, `cp .env.example .env`, `npm run db:migrate`, `npm run db:seed`;
   danach `npm run run` und `npm test` grün bekommen (Screenshot der 5 Konsolen-Zeilen).
3. **Erweitern:** Model `Playlist` mit N:M zu `Song` ergänzen, migrieren und **eine** Prisma-Query
   schreiben, die pro Playlist die Song-Anzahl liefert.
4. **Reflexion (5–6 Sätze):** Wo war Prisma kürzer als SQL, wo musstest du auf `$queryRaw`
   ausweichen? Bleibst du vorerst bei Prisma?

---

## Lösungen

### 1) Vorhersage (vor dem Ausführen)

**Query 1 — Top-Künstler** (`src/queries.js`, `topKuenstler()`): gruppiert `Song` nach
`kuenstlerId`, zählt je Gruppe `_all`, sortiert absteigend, `take: 5`. Erwartetes Ergebnis
(Seed: 7 Songs / 4 Künstler):

```
1) Top-Künstler:  [ { name: 'Nova', tracks: 3 },
                    { name: 'Pixel', tracks: 2 },
                    { name: 'Ohne Label', tracks: 1 },
                    { name: 'Solveig', tracks: 1 } ]
```

Die Reihenfolge der beiden 1er-Plätze ist hier **nicht** garantiert (kein Tie-Breaker in
`orderBy`) — nur ihre Anzahl ist sicher.

**Warum `COUNT(*)` = 4, aber `COUNT(labelId)` = 3?**

`COUNT(*)` zählt **Zeilen**: Jeder Datensatz wird gezählt, egal ob der Spalteninhalt
irgendetwas ist — auch dann, wenn er `NULL` ist. In `Kuenstler` liegen 4 Zeilen
(Nova, Pixel, Solveig, "Ohne Label"), also 4.

`COUNT(labelId)` zählt **Werte**: `NULL` ist in SQL kein Wert, sondern "unbekannt", und wird
vom Aggregat ignoriert — es wird nicht als 0 gezählt, sondern gar nicht erst als Kandidat
betrachtet. Der Künstler "Ohne Label" hat `labelId IS NULL` und fällt deshalb aus der
Zählung heraus: 4 − 1 = 3.

Merksatz: `COUNT(*)` = "wie viele Datensätze gibt es", `COUNT(spalte)` = "wie viele
Datensätze haben in dieser Spalte einen Wert". Die Spalte muss dafür **NOT NULL** sein,
sonst liefert Prisma ein abweichendes Ergebnis.

In Prisma sieht das so aus (`kuenstlerMitUndOhneLabel()`): `prisma.kuenstler.count()` gegen
`prisma.kuenstler.count({ where: { labelId: { not: null } } })`.

### 2) Setup

Befehle in `praxis/` in dieser Reihenfolge ausgeführt (Node v24.19.0, npm 11.17.0):

```bash
npm i prisma@7 @prisma/client@7 @prisma/adapter-better-sqlite3@7 dotenv
npm approve-scripts --all          # → "No packages with unreviewed install scripts."
cp .env.example .env               # PowerShell: Copy-Item .env.example .env
npm run db:migrate                 # → Migration 20260928220811_init angewandt
npm run db:seed                    # → Seed fertig: 4 Künstler, 7 Songs.
npm run run                        # → 5 Konsolen-Zeilen
npm test                           # → 5/5 grün
```

**Zwei Stolpersteine, die ich im Scaffold behoben musste:**

1. **`postinstall` lief nicht durch.** Nach `npm approve-scripts --all` war kein Script mehr
   offen ("No packages with unreviewed install scripts."), der generierte Client fehlte
   trotzdem — `npm run db:seed` brach mit
   `SyntaxError: ... '@prisma/client' does not provide an export named 'PrismaClient'` ab.
   Grund: das `postinstall` lief, *bevor* `.env` existierte, und Prisma 7 findet die
   Datasource-URL nur über `prisma7.config.ts`/`DATABASE_URL`. Lösung: einmalig
   `npm run db:generate` nach `cp .env.example .env`.
2. **`npm run run` gab keinerlei Ausgabe.** Der Aufruf-Guard
   `if (import.meta.url === \`file://${process.argv[1]}\`)` vergleicht unter Windows einen
   `file:///C:/...`-URL mit einem Backslash-Pfad (`C:\...\src\queries.js`) — nie gleich, also
   sprang `main()` nie an. Behoben in `src/queries.js` mit
   `pathToFileURL(process.argv[1]).href` (plattformunabhängig).

**Konsolenausgabe `npm run run` (Screenshot ersetzt durch Textausgabe):**

```
1) Top-Künstler:           [ { name: 'Nova', tracks: 3 },
                               { name: 'Pixel', tracks: 2 },
                               { name: 'Ohne Label', tracks: 1 },
                               { name: 'Solveig', tracks: 1 } ]
2) Label-Paare:            [ { a: 'Nova', b: 'Pixel', label: 'Ohrwurm Records' } ]
3) Labels mit >1 Künstler: [ { name: 'Ohrwurm Records', anzahl: 2 } ]
4) COUNT(*) vs. mit Label: { alle: 4, mitLabel: 3 }
5) Künstler mit 2+ langen: [ { name: 'Nova', anzahl: 2 }, { name: 'Pixel', anzahl: 2 } ]
6) Song-Anzahl/Playlist:   [ { name: 'Frühling', anzahl: 3 },
                               { name: 'Leer (für 0 Songs)', anzahl: 0 },
                               { name: 'U2 Übung', anzahl: 1 } ]
```

(Zeile 6 ist die Erweiterung aus Aufgabe 3, also inzwischen eine 6. Zeile statt 5.)

`npm test`: **6/6 grün** (5 Original-Tests + 1 neuer Playlist-Test).

### 3) Erweiterung: `Playlist` N:M zu `Song`

**Schema** (`prisma/schema.prisma`) — nur die zwei Listenfelder, Prisma erzeugt die
Join-Tabelle selbst:

```prisma
model Song {
  // ... unverändert
  playlists   Playlist[]
}

model Playlist {
  id    Int    @id @default(autoincrement())
  name  String @unique
  songs Song[]
}
```

**Migration** `prisma/migrations/20261001163442_add_playlist/migration.sql` legt `Playlist`
und die Join-Tabelle `_PlaylistToSong` (`A` → `Playlist`, `B` → `Song`, beide `ON DELETE
CASCADE`) an. In Prisma 7 läuft die Migration über `prisma migrate dev --name add_playlist`
(die Konfiguration kommt aus `prisma7.config.ts`, nicht aus einem CLI-Flag). Nach dem
Schema-Wechsel muss einmal `npm run db:generate` laufen, sonst kennt der Client
`prisma.playlist` noch nicht.

**Die Query** (`src/queries.js`, `songAnzahlProPlaylist()`) — eine einzige Abfrage, kein
`JOIN`/`GROUP BY` von Hand:

```js
const playlists = await prisma.playlist.findMany({
  select: { name: true, _count: { select: { songs: true } } },
  orderBy: { name: "asc" },
});
return playlists.map((p) => ({ name: p.name, anzahl: p._count.songs }));
```

Ergebnis: `Frühling` = 3, `U2 Übung` = 1, `Leer (für 0 Songs)` = 0. Die leere Playlist ist
der interessante Fall: `_count` zählt über die Join-Tabelle und liefert korrekt `0` — ein
`LEFT JOIN ... COUNT(s.id)` hätte ebenfalls 0 geliefert, ein innerer Join hätte die
Playlist dagegen ganz verschwinden lassen.

**Seed-Erweiterung** (`src/seed.js`): 3 Playlists; `Frühling` verknüpft Fjord/Nordlicht/Glut,
`U2 Übung` nur Glut (zeigt, dass ein Song in mehreren Playlists liegen darf), eine bleibt
leer. Zusätzlich `prisma.playlist.deleteMany()` am Anfang, damit der Seed weiterhin
idempotent bleibt.

### 4) Reflexion

Am deutlichsten war Prisma bei den Aggregationen kürzer als SQL: `GROUP BY` + `ORDER BY` +
`LIMIT` für die Top-Künstler waren ein `groupBy({ by, _count, orderBy, take })` ohne einen
einzigen JOIN, und `COUNT(*)` vs. `COUNT(labelId)` wurde zu zwei `count()`-Aufrufen mit
`where`-Filter, ohne dass ich die NULL-Semantik selbst ausformulieren musste — die
Unterscheidung ist im Typsystem versteckt statt im SQL-Text. Für die N:M-Zählung pro
Playlist reichte ein `_count: { select: { songs: true } }`, was in SQL ein `LEFT JOIN` plus
`GROUP BY` über der impliziten Join-Tabelle gewesen wäre. Umgekehrt gab es genau eine Stelle,
an der ich auf `$queryRaw` ausweichen musste: das Self-JOIN für die Künstlerpaare
(`x.id < y.id`), denn Prisma kann eine Relation nicht gegen sich selbst joinen — das ist
kein Feature-Umweg, sondern schlicht nicht im Client abgebildet. Die `_count`-Syntax ist
zudem an das Modell gebunden: sobald ich „Songs, die in keiner Playlist sind" oder
Zwischensummen bräuchte, wäre Aggregat-Filter (`where` in `_count`) nötig, und für
mehrstufige Auswertungen oder Fensterfunktionen würde Prisma sowieso zu SQL zurückfallen.
Insgesamt bleibe ich vorerst bei Prisma, weil es die Migration, die Typsicherheit und
die Relation-Generierung mitbringt und ich bei meinen Diagnose-Queries nur einmal auf
`$queryRaw` ausweichen musste — SQL-Kenntnisse bleiben aber nötig, um zu erkennen, *wann*
man aus der Query-API herausfallen muss.
