"use client";
import { useRoster } from "@/context/RosterContext";
import { useState } from "react";
import styles from "./unitCard.module.css";
import rules from "../../data/rules";

// Strip trailing digits so "ballisticDamage2" maps to the "ballisticDamage" icon and rules
const baseType = (type) => type.replace(/\d+$/, "");

export default function UnitCard({ unit, expandUnit, index }) {
  const { roster, setRoster } = useRoster();
  const [damage, setDamage] = useState(unit.damage || 0);
  const [currentHeat, setCurrentHeat] = useState(unit.currentHeat || 0);
  const [alive, setAlive] = useState(unit.alive);
  const [repairCap, setRepairCap] = useState(unit.repairCap || 0);
  const [toast, setToast] = useState(null);

  const flash = (msg, variant) => {
    setToast({ msg, variant });
    setTimeout(() => setToast(null), 1100);
  };

  const rulesList = Object.entries(unit.table1)
    .filter(([type]) => type !== "repair")
    .map(([type, value]) => [value[damage][1], type])
    .filter(([ruleCode]) => ruleCode);

  const getHeatRulesList = () => {
    if (unit.heat) {
      if (currentHeat < unit.heat.mechSpeed.length) {
        return Object.entries(unit.heat)
          .map(([type, value]) => [value[currentHeat][1], type])
          .filter(([ruleCode]) => ruleCode);
      }
      return [];
    }
    return [];
  };

  const takeDamage = () => {
    if (damage < unit.table1.attack.length - 1) {
      setDamage((prev) => prev + 1);
      roster[index].damage = damage + 1;
      if (unit.table1.repair[damage + 1][1] === "black") {
        setRepairCap(damage + 1);
        roster[index].repairCap = damage + 1;
      }
      flash("Damage applied", "damage");
    } else {
      setAlive(false);
      roster[index].alive = false;
      flash("Unit destroyed!", "damage");
    }
  };

  const repairUnit = () => {
    if (damage > repairCap && damage > 0) {
      setDamage((prev) => prev - 1);
      roster[index].damage = damage - 1;
      flash("Repaired", "repair");
    }
  };

  const takeHeat = () => {
    if (currentHeat < 5) {
      setCurrentHeat((prev) => prev + 1);
      roster[index].currentHeat = currentHeat + 1;
      flash("Heat applied", "heat");
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
    flash("Vented", "vent");
  };

  const checkBackground = (bgCode) => {
    if (!bgCode) return "";
    let style = "";
    if (bgCode[bgCode.length - 1] === "C") {
      style += styles.circle;
    }
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
    } else if (currentHeat > unit.heat.mechSpeed.length - 1) {
      return (
        <span className={styles.statDead}>
          <img src="/assets/icons/Shutdown.gif" alt="shutdown" />
        </span>
      );
    } else {
      return (
        <span className={`${styles.statValue} ${checkBackground(value[currentHeat][1])}`}>
          {value[currentHeat][0]}
        </span>
      );
    }
  };

  const heatRulesList = getHeatRulesList();
  const isShutdown = unit.heat && currentHeat > unit.heat.mechSpeed.length - 1;

  return (
    <div className={`${styles.card} ${!alive ? styles.cardDead : ""}`}>

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.variant}`]}`}>
          {toast.msg}
        </div>
      )}

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
            <button className={styles.closeBtn} onClick={expandUnit(index)} aria-label="Collapse">✕</button>
          </div>
          {unit.variant && <p className={styles.variant}>{unit.variant}</p>}
          {unit.faction && <p className={styles.faction}>{unit.faction}</p>}
          <div className={styles.staticStats}>
            {unit.primary != null && (
              <span className={styles.staticStat}>Primary: {unit.primary[0]} @ {unit.primary[1]}</span>
            )}
            {unit.secondary && (
              <span className={styles.staticStat}>Secondary: {unit.secondary[0]} @ {unit.secondary[1]}</span>
            )}
            {unit.vent && <span className={styles.staticStat}>Vent: {unit.vent}</span>}
            {unit.capacity !== undefined && unit.capacity !== 0 && (
              <span className={styles.staticStat}>Capacity: {unit.capacity}</span>
            )}
            {unit.artilleryRange && (
              <span className={styles.staticStat}>Arty Range: {unit.artilleryRange}</span>
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

      {!alive && <div className={styles.destroyedBanner}>DESTROYED</div>}
      {alive && isShutdown && <div className={styles.shutdownBanner}>SHUTDOWN</div>}

      {/* ── Damage section ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Damage</span>
          <div className={styles.actionBtns}>
            <button className={styles.btnDamage} onClick={takeDamage}>+ Damage</button>
            <button className={styles.btnRepair} onClick={repairUnit}>↩ Repair</button>
          </div>
        </div>

        <div className={styles.statsRow}>
          {Object.entries(unit.table1).map(([type, value]) => {
            if (type === "repair") return null;
            return (
              <div className={styles.statCell} key={type}>
                <img className={styles.statIcon} src={`/assets/icons/${baseType(type)}.jpg`} alt={baseType(type)} />
                {alive ? (
                  <span className={`${styles.statValue} ${checkBackground(value[damage][1])}`}>
                    {value[damage][0]}
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

        {rulesList.length > 0 && (
          <div className={styles.rulesSection}>
            {rulesList.map(([ruleCode, type], i) => {
              const bt = baseType(type);
              if (!rules.damage[bt] || !rules.damage[bt][ruleCode.slice(0, -1)]) return null;
              return (
                <details key={i} className={styles.rule}>
                  <summary className={styles.ruleSummary}>
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
              <button className={styles.btnHeat} onClick={takeHeat}>+ Heat</button>
              <button className={styles.btnVent} onClick={vent}>↓ Vent</button>
            </div>
          </div>

          <div className={styles.statsRow}>
            {Object.entries(unit.heat).map(([type, value]) => (
              <div className={styles.statCell} key={type}>
                <img className={styles.statIcon} src={`/assets/icons/${baseType(type)}.jpg`} alt={baseType(type)} />
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

    </div>
  );
}
