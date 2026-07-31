import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotesTab } from '../NotesTab';

describe('NotesTab React Component Unit Tests', () => {
  const defaultProps = {
    insights: [
      { type: 'transcript_turn', role: 'user', text: 'Hi, nice to meet you.' },
      { type: 'transcript_turn', role: 'assistant', text: 'Hi there!' },
      { type: 'behavioral_cue', category: 'EQ', signalType: 'positive', reason: 'Maintained eye contact' },
    ],
    masterLog: null,
    synthesis: null,
    isSynthesizing: false,
    transcriptRef: { current: null },
    toolsRef: { current: null },
    videoRef: { current: null },
    onApplyNextPartnerPrompt: vi.fn(),
    conversationId: 'c_mock_conv_456',
  };

  it('should render transcript dialogue turns correctly', () => {
    render(<NotesTab {...defaultProps} />);

    expect(screen.getByText('Hi, nice to meet you.')).toBeDefined();
    expect(screen.getByText('Hi there!')).toBeDefined();
    expect(screen.getByText('You')).toBeDefined();
    expect(screen.getByText('Partner')).toBeDefined();
  });

  it('should render behavioral cue tool call badges', () => {
    render(<NotesTab {...defaultProps} />);

    expect(screen.getByText(/EQ: positive/i)).toBeDefined();
    expect(screen.getByText('Maintained eye contact')).toBeDefined();
  });

  it('should render embedded MentorChatContainer when conversationId is present', () => {
    render(<NotesTab {...defaultProps} />);
    expect(screen.getByText(/Debrief with M1 Mentor/i)).toBeDefined();
  });
});
