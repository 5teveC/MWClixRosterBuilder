const STAT_INFO = {
  footSpeed: {
    name: "Foot",
    text: `A unit with the foot speed mode exists at NOE (nape of the earth) level. NOE level is any point on the battlefield that is not elevated (an elevated terrain feature or cruising level). It interacts with all terrain types per the rules for those types.`,
  },
  aquaticSpeed: {
    name: "Aquatic",
    text: `A unit with the aquatic speed mode exists at NOE level. It interacts with all terrain types per the rules for those types except that this unit treats all water terrain as clear terrain for movement purposes. If it occupies deep water terrain, it is submerged.`,
  },
  hoverSpeed: {
    name: "Hover",
    text: `A unit with the hover speed mode exists at NOE level. It interacts with all terrain types per the rules for those types except that it treats all water terrain as clear terrain and all hindering terrain as blocking terrain for movement purposes. If it occupies deep water terrain, it is not submerged. It fails to break away only on a die roll result of 1.`,
  },
  trackedSpeed: {
    name: "Tracked",
    text: `A unit with the tracked speed mode exists at NOE level. It interacts with all terrain types per the rules for those types except that it treats all hindering terrain as clear terrain for movement purposes.`,
  },
  wheeledSpeed: {
    name: "Wheeled",
    text: `A unit with the wheeled speed mode exists at NOE level. It interacts with all terrain types per the rules for those types except that this unit treats all water terrain as blocking terrain for movement purposes.`,
  },
  mechSpeed: {
    name: "'Mech",
    text: `A unit with the 'Mech speed mode exists at NOE level. It interacts with all terrain types per the rules for those types except that it treats shallow water terrain as clear terrain and deep water terrain as hindering terrain for movement purposes.

This unit's movement path may cross infantry bases, and it deals 1 pushing damage to any opposing infantry in base contact with it when it successfully breaks away.

Run Option: A unit with the 'Mech speed mode can use the run option when given a move order; this allows the unit to move a number of inches equal to double its speed value. You must declare that the 'Mech will run before attempting to move it. Running causes the unit to gain 1 heat in addition to any other heat gained by the order. If a 'Mech given a move order to run fails a break away roll, it does not gain 1 heat for the run.`,
  },
  quadSpeed: {
    name: "Quad 'Mech",
    text: `A unit with the Quad 'Mech speed mode exists at NOE level. It interacts with all terrain types per the rules for those types except that it treats shallow water terrain as clear terrain and deep water terrain as hindering terrain for movement purposes.

A Quad 'Mech:
• Ignores infantry bases when determining its movement path
• Can use the run option when given a move order
• Need not make a break away roll to move away from opposing infantry
• Cannot change its facing if it fails a break away roll
• Cannot make free spins
• Loses 2 heat if it begins and ends your turn occupying any water terrain

Hull-Down Modifier: A Quad 'Mech gets +1 to its defense value against ranged combat attacks when it occupies hindering terrain.`,
  },
  vtolSpeed: {
    name: "VTOL",
    text: `A unit with the VTOL speed mode can exist on the battlefield at two different levels: NOE and cruising. It may exist at only one level at a time.

At NOE level, this unit treats all water terrain as clear terrain and hindering terrain as blocking terrain for movement purposes. If it occupies deep water terrain, it is not submerged.

A VTOL can change levels as part of resolving a move order. Each change between levels requires 2″ of movement. You may change levels at any time during a move order, as long as at least 2″ of movement remains.

A VTOL:
• Cannot be a member of a formation
• Cannot use the ram special attack
• Cannot be the passenger of a transport
• Is eliminated instead of captured if targeted by a successful capture attempt
• Must immediately move to NOE level if it gains the Salvage special equipment

Cruising Level: A unit at cruising level does not interact with or occupy any terrain type. Its base does not block lines of fire. No unit is ever in base contact with a cruising unit. Lines of fire to or from a cruising unit ignore blocking terrain, unit bases, and hindering terrain (unless the target or attacker occupies hindering terrain). A cruising unit ignores terrain and bases for movement, but cannot end its movement overlapping another unit's base.

Height-Advantage Modifier: A unit at cruising level gets +1 to its defense value when targeted by a ranged combat attack originating from NOE level.`,
  },
  ballisticDamage: {
    name: "Ballistic Damage",
    text: `Attacks using this range type score damage equal to the attacker's damage value, affected by any modifiers.

Indirect Fire: When its line of fire would be blocked, a unit can make an indirect-fire ranged combat attack against a single target; the target may not be in base contact with a unit friendly to the attacker. To make an indirect-fire attack, a unit must:
• Have a maximum range value greater than 0
• Not be in base contact with an opposing unit
• Use a damage value with the Ballistic range type
• Have an attack value greater than 0

Draw a line of fire as normal; it ignores unit bases and terrain. The target gets +3 to its defense value. If the attack succeeds, score damage equal to the attacker's damage value, maximum 2.`,
  },
  energyDamage: {
    name: "Energy Damage",
    text: `If an attack using this range type targets a vehicle or 'Mech, it scores damage equal to the attacker's damage value, affected by any modifiers. If the attack targets infantry, the damage is reduced to 1, affected by any modifiers.

If a ranged combat attack using the Energy range type deals at least 1 damage to a 'Mech, the 'Mech also gains 1 heat. A 'Mech may gain only 1 heat in this way each turn, regardless of how many successful Energy attacks damage it that turn.`,
  },
};

export default STAT_INFO;
