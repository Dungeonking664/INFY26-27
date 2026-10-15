# Lösung KM5-05 — Drizzle ORM (Aufgabe 2–4)

Vorhersagen (Aufgabe 1) stehen in [`VORHERSAGEN.md`](VORHERSAGEN.md) — dort auch
der ehrliche Abgleich mit dem tatsächlich erzeugten SQL.

## Aufgabe 2 — drei Queries in `demo.ts` ergänzt

### a) ältestes Album (`orderBy` + `limit`)

```ts
const aeltestes = db.select().from(album)
  .orderBy(asc(album.jahr)).limit(1);
```

Ausgabe von `deno task demo`:

```text
Ältestes Album, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
Ältestes Album, Parameter: [ 1 ]
Ältestes Album: Night Ferry ( 2012 )
```

- `asc(album.jahr)` = aufsteigend (erstes Jahr = ältestes Album) — das
  Gegenstück zu `desc(...)` des „neuesten Albums" weiter oben in der Demo.
- Auch `limit` wird **parametrisiert** (`limit ?`, Parameter `1`).

### b) Tracks mit Titel-Anfang „Echo" (`and` + `eq` + `like`)

```ts
const echoTracks = db.select().from(track)
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Echo%")));
```

```text
Echo-Tracks, erzeugtes SQL: select "id", "titel", "dauer_sek", "album_id" from "track" where (("track"."album_id" = ?) and ("track"."titel" like ?))
Echo-Tracks, Parameter: [ 1, "Echo%" ]
Echo-Tracks: [ { id: 2, titel: "Echo Room", dauerSek: 187, albumId: 1 } ]
```

- `and(...)` umschließt beide Bedingungen mit Klammern — dieselbe Logik wie
  `AND` in SQL; Werte (`1`, `"Echo%"`) liegen im `params`-Array.
- `like(track.titel, "Echo%")` wird zu `"track"."titel" like ?` — das
  SQL-Wildcard-Zeichen `%` gehört zum **Wert**, nicht zum Code.

### c) Anzahl Tracks je Album (`count` + `groupBy`)

```ts
const tracksJeAlbum = db.select({ titel: album.titel, tracks: count() })
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(album.id);
```

```text
Tracks pro Album, erzeugtes SQL: select "album"."titel", count(*) from "track" inner join "album" on "track"."album_id" = "album"."id" group by "album"."id"
Tracks pro Album, Parameter: []
Tracks pro Album: [ { titel: "Silent Lines", tracks: 2 } ]
```

- `count()` → `count(*)`, `groupBy(album.id)` → `group by "album"."id"` —
  dieselben Bausteine wie im SQL von KM5.
- `params: []` — hier stecken keine Werte in der Query, nur Spalten und
  Konstanten.

## Aufgabe 3 — SQL-Vergleich (Interleaving)

Reines SQL für dieselbe Frage „Tracks pro Album", in `demo.ts` über
`db.$client.prepare(...)` ausgeführt (gleicher Treiber, dieselbe DB):

```sql
SELECT a.titel AS titel,
       COUNT(*) AS tracks
  FROM track AS t
  JOIN album AS a ON t.album_id = a.id
 GROUP BY a.id;
```

Drizzle erzeugt (aus `toSQL()`, oben):

```sql
select "album"."titel", count(*)
  from "track"
  inner join "album" on "track"."album_id" = "album"."id"
 group by "album"."id"
```

**Wo Drizzle dieselben Bausteine erzeugt:**

| Baustein        | reines SQL                             | Drizzle-Query                                        |
| --------------- | -------------------------------------- | ---------------------------------------------------- |
| Auswahlliste    | `a.titel`, `COUNT(*) AS tracks`        | `db.select({ titel: album.titel, tracks: count() })` |
| Tabelle im FROM | `FROM track AS t`                      | `.from(track)`                                       |
| JOIN            | `JOIN album AS a ON t.album_id = a.id` | `.innerJoin(album, eq(track.albumId, album.id))`     |
| COUNT           | `COUNT(*)`                             | `count()`                                            |
| Gruppierung     | `GROUP BY a.id`                        | `.groupBy(album.id)`                                 |

