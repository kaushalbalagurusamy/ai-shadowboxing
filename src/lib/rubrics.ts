/**
 * Decision Matrix & Scoring Rubrics for AI Shadowboxing
 * Single source of truth for real-time perception scoring (Governor),
 * Tavus PAL visual tool grounding, and post-session synthesis (The Zipper & maj@3).
 *
 * Implements ADR 0005: Structured Decision Matrix & Precision Rubric Grounding
 */

export type RubricCategory = 'Physique' | 'EQ' | 'IQ' | 'Wealth';
export type ValueLevel = 'High' | 'Low' | 'Neutral';
export type TargetEmotion = 'neutral' | 'contempt' | 'disgusted' | 'content' | 'surprised' | 'excited';

export interface RubricEntry {
  signalId: string;
  category: RubricCategory;
  valueLevel: ValueLevel;
  signalType: 'positive' | 'negative';
  description: string;
  delta: number;
  targetEmotion: TargetEmotion;
  minDurationSec?: number;
  behaviorLogic?: string;
}

export const RUBRIC_ENTRIES: readonly RubricEntry[] = [
  // --- PHYSIQUE & DEMEANOR (Posture, Ocular Stability, Fidgeting) ---
  {
    signalId: 'PHY_POSTURE_UPRIGHT',
    category: 'Physique',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Upright, open, uncrossed physical posture with shoulders dropped and relaxed',
    delta: 5,
    targetEmotion: 'content',
    minDurationSec: 3.0,
    behaviorLogic: 'User displays physical comfort, presence, and spatial ownership.',
  },
  {
    signalId: 'PHY_EYE_CONTACT_STEADY',
    category: 'Physique',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Steady, unbroken eye contact during partner statements without intimidating stare',
    delta: 10,
    targetEmotion: 'content',
    minDurationSec: 2.5,
    behaviorLogic: 'User demonstrates grounding and emotional presence.',
  },
  {
    signalId: 'PHY_TEMPO_DELIBERATE',
    category: 'Physique',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Deliberate, grounded speaking tempo with steady vocal pitch and zero upward inflection',
    delta: 10,
    targetEmotion: 'content',
    behaviorLogic: 'Vocal composure indicates lack of performance anxiety.',
  },
  {
    signalId: 'PHY_FIDGET_TOUCH',
    category: 'Physique',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Nervous face-touching, neck-scratching, ring-spinning, or desk-tapping',
    delta: -15,
    targetEmotion: 'contempt',
    minDurationSec: 1.0,
    behaviorLogic: 'User displays anxiety, physical leakage, or low presence under scrutiny.',
  },
  {
    signalId: 'PHY_POSTURE_COLLAPSE',
    category: 'Physique',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Slouching, leaning back defensively, or physical folding when challenged',
    delta: -20,
    targetEmotion: 'disgusted',
    minDurationSec: 2.0,
    behaviorLogic: 'Physical submission or defensive withdrawal.',
  },
  {
    signalId: 'PHY_EYE_DARTING',
    category: 'Physique',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Frequent ocular evasion, looking down or sideways when answering direct questions',
    delta: -10,
    targetEmotion: 'contempt',
    minDurationSec: 1.5,
    behaviorLogic: 'Indicates lack of conviction or insecurity in response.',
  },

  // --- EMOTIONAL INTELLIGENCE (EQ) (Frame Control, Pauses, Validation Seeking) ---
  {
    signalId: 'EQ_CALM_JAB_DEFLECTION',
    category: 'EQ',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Calmly ignoring, laughing off, or disarming a boundary test with amusement',
    delta: 15,
    targetEmotion: 'content',
    behaviorLogic: 'Maintains composure under pressure without taking the bait.',
  },
  {
    signalId: 'EQ_HOLDS_SILENCE',
    category: 'EQ',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Comfortably holding a 3-second natural silence without rushing to fill space',
    delta: 10,
    targetEmotion: 'neutral',
    minDurationSec: 3.0,
    behaviorLogic: 'Comfort with stillness signals high status and self-worth.',
  },
  {
    signalId: 'EQ_COOL_HUMOR',
    category: 'EQ',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Disarming, playful humor that pivots tension into banter',
    delta: 15,
    targetEmotion: 'surprised',
    behaviorLogic: 'Demonstrates emotional agility and social calibration.',
  },
  {
    signalId: 'EQ_NERVOUS_LAUGHTER',
    category: 'EQ',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'High-pitched nervous giggling, throat-clearing, or stuttering under scrutiny',
    delta: -15,
    targetEmotion: 'disgusted',
    behaviorLogic: 'Failing the pressure test through anxious vocal submissiveness.',
  },
  {
    signalId: 'EQ_VALIDATION_SEEKING',
    category: 'EQ',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Uttering verbal validation checks (e.g., "Right?", "You know?", "Does that make sense?")',
    delta: -10,
    targetEmotion: 'contempt',
    behaviorLogic: 'Subconscious request for female approval and validation.',
  },
  {
    signalId: 'EQ_OVER_EXPLAINING',
    category: 'EQ',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Defensively justifying choices, rambling past the point, or apologizing prematurely',
    delta: -15,
    targetEmotion: 'contempt',
    behaviorLogic: 'Demonstrates fragile frame and eagerness to please.',
  },
  {
    signalId: 'EQ_PREMATURE_ESCALATION',
    category: 'EQ',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Aggressive sexualized comments or overly intimate probing before rapport is built',
    delta: -25,
    targetEmotion: 'disgusted',
    behaviorLogic: 'Insecure attempt to fast-track intimacy without calibration.',
  },

  // --- INTELLECTUAL QUALITY (IQ) (Substance, Curiosity, Active Listening) ---
  {
    signalId: 'IQ_ACTIVE_LISTENING',
    category: 'IQ',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Sharp follow-up question referencing an implicit detail shared by the partner',
    delta: 15,
    targetEmotion: 'surprised',
    behaviorLogic: 'Reflects deep presence and authentic cognitive engagement.',
  },
  {
    signalId: 'IQ_CONCEPTUAL_STRUCTURE',
    category: 'IQ',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Articulating complex thoughts with structured clarity, brevity, and original insight',
    delta: 15,
    targetEmotion: 'content',
    behaviorLogic: 'High intellectual horsepower delivered concisely.',
  },
  {
    signalId: 'IQ_GENUINE_CURIOSITY',
    category: 'IQ',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Probing into partner worldview or motivations beyond superficial trivia',
    delta: 10,
    targetEmotion: 'content',
    behaviorLogic: 'Demonstrates psychological depth.',
  },
  {
    signalId: 'IQ_SHALLOW_CLICHE',
    category: 'IQ',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Relying on generic small-talk filler (weather, commute) or superficial dating cliches',
    delta: -10,
    targetEmotion: 'contempt',
    behaviorLogic: 'Boring conversational rhythm and low intellectual stimulus.',
  },
  {
    signalId: 'IQ_ARGUMENTATIVE_DEFENSIVENESS',
    category: 'IQ',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Treating playful banter as a formal debate to be won; arguing over trivial points',
    delta: -15,
    targetEmotion: 'disgusted',
    behaviorLogic: 'Socially uncalibrated combative behavior.',
  },

  // --- PERCEIVED WEALTH & STATUS (Grounding, Craft Passion, Non-Neediness) ---
  {
    signalId: 'WTH_AUTHENTIC_CRAFT',
    category: 'Wealth',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Articulating clear vision, craft mastery, or long-term mission with quiet authority',
    delta: 20,
    targetEmotion: 'content',
    behaviorLogic: 'High intrinsic status grounded in competence rather than validation.',
  },
  {
    signalId: 'WTH_LUXURY_FAMILIARITY',
    category: 'Wealth',
    valueLevel: 'High',
    signalType: 'positive',
    description: 'Discussing high-end travel, culinary arts, or aesthetics with unbothered familiarity',
    delta: 15,
    targetEmotion: 'surprised',
    behaviorLogic: 'Organic exposure to high-value lifestyle without try-hard energy.',
  },
  {
    signalId: 'WTH_BRAND_DROP',
    category: 'Wealth',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Unprompted dropping of luxury brands, designer labels, or conspicuous material assets',
    delta: -25,
    targetEmotion: 'disgusted',
    behaviorLogic: 'Insecure compensatory behavior; screams newly acquired or borrowed status.',
  },
  {
    signalId: 'WTH_HUMBLE_BRAG',
    category: 'Wealth',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'Masking boastful financial claims behind self-deprecating complaints',
    delta: -20,
    targetEmotion: 'contempt',
    behaviorLogic: 'Manipulative status demonstration easily parsed as weak.',
  },
  {
    signalId: 'WTH_INCONGRUENT_FLEX',
    category: 'Wealth',
    valueLevel: 'Low',
    signalType: 'negative',
    description: 'High-status verbal claim directly contradicted by nervous non-verbal demeanor',
    delta: -30,
    targetEmotion: 'disgusted',
    behaviorLogic: 'Severe incongruence; triggers immediate female screening alarm.',
  },
] as const;

