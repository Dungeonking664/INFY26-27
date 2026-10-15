import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("1NF: Bestellpositionen als Kindtabelle", async () => {
  const positionen = await prisma.bestellposition.findMany({
    where: { bestell_nr: 101 },
    orderBy: { position: "asc" },
  });
  assert.equal(positionen.length, 2);
  assert.deepEqual(
    positionen.map((p) => p.track_id),
    [1, 2],
  );
});

test("2NF: Song-Titel steht genau einmal", async () => {
  const song = await prisma.song.findUnique({ where: { song_id: 1 } });
  assert.equal(song?.titel, "Silent Lines");
  const count = await prisma.song.count({ where: { song_id: 1 } });
  assert.equal(count, 1);
});

test("3NF: PLZ -> Ort steht genau einmal", async () => {
  const plz = await prisma.plz.findUnique({ where: { plz: "1020" } });
  assert.equal(plz?.ort, "Wien");
  const count = await prisma.plz.count({ where: { plz: "1020" } });
  assert.equal(count, 1);
});

test("3NF-Fix: Bestellung mit JOIN auf plzRel", async () => {
  const bestellung = await prisma.bestellung.findUnique({
    where: { bestell_nr: 101 },
    include: { plzRel: true },
  });
  assert.equal(bestellung?.plzRel.ort, "Wien");
});
