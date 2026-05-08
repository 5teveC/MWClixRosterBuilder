"use client";

import styles from "./game.module.css";
import { useRoster } from "@/context/RosterContext";
import Link from "next/link";
import { useState, useRef } from "react";
import UnitCard from "@/app/components/UnitCard";

// ---------------------------------------------------------------------------
// Rules data
// ---------------------------------------------------------------------------

const RULES_SECTIONS = [
  {
    title: "Turn Structure",
    body: `Each game turn is divided into three stages: Command Stage, Order Stage, and Clean-Up Stage.

Command Stage: Players determine initiative. The player with the lower Force Build total rolls 2d6; on a 7 or higher they have initiative. If totals are equal, both players roll 2d6 and the higher result has initiative.

Order Stage: Starting with the player who does NOT have initiative, players alternate giving one order to one unit at a time until all units have received an order or been passed. A unit that is Shutdown may not be given an order.

Clean-Up Stage: Remove any markers that last only one turn. Units that are Shutdown check to restart: roll 2d6; on an 8+ the unit restarts and is no longer Shutdown. Units that are Destroyed remain on the field as wreckage.`,
  },
  {
    title: "Orders",
    body: `Each unit may receive one of the following five orders per turn:

Move Order: The unit moves up to its Speed value in inches. A unit may pivot freely before and after its move. A unit may not move through other units or impassable terrain.

Vent Order: The unit vents heat equal to its Vent value. The unit may not move or attack this turn.

Ranged Combat Order: The unit may make one ranged attack, then move up to half its Speed value (or move first, then attack). Declare the target before rolling.

Close Combat Order: The unit moves into base contact with a target and makes a close combat attack. The unit must end its move in base contact with the target.

Assault Order: The unit moves up to its Speed value and makes a ranged attack at any point during the move. The unit suffers +1 Heat after the attack.`,
  },
  {
    title: "Pushing & Heat",
    body: `A unit may Push to move an additional number of inches equal to its Speed value. Pushing costs +2 Heat.

A unit that reaches or exceeds its maximum heat level (shown on the heat dial) is Shutdown. A Shutdown unit cannot be given orders and cannot make attacks. At the end of each Clean-Up Stage, a Shutdown unit rolls 2d6: on an 8+ it restarts.

Heat modifiers: as a unit's heat increases, its stats may be penalised. These are shown on the heat dial — the value shown is applied as a modifier to the corresponding damage dial stat.`,
  },
  {
    title: "Special Attacks",
    body: `Charge: A unit may declare a Charge as part of a Move Order. The unit must move in a straight line toward the target and end in base contact. A successful Charge deals bonus damage equal to the unit's Speed divided by 4 (round down), minimum 1.

Death From Above (DFA): A Mech may leap onto a target within its Speed value. Both units take damage: the target takes the Mech's current Attack value; the Mech takes damage equal to half the target's current Attack value (round up). The Mech must have no Heat modifier penalties to its Speed to attempt DFA.

Ram: A Vehicle may declare a Ram as part of a Move Order. The vehicle must move in a straight line and end in base contact with the target. Both units take 1 damage. If the vehicle's Speed is 10 or more, both units take 2 damage instead.`,
  },
  {
    title: "Formations",
    body: `Units may be organised into Formations of 2–4 units. Units in a Formation must stay within 4″ of the Formation Leader.

Formation Movement: All units in a Formation move when the Leader receives a Move Order. Each unit in the Formation moves up to the Leader's Speed value.

Formation Ranged Combat: When the Leader makes a ranged attack, each other unit in the Formation within line of sight of the same target may also attack that target. Each unit rolls its own attack separately.

Formation Close Combat: Only the Leader engages in close combat; other Formation members do not attack but move with the Leader.

Breaking Formation: A unit may leave a Formation at any time during its movement. Once out of Formation it acts independently for the rest of the turn.`,
  },
];

// ---------------------------------------------------------------------------
// Planetary conditions data
// ---------------------------------------------------------------------------

