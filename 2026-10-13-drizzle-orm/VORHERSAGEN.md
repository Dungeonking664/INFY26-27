# Vorhersagen KM5-05 — Drizzle ORM (Aufgabe 1)

Notiert **vor** dem ersten Ausführen von `deno task demo`. Der „Abgleich" unten
wurde erst **nach** dem Lauf ergänzt — genau das ist die Übung: erst tippen,
dann schauen, ob das ORM das SQL liefert, das man erwartet hat.

Grundannahmen, auf denen beide Vorhersagen basieren:

- `select()` ohne Argumente listet Drizzle **alle Spalten explizit** auf — in
  der Reihenfolge der Spaltendefinition in `schema.ts`.
- Jeder Wert landet als **Platzhalter `?`** im SQL und als Eintrag im
  `params`-Array (Parametrisierung by default).
- Der WHERE-Bezug ist **tabellenqualifiziert** (`"tabelle"."spalte"`), wie in
  der Lesson gezeigt (`"track"."album_id" = ?`).
- Der DB-Spaltenname kommt aus der Klammer im Schema (`artistId` → `artist_id`),
  nicht aus dem TypeScript-Namen.

## a) `db.select().from(artist).where(eq(artist.gruendungsjahr, 1999))`

Vorhergesagtes SQL:

```sql
select "id", "name", "gruendungsjahr"
  from "artist"
 where "artist"."gruendungsjahr" = ?
```

- **Spaltenliste:** `"id"`, `"name"`, `"gruendungsjahr"` — genau in der
  Reihenfolge der Definition in `schema.ts` (Reihenfolge 1‑2‑3 wie
  `sqliteTable("artist", { id, name, gruendungsjahr })`).
- **WHERE-Klausel:** `"artist"."gruendungsjahr" = ?` — Tabelle und Spalte
  qualifiziert, kein Wert im Text.
- **Parameter:** `[ 1999 ]`.
- **Ergebnis (typisiert):** Array von
  `{ id: number; name: string;
  gruendungsjahr: number | null }` — bei
  vorhandenen Künstlern mit Gründungsjahr 1999 z. B.
  `[ { id: 1, name: "Aera", gruendungsjahr: 1999 } ]`.

## b) `db.select({ n: count() }).from(album).where(eq(album.artistId, 1))`

Vorhergesagtes SQL:

```sql
select count(*) as "n"
  from "album"
 where "album"."artist_id" = ?
```

- **Spaltenliste:** nur die Aggregation — `count()` ohne Argument wird zu
  `count(*)` und trägt den Alias `"n"` aus dem Auswahl-Objekt `{ n: count() }`.
  Keine weiteren Spalten (Sterne landen nie im SQL).
- **WHERE-Klausel:** `"album"."artist_id" = ?` — der TypeScript-Name `artistId`
  übersetzt zu DB-Spalte `artist_id`.
- **Parameter:** `[ 1 ]`.
- **Ergebnis:** `[{ n: number }]`, z. B. `[{ n: 1 }]` („Wie viele Alben hat
  Artist 1?").

## Bonus: „Jetzt du!" Nr. 1 — `db.select().from(track)`

Welche Spalten und in welcher Reihenfolge?

```sql
select "id", "titel", "dauer_sek", "album_id" from "track"
```

- Reihenfolge = Reihenfolge der Spalten in `schema.ts` (`id`, `titel`,
  `dauerSek`, `albumId`), jeweils mit dem DB-Namen in Anführungszeichen.
- Würde man im Schema die Spalten anders anordnen, liefert Drizzle genau diese
  andere Reihenfolge — die Liste folgt der **Definition**, nicht dem
  Spaltenstand der Tabelle in der DB.

---

## Abgleich (ERGEBNIS — erst nach `deno task demo` ergänzt)

Tatsächliche Ausgabe des Vorhersage-Checks in `demo.ts`:

```text
Vorhersage a) SQL: select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?
Vorhersage a) Parameter: [ 1999 ]
Vorhersage a) Ergebnis: [ { id: 1, name: "Aera", gruendungsjahr: 1999 } ]
Vorhersage b) SQL: select count(*) from "album" where "album"."artist_id" = ?
Vorhersage b) Parameter: [ 1 ]
Vorhersage b) Ergebnis: [ { n: 1 } ]
Bonus, erzeugtes SQL: select "id", "titel", "dauer_sek", "album_id" from "track"
```

- **a) getroffen.** Spaltenliste, qualifizierte WHERE-Klausel und Parameter
  exakt wie vorhergesagt.
- **b) fast getroffen — eine Abweichung:** Ich hatte `select count(*) as "n" …`
  vorhergesagt, Drizzle erzeugt
  `select count(*) from "album" where "album"."artist_id" = ?` **ohne** Alias.
  Der Schlüssel `n` existiert nur als **Property im Ergebnisobjekt**
  (`{ n: 1 }`) — er kommt aus dem Auswahl-Objekt `{ n: count() }` und wird nicht
  ins SQL geschrieben. Merksatz: Der Alias im Auswahl-Objekt ist
  TypeScript-Sicht, keine SQL-Klausel.
- **Bonus „Jetzt du!" getroffen:**
  `select "id", "titel", "dauer_sek",
  "album_id" from "track"` —
  Schema-Reihenfolge, DB-Spaltennamen in Anführungszeichen.
- **Bestätigt:** Nicht ein einziger Wert steckt im SQL-Text (beide Male
  `params`-Array) — Parametrisierung by default war korrekt vorhergesagt.
