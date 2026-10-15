import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --- 1NF: Wiederholgruppe als Spalten (track1, track2, track3) ---
  // In Prisma/SQLite nicht direkt abbildbar — demonstriert über Kindtabelle
  const positionen = await prisma.bestellposition.findMany({
    where: { bestell_nr: 101 },
    orderBy: { position: "asc" },
  });
  console.log(
    `1NF: Bestellung 101 hat ${positionen.length} Positionen (Kindtabelle statt track1/track2/track3).`,
  );

  // --- 2NF: partielle Abhängigkeit (song_titel hängt nur an song_id) ---
  const song = await prisma.song.findUnique({ where: { song_id: 1 } });
  const songPlaylists = await prisma.songPlaylist.findMany({
    where: { song_id: 1 },
  });
  console.log(
    `2NF: Song 1 (${song?.titel}) steht in ${songPlaylists.length} Playlists — Titel nur einmal in song-Tabelle.`,
  );

  // --- 3NF: transitive Abhängigkeit (bestell_nr -> plz -> ort) ---
  const bestellung = await prisma.bestellung.findUnique({
    where: { bestell_nr: 101 },
    include: { plzRel: true },
  });
  console.log(
    `3NF: Bestellung 101 -> PLZ ${bestellung?.plz} -> Ort ${bestellung?.plzRel.ort} (Ort steht nur in plz-Tabelle).`,
  );

  // --- JOIN: Bestellung mit Positionen und Ort ---
  const komplett = await prisma.bestellung.findMany({
    include: {
      plzRel: true,
      positionen: { orderBy: { position: "asc" } },
    },
  });
  for (const b of komplett) {
    console.log(
      `JOIN: Bestellung ${b.bestell_nr} (${b.kunde}, ${b.plzRel.ort}) — Tracks: ${b.positionen.map((p) => p.track_id).join(", ")}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