const PLANETARY_CONDITIONS = [
  {
    id: "AOD-PC-001",
    name: "Ice Field",
    text: "All water terrain features become clear terrain features instead. Only shutdown 'Mech units roll for heat effects when losing heat. At the beginning of each player's clean-up stage, that player rolls one six-sided die. If the result is 5 or 6, all 'Mechs lose 1 heat in addition to any other heat lost during the clean-up stage. Ice Field cancels the Storm and Swamp planetary conditions. It is canceled by the Desert Wasteland planetary condition.",
  },
  {
    id: "AOD-PC-002",
    name: "Desert Wasteland",
    text: "Remove all water terrain features from the game. 'Mechs do not lose heat during their controllers' clean-up stages. Desert Wasteland cancels the Ice Field planetary condition. Desert Wasteland is canceled by the Storm and Swamp planetary conditions.",
  },
  {
    id: "AOD-PC-003",
    name: "Dust Storm",
    text: "All units must be deployed at NOE level. No unit may move to cruising level or be at cruising level when an order resolves. No unit may make a charge or death from above special attack. Units with a maximum range value greater than 8 have a maximum range value of 8 instead. The line of fire to all artillery markers is blocked. Dust Storm cancels the Swamp planetary condition. Dust Storm is canceled by the Storm planetary condition.",
  },
  {
    id: "AOD-PC-004",
    name: "Swamp",
    text: "All units without the Hover or VTOL speed mode that have a speed value greater than 8 have a speed value of 8 instead. Reduce the blast radius of all artillery markers by 1 inch, minimum 1 inch. Swamp cancels the Desert Wasteland planetary condition. Swamp is canceled by the Ice Field planetary condition.",
  },
  {
    id: "AOD-PC-005",
    name: "Storm",
    text: "All non-blocking terrain features become shallow water terrain features instead. All units with a speed value greater than 10 that begin the turn at cruising level have a speed value of 10 instead. Storm cancels the Mountain Range planetary condition. Storm is canceled by the Ice Field planetary condition.",
  },
  {
    id: "AOD-PC-006",
    name: "Barrens",
    text: "Remove all terrain features from the battlefield. Barrens is canceled by the Storm and Tornado planetary conditions.",
  },
  {
    id: "AOD-PC-007",
    name: "Mountain Range",
    text: "All non-blocking terrain features become blocking terrain features. Mountain Range is cancelled by the Storm planetary condition.",
  },
  {
    id: "AOD-PC-008",
    name: "Perfect Day",
    text: "Cancel one other planetary condition; if you do, cancel this Perfect Day.",
  },
  {
    id: "AOD-PC-009",
    name: "Active Volcanoes",
    text: "At the beginning of each player's clean-up stage, that player rolls one six-sided die. On a result of 5 or 6, each player must deal 1 pushing damage to one of his or her units.",
  },
  {
    id: "AOD-PC-010",
    name: "Tornado",
    text: "All blocking terrain features become hindering terrain features instead.",
  },
];

