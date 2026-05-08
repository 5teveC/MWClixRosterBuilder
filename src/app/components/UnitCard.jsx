"use client";
import { useRoster } from "@/context/RosterContext";
import { useState, useEffect } from "react";
import styles from "./unitCard.module.css";
import rules from "../../data/rules";
import STAT_INFO from "../../data/statInfo";
import GEAR_DATA from "../../data/gear";

const parseGearSE = (effectText) => {
  const m = effectText.match(/Provides (Square|Circle) (.+?) SE/);
  return m ? { seShape: m[1].toLowerCase(), seName: m[2] } : { seShape: null, seName: null };
};

// Maps gear SE name → the color key used in rules.damage[type]
const SE_COLOR_MAP = {
  "Pulse":                 "red",
  "Evade":                 "red",
  "Improved Targeting":    "blue",
  "Decoy":                 "green",
  "Full Strike":           "green",
  "Agility":               "black",
  "Armor Piercing":        "red",
  "Reflective Armor":      "red",
  "Heavy Armor":           "grey",
  "Repair":                "green",
  "Reactive Armor":        "blue",
  "Electronic Camouflage": "black",
  "Streak Missiles":       "black",
  "Alpha Strike":          "black",
  "Flamers":               "grey",
  "Anti-Personnel":        "blue",
  "Rapid Strike":          "blue",
};

// Strip trailing digits: "ballisticDamage2" → "ballisticDamage"
const baseType = (type) => type.replace(/\d+$/, "");

// Some icon filenames have non-standard capitalisation on disk
const ICON_NAME = { quadSpeed: "QuadSpeed", wheeledSpeed: "WheeledSpeed" };
const iconFile = (type) => ICON_NAME[baseType(type)] ?? baseType(type);

// Find the length of the heat table using whichever speed key is present
const heatTableLength = (heat) => {
  if (!heat) return 0;
  const speedKey = Object.keys(heat).find((k) => k.endsWith("Speed"));
  return speedKey ? heat[speedKey].length : 0;
};

