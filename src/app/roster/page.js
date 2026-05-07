"use client";

import styles from "./roster.module.css";
import units from "../../data/units";
import { useRoster } from "@/context/RosterContext";
import { useState, useMemo } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Derive display type from unit data
function getUnitType(unitCode, category) {
  if (category === "mechs") return "Mech";
  const unit = units.vehicles[unitCode];
  const speedKey = Object.keys(unit.table1).find((k) => k.endsWith("Speed"));
  if (speedKey === "footSpeed" || speedKey === "aquaticSpeed") return "Infantry";
  return "Vehicle";
}

// Collect all factions from both mechs and vehicles
const ALL_FACTIONS = Array.from(
  new Set([
    ...Object.values(units.mechs).map((u) => u.faction),
    ...Object.values(units.vehicles).map((u) => u.faction),
  ])
).filter(Boolean).sort();

// Flatten all units into one list with metadata
const ALL_UNITS = [
  ...Object.entries(units.mechs).map(([code, unit]) => ({
    code,
    category: "mechs",
    type: "Mech",
    ...unit,
  })),
  ...Object.entries(units.vehicles).map(([code, unit]) => ({
    code,
    category: "vehicles",
    type: getUnitType(code, "vehicles"),
    ...unit,
  })),
].sort((a, b) => a.name.localeCompare(b.name));

const UNIT_TYPES = ["Mech", "Vehicle", "Infantry"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Roster() {
  const { roster, setRoster } = useRoster();
  const [gamePoints, setGamePoints] = useState(500);
  const [selectedFactions, setSelectedFactions] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const rosterPoints = roster.reduce((sum, u) => sum + u.points, 0);
  const isOverPoints = rosterPoints > gamePoints;

  // Toggle a value in a Set
  const toggleSet = (setter, value) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  // Filtered unit list
  const filteredUnits = useMemo(() => {
    return ALL_UNITS.filter((unit) => {
      if (selectedFactions.size > 0 && !selectedFactions.has(unit.faction)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(unit.type)) return false;
      if (search && !unit.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [selectedFactions, selectedTypes, search]);

  const addUnit = (unit) => {
    const addedUnit = { ...unit, id: Date.now() };
    setRoster([...roster, addedUnit]);
  };

  const removeUnit = (uid) => {
    setRoster(roster.filter((u) => u.id !== uid));
  };

  const [clearConfirm, setClearConfirm] = useState(false);

  const handleClear = () => {
    if (clearConfirm) {
      setRoster([]);
      setClearConfirm(false);
    } else {
      setClearConfirm(true);
    }
  };

  const activeFilterCount = selectedFactions.size + selectedTypes.size;

  return (
    <div className={styles.page}>

      {/* ── Sticky Header ── */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Roster Builder</h1>
          <div className={styles.pointsDisplay}>
            <span className={isOverPoints ? styles.overPoints : styles.underPoints}>
              {rosterPoints}
            </span>
            <span className={styles.pointsSep}>/</span>
            <input
              className={styles.pointsInput}
              type="number"
              value={gamePoints}
              onChange={(e) => setGamePoints(Number(e.target.value))}
              min={0}
            />
            <span className={styles.pointsLabel}>pts</span>
          </div>
        </div>

        {/* Search */}
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search units..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter toggle */}
        <button
          className={styles.filterToggle}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className={styles.filterBadge}>{activeFilterCount}</span>
          )}
          <span className={styles.filterChevron}>{filtersOpen ? "▲" : "▼"}</span>
        </button>

        {/* Filter panel */}
        {filtersOpen && (
          <div className={styles.filterPanel}>
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>Unit Type</p>
              <div className={styles.filterChips}>
                {UNIT_TYPES.map((type) => (
                  <button
                    key={type}
                    className={`${styles.chip} ${selectedTypes.has(type) ? styles.chipActive : ""}`}
                    onClick={() => toggleSet(setSelectedTypes, type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>Faction</p>
              <div className={styles.filterChips}>
                {ALL_FACTIONS.map((faction) => (
                  <button
                    key={faction}
                    className={`${styles.chip} ${selectedFactions.has(faction) ? styles.chipActive : ""}`}
                    onClick={() => toggleSet(setSelectedFactions, faction)}
                  >
                    {faction}
                  </button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                className={styles.clearFilters}
                onClick={() => { setSelectedFactions(new Set()); setSelectedTypes(new Set()); }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Two-panel body ── */}
      <main className={styles.body}>

        {/* Unit list */}
        <section className={styles.unitList}>
          <p className={styles.resultCount}>
            {filteredUnits.length} unit{filteredUnits.length !== 1 ? "s" : ""}
          </p>
          {filteredUnits.map((unit) => (
            <div className={styles.unitRow} key={unit.code}>
              <img
                className={styles.unitThumb}
                src={`/assets/units/${unit.code}.jpg`}
                alt={unit.name}
                onError={(e) => { e.target.style.visibility = "hidden"; }}
              />
              <div className={styles.unitInfo}>
                <span className={styles.unitName}>{unit.name}</span>
                <span className={styles.unitMeta}>
                  <span className={styles.unitType}>{unit.type}</span>
                  <span className={styles.unitFaction}>{unit.faction}</span>
                </span>
              </div>
              <div className={styles.unitRight}>
                <span className={styles.unitPoints}>{unit.points}</span>
                <button
                  className={styles.addBtn}
                  onClick={() => addUnit(unit)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Roster panel */}
        <section className={styles.rosterPanel}>
          <div className={styles.rosterTitleRow}>
            <h2 className={styles.rosterTitle}>Your Roster</h2>
            {roster.length > 0 && (
              <button
                className={`${styles.clearBtn} ${clearConfirm ? styles.clearBtnConfirm : ""}`}
                onClick={handleClear}
                onBlur={() => setClearConfirm(false)}
              >
                {clearConfirm ? "Really?" : "Clear"}
              </button>
            )}
          </div>
          {roster.length === 0 ? (
            <p className={styles.emptyRoster}>No units added yet.</p>
          ) : (
            <ul className={styles.rosterList}>
              {roster.map((unit) => (
                <li key={unit.id} className={styles.rosterItem}>
                  <span className={styles.rosterName}>{unit.name}</span>
                  <span className={styles.rosterPoints}>{unit.points}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeUnit(unit.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isOverPoints && (
            <p className={styles.overWarning}>
              ⚠ Over points limit by {rosterPoints - gamePoints}
            </p>
          )}
        </section>
      </main>

      {/* ── Sticky Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerPoints}>
          <span className={isOverPoints ? styles.overPoints : styles.underPoints}>
            {rosterPoints}
          </span>
          <span> / {gamePoints} pts</span>
        </div>
        <button
          className={`${styles.playBtn} ${roster.length === 0 ? styles.playBtnDisabled : ""}`}
          disabled={roster.length === 0}
        >
          <Link href="/game">▶ Play</Link>
        </button>
      </footer>

    </div>
  );
}
