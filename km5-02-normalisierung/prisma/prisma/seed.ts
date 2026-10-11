import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.songPlaylist.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.bestellposition.deleteMany();
  await prisma.bestellung.deleteMany();
  await prisma.plz.deleteMany();

  await prisma.plz.createMany({
    data: [
      { plz: "1020", ort: "Wien" },
      { plz: "4020", ort: "Linz" },
    ],
  });

  await prisma.bestellung.createMany({
    data: [
      { bestell_nr: 101, kunde: "Auer", plz: "1020" },
      { bestell_nr: 102, kunde: "Beck", plz: "1020" },
      { bestell_nr: 103, kunde: "Cevik", plz: "4020" },
    ],
  });

  await prisma.bestellposition.createMany({
    data: [
      { bestell_nr: 101, position: 1, track_id: 1 },
      { bestell_nr: 101, position: 2, track_id: 2 },
      { bestell_nr: 102, position: 1, track_id: 3 },
    ],
  });

  await prisma.song.createMany({
    data: [
      { song_id: 1, titel: "Silent Lines", dauerSek: 215 },
      { song_id: 2, titel: "Night Ferry", dauerSek: 240 },
      { song_id: 3, titel: "Dust Choir", dauerSek: 198 },
    ],
  });

  await prisma.playlist.createMany({
    data: [
      { playlist_id: 10, name: "Fokus" },
      { playlist_id: 20, name: "Nachtfahrt" },
    ],
  });

  await prisma.songPlaylist.createMany({
    data: [
      { song_id: 1, playlist_id: 10 },
      { song_id: 1, playlist_id: 20 },
      { song_id: 2, playlist_id: 20 },
    ],
  });

  console.log("Seed erfolgreich.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