export default function UnitCard({ unit, expandUnit, index, condition }) {
  const { roster, setRoster } = useRoster();
  const [damage, setDamage] = useState(unit.damage || 0);
  const [currentHeat, setCurrentHeat] = useState(unit.currentHeat || 0);
  const [alive, setAlive] = useState(unit.alive);
  const [repairCap, setRepairCap] = useState(unit.repairCap || 0);
  const [toasts, setToasts] = useState([]);
  const [artilleryOpen, setArtilleryOpen] = useState(false);
  const [applyHeatMods, setApplyHeatMods] = useState(true);
  const [statInfoEntry, setStatInfoEntry] = useState(null);
  const [shutdownStep, setShutdownStep] = useState(0); // 0=hidden, 1="Shutdown", 2="Restart?"

  // Shutdown button lifecycle: appear on shutdown, dismiss when heat returns to 0
  useEffect(() => {
    if (currentHeat === 0) {
      setShutdownStep(0);
    } else if (unit.heat && currentHeat > heatTableLength(unit.heat) - 1 && shutdownStep === 0) {
      setShutdownStep(1);
    }
  }, [currentHeat]);

  const vibrate = (pattern) => navigator?.vibrate?.(pattern);

  const addToast = (msg, variant) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1100);
  };

  // ── Planetary condition helpers ────────────────────────────────────────────

  // Dust Storm (AOD-PC-003): cap max range to 8
  const applyDustStorm = (rangeStr) => {
    if (condition?.id !== "AOD-PC-003" || !rangeStr) return rangeStr;
    const [min, max] = rangeStr.split("/");
    return parseInt(max) > 8 ? `${min}/8` : rangeStr;
  };

  // Swamp (AOD-PC-004): cap hoverSpeed / vtolSpeed display values to 8
  const applySwamp = (type, val) => {
    if (condition?.id !== "AOD-PC-004") return val;
    const bt = baseType(type);
    if (bt === "hoverSpeed" || bt === "vtolSpeed") {
      return typeof val === "number" ? Math.min(val, 8) : val;
    }
    return val;
  };

  // ── Heat modifier helper ───────────────────────────────────────────────────

  const getHeatMod = (type) => {
    if (!applyHeatMods || !unit.heat) return 0;
    const key = unit.heat[type] !== undefined ? type : baseType(type);
    if (!unit.heat[key]) return 0;
    if (currentHeat >= heatTableLength(unit.heat)) return 0;
    const entry = unit.heat[key][currentHeat];
    if (!entry) return 0;
    const delta = Number(entry[0]);
    return isNaN(delta) ? 0 : delta;
  };

  // ── Rules lists ───────────────────────────────────────────────────────────

  const rulesList = Object.entries(unit.table1)
    .filter(([type]) => type !== "repair")
    .map(([type, value]) => [value[damage]?.[1], type])
    .filter(([ruleCode]) => ruleCode);

  // Resolve gear attachesTo → actual table1 key
  const getStatTypeForAttachesTo = (attachesTo) => {
    const keys = Object.keys(unit.table1);
    switch (attachesTo) {
      case "Energy":    return keys.find((k) => k === "energyDamage") ?? keys.find((k) => k.startsWith("energyDamage")) ?? null;
      case "Ballistic": return keys.find((k) => k === "ballisticDamage") ?? keys.find((k) => k.startsWith("ballisticDamage")) ?? null;
      case "Melee":     return keys.find((k) => k === "meleeDamage") ?? null;
      case "Speed":     return keys.find((k) => k.endsWith("Speed")) ?? null;
      case "Attack":    return keys.includes("attack") ? "attack" : null;
      case "Defense":   return keys.includes("defense") ? "defense" : null;
      case "Damage":    return keys.find((k) => k.endsWith("Damage") && !k.startsWith("melee")) ?? null;
      default:          return null;
    }
  };

  // Build extra rule entries from equipped gear that provide SE
  const gearSERules = (unit.gear || []).flatMap((gearId) => {
    const g = GEAR_DATA[gearId];
    if (!g) return [];
    const { seShape, seName } = parseGearSE(g.effectText);
    if (!seShape || !seName) return [];
    const color = SE_COLOR_MAP[seName];
    if (!color) return [];
    const statType = getStatTypeForAttachesTo(g.attachesTo);
    if (!statType) return [];
    const bt = baseType(statType);
    if (!rules.damage[bt]?.[color]) return [];
    return [[color + (seShape === "circle" ? "C" : "S"), statType]];
  });

  const allDamageRules = [...rulesList, ...gearSERules];

  const getHeatRulesList = () => {
    if (unit.heat) {
      if (currentHeat < heatTableLength(unit.heat)) {
        return Object.entries(unit.heat)
          .map(([type, value]) => [value[currentHeat]?.[1], type])
          .filter(([ruleCode]) => ruleCode);
      }
      return [];
    }
    return [];
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const takeDamage = () => {
    if (damage < unit.table1.attack.length - 1) {
      setDamage((prev) => prev + 1);
      roster[index].damage = damage + 1;
      if (unit.table1.repair[damage + 1]?.[1] === "black") {
        setRepairCap(damage + 1);
        roster[index].repairCap = damage + 1;
      }
      vibrate(25);
      addToast("Damage", "damage");
    } else {
      setAlive(false);
      roster[index].alive = false;
      vibrate([100, 60, 150, 60, 200]);
      addToast("Destroyed!", "damage");
    }
  };

  const repairUnit = () => {
    if (damage > repairCap && damage > 0) {
      setDamage((prev) => prev - 1);
      roster[index].damage = damage - 1;
      addToast("Repaired", "repair");
    }
  };

  const revive = () => {
    setAlive(true);
    roster[index].alive = true;
    addToast("Revived!", "repair");
  };

  const takeHeat = () => {
    if (currentHeat < 5) {
      const nextHeat = currentHeat + 1;
      setCurrentHeat(nextHeat);
      roster[index].currentHeat = nextHeat;
      if (unit.heat && nextHeat > heatTableLength(unit.heat) - 1) {
        vibrate([80, 50, 80]);
      }
      addToast("Heat", "heat");
    }
  };

  const vent = () => {
    const ventNum = unit.vent;
    if (currentHeat - ventNum >= 0) {
      setCurrentHeat((prev) => prev - ventNum);
      roster[index].currentHeat = currentHeat - ventNum;
    } else {
      setCurrentHeat(0);
      roster[index].currentHeat = 0;
    }
    addToast("Vented", "vent");
  };

  const coolOne = () => {
    if (currentHeat > 0) {
      setCurrentHeat((prev) => prev - 1);
      roster[index].currentHeat = currentHeat - 1;
      addToast("Cooled", "vent");
    }
  };

  // ── Display helpers ───────────────────────────────────────────────────────

  const checkBackground = (bgCode) => {
    if (!bgCode) return "";
    let style = "";
    if (bgCode[bgCode.length - 1] === "C") style += styles.circle;
    bgCode = bgCode.slice(0, -1);
    if (bgCode === "green") style += ` ${styles.green}`;
    else if (bgCode === "yellow") style += ` ${styles.yellow}`;
    else if (bgCode === "red") style += ` ${styles.red}`;
    else if (bgCode === "blue") style += ` ${styles.blue}`;
    else if (bgCode === "grey") style += ` ${styles.grey}`;
    else if (bgCode === "black") style += ` ${styles.black}`;
    return style;
  };

  const determineHeatImage = (value) => {
    if (!alive) {
      return (
        <span className={styles.statDead}>
          <img src="/assets/icons/bullets.jpg" alt="destroyed" />
        </span>
      );
    } else if (currentHeat > heatTableLength(unit.heat) - 1) {
      return (
        <span className={styles.statDead}>
          <img src="/assets/icons/Shutdown.gif" alt="shutdown" />
        </span>
      );
    }
    return (
      <span className={`${styles.statValue} ${checkBackground(value[currentHeat][1])}`}>
        {value[currentHeat][0]}
      </span>
    );
  };

  const heatRulesList = getHeatRulesList();
  const isShutdown = unit.heat && currentHeat > heatTableLength(unit.heat) - 1;

  return (
    <div className={`${styles.card} ${!alive ? styles.cardDead : ""}`}>

      {/* ── Stacking toasts ── */}
      <div className={styles.toastStack}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.variant}`]}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Card header ── */}
      <div className={styles.cardHeader}>
        <img
          className={styles.unitImage}
          src={`/assets/units/${unit.wId}.jpg`}
          alt={unit.name}
        />
        <div className={styles.headerInfo}>
          <div className={styles.headerRow}>
            <h2 className={styles.unitName}>{unit.name}</h2>
            <button className={styles.closeBtn} onClick={expandUnit(index)} aria-label="Collapse">▲</button>
          </div>
          {unit.variant && <p className={styles.variant}>{unit.variant}</p>}
          {unit.faction && <p className={styles.faction}>{unit.faction}</p>}
          <div className={styles.staticStats}>
            {unit.primary != null && (
              <span className={styles.staticStat}>
                Primary: {unit.primary[0]} @ {applyDustStorm(unit.primary[1])}
              </span>
            )}
            {unit.secondary && (
              <span className={styles.staticStat}>
                Secondary: {unit.secondary[0]} @ {applyDustStorm(unit.secondary[1])}
              </span>
            )}
            {unit.vent && <span className={styles.staticStat}>Vent: {unit.vent}</span>}
            {unit.capacity !== undefined && unit.capacity !== 0 && (
              <span className={styles.staticStat}>Capacity: {unit.capacity}</span>
            )}
            {unit.artilleryRange && (
              <span className={styles.staticStat}>Artillery Range: {unit.artilleryRange}″</span>
            )}
          </div>
          <a
            className={styles.warrenborn}
            target="_blank"
            rel="noreferrer"
            href={`https://www.warrenborn.com/Unit.php?ID=${unit.wId}`}
          >
            View on Warrenborn ↗
          </a>
        </div>
      </div>

      {/* ── Artillery token ── */}
      {unit.artilleryRange && (
        <div className={styles.artilleryRow}>
          <img
            className={styles.artilleryToken}
            src={`/assets/artillery/${unit.wId}.jpg`}
            alt={`${unit.name} artillery token`}
            onClick={() => setArtilleryOpen(true)}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      {/* ── Artillery lightbox ── */}
      {artilleryOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setArtilleryOpen(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setArtilleryOpen(false)}>✕</button>
            <img
              className={styles.lightboxImage}
              src={`/assets/artillery/${unit.wId}.jpg`}
              alt={`${unit.name} artillery token`}
            />
          </div>
        </div>
      )}

      {/* ── Status banners ── */}
      {!alive && (
        <div className={styles.destroyedBanner}>
          <span>DESTROYED</span>
          <button className={styles.reviveBtn} onClick={revive}>Revive</button>
        </div>
      )}
      {alive && shutdownStep > 0 && (
        <button
          className={styles.shutdownBanner}
          onClick={() => setShutdownStep(shutdownStep === 1 ? 2 : 0)}
        >
          {shutdownStep === 1 ? "SHUTDOWN" : "RESTART?"}
        </button>
      )}

      {/* ── Damage section ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Damage</span>
          <div className={styles.actionBtns}>
            <button className={`${styles.btn} ${styles.btnDamage}`} onClick={takeDamage}>+ Damage</button>
            <button className={`${styles.btn} ${styles.btnRepair}`} onClick={repairUnit}>↩ Repair</button>
          </div>
        </div>

        <div className={styles.statsRow}>
          {Object.entries(unit.table1).map(([type, value]) => {
            if (type === "repair") return null;
            const rawVal = value[damage][0];
            const mod = getHeatMod(type);
            let displayVal = (mod !== 0 && typeof rawVal === "number") ? rawVal + mod : rawVal;
            displayVal = applySwamp(type, displayVal);
            return (
              <div className={styles.statCell} key={type}>
                <img
                  className={`${styles.statIcon} ${STAT_INFO[baseType(type)] ? styles.statIconClickable : ""}`}
                  src={`/assets/icons/${iconFile(type)}.jpg`}
                  alt={baseType(type)}
                  onError={(e) => { e.target.style.visibility = "hidden"; }}
                  onClick={STAT_INFO[baseType(type)] ? () => setStatInfoEntry(STAT_INFO[baseType(type)]) : undefined}
                />
                {alive ? (
                  <span className={`${styles.statValue} ${checkBackground(value[damage][1])}`}>
                    {displayVal}
                  </span>
                ) : (
                  <span className={styles.statDead}>
                    <img src="/assets/icons/bullets.jpg" alt="dead" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {allDamageRules.length > 0 && (
          <div className={styles.rulesSection}>
            {allDamageRules.map(([ruleCode, type], i) => {
              const bt = baseType(type);
              if (!rules.damage[bt] || !rules.damage[bt][ruleCode.slice(0, -1)]) return null;
              return (
                <details key={i} className={styles.rule}>
                  <summary className={styles.ruleSummary}>
                    <img
                      className={styles.ruleIcon}
                      src={`/assets/icons/${iconFile(type)}.jpg`}
                      alt={bt}
                      onError={(e) => { e.target.style.visibility = "hidden"; }}
                    />
                    <span className={`${styles.ruleColor} ${checkBackground(ruleCode)}`} />
                    {rules.damage[bt][ruleCode.slice(0, -1)].name}
                  </summary>
                  <p className={styles.ruleText}>{rules.damage[bt][ruleCode.slice(0, -1)].text}</p>
                </details>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Heat section ── */}
      {unit.vent && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Heat</span>
            <div className={styles.actionBtns}>
              <button className={`${styles.btn} ${styles.btnHeat}`} onClick={takeHeat}>+ Heat</button>
              <button className={`${styles.btn} ${styles.btnVent}`} onClick={vent}>↓ Vent</button>
              <button className={`${styles.btn} ${styles.btnCool}`} onClick={coolOne}>Cool 1</button>
            </div>
          </div>

          {/* Heat modifier toggle */}
          <div className={styles.heatModRow}>
            <span className={styles.heatModLabel}>Apply heat modifiers to damage stats</span>
            <button
              className={`${styles.heatModToggle} ${applyHeatMods ? styles.heatModOn : styles.heatModOff}`}
              onClick={() => setApplyHeatMods((v) => !v)}
              aria-pressed={applyHeatMods}
            >
              {applyHeatMods ? "ON" : "OFF"}
            </button>
          </div>

          <div className={styles.statsRow}>
            {Object.entries(unit.heat).map(([type, value]) => (
              <div className={styles.statCell} key={type}>
                <img
                  className={`${styles.statIcon} ${STAT_INFO[baseType(type)] ? styles.statIconClickable : ""}`}
                  src={`/assets/icons/${iconFile(type)}.jpg`}
                  alt={baseType(type)}
                  onError={(e) => { e.target.style.visibility = "hidden"; }}
                  onClick={STAT_INFO[baseType(type)] ? () => setStatInfoEntry(STAT_INFO[baseType(type)]) : undefined}
                />
                {determineHeatImage(value)}
              </div>
            ))}
          </div>

          {heatRulesList.length > 0 && (
            <div className={styles.rulesSection}>
              {heatRulesList.map(([ruleCode, type], i) => {
                const bt = baseType(type);
                if (!rules.heat[bt] || !rules.heat[bt][ruleCode.slice(0, -1)]) return null;
                return (
                  <details key={i} className={styles.rule}>
                    <summary className={styles.ruleSummary}>
                      <img
                        className={styles.ruleIcon}
                        src={`/assets/icons/${iconFile(type)}.jpg`}
                        alt={bt}
                        onError={(e) => { e.target.style.visibility = "hidden"; }}
                      />
                      <span className={`${styles.ruleColor} ${checkBackground(ruleCode)}`} />
                      {rules.heat[bt][ruleCode.slice(0, -1)].name}
                    </summary>
                    <p className={styles.ruleText}>{rules.heat[bt][ruleCode.slice(0, -1)].text}</p>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Gear section (text-only gear with no SE — SE gear appears in the damage section above) ── */}
      {unit.gear?.some((gId) => !parseGearSE(GEAR_DATA[gId]?.effectText || "").seShape) && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Gear</span>
          </div>
          <div className={styles.rulesSection}>
            {unit.gear.map((gearId) => {
              const g = GEAR_DATA[gearId];
              if (!g) return null;
              const { seShape } = parseGearSE(g.effectText);
              if (seShape) return null; // SE gear is shown in damage section
              return (
                <details key={gearId} className={styles.rule}>
                  <summary className={styles.ruleSummary}>
                    <img
                      className={styles.ruleIcon}
                      src={`/assets/gear/${gearId}.jpg`}
                      alt={g.name}
                      onError={(e) => { e.target.style.visibility = "hidden"; }}
                    />
                    {g.name}
                  </summary>
                  <p className={styles.ruleText}>{g.effectText}</p>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stat info overlay ── */}
      {statInfoEntry && (
        <div className={styles.statInfoOverlay} onClick={() => setStatInfoEntry(null)}>
          <div className={styles.statInfoPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.statInfoHeader}>
              <span className={styles.statInfoTitle}>{statInfoEntry.name}</span>
              <button className={styles.statInfoCloseBtn} onClick={() => setStatInfoEntry(null)}>✕</button>
            </div>
            <div className={styles.statInfoBody}>
              {statInfoEntry.text.split("\n\n").map((para, i) => (
                <p key={i} className={styles.statInfoText}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
