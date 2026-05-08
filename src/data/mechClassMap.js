// Maps unit wId → Mech class (Light / Medium / Heavy / Assault).
// Derived from variant code suffix (-L/-M/-H/-A) or BattleTech tonnage.
// Units not listed here have no class and cannot equip gear.
const mechClassMap = {
  // Mongoose (variant -L)
  AOD081: "Light", AOD082: "Light", AOD083: "Light", AOD084: "Light",
  // Valiant (variant -L)
  AOD085: "Light", AOD086: "Light", AOD087: "Light", AOD088: "Light",
  // Blade (variant -L)
  AOD089: "Light", AOD090: "Light", AOD091: "Light", AOD092: "Light",
  // Uziel (variant -M)
  AOD093: "Medium", AOD094: "Medium", AOD095: "Medium", AOD096: "Medium",
  // Thunder Fox (variant -M)
  AOD097: "Medium", AOD098: "Medium", AOD099: "Medium", AOD100: "Medium",
  // Hatchetman (variant -M)
  AOD101: "Medium", AOD102: "Medium", AOD103: "Medium", AOD104: "Medium",
  // Dasher II (variant -M)
  AOD105: "Medium", AOD106: "Medium", AOD107: "Medium", AOD108: "Medium",
  // Ursa (variant -H)
  AOD109: "Heavy", AOD110: "Heavy", AOD111: "Heavy", AOD112: "Heavy",
  // Named mechs — class from variant suffix
  AOD113: "Light",   // Arbalest 'Bolt'    ABT-R3-L
  AOD114: "Light",   // Firestarter 'Cinders' FS9-S3-L
  AOD115: "Light",   // Nyx 'Kolyu'        NX-23-L
  AOD116: "Medium",  // Cuirass 'Crusader' CDR-C1-M
  AOD117: "Heavy",   // Mangonel 'Alpha'   MNL-V1-H
  AOD118: "Heavy",   // Rifleman 'Big Bertha' RFL-7M-H
  AOD119: "Heavy",   // Jade Hawk 'Milagro' JHK-01-H
  AOD120: "Heavy",   // Cave Lion 'Anima'  CLN-C2-H
  AOD121: "Assault", // Phoenix Hawk IIC 'Hellfire' PHX-2C5-A
  AOD122: "Assault", // Battlemaster 'Caber' BLR-4S-A
  AOD123: "Assault", // Xanthos 'Chikako'  XNS-01-A
  AOD124: "Assault", // Cygnus 'Persuader' CYS-01-A
  AOD133: "Heavy",   // Jade Hawk 'Blitz'  JHK-01-H
  AOD134: "Heavy",   // Mangonel 'Copperhead' MNL-V1-H
  AOD135: "Assault", // Battlemaster 'E.O.D.' BLR-1S-A
  AOD136: "Medium",  // Thunder Fox 'Twinkletoes' TFX-C4-M
  AOD137: "Heavy",   // Ursa 'Prowler'     URA-2A-H
  AOD138: "Assault", // Xanthos 'Wooly'    XNS-11-A
  AOD139: "Heavy",   // Jade Hawk 'Phoenix' JHK-04-H
  AOD140: "Assault", // Phoenix Hawk IIC 'Fu' PHK-2C3-A
  AOD141: "Light",   // Crimson Hawk       CHK-2B-L
  // Custom / non-AOD units
  BF042:  "Light",   // Raven 'Spettro'    RVN-4R-L
  D113:   "Heavy",   // Kendrick Fetladral (Mad Cat III — 75t)
  D114:   "Assault", // Kriya Wolf (Tundra Wolf — 80t)
  DOM088: "Light",   // Phoenix Hawk I     PXK-M2-L
  E103:   "Light",   // Cougar (35t)
  E123:   "Assault", // Viktor Hannan (Zeus — 80t)
  FP109:  "Medium",  // Griffin (55t)
  L096:   "Light",   // Wasp (20t)
  L119:   "Heavy",   // Porfiria Navas (Thunderbolt — 65t)
  VG068:  "Heavy",   // Thor               TR-VS-H
  // D090 (ForestryMech MOD) and E096 (Crimson Hawk — no variant) intentionally omitted
};

export default mechClassMap;
