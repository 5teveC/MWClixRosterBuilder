"use client";

import styles from "./roster.module.css";
import units from "../../data/units";
import gearData from "../../data/gear";
import pilotData from "../../data/pilots";
import mechClassMap from "../../data/mechClassMap";
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

const PRECON_FORCES = [
  {
    name: "Starter Force 1",
    codes: ["AOD125", "AOD126", "AOD127", "AOD131", "AOD134"],
  },
  {
    name: "Starter Force 2",
    codes: ["AOD128", "AOD129", "AOD130", "AOD132", "AOD133"],
  },
];

const GEAR_CLASS_OPTIONS = ["All", "Light", "Medium", "Heavy", "Assault"];

const parseGearSE = (effectText) => {
  const m = effectText.match(/Provides (Square|Circle) (.+?) SE/);
  return m ? { seShape: m[1].toLowerCase(), seName: m[2] } : { seShape: null, seName: null };
};

// A pilot's faction field may be "All", a single faction, or "FactionA-FactionB".
// Returns true if the mech's faction matches any of the hyphen-separated parts.
const pilotFactionMatch = (pilotFaction, mechFaction) => {
  if (!pilotFaction || pilotFaction === "All") return true;
  if (!mechFaction) return false;
  return pilotFaction.split("-").some((part) =>
    mechFaction.toLowerCase().includes(part.trim().toLowerCase())
  );
};

