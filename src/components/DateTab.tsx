import React, { useState } from 'react';
import { SCENARIO_PRESETS } from '@/lib/scenarioPresets';

interface DateTabProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  knowledgeBase: string;
  setKnowledgeBase: (kb: string) => void;
  conversationUrl: string | null;
  error: string | null;
  isLoading: boolean;
  onStartSession: (prompt: string, kb: string, label: string) => void;
}

export function DateTab({
  systemPrompt,
  setSystemPrompt,
  knowledgeBase,
  setKnowledgeBase,
  conversationUrl,
  error,
  isLoading,
  onStartSession,
}: DateTabProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SCENARIO_PRESETS[0].id);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSystemPrompt(preset.systemPrompt);
      setKnowledgeBase(preset.knowledgeBase);
    }
  };

  return (
    <>
      <div className="input-group">
        <label htmlFor="presetSelect">Scenario Challenge</label>
        <select
          id="presetSelect"
          value={selectedPresetId}
          onChange={(e) => handleSelectPreset(e.target.value)}
          disabled={!!conversationUrl}
        >
          {SCENARIO_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} ({preset.difficulty})
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="personaPrompt">Prompt</label>
        <textarea
          id="personaPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Define the avatar's personality..."
          rows={6}
          disabled={!!conversationUrl}
        />
      </div>

      <div className="input-group">
        <label htmlFor="knowledgeBase">Knowledge</label>
        <textarea
          id="knowledgeBase"
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          placeholder="Define the grading rubrics..."
          rows={6}
          disabled={!!conversationUrl}
        />
      </div>

      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "16px", fontSize: "0.9rem", fontWeight: 500 }}>
          Error: {error}
        </div>
      )}

      {!conversationUrl && (
        <button 
          className="btn btn-primary" 
          onClick={() => onStartSession(systemPrompt, knowledgeBase, 'Date')} 
          disabled={isLoading}
        >
          {isLoading ? "Provisioning..." : "Date"}
        </button>
      )}
    </>
  );
}