// Primary Fast Lookup Index by signalId (O(1))
const signalIdMap = new Map<string, RubricEntry>();

// Secondary Fallback Index by category + signalType (O(1))
const categoryTypeMap = new Map<string, RubricEntry[]>();

// Initialize indices statically on load (zero runtime overhead during WebRTC loop)
for (const entry of RUBRIC_ENTRIES) {
  signalIdMap.set(entry.signalId.toUpperCase(), entry);

  const catKey = `${entry.category.toLowerCase()}:${entry.signalType.toLowerCase()}`;
  const existing = categoryTypeMap.get(catKey) || [];
  existing.push(entry);
  categoryTypeMap.set(catKey, existing);
}

/**
 * Direct O(1) lookup by canonical Signal ID
 */
export function lookupRubricBySignalId(signalId: string): RubricEntry | undefined {
  if (!signalId) return undefined;
  return signalIdMap.get(signalId.trim().toUpperCase());
}

/**
 * Universal Rubric Resolution:
 * 1. Checks direct signalId match (O(1)).
 * 2. Attempts keyword match in reason string if provided.
 * 3. Falls back to canonical category average delta if signalId is missing.
 */
export function lookupRubric(params: {
  signalId?: string;
  category?: string;
  signalType?: string;
  reason?: string;
}): RubricEntry {
  // 1. Exact Signal ID Match
  if (params.signalId) {
    const direct = lookupRubricBySignalId(params.signalId);
    if (direct) return direct;
  }

  const normCategory: RubricCategory = normalizeCategory(params.category);
  const normType: 'positive' | 'negative' = (params.signalType?.toLowerCase() === 'positive') ? 'positive' : 'negative';

  // 2. Keyword scan in reason string against known entries in the category
  const candidates = categoryTypeMap.get(`${normCategory.toLowerCase()}:${normType}`) || [];
  if (params.reason && candidates.length > 0) {
    const lowerReason = params.reason.toLowerCase();
    for (const candidate of candidates) {
      // Match signalId tokens (e.g., POSTURE, COLLAPSE, FIDGET, EYE, CONTACT)
      const idTokens = candidate.signalId.toLowerCase().split('_').filter(t => t.length > 3);
      if (idTokens.some(t => lowerReason.includes(t))) {
        return candidate;
      }

      // Match cleaned description words (stripping punctuation so "slouching," matches "slouching")
      const words = candidate.description
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4);

      if (words.some(w => lowerReason.includes(w))) {
        return candidate;
      }
    }
  }

  // 3. Fallback to default canonical representative for (Category + Type)
  if (candidates.length > 0) {
    return candidates[0];
  }

  // Absolute fallback default
  return {
    signalId: 'GENERIC_SIGNAL',
    category: normCategory,
    valueLevel: normType === 'positive' ? 'High' : 'Low',
    signalType: normType,
    description: params.reason || 'General behavioral observation',
    delta: normType === 'positive' ? 10 : -10,
    targetEmotion: normType === 'positive' ? 'content' : 'contempt',
  };
}