const hasAttachType = (unit, attachesTo) => {
  if (!unit?.table1) return false;
  const keys = Object.keys(unit.table1);
  switch (attachesTo) {
    case "Energy":    return keys.some((k) => k.startsWith("energyDamage"));
    case "Ballistic": return keys.some((k) => k.startsWith("ballisticDamage"));
    case "Melee":     return keys.some((k) => k === "meleeDamage");
    case "Speed":     return keys.some((k) => k.endsWith("Speed"));
    case "Attack":    return keys.includes("attack");
    case "Defense":   return keys.includes("defense");
    case "Damage":    return keys.some((k) => k.endsWith("Damage") && !k.startsWith("melee"));
    default:          return false;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Roster() {
  const { roster, setRoster, gamePoints, setGamePoints } = useRoster();
  const [selectedFactions, setSelectedFactions] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [selectedPrecon, setSelectedPrecon] = useState(null);
  const [selectedOwned, setSelectedOwned] = useState("owned");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [factionInfoOpen, setFactionInfoOpen] = useState(false);

  // Gear / pilot picker state
  const [gearPickerUnitId, setGearPickerUnitId] = useState(null);
  const [gearClassFilter, setGearClassFilter] = useState("All");
  const [pickerTab, setPickerTab] = useState("gear"); // "gear" | "pilot"

  // ---------------------------------------------------------------------------
  // Gear helpers
  // ---------------------------------------------------------------------------

  const gearPointsFor = (unit) =>
    (unit.gear || []).reduce((sum, gId) => sum + (gearData[gId]?.points || 0), 0);

  const pilotPointsFor = (unit) => {
    if (!unit.pilot) return 0;
    const p = pilotData[unit.pilot];
    if (!p) return 0;
    return (p.preferredMech === unit.wId) ? p.preferredMechCost : p.points;
  };

  const totalPtsFor = (unit) => unit.points + gearPointsFor(unit) + pilotPointsFor(unit);

  const gearPickerUnit = gearPickerUnitId
    ? roster.find((u) => u.id === gearPickerUnitId)
    : null;

  const filteredGear = useMemo(
    () =>
      Object.values(gearData).filter(
        (g) => gearClassFilter === "All" || g.classReq === gearClassFilter
      ),
    [gearClassFilter]
  );

  const assignGear = (gearId) => {
    const unit = roster.find((u) => u.id === gearPickerUnitId);
    if (!unit) return;
    const cur = unit.gear || [];
    const maxGear = unit.pilot ? 1 : 2;
    if (cur.length >= maxGear || cur.includes(gearId)) return;
    unit.gear = [...cur, gearId];
    setRoster([...roster]);
  };

  const unequipGear = (gearId) => {
    const unit = roster.find((u) => u.id === gearPickerUnitId);
    if (!unit) return;
    unit.gear = (unit.gear || []).filter((g) => g !== gearId);
    setRoster([...roster]);
  };

  const assignPilot = (pilotId) => {
    const unit = roster.find((u) => u.id === gearPickerUnitId);
    if (!unit || unit.pilot === pilotId) return;
    if ((unit.gear?.length || 0) >= 2) return; // both gear slots full — no room for pilot
    unit.pilot = pilotId;
    setRoster([...roster]);
  };

  const unequipPilot = () => {
    const unit = roster.find((u) => u.id === gearPickerUnitId);
    if (!unit) return;
    unit.pilot = null;
    setRoster([...roster]);
  };

  // ---------------------------------------------------------------------------
  // Points
  // ---------------------------------------------------------------------------

  const rosterPoints = roster.reduce((sum, u) => sum + totalPtsFor(u), 0);
  const isOverPoints = rosterPoints > gamePoints;

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  const toggleSet = (setter, value) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const togglePrecon = (index) => {
    setSelectedPrecon((prev) => (prev === index ? null : index));
  };

  const filteredUnits = useMemo(() => {
    return ALL_UNITS.filter((unit) => {
      if (selectedPrecon !== null) {
        if (!PRECON_FORCES[selectedPrecon].codes.includes(unit.code)) return false;
      } else {
        if (selectedFactions.size > 0 && !selectedFactions.has(unit.faction)) return false;
        if (selectedTypes.size > 0 && !selectedTypes.has(unit.type)) return false;
      }
      if (selectedOwned === "owned" && !unit.owned) return false;
      if (search && !unit.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [selectedFactions, selectedTypes, selectedPrecon, selectedOwned, search]);

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

  const activeFilterCount =
    selectedFactions.size +
    selectedTypes.size +
    (selectedPrecon !== null ? 1 : 0) +
    (selectedOwned === "owned" ? 1 : 0);

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
            <span className={styles.activationsLabel}>{Math.floor(gamePoints / 150)} ACT</span>
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
          <span className={styles.filterToggleLeft}>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </span>
          <span className={styles.filterChevron}>{filtersOpen ? "▲" : "▼"}</span>
        </button>

        {filtersOpen && (
          <div className={styles.filterPanel}>

            {/* ── Precon Forces ── */}
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>Precon Forces</p>
              <div className={styles.filterChips}>
                {PRECON_FORCES.map((force, i) => (
                  <button
                    key={force.name}
                    className={`${styles.chip} ${selectedPrecon === i ? styles.chipActive : ""}`}
                    onClick={() => togglePrecon(i)}
                  >
                    {force.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Unit Type ── */}
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

            {/* ── Faction ── */}
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

            {/* ── Owned / All ── */}
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>Collection</p>
              <div className={styles.filterChips}>
                {["all", "owned"].map((opt) => (
                  <button
                    key={opt}
                    className={`${styles.chip} ${selectedOwned === opt ? styles.chipActive : ""}`}
                    onClick={() => setSelectedOwned(opt)}
                  >
                    {opt === "all" ? "All" : "Owned"}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                className={styles.clearFilters}
                onClick={() => {
                  setSelectedFactions(new Set());
                  setSelectedTypes(new Set());
                  setSelectedPrecon(null);
                  setSelectedOwned("all");
                }}
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

      {/* ── Sticky Footer ── */}
      <footer className={styles.footer}>

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
                <div className={styles.rosterItemMain}>
                  <span className={styles.rosterName}>{unit.name}</span>
                  <div className={styles.rosterItemRight}>
                    <span className={styles.rosterPoints}>{totalPtsFor(unit)}</span>
                    {unit.category === "mechs" && (
                      <button
                        className={`${styles.gearBtn} ${(unit.gear?.length || unit.pilot) ? styles.gearBtnActive : ""}`}
                        onClick={() => {
                          setGearPickerUnitId(unit.id);
                          setGearClassFilter(mechClassMap[unit.wId] || "All");
                          setPickerTab("gear");
                        }}
                        aria-label="Manage gear"
                      >
                        ⚙
                      </button>
                    )}
                    <button className={styles.removeBtn} onClick={() => removeUnit(unit.id)}>✕</button>
                  </div>
                </div>
                {(unit.pilot || unit.gear?.length > 0) && (
                  <div className={styles.rosterGearRow}>
                    {unit.pilot && (
                      <span className={`${styles.rosterGearChip} ${styles.rosterPilotChip}`}>
                        ✈ {pilotData[unit.pilot]?.name}
                      </span>
                    )}
                    {unit.gear?.map((gId) => (
                      <span key={gId} className={styles.rosterGearChip}>
                        {gearData[gId]?.name}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {isOverPoints && (
          <p className={styles.overWarning}>⚠ Over by {rosterPoints - gamePoints} pts</p>
        )}

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

      {/* ── Gear / Pilot picker overlay ── */}
      {gearPickerUnit && (() => {
        const unitClass = mechClassMap[gearPickerUnit.wId];
        const maxGear = gearPickerUnit.pilot ? 1 : 2;
        const gearFull = (gearPickerUnit.gear || []).length >= maxGear;

        // Build the sorted pilot list for the picker:
        // preferred pilot first (if any), then legendaries, then commons; filter by class+faction
        const preferredPilotId = Object.values(pilotData).find(
          (p) => p.preferredMech === gearPickerUnit.wId
        )?.wId ?? null;

        const filteredPilots = Object.values(pilotData)
          .filter((p) => {
            if (!unitClass) return false;
            if (p.classReq !== unitClass) return false;
            if (!pilotFactionMatch(p.faction, gearPickerUnit.faction)) return false;
            return true;
          })
          .sort((a, b) => {
            const aPref = a.wId === preferredPilotId ? 0 : 1;
            const bPref = b.wId === preferredPilotId ? 0 : 1;
            if (aPref !== bPref) return aPref - bPref;
            // legendaries before commons
            if (a.tier !== b.tier) return a.tier === "legendary" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });

        return (
          <div className={styles.gearOverlay} onClick={() => setGearPickerUnitId(null)}>
            <div className={styles.gearPanel} onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className={styles.gearPanelHeader}>
                <div className={styles.gearPanelTitleGroup}>
                  <span className={styles.gearPanelTitle}>Loadout — {gearPickerUnit.name}</span>
                  {unitClass && <span className={styles.gearPanelClass}>{unitClass}</span>}
                </div>
                <button className={styles.gearCloseBtn} onClick={() => setGearPickerUnitId(null)}>✕</button>
              </div>

              {!unitClass ? (
                <div className={styles.gearNoClass}>
                  <p>No class assigned — this unit cannot equip gear or pilots.</p>
                </div>
              ) : (
                <>
                  {/* ── Equipped slots ── */}
                  <div className={styles.gearSlots}>
                    {/* Pilot slot */}
                    {(() => {
                      const p = gearPickerUnit.pilot ? pilotData[gearPickerUnit.pilot] : null;
                      return (
                        <div className={`${styles.gearSlot} ${p ? styles.gearSlotFilled : styles.gearSlotEmpty} ${styles.pilotSlot}`}>
                          {p ? (
                            <>
                              <img
                                className={styles.gearSlotImg}
                                src={`/assets/pilots/${p.wId}.jpg`}
                                alt={p.name}
                                onError={(e) => { e.target.style.visibility = "hidden"; }}
                              />
                              <span className={styles.gearSlotName}>{p.name}</span>
                              <span className={styles.gearSlotPts}>
                                {p.preferredMech === gearPickerUnit.wId ? p.preferredMechCost : p.points}pts
                              </span>
                              <button className={styles.gearSlotRemove} onClick={unequipPilot}>✕</button>
                            </>
                          ) : (
                            <span className={styles.gearSlotEmptyText}>Pilot — Empty</span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Gear slot(s) */}
                    {[0, ...(gearPickerUnit.pilot ? [] : [1])].map((slot) => {
                      const gId = (gearPickerUnit.gear || [])[slot];
                      const g = gId ? gearData[gId] : null;
                      return (
                        <div
                          key={slot}
                          className={`${styles.gearSlot} ${g ? styles.gearSlotFilled : styles.gearSlotEmpty}`}
                        >
                          {g ? (
                            <>
                              <img
                                className={styles.gearSlotImg}
                                src={`/assets/gear/${gId}.jpg`}
                                alt={g.name}
                                onError={(e) => { e.target.style.visibility = "hidden"; }}
                              />
                              <span className={styles.gearSlotName}>{g.name}</span>
                              <span className={styles.gearSlotPts}>{g.points}pts</span>
                              <button className={styles.gearSlotRemove} onClick={() => unequipGear(gId)}>✕</button>
                            </>
                          ) : (
                            <span className={styles.gearSlotEmptyText}>Gear — Empty</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Tab toggle: Pilot / Gear ── */}
                  <div className={styles.pickerTabRow}>
                    <button
                      className={`${styles.pickerTab} ${pickerTab === "pilot" ? styles.pickerTabActive : ""}`}
                      onClick={() => setPickerTab("pilot")}
                    >
                      ✈ Pilot
                    </button>
                    <button
                      className={`${styles.pickerTab} ${pickerTab === "gear" ? styles.pickerTabActive : ""}`}
                      onClick={() => setPickerTab("gear")}
                    >
                      ⚙ Gear
                    </button>
                  </div>

                  {/* ── Pilot list ── */}
                  {pickerTab === "pilot" && (
                    <div className={styles.gearList}>
                      {filteredPilots.length === 0 ? (
                        <p className={styles.gearNoClass} style={{ padding: "20px", textAlign: "center" }}>
                          No compatible pilots available for this mech.
                        </p>
                      ) : filteredPilots.map((p) => {
                        const equipped = gearPickerUnit.pilot === p.wId;
                        const isPreferred = p.wId === preferredPilotId;
                        const isPreferredMech = p.preferredMech === gearPickerUnit.wId;
                        const displayCost = isPreferredMech ? p.preferredMechCost : p.points;
                        const statParts = [
                          p.speed !== 0 ? `Spd ${p.speed > 0 ? "+" : ""}${p.speed}` : null,
                          p.attack !== 0 ? `Atk ${p.attack > 0 ? "+" : ""}${p.attack}` : null,
                          p.defense !== 0 ? `Def ${p.defense > 0 ? "+" : ""}${p.defense}` : null,
                        ].filter(Boolean).join("  ");
                        return (
                          <div
                            key={p.wId}
                            className={`${styles.gearCard} ${equipped ? styles.gearCardEquipped : ""} ${isPreferred && !equipped ? styles.pilotCardPreferred : ""}`}
                          >
                            {isPreferred && (
                              <div className={styles.pilotPreferredBanner}>★ Preferred Pilot for this Mech</div>
                            )}
                            <div className={styles.gearCardTop}>
                              <img
                                className={styles.gearCardImg}
                                src={`/assets/pilots/${p.wId}.jpg`}
                                alt={p.name}
                                onError={(e) => { e.target.style.visibility = "hidden"; }}
                              />
                              <div className={styles.gearCardInfo}>
                                <span className={styles.gearCardName}>{p.name}</span>
                                <div className={styles.gearCardMeta}>
                                  <span className={styles.gearCardClass}>{p.classReq}</span>
                                  {p.tier === "legendary" && (
                                    <span className={styles.pilotLegendaryBadge}>LEGENDARY</span>
                                  )}
                                </div>
                                {p.faction !== "All" && (
                                  <span className={styles.gearCardFaction}>{p.faction} only</span>
                                )}
                                {statParts && (
                                  <span className={styles.pilotStatBadge}>{statParts}</span>
                                )}
                              </div>
                              <div className={styles.gearCardActions}>
                                <span className={styles.gearCardPts}>
                                  {displayCost}pts
                                  {isPreferredMech && displayCost !== p.points && (
                                    <span className={styles.pilotPreferredCost}> ★</span>
                                  )}
                                </span>
                                <button
                                  className={`${styles.gearEquipBtn} ${equipped ? styles.gearEquipBtnActive : ""}`}
                                  disabled={!equipped && (!!gearPickerUnit.pilot || (gearPickerUnit.gear?.length || 0) >= 2)}
                                  onClick={() => (equipped ? unequipPilot() : assignPilot(p.wId))}
                                >
                                  {equipped ? "Remove" : "Assign"}
                                </button>
                                {!equipped && !!gearPickerUnit.pilot && (
                                  <span className={styles.gearDisabledReason}>Pilot slot full</span>
                                )}
                                {!equipped && !gearPickerUnit.pilot && (gearPickerUnit.gear?.length || 0) >= 2 && (
                                  <span className={styles.gearDisabledReason}>Remove a gear piece first</span>
                                )}
                              </div>
                            </div>
                            {isPreferredMech && p.preferredMechAbility && (
                              <p className={`${styles.gearCardText} ${styles.pilotAbilityText}`}>
                                ★ On preferred mech: {p.preferredMechAbility}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Gear list ── */}
                  {pickerTab === "gear" && (
                    <>
                      <div className={styles.gearClassFilter}>
                        {GEAR_CLASS_OPTIONS.map((cls) => (
                          <button
                            key={cls}
                            className={`${styles.gearClassChip} ${gearClassFilter === cls ? styles.gearClassChipActive : ""}`}
                            onClick={() => setGearClassFilter(cls)}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>

                      <div className={styles.gearList}>
                        {filteredGear.map((g) => {
                          const { seShape, seName } = parseGearSE(g.effectText);
                          const equipped = (gearPickerUnit.gear || []).includes(g.wId);
                          const wrongClass = g.classReq !== unitClass;
                          const wrongAttach = !hasAttachType(gearPickerUnit, g.attachesTo);
                          const canEquip = !wrongClass && !wrongAttach;
                          const disabledReason = wrongClass
                            ? `Requires ${g.classReq} mech`
                            : wrongAttach
                            ? `Requires ${g.attachesTo} stat`
                            : null;
                          return (
                            <div
                              key={g.wId}
                              className={`${styles.gearCard} ${equipped ? styles.gearCardEquipped : ""} ${!canEquip && !equipped ? styles.gearCardDisabled : ""}`}
                            >
                              <div className={styles.gearCardTop}>
                                <img
                                  className={styles.gearCardImg}
                                  src={`/assets/gear/${g.wId}.jpg`}
                                  alt={g.name}
                                  onError={(e) => { e.target.style.visibility = "hidden"; }}
                                />
                                <div className={styles.gearCardInfo}>
                                  <span className={styles.gearCardName}>{g.name}</span>
                                  <div className={styles.gearCardMeta}>
                                    <span className={styles.gearCardClass}>{g.classReq}</span>
                                    <span className={styles.gearCardAttaches}>{g.attachesTo}</span>
                                    {seShape && (
                                      <span className={`${styles.gearCardSE} ${seShape === "circle" ? styles.gearCardSECircle : ""}`}>
                                        {seShape === "square" ? "■" : "●"} {seName}
                                      </span>
                                    )}
                                  </div>
                                  {g.faction !== "All" && (
                                    <span className={styles.gearCardFaction}>{g.faction} only</span>
                                  )}
                                </div>
                                <div className={styles.gearCardActions}>
                                  <span className={styles.gearCardPts}>{g.points}pts</span>
                                  <button
                                    className={`${styles.gearEquipBtn} ${equipped ? styles.gearEquipBtnActive : ""}`}
                                    disabled={!equipped && (gearFull || !canEquip)}
                                    onClick={() => (equipped ? unequipGear(g.wId) : assignGear(g.wId))}
                                  >
                                    {equipped ? "Remove" : "Equip"}
                                  </button>
                                  {disabledReason && !equipped && (
                                    <span className={styles.gearDisabledReason}>{disabledReason}</span>
                                  )}
                                </div>
                              </div>
                              <p className={styles.gearCardText}>{g.effectText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
}
