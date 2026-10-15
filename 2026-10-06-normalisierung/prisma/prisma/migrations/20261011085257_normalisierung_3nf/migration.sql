/*
  Warnings:

  - You are about to drop the `BestellungDenorm` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BestellungDenorm";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Plz" (
    "plz" TEXT NOT NULL PRIMARY KEY,
    "ort" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Bestellung" (
    "bestell_nr" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kunde" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    CONSTRAINT "Bestellung_plz_fkey" FOREIGN KEY ("plz") REFERENCES "Plz" ("plz") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bestellposition" (
    "bestell_nr" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,

    PRIMARY KEY ("bestell_nr", "position"),
    CONSTRAINT "Bestellposition_bestell_nr_fkey" FOREIGN KEY ("bestell_nr") REFERENCES "Bestellung" ("bestell_nr") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "song_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "dauerSek" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Playlist" (
    "playlist_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SongPlaylist" (
    "song_id" INTEGER NOT NULL,
    "playlist_id" INTEGER NOT NULL,

    PRIMARY KEY ("song_id", "playlist_id"),
    CONSTRAINT "SongPlaylist_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "Song" ("song_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SongPlaylist_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "Playlist" ("playlist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