function normalizeCategory(cat?: string): RubricCategory {
  if (!cat) return 'EQ';
  const c = cat.toLowerCase();
  if (c.includes('phys')) return 'Physique';
  if (c.includes('eq') || c.includes('emot')) return 'EQ';
  if (c.includes('iq') || c.includes('intel')) return 'IQ';
  if (c.includes('wth') || c.includes('wealth') || c.includes('status')) return 'Wealth';
  return 'EQ';
}

/**
 * Generate CSV representation of Decision Matrix
 * Format matches Tavus /v2/documents and knowledge base specifications
 */
export function generateDecisionMatrixCsv(): string {
  const headers = ['Category', 'Signal_ID', 'Value_Level', 'Signal_Type', 'Delta', 'Target_Emotion', 'Min_Duration_Sec', 'Description', 'Behavior_Logic'];
  const rows = RUBRIC_ENTRIES.map(e => [
    e.category,
    e.signalId,
    e.valueLevel,
    e.signalType,
    e.delta.toString(),
    e.targetEmotion,
    (e.minDurationSec || 0).toString(),
    `"${e.description.replace(/"/g, '""')}"`,
    `"${(e.behaviorLogic || '').replace(/"/g, '""')}"`
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export const DECISION_MATRIX_CSV = generateDecisionMatrixCsv();
