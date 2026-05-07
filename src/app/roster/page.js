"use client";

import styles from "./roster.module.css";
import units from "../../data/units";
import { useRoster } from "@/context/RosterContext";
import { useState, useMemo } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUnitType(unitCode, category) {
  if (category === "mechs") return "Mech";
  const unit = units.vehicles[unitCode];
  const speedKey = Object.keys(unit.table1).find((k) => k.endsWith("Speed"));
  if (speedKey === "footSpeed" || speedKey === "aquaticSpeed") return "Infantry";
  return "Vehicle";
}

const ALL_FACTIONS = Array.from(
  new Set([
    ...Object.values(units.mechs).map((u) => u.faction),
    ...Object.values(units.vehicles).map((u) => u.faction),
  ])
).filter(Boolean).sort();

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
  const [clearConfirm, setClearConfirm] = useState(false);
  const [factionInfoOpen, setFactionInfoOpen] = useState(false);

  const rosterPoints = roster.reduce((sum, u) => sum + u.points, 0);
  const isOverPoints = rosterPoints > gamePoints;

  const toggleSet = (setter, value) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

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

        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search units..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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
              <div className={styles.filterLabelRow}>
                <p className={styles.filterLabel}>Faction</p>
                <button
                  className={styles.factionInfoBtn}
                  onClick={() => setFactionInfoOpen((v) => !v)}
                  aria-label="Faction info"
                >?</button>
              </div>
              {factionInfoOpen && (
                <div className={styles.factionInfoPanel}>
                  {[
                    ["Banson's Raiders",    "Easier to fully repair (few repair limit markers)"],
                    ["Dragon's Fury",       "Better attack ratings"],
                    ["Highlanders",         "Able to absorb more damage (longer dials)"],
                    ["House Liao",          "Special Abilities — Awe, Fanaticism, Ruthless"],
                    ["Jade Falcons",        "Higher vent ratings & improved Death From Above"],
                    ["Republic of the Sphere", "Generalist faction, more Command ability"],
                    ["Spirit Cats",         "Better energy weapon ratings (longer range, more damage)"],
                    ["Steel Wolves",        "Berserker dials — get better after taking damage"],
                    ["Stormhammers",        "Higher damage ratings but poorer defense (glass jawed)"],
                    ["Swordsworn",          "Better ballistic weapon ratings (more damage & special effects)"],
                  ].map(([faction, desc]) => (
                    <div key={faction} className={styles.factionInfoRow}>
                      <span className={styles.factionInfoName}>{faction}</span>
                      <span className={styles.factionInfoDesc}>{desc}</span>
                    </div>
                  ))}
                </div>
              )}

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

      {/* ── Scrollable unit list ── */}
      <main className={styles.body}>
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
              <button className={styles.addBtn} onClick={() => addUnit(unit)}>+</button>
            </div>
          </div>
        ))}
      </main>

      {/* ── Sticky Footer (always-visible roster + actions) ── */}
      <footer className={styles.footer}>

        {/* Roster list */}
        <div className={styles.footerRosterHeader}>
          <span className={styles.footerRosterLabel}>Your Roster</span>
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
          <ul className={styles.footerRosterList}>
            {roster.map((unit) => (
              <li key={unit.id} className={styles.footerRosterItem}>
                <span className={styles.rosterName}>{unit.name}</span>
                <span className={styles.rosterPoints}>{unit.points}</span>
                <button className={styles.removeBtn} onClick={() => removeUnit(unit.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        {isOverPoints && (
          <p className={styles.overWarning}>⚠ Over by {rosterPoints - gamePoints} pts</p>
        )}

        {/* Points + Play row */}
        <div className={styles.footerActions}>
          <div className={styles.footerPoints}>
            <span className={isOverPoints ? styles.overPoints : styles.underPoints}>
              {rosterPoints}
            </span>
            <span className={styles.footerPointsSep}> / {gamePoints} pts</span>
          </div>
          <Link
            href="/game"
            className={`${styles.playBtn} ${roster.length === 0 ? styles.playBtnDisabled : ""}`}
            onClick={(e) => { if (roster.length === 0) e.preventDefault(); }}
          >
            ▶ Play
          </Link>
        </div>

      </footer>
    </div>
  );
}
