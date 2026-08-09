import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MentorTab } from '../MentorTab';

describe('MentorTab React Component Unit Tests', () => {
  const defaultProps = {
    mentorPrompt: 'Initial mentor prompt',
    setMentorPrompt: vi.fn(),
    mentorKnowledgeBase: 'Initial mentor KB',
    setMentorKnowledgeBase: vi.fn(),
    conversationUrl: null,
    error: null,
    isLoading: false,
    isSynthesizing: false,
    synthesis: null,
    onStartSession: vi.fn(),
  };

  const mockSynthesis = {
    audit: {
      scores: { EQ: 8, IQ: 7, Wealth: 9, Physique: 8 },
      primary_weakness: 'Nervous posture under pressure',
      rationale: 'Client maintained solid vocal tone but exhibited physical stiffness.',
    },
    master_log: '# Master Performance Log\nTimestamped transcript aligned.',
    mentor_prompt: {
      system_instruction: 'You are M1, executive mentor.',
      highlights: [],
    },
    next_partner_prompt: {
      system_instruction: 'You are P1, standoffish partner.',
    },
  };

  it('should render synthesizing indicator when isSynthesizing is true', () => {
    render(<MentorTab {...defaultProps} isSynthesizing={true} />);
    expect(screen.getByText(/Synthesis in progress.../i)).toBeDefined();
  });

  it('should render Knowledge Loaded status and Learn button when synthesis prop is provided', () => {
    render(<MentorTab {...defaultProps} synthesis={mockSynthesis} />);

    expect(screen.getByText(/✓ Post-Session Knowledge Loaded/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Learn/i })).toBeDefined();
  });

  it('should render default Learn button even when synthesis prop is null', () => {
    render(<MentorTab {...defaultProps} synthesis={null} />);
    const chatBtn = screen.getByRole('button', { name: /Learn/i });
    expect(chatBtn).toBeDefined();

    fireEvent.click(chatBtn);
    expect(defaultProps.onStartSession).toHaveBeenCalledWith('Initial mentor prompt', 'Initial mentor KB', 'Mentor');
  });
});
