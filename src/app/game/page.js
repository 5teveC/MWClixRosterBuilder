"use client";

import styles from "./game.module.css";
import { useRoster } from "@/context/RosterContext";
import Link from "next/link";
import UnitCard from "@/app/components/UnitCard";

export default function Game() {
  const { roster, setRoster } = useRoster();

  const expandUnit = (index) => () => {
    const unit = roster[index];
    unit.expanded = !unit.expanded;
    setRoster([...roster]);
  };

  const heatTableLength = (heat) => {
    if (!heat) return 0;
    const speedKey = Object.keys(heat).find((k) => k.endsWith("Speed"));
    return speedKey ? heat[speedKey].length : 0;
  };

  const getStatus = (unit) => {
    if (!unit.alive) return { label: "Destroyed", cls: styles.statusDead };
    if (unit.heat && unit.currentHeat > heatTableLength(unit.heat) - 1)
      return { label: "Shutdown", cls: styles.statusShutdown };
    return null;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Battle</h1>
        <Link href="/roster" className={styles.adjustLink}>← Roster</Link>
      </header>

      <main className={styles.unitList}>
        {roster.map((unit, index) =>
          unit.expanded ? (
            <UnitCard key={unit.id} unit={unit} expandUnit={expandUnit} index={index} />
          ) : (
            <div
              key={unit.id}
              className={`${styles.collapsedCard} ${!unit.alive ? styles.deadCard : ""}`}
              onClick={expandUnit(index)}
            >
              <img
                className={styles.thumb}
                src={`/assets/units/${unit.wId}.jpg`}
                alt={unit.name}
                onError={(e) => { e.target.style.visibility = "hidden"; }}
              />
              <div className={styles.collapsedInfo}>
                <span className={styles.collapsedName}>{unit.name}</span>
                {getStatus(unit) && (
                  <span className={`${styles.statusBadge} ${getStatus(unit).cls}`}>
                    {getStatus(unit).label}
                  </span>
                )}
              </div>
              <div className={styles.collapsedPips}>
                {(unit.damage || 0) > 0 && (
                  <span className={styles.dmgPip}>DMG {unit.damage}</span>
                )}
                {(unit.currentHeat || 0) > 0 && (
                  <span className={styles.heatPip}>HEAT {unit.currentHeat}</span>
                )}
              </div>
              <span className={styles.chevron}>›</span>
            </div>
          )
        )}
      </main>
    </div>
  );
}
