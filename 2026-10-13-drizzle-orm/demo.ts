// demo.ts — Drizzle ORM am Musik-Katalog: Lesen, Schreiben, Auswerten.
// Zeigt zu jeder Query das erzeugte SQL (toSQL()) — ein ORM ersetzt SQL
// nicht, es erzeugt es. Laufen mit:  deno task demo
import { and, asc, count, desc, eq, like } from "drizzle-orm";
import { oeffneDb } from "./db.ts";
import { album, artist, track } from "./schema.ts";

// Datei-DB im Projektordner — bei jedem Lauf neu anlegen.
await Deno.remove("musik.db").catch(() => {/* Datei fehlt: egal */});
const db = oeffneDb("musik.db");

// --- Schreiben: insert mit .returning() ------------------------------
const aera = await db.insert(artist)
  .values({ name: "Aera", gruendungsjahr: 1999 })
  .returning();
const nova = await db.insert(artist)
  .values({ name: "Nova", gruendungsjahr: 2012 })
  .returning();
const stille = await db.insert(album)
  .values({ titel: "Silent Lines", jahr: 2015, artistId: aera[0].id })
  .returning();
await db.insert(album)
  .values({ titel: "Night Ferry", jahr: 2012, artistId: nova[0].id });
await db.insert(track)
  .values({ titel: "Silent Lines", dauerSek: 215, albumId: stille[0].id });
await db.insert(track)
  .values({ titel: "Echo Room", dauerSek: 187, albumId: stille[0].id });

// --- Lesen: select .from() .where() ----------------------------------
const fragen = db.select().from(album).where(eq(album.artistId, aera[0].id));
console.log("Lesen, erzeugtes SQL:", fragen.toSQL().sql);
console.log("Lesen, Parameter:", fragen.toSQL().params);
console.log("Lesen, Ergebnis:", await fragen);

// --- Auswerten: orderBy, limit ----------------------------------------
const neueste = await db.select().from(album).orderBy(desc(album.jahr)).limit(
  1,
);
console.log("Neuestes Album:", neueste[0].titel, "(", neueste[0].jahr, ")");

// --- Aufgabe KM5-05: drei Queries -------------------------------------
// a) ältestes Album (orderBy + limit) — das Gegenstück zum neuesten oben:
const aeltestes = await db.select().from(album)
  .orderBy(asc(album.jahr)).limit(1);
console.log(
  "Ältestes Album:",
  aeltestes[0].titel,
  "(",
  aeltestes[0].jahr,
  ")",
);

// b) Tracks eines Albums, deren Titel mit „Echo" beginnt
//    (and + eq + like) — erst das SQL ansehen, dann ausführen:
const echoTracks = db.select().from(track)
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Echo%")));
console.log("Echo-Tracks, erzeugtes SQL:", echoTracks.toSQL().sql);
console.log("Echo-Tracks, Parameter:", echoTracks.toSQL().params);
console.log("Echo-Tracks:", await echoTracks);

// c) Anzahl Tracks je Album (count + groupBy):
const tracksJeAlbum = db.select({ titel: album.titel, tracks: count() })
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(album.id);
console.log("Tracks pro Album, erzeugtes SQL:", tracksJeAlbum.toSQL().sql);
console.log("Tracks pro Album, Parameter:", tracksJeAlbum.toSQL().params);
console.log("Tracks pro Album:", await tracksJeAlbum);

// Interleaving: dieselbe Frage als reines SQL — gleicher Treiber, gleiche
// Bausteine (JOIN ... ON, COUNT(*), GROUP BY) wie im Query darüber:
const roh = db.$client.prepare(
  `SELECT a.titel AS titel, COUNT(*) AS tracks
     FROM track AS t
     JOIN album AS a ON t.album_id = a.id
    GROUP BY a.id`,
).all();
console.log("Tracks pro Album, reines SQL:", roh);

// --- Vorhersage-Check (Aufgabe 1): erzeugtes SQL zeigen ---------------
const vorhersageA = db.select().from(artist)
  .where(eq(artist.gruendungsjahr, 1999));
console.log("Vorhersage a) SQL:", vorhersageA.toSQL().sql);
console.log("Vorhersage a) Parameter:", vorhersageA.toSQL().params);
console.log("Vorhersage a) Ergebnis:", await vorhersageA);

const vorhersageB = db.select({ n: count() }).from(album)
  .where(eq(album.artistId, 1));
console.log("Vorhersage b) SQL:", vorhersageB.toSQL().sql);
console.log("Vorhersage b) Parameter:", vorhersageB.toSQL().params);
console.log("Vorhersage b) Ergebnis:", await vorhersageB);

// Bonus („Jetzt du!" Nr. 1): Spaltenreihenfolge bei select() ohne Argumente:
const bonus = db.select().from(track);
console.log("Bonus, erzeugtes SQL:", bonus.toSQL().sql);

// --- Ändern: update .set() .where() ----------------------------------
await db.update(track)
  .set({ dauerSek: 220 })
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Silent%")));
const korrigiert = await db.select().from(track)
  .where(eq(track.titel, "Silent Lines"));
console.log("Nach update:", korrigiert[0].dauerSek, "Sekunden");

// --- Löschen: delete .where() ----------------------------------------
await db.delete(track).where(eq(track.titel, "Echo Room"));
const rest = await db.select({ anzahl: count() }).from(track);
console.log("Tracks nach delete:", rest[0].anzahl);

db.$client.close();