const DEFAULT_CONDITION = PLANETARY_CONDITIONS.find((c) => c.id === "AOD-PC-008");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Game() {
  const { roster, setRoster, gamePoints } = useRoster();
  const [rulesOpen, setRulesOpen] = useState(false);

  // Planetary condition state
  const [condition, setCondition] = useState(DEFAULT_CONDITION);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [conditionView, setConditionView] = useState("list"); // "list" | "rolling" | "detail"
  const [detailCondition, setDetailCondition] = useState(null);
  const [rollName, setRollName] = useState("");
  const rollRef = useRef(null);

  const openConditionOverlay = () => {
    setConditionView("list");
    setConditionOpen(true);
  };

  const closeConditionOverlay = () => {
    if (rollRef.current) clearTimeout(rollRef.current);
    setConditionOpen(false);
  };

  const selectCondition = (cond) => {
    setCondition(cond);
    setDetailCondition(cond);
    setConditionView("detail");
  };

  const rollRandom = () => {
    setConditionView("rolling");
    const startTime = Date.now();
    const duration = 2400;

    const step = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        const picked = PLANETARY_CONDITIONS[Math.floor(Math.random() * PLANETARY_CONDITIONS.length)];
        setCondition(picked);
        setDetailCondition(picked);
        setConditionView("detail");
        return;
      }
      setRollName(PLANETARY_CONDITIONS[Math.floor(Math.random() * PLANETARY_CONDITIONS.length)].name);
      const interval = elapsed < 800 ? 80 : elapsed < 1500 ? 160 : elapsed < 2000 ? 300 : 450;
      rollRef.current = setTimeout(step, interval);
    };

    rollRef.current = setTimeout(step, 80);
  };

  // Game utilities
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

  const isPerfectDay = condition?.id === "AOD-PC-008";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Battle</h1>
          <div className={styles.headerActions}>
            <span className={styles.activationsDisplay}>{Math.floor((gamePoints || 300) / 150)} ACT</span>
            <button className={styles.rulesBtn} onClick={() => setRulesOpen(true)}>Rules</button>
            <Link href="/roster" className={styles.adjustLink}>← Roster</Link>
          </div>
        </div>
        <button
          className={`${styles.conditionBtn} ${!isPerfectDay ? styles.conditionBtnActive : ""}`}
          onClick={openConditionOverlay}
        >
          {condition?.name ?? "Perfect Day"}
        </button>
      </header>

      <main className={styles.unitList}>
        {roster.map((unit, index) =>
          unit.expanded ? (
            <UnitCard
              key={unit.id}
              unit={unit}
              expandUnit={expandUnit}
              index={index}
              condition={condition}
            />
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

      {/* ── Rules overlay ── */}
      {rulesOpen && (
        <div className={styles.rulesOverlay} onClick={() => setRulesOpen(false)}>
          <div className={styles.rulesPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.rulesPanelHeader}>
              <h2 className={styles.rulesPanelTitle}>Rules Reference</h2>
              <button className={styles.rulesCloseBtn} onClick={() => setRulesOpen(false)}>✕</button>
            </div>
            <div className={styles.rulesPanelBody}>
              {RULES_SECTIONS.map((section) => (
                <div key={section.title} className={styles.rulesEntry}>
                  <h3 className={styles.rulesEntryTitle}>{section.title}</h3>
                  {section.body.split("\n\n").map((para, i) => (
                    <p key={i} className={styles.rulesEntryPara}>{para}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Planetary condition overlay ── */}
      {conditionOpen && (
        <div className={styles.conditionOverlay} onClick={closeConditionOverlay}>
          <div className={styles.conditionPanel} onClick={(e) => e.stopPropagation()}>

            {/* Panel header */}
            <div className={styles.conditionPanelHeader}>
              {conditionView === "detail" ? (
                <button className={styles.conditionBackBtn} onClick={() => setConditionView("list")}>← Back</button>
              ) : (
                <span className={styles.conditionPanelTitle}>Planetary Conditions</span>
              )}
              <button className={styles.conditionCloseBtn} onClick={closeConditionOverlay}>✕</button>
            </div>

            {/* List view */}
            {conditionView === "list" && (
              <div className={styles.conditionBody}>
                <button className={styles.rollBtn} onClick={rollRandom}>Roll Random</button>
                <div className={styles.conditionGrid}>
                  {PLANETARY_CONDITIONS.map((cond) => (
                    <button
                      key={cond.id}
                      className={`${styles.conditionChip} ${condition?.id === cond.id ? styles.conditionChipActive : ""}`}
                      onClick={() => selectCondition(cond)}
                    >
                      {cond.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rolling view */}
            {conditionView === "rolling" && (
              <div className={styles.rollingBody}>
                <p className={styles.rollingLabel}>Rolling...</p>
                <div className={styles.rollingDisplay}>{rollName}</div>
              </div>
            )}

            {/* Detail view */}
            {conditionView === "detail" && detailCondition && (
              <div className={styles.conditionDetailBody}>
                <img
                  className={styles.conditionImage}
                  src={`/assets/planetary/${detailCondition.id}.jpg`}
                  alt={detailCondition.name}
                />
                <div className={styles.conditionDetailInfo}>
                  <p className={styles.conditionDetailId}>{detailCondition.id}</p>
                  <h3 className={styles.conditionDetailName}>{detailCondition.name}</h3>
                  <p className={styles.conditionDetailText}>{detailCondition.text}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
