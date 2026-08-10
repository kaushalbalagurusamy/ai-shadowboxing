import React from 'react';
import { SKILL_TREE_CURRICULUM, getDefaultUserProgressState, UserProgressState } from '@/lib/skillTree';
import { SessionSynthesis } from '@/hooks/useSessionInsights';

interface SkillsTabProps {
  synthesis: SessionSynthesis | null;
}

export function SkillsTab({ synthesis }: SkillsTabProps) {
  const progressState: UserProgressState = synthesis?.user_progress_state || getDefaultUserProgressState();
  const activeTierLevel = progressState.active_tier || 1;

  return (
    <div className="skills-tab-container" style={{ paddingBottom: '32px' }}>
      
      {/* Skill Ladder Header Overview */}
      <div className="notes-section" style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Deterministic Skill Progression Ladder
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '2px' }}>
              Master each level with a 90%+ median score to unlock higher difficulty dynamics.
            </div>
          </div>
          <div className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '6px 14px', fontWeight: 700 }}>
            Active: Level {activeTierLevel}
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${(progressState.unlocked_tiers.length / 5) * 100}%`, 
              background: 'linear-gradient(90deg, var(--pastel-blue-text), var(--pastel-green-text))', 
              transition: 'width 0.4s ease' 
            }} 
          />
        </div>
      </div>

      {/* 5-Tier Curriculum Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3, 4, 5].map((lvl) => {
          const tierDef = SKILL_TREE_CURRICULUM[lvl];
          const hist = progressState.tier_history?.[`tier_${lvl}`];
          const isUnlocked = progressState.unlocked_tiers.includes(lvl);
          const isActive = activeTierLevel === lvl;
          const isPassed = hist?.passed;

          return (
            <div
              key={lvl}
              style={{
                background: isPassed ? 'rgba(0,200,100,0.03)' : isActive ? '#ffffff' : isUnlocked ? '#ffffff' : 'rgba(245,245,248,0.7)',
                border: isActive ? '2px solid var(--pastel-blue-text)' : '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
                opacity: 1,
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="badge badge-blue" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                    Level {lvl}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {tierDef.name.split(': ')[1] || tierDef.name}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {hist && hist.attempts > 0 ? (
                      <>Best: <strong>{hist.best_score}/100</strong> ({hist.attempts} attempt{hist.attempts === 1 ? '' : 's'})</>
                    ) : (
                      <>Baseline: <strong>{hist?.best_score || 0}/100</strong></>
                    )}
                  </span>
                  <div 
                    className={`badge ${isPassed ? 'badge-green' : isActive ? 'badge-blue' : isUnlocked ? 'badge-blue' : 'badge-red'}`} 
                    style={{ fontWeight: 700 }}
                  >
                    {isPassed ? '✓ PASSED' : isActive ? '● ACTIVE IN PROGRESS' : isUnlocked ? 'UNLOCKED' : '🔒 LOCKED (Monitored)'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', lineHeight: '1.4', opacity: 0.8, marginBottom: '12px' }}>
                {tierDef.description}
              </div>

              {/* Collapsible 10-Item Benchmark Syllabus */}
              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', opacity: 0.7 }}>
                  View 10 Target Evaluation Benchmarks
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                  {tierDef.targetRubricItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '6px 8px', 
                        background: 'rgba(0,0,0,0.02)', 
                        borderRadius: '4px',
                        borderLeft: '2px solid var(--border)'
                      }}
                    >
                      <span style={{ fontWeight: 600, opacity: 0.6 }}>{idx + 1}.</span> {item}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })}
      </div>

    </div>
  );
}
