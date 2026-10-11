-- CreateTable
CREATE TABLE "BestellungDenorm" (
    "bestell_nr" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kunde" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "ort" TEXT NOT NULL
);
