# Aufgabe KM5-02 — Normalisierung 1NF–3NF

## 1. Vorhersage

| Tabelle | Spalte | Verletzung | Warum |
|---------|--------|------------|-------|
| `bestellung_denorm` | `ort` | 3NF | `ort` hängt nicht direkt vom PK ab, sondern über `plz` (transitive Abhängigkeit) |
| `bestellung_denorm` | `plz` | — (ok) | `plz` hängt direkt vom PK `bestell_nr` ab |

`bestellung_denorm` hat einen einfachen Primärschlüssel (`bestell_nr`), daher ist **2NF hier kein Thema** — es gibt keine Teilabhängigkeit.

---

## 2. Zerlegen bis 3NF

### Ausgangstabelle (denormalisiert)

```
bestellung_denorm(bestell_nr PK, kunde, plz, ort)
```

### 3NF-Fix

**Abhängigkeitspfeil:**
```
bestell_nr → kunde
bestell_nr → plz
plz → ort        ← transitiv über Nichtschlüssel!
```

**Neue Tabellen:**

```sql
-- 3NF: Bestellung ohne transitive Abhängigkeit
CREATE TABLE bestellung(
  bestell_nr INTEGER PRIMARY KEY,
  kunde      TEXT NOT NULL,
  plz        TEXT NOT NULL REFERENCES plz(plz)
);

-- 3NF: PLZ als eigene Entität
CREATE TABLE plz(
  plz TEXT PRIMARY KEY,
  ort TEXT NOT NULL
);
```

**Begründung:** `ort` hängt von `plz` ab, nicht von `bestell_nr`. Nach dem Zerlegen steht `ort` genau einmal pro PLZ — keine Anomalie mehr.

---

## 3. Zwei Quiz-Tabellen zerlegen

### Tabelle A: `song_playlist` (2NF-Verletzung)

**Ausgang:**
```sql
CREATE TABLE song_playlist(
  song_id     INTEGER NOT NULL,
  playlist_id INTEGER NOT NULL,
  song_titel  TEXT NOT NULL,
  PRIMARY KEY(song_id, playlist_id)
);
```

**Abhängigkeitspfeil:**
```
(song_id, playlist_id) → keine weiteren Attribute
song_id → song_titel      ← hängt nur am Teil des PK!
```

**2NF-Fix:**
```sql
-- 2NF: Song als eigene Entität
CREATE TABLE song(
  song_id INTEGER PRIMARY KEY,
  titel   TEXT NOT NULL
);

-- 2NF: Nur noch die Beziehung (Zwischentabelle)
CREATE TABLE song_playlist(
  song_id     INTEGER NOT NULL REFERENCES song(song_id),
  playlist_id INTEGER NOT NULL,
  PRIMARY KEY(song_id, playlist_id)
);
```

**3 Beispielzeilen:**
```sql
INSERT INTO song(song_id, titel) VALUES (1, 'Silent Lines'), (2, 'Night Ferry');
INSERT INTO song_playlist(song_id, playlist_id) VALUES (1, 10), (1, 20), (2, 20);
```

---

### Tabelle B: `bestellung` mit Wiederholgruppe (1NF-Verletzung)

**Ausgang:**
```sql
CREATE TABLE bestellung(
  bestell_nr INTEGER PRIMARY KEY,
  kunde      TEXT NOT NULL,
  track1     INTEGER,
  track2     INTEGER,
  track3     INTEGER
);
```

**Abhängigkeitspfeil:**
```
bestell_nr → kunde
bestell_nr → track1, track2, track3    ← Wiederholgruppe (nicht atomar)
```

**1NF-Fix:**
```sql
-- 1NF: Bestellposition als Kindtabelle
CREATE TABLE bestellposition(
  bestell_nr INTEGER NOT NULL,
  position   INTEGER NOT NULL,
  track_id   INTEGER NOT NULL,
  PRIMARY KEY(bestell_nr, position)
);
```

**3 Beispielzeilen:**
```sql
INSERT INTO bestellposition(bestell_nr, position, track_id) VALUES (101, 1, 1), (101, 2, 2), (102, 1, 3);
```

---

## 4. Demo (Nachweis)

`deno task demo` und `deno task test` im Projektordner ausgeführt:

```
1NF: WHERE hobbys = 'Schwimmen' findet 0 Zeilen (die Zelle ist eine Liste).
1NF-Fix: eine Zeile pro Wert -> 1 Treffer.
2NF: song_id 1 hat 2 verschiedene Titel (Titel hängt nur an song_id).
2NF-Fix: der Titel steht 1 Mal fuer song_id 1.
3NF: PLZ 1020 hat 2 verschiedene Orte (Ort hängt an PLZ).
```

4/4 Tests bestanden.
