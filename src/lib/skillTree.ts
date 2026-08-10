export interface SkillTierDefinition {
  level: number;
  name: string;
  focusPillar: 'Physique' | 'EQ' | 'IQ' | 'Wealth' | 'Apex';
  description: string;
  targetRubricItems: string[];
  partnerBasePrompt: string;
}

export interface TierProgressRecord {
  status: 'UNLOCKED' | 'IN_PROGRESS' | 'PASSED' | 'LOCKED';
  best_score: number;
  attempts: number;
  passed: boolean;
}

export interface UserProgressState {
  active_tier: number;
  active_tier_name: string;
  unlocked_tiers: number[];
  tier_history: Record<string, TierProgressRecord>;
}

export const SKILL_TREE_CURRICULUM: Record<number, SkillTierDefinition> = {
  1: {
    level: 1,
    name: "Physical Demeanor",
    focusPillar: "Physique",
    description: "Master posture, steady eye contact, vocal composure, and zero fidgeting under screening pressure.",
    targetRubricItems: [
      "Maintains unbroken eye contact during introduction",
      "Sits upright with open, uncrossed physical posture",
      "Eliminates nervous fidgeting, face-touching, or desk tapping",
      "Maintains calm vocal pitch without upward inflection (inflection stability)",
      "Speaks at a deliberate, controlled tempo (no rushed words)",
      "Responds to initial greeting without hesitation stutter",
      "Demonstrates physical grounding when date makes observant eye contact",
      "Avoids defensive posture shifts when questioned about background",
      "Maintains comfortable facial composure without nervous smiling",
      "Concludes initial turns with steady vocal grounding"
    ],
    partnerBasePrompt: "You are a very attractive mid 20s woman (working a 500k corporate lawyer job in NYC) on a first date in a coffee shop. You are initially passive and observant, testing the user's physical presence, eye contact, and posture. You respond with terse, watchful engagement."
  },
  2: {
    level: 2,
    name: "EQ",
    focusPillar: "EQ",
    description: "Handle awkward silences, subtle probes, and emotional stress-tests without validation-seeking.",
    targetRubricItems: [
      "Comfortably holds 3-second natural silences without rushing to fill space",
      "Responds to subtle sarcasm or dismissive comments with calm amusement",
      "Eliminates validation-seeking questions (e.g. 'Right?', 'Does that make sense?')",
      "Keeps vocal cadence relaxed when date challenges an opinion",
      "Displays emotional independence when date expresses indifference",
      "Avoids over-explaining or justifying personal choices",
      "Uses disarming, cool-headed humor instead of defensive explanations",
      "Acknowledges partner statements without needy agreement",
      "Maintains frame when date asks probing personal questions",
      "Pivots conversation smoothly without emotional reactivity"
    ],
    partnerBasePrompt: "You are a mid 20s executive recruiter in NYC on a first date. You are emotionally perceptive, slightly skeptical, and stress-test the date's emotional composure by using subtle sarcasm and deliberate pauses."
  },
  3: {
    level: 3,
    name: "IQ",
    focusPillar: "IQ",
    description: "Drive intellectually stimulating dialogue, active listening, and sharp conversational banter.",
    targetRubricItems: [
      "Demonstrates clear, logical structure when sharing complex thoughts",
      "Asks insightful follow-up questions reflecting deep active listening",
      "Engages in intellectual debate without becoming argumentative",
      "Displays genuine curiosity and original perspectives",
      "Avoids shallow cliches or generic small-talk filler",
      "Connects abstract concepts to practical real-world examples",
      "Matches and elevates the partner's intellectual tempo",
      "Articulates core personal philosophy with clarity and brevity",
      "Summarizes partner points accurately before adding insights",
      "Transitions between topics naturally with strong intellectual flow"
    ],
    partnerBasePrompt: "You are a sharp NYC venture capital partner on a first date. You value intellectual depth, razor-sharp logic, and original thinking. You quickly get bored by superficial small talk and probe for substance."
  },
  4: {
    level: 4,
    name: "Status",
    focusPillar: "Wealth",
    description: "Display authentic high status, career grounding, and lifestyle congruence without humble-bragging.",
    targetRubricItems: [
      "Discusses career and achievements with understated confidence",
      "Zero material flexes, humble-bragging, or brand-dropping",
      "Demonstrates clear long-term ambition and vision",
      "Communicates personal values around wealth and success authentically",
      "Responds to luxury/lifestyle topics with unbothered familiarity",
      "Displays zero insecurity when date mentions high-achieving peers",
      "Articulates passion for craft rather than monetary compensation",
      "Demonstrates high standards for personal time and priorities",
      "Remains grounded when date questions career trajectories",
      "Exudes quiet authority without needing external validation"
    ],
    partnerBasePrompt: "You are a high-earning NYC art gallery director from an established background. You easily detect try-hard flexes, luxury brand-dropping, and humble-bragging. You respect quiet, understated authority and authentic ambition."
  },
  5: {
    level: 5,
    name: "Escalation Speed",
    focusPillar: "Apex",
    description: "Synthesize physical demeanor, EQ, IQ, and status into a fluid, calibrated, and romantically escalating display.",
    targetRubricItems: [
      "Seamlessly integrates physical demeanor, EQ, IQ, and status under pressure",
      "Handles rapid topic switches and unexpected teasing with effortless grace",
      "Maintains absolute frame control when date tests boundaries",
      "Leads the conversation direction naturally without appearing bossy",
      "Balances playful teasing with genuine romantic escalation and chemistry",
      "Responds to multi-layered screening questions with charisma",
      "Displays unshakeable self-worth across all 4 core pillars",
      "Creates natural romantic tension through calibrated vocal and emotional pacing",
      "Demonstrates high value across tone, content, and body language simultaneously",
      "Concludes session with undeniable romantic magnetic presence"
    ],
    partnerBasePrompt: "You are an exceptionally attractive, high-status NYC corporate attorney on a first date. You run a comprehensive screening test across physical demeanor, intelligence, emotional stability, and status, yielding to romantic escalation only when true high value is demonstrated."
  }
};

export function getTierDefinition(tierLevel: number): SkillTierDefinition {
  const level = Math.min(Math.max(1, tierLevel), 5);
  return SKILL_TREE_CURRICULUM[level];
}

export function getDefaultUserProgressState(): UserProgressState {
  return {
    active_tier: 1,
    active_tier_name: SKILL_TREE_CURRICULUM[1].name,
    unlocked_tiers: [1],
    tier_history: {
      tier_1: { status: 'IN_PROGRESS', best_score: 0, attempts: 0, passed: false },
      tier_2: { status: 'LOCKED', best_score: 0, attempts: 0, passed: false },
      tier_3: { status: 'LOCKED', best_score: 0, attempts: 0, passed: false },
      tier_4: { status: 'LOCKED', best_score: 0, attempts: 0, passed: false },
      tier_5: { status: 'LOCKED', best_score: 0, attempts: 0, passed: false },
    }
  };
}
