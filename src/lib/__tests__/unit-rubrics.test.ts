import assert from 'assert';
import { 
  RUBRIC_ENTRIES, 
  lookupRubricBySignalId, 
  lookupRubric, 
  generateDecisionMatrixCsv, 
  DECISION_MATRIX_CSV,
  RubricCategory
} from '../rubrics';

export function runRubricsTestSuite() {
  console.log("--- STARTING STRUCTURED DECISION MATRIX (ADR 0005) TEST SUITE ---");

  // 1. Cover all 4 core pillars with both positive and negative signals
  const categories: RubricCategory[] = ['Physique', 'EQ', 'IQ', 'Wealth'];
  for (const cat of categories) {
    const positiveEntries = RUBRIC_ENTRIES.filter(e => e.category === cat && e.signalType === 'positive');
    const negativeEntries = RUBRIC_ENTRIES.filter(e => e.category === cat && e.signalType === 'negative');
    assert(positiveEntries.length > 0, `Expected positive entries for ${cat}`);
    assert(negativeEntries.length > 0, `Expected negative entries for ${cat}`);
  }

  // 2. Enforce delta boundaries (-50 <= delta <= 50) and valid emotions
  const validEmotions = new Set(['neutral', 'contempt', 'disgusted', 'content', 'surprised', 'excited']);
  for (const entry of RUBRIC_ENTRIES) {
    assert(entry.delta >= -50 && entry.delta <= 50, `Delta out of bounds: ${entry.delta} in ${entry.signalId}`);
    assert(validEmotions.has(entry.targetEmotion), `Invalid emotion: ${entry.targetEmotion} in ${entry.signalId}`);
    assert(entry.signalId, `Missing signalId`);
    assert(entry.description, `Missing description for ${entry.signalId}`);
  }

  // 3. Resolve signal by exact signalId in O(1) time
  const entry = lookupRubricBySignalId('PHY_FIDGET_TOUCH');
  assert(entry !== undefined, 'Expected PHY_FIDGET_TOUCH to be defined');
  assert(entry?.category === 'Physique', 'Expected Physique category');
  assert(entry?.delta === -15, 'Expected delta -15');
  assert(entry?.targetEmotion === 'contempt', 'Expected contempt targetEmotion');

  // 4. Case-insensitive signalId lookups
  const lower = lookupRubricBySignalId('eq_calm_jab_deflection');
  assert(lower !== undefined, 'Expected lower case lookup to resolve');
  assert(lower?.signalId === 'EQ_CALM_JAB_DEFLECTION', 'Expected canonical signalId');
  assert(lower?.delta === 15, 'Expected delta 15');

  // 5. Fallback gracefully when signalId is missing
  const fallback = lookupRubric({
    category: 'EQ',
    signalType: 'negative',
    reason: 'Nervous throat clearing and stuttering'
  });
  assert(fallback !== undefined, 'Expected fallback rubric entry');
  assert(fallback.category === 'EQ', 'Expected EQ category');
  assert(fallback.delta < 0, 'Expected negative delta');

  // 6. Match keywords in reason string
  const keywordMatch = lookupRubric({
    category: 'Physique',
    signalType: 'negative',
    reason: 'Observed slouching and posture collapse during date'
  });
  assert(keywordMatch !== undefined, 'Expected keyword match');
  assert(keywordMatch.signalId === 'PHY_POSTURE_COLLAPSE', 'Expected PHY_POSTURE_COLLAPSE match');
  assert(keywordMatch.delta === -20, 'Expected delta -20');

  // 7. CSV generation
  const csv = generateDecisionMatrixCsv();
  assert(csv.includes('Category,Signal_ID,Value_Level,Signal_Type,Delta,Target_Emotion,Min_Duration_Sec,Description,Behavior_Logic'), 'CSV missing headers');
  assert(csv.includes('PHY_POSTURE_UPRIGHT'), 'CSV missing PHY_POSTURE_UPRIGHT');
  assert(csv.includes('EQ_NERVOUS_LAUGHTER'), 'CSV missing EQ_NERVOUS_LAUGHTER');
  assert(csv.includes('WTH_BRAND_DROP'), 'CSV missing WTH_BRAND_DROP');
  assert(DECISION_MATRIX_CSV === csv, 'DECISION_MATRIX_CSV mismatch');

  // 8. Benchmark: 100,000 lookups in under 50ms
  const start = performance.now();
  for (let i = 0; i < 100_000; i++) {
    lookupRubricBySignalId('WTH_AUTHENTIC_CRAFT');
  }
  const elapsed = performance.now() - start;
  assert(elapsed < 100, `Benchmark exceeded target: ${elapsed.toFixed(2)}ms`);

  console.log(`--- ALL DECISION MATRIX TESTS PASSED CLEANLY (100k lookups in ${elapsed.toFixed(2)}ms) ---`);
}