Unterschiede: Drizzle listet Spalten **explizit** (kein `*`), schreibt
Schlüsselwörter klein, tabellenqualifiziert (`"album"."titel"`), nutzt
`inner join` statt `JOIN` und braucht keinen Alias — die Tabellen kommen als
Objekte aus dem Schema. Die **Semantik ist identisch**, beide liefern:

```text
[ { titel: "Silent Lines", tracks: 2 } ]      // Drizzle
[ [Object: null prototype] { titel: "Silent Lines", tracks: 2 } }   // reines SQL
```

(Orthografie-Unterschied, kein inhaltlicher: `node:sqlite` liefert
Null-Prototype-Objekte, Drizzle normale — deshalb der kleine Unterschied in der
Konsolenausgabe.)

## Aufgabe 4 — Nachweis

### `deno task demo`

```text
Lesen, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" where "album"."artist_id" = ?
Lesen, Parameter: [ 1 ]
Lesen, Ergebnis: [ { id: 1, titel: "Silent Lines", jahr: 2015, artistId: 1 } ]
Neuestes Album: Silent Lines ( 2015 )
Ältestes Album, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
Ältestes Album, Parameter: [ 1 ]
Ältestes Album: Night Ferry ( 2012 )
Echo-Tracks, erzeugtes SQL: select "id", "titel", "dauer_sek", "album_id" from "track" where (("track"."album_id" = ?) and ("track"."titel" like ?))
Echo-Tracks, Parameter: [ 1, "Echo%" ]
Echo-Tracks: [ { id: 2, titel: "Echo Room", dauerSek: 187, albumId: 1 } ]
Tracks pro Album, erzeugtes SQL: select "album"."titel", count(*) from "track" inner join "album" on "track"."album_id" = "album"."id" group by "album"."id"
Tracks pro Album, Parameter: []
Tracks pro Album: [ { titel: "Silent Lines", tracks: 2 } ]
Tracks pro Album, reines SQL: [ [Object: null prototype] { titel: "Silent Lines", tracks: 2 } ]
Vorhersage a) SQL: select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?
Vorhersage a) Parameter: [ 1999 ]
Vorhersage a) Ergebnis: [ { id: 1, name: "Aera", gruendungsjahr: 1999 } ]
Vorhersage b) SQL: select count(*) from "album" where "album"."artist_id" = ?
Vorhersage b) Parameter: [ 1 ]
Vorhersage b) Ergebnis: [ { n: 1 } ]
Bonus, erzeugtes SQL: select "id", "titel", "dauer_sek", "album_id" from "track"
Nach update: 220 Sekunden
Tracks nach delete: 1
```

### `deno task test`

```text
running 9 tests from ./demo_test.ts
insert mit returning liefert die neue Zeile mit id ... ok
select mit where filtert typsicher ... ok
Fremdschlüssel verhindert Album ohne Artist ... ok
update aendert nur die gewaehlten Zeilen ... ok
delete entfernt nur die gewaehlte Zeile ... ok
orderBy + limit liefern das juengste Album ... ok
innerJoin verbindet Album und Artist ... ok
Drizzle parametrisiert: Werte stecken in params, nicht im SQL ... ok
assertThrows ist importiert und steht bereit ... ok

ok | 9 passed | 0 failed
```

**Hinweis am Rande:** Der Start lief anfangs nicht — in `deno.json` lag der
falsche Import `"drizzle": "npm:drizzle@^1.4.0"` (das Ethereum-Paket „drizzle"
von Truffle mit web3-Abhängigkeiten, nicht das ORM). Entfernt, danach laufen
`demo` und `test` wie erwartet.
