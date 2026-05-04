"use client";
import { useRoster } from "@/context/RosterContext";
import { useState, useRef } from "react";
import styles from "./unitCard.module.css";
import rules from "../../data/rules";



export default function UnitCard({ unit, expandUnit, index }) {
  const { roster, setRoster } = useRoster();
  const [damage, setDamage] = useState(unit.damage || 0);
  const [currentHeat, setCurrentHeat] = useState(unit.currentHeat || 0);
  const [alive, setAlive] = useState(unit.alive);
  const [repairCap, setRepairCap]=useState(unit.repairCap || 0)

  const rulesList = Object.entries(unit.table1)
    .filter(([type]) => type !== "repair")
    .map(([type, value]) => [value[damage][1], type])
    .filter(([ruleCode]) => ruleCode); // Skip invalid/null ruleCodes



  const getHeatRulesList = () => {
    if (unit.heat) {
      if (currentHeat < unit.heat.mechSpeed.length) {
        return (
        Object.entries(unit.heat)
          .map(([type, value]) => [value[currentHeat][1], type])
          .filter(([ruleCode]) => ruleCode)
        )
      } else {
        return []
      }
    } else {
      return [];
    }
  }


  const takeDamage = () => {
    if (damage < unit.table1.attack.length - 1) {
      setDamage((prev) => prev + 1);
      roster[index].damage = damage + 1;
      if (unit.table1.repair[damage + 1][1] === "black") {
        setRepairCap(damage + 1)
        roster[index].repairCap= damage+1;
      }
    } else {
      setAlive(false);
      roster[index].alive = false;
    }
  };
  const repairUnit = () => {
    if (damage > repairCap && damage > 0) {
      setDamage((prev) => prev - 1);
      roster[index].damage = damage - 1;
    }
  };

  const takeHeat = () => {
    if (currentHeat < 5) {//was unit.heat.mechSpeed.length - 1 but changed to 5 because they can go up to 6 in shutdown mode
      setCurrentHeat((prev) => prev + 1);
      roster[index].currentHeat = currentHeat + 1;
    }
  };

  const vent = () => {
    let ventNum = unit.vent;
      if( currentHeat - ventNum >= 0) {
      setCurrentHeat((prev) => prev - ventNum);
      roster[index].currentHeat = currentHeat - ventNum;
      } else {
        setCurrentHeat(0);
        roster[index].currentHeat = 0;
      }
  };


  const checkBackground = (bgCode) => {
    if (!bgCode) return;
    let style = "";
    if (bgCode[bgCode.length - 1] === "C") {
      style += styles.circle;
    }
    bgCode = bgCode.slice(0, -1); // Remove the last character (C or S)
    if (bgCode === "green") {
      style += ` ${styles.green}`;
    } else if (bgCode === "yellow") {
      style += ` ${styles.yellow}`;
    } else if (bgCode === "red") {
      style += ` ${styles.red}`;
    } else if (bgCode === "blue") {
      style += ` ${styles.blue}`;
    } else if (bgCode === "grey") {
      style += ` ${styles.grey}`;
    } else if (bgCode === "black") {
      style += ` ${styles.black}`;
    }
    return style;
  };

  const determineHeatImage = (value) => {
    if (!alive) {
      return(<span className={styles.dead}>
                        <img src={`/assets/icons/bullets.jpg`}></img>
                      </span>)
    } else if(currentHeat > unit.heat.mechSpeed.length - 1) {
      return (<span className={styles.dead}><img src={`/assets/icons/Shutdown.gif`}></img></span>)
    } else {
      return (
        <span className={`${styles.tableStat} ${checkBackground(value[currentHeat][1])}`}>
          {value[currentHeat][0]}
        </span>
      )

    }
  }

  return (
    <div>
      <img
        className={styles.unitImage}
        src={`/assets/units/${unit.wId}.jpg`}
        alt={unit.name}
      />
      <h2>{unit.name}</h2>
      <span className={styles.close} onClick={expandUnit(index)}>
        X
      </span>
      <a
        target="blank"
        href={`https://www.warrenborn.com/Unit.php?ID=${unit.wId}`}
      >
        See on Warrenborn
      </a>
      <section className={styles.damageTable}>
        {unit.primary != null && (
          <p className={styles.stat}>
            Primary: {unit.primary[0]} @ {unit.primary[1]}
          </p>
        )}
        {unit.secondary && (
          <p className={styles.stat}>
            Secondary: {unit.secondary[0]} @ {unit.secondary[1]}
          </p>
        )}
        {unit.capacity !== undefined && unit.capacity != 0 && (
          <p>Capacity: {unit.capacity}</p>
        )}
        {/* { unit.artillery && <p>Artillery: {unit.artillery}</p> } */}
        {unit.artilleryRange && <p>Artillery Range: {unit.artilleryRange}</p>}
        {unit.vent && <p className={styles.stat}>Vent: {unit.vent}</p>}
      </section>
      <section>
        <div>
          <button
            className={styles.button}
            onClick={() => {
              takeDamage();
            }}
          >
            {" "}
            Take Damage
          </button>
          <button
            className={styles.button}
            onClick={() => {
              repairUnit();
            }}
          >
            {" "}
            Repair
          </button>
        </div>
        <div className={styles.damageContainer}>
          {Object.entries(unit.table1).map(([type, value]) => {
            if (type === "repair") return null; // Skip repair
            return (
              <div className={styles.statsContainer} key={type}>
                <img width="35px" src={`/assets/icons/${type}.jpg`}></img>
                {alive ? (
                  <span
                    className={`${styles.tableStat} ${checkBackground(
                      value[damage][1],
                    )}`}
                  >
                    {value[damage][0]}
                  </span>
                ) : (
                  <span className={styles.dead}>
                    <img src={`/assets/icons/bullets.jpg`}></img>
                  </span>
                )}
              </div>
            );
          })}
          <div className={styles.rulesContainer}>
            {rulesList.map(([ruleCode, type], i) => {
              //Damage rules
              return (
                <details className={styles.rule}>
                  <summary className={styles.ruleSummary}>
                    <span className={checkBackground(ruleCode)}></span>
                    {rules.damage[type][ruleCode.slice(0, -1)].name}
                  </summary>
                  <p>{rules.damage[type][ruleCode.slice(0, -1)].text}</p>
                </details>
              );
            })}
            {getHeatRulesList()[0] && <h3>Heat Rules</h3>}
            {getHeatRulesList().map(([ruleCode, type], i) => {
              //Heat rules
              if (rules.heat[type] && rules.heat[type][ruleCode.slice(0, -1)]) {
                return (
                  <details className={styles.rule}>
                    <summary className={styles.ruleSummary}>
                      <span className={checkBackground(ruleCode)}></span>
                      {rules.heat[type][ruleCode.slice(0, -1)].name}
                    </summary>
                    <p>{rules.heat[type][ruleCode.slice(0, -1)].text}</p>
                  </details>
                );
              }
            })}
          </div>
        </div>
        {unit.vent && (
          <div className={styles.heatContainer}>
            <div>
              <button
                className={styles.button}
                onClick={() => {
                  takeHeat();
                }}
              >
                {" "}
                Take Heat
              </button>
              <button
                className={styles.button}
                onClick={() => {
                  vent();
                }}
              >
                {" "}
                Vent
              </button>
            </div>
            <div className={styles.damageContainer}>
              {Object.entries(unit.heat).map(([type, value]) => {
                return (
                  <div className={styles.statsContainer} key={type}>
                    <img width="35px" src={`/assets/icons/${type}.jpg`}></img>
                    {determineHeatImage(value)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}