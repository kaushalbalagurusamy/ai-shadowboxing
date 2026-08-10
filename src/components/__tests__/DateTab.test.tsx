import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DateTab } from '../DateTab';

describe('DateTab React Component Unit Tests', () => {
  const defaultProps = {
    systemPrompt: 'Initial prompt text',
    setSystemPrompt: vi.fn(),
    knowledgeBase: 'Initial knowledge base text',
    setKnowledgeBase: vi.fn(),
    conversationUrl: null,
    error: null,
    isLoading: false,
    onStartSession: vi.fn(),
  };

  it('should render DateTab inputs and action buttons', () => {
    render(<DateTab {...defaultProps} />);

    expect(screen.getByDisplayValue('Initial prompt text')).toBeDefined();
    expect(screen.getByDisplayValue('Initial knowledge base text')).toBeDefined();
    expect(screen.getByRole('button', { name: /Practice/i })).toBeDefined();
  });

  it('should render error message banner when error prop is provided', () => {
    render(<DateTab {...defaultProps} error="Failed to initialize WebRTC conversation" />);
    expect(screen.getByText(/Failed to initialize WebRTC conversation/i)).toBeDefined();
  });

  it('should update prompt text when user types in System Prompt textarea', () => {
    render(<DateTab {...defaultProps} />);
    const textarea = screen.getByDisplayValue('Initial prompt text');

    fireEvent.change(textarea, { target: { value: 'Updated prompt text' } });
    expect(defaultProps.setSystemPrompt).toHaveBeenCalledWith('Updated prompt text');
  });

  it('should trigger onStartSession callback when Practice button is clicked', () => {
    render(<DateTab {...defaultProps} />);
    const startBtn = screen.getByRole('button', { name: /Practice/i });

    fireEvent.click(startBtn);
    expect(defaultProps.onStartSession).toHaveBeenCalledTimes(1);
  });

  it('should disable button and show Provisioning... when isLoading is true', () => {
    render(<DateTab {...defaultProps} isLoading={true} />);
    const startBtn = screen.getByRole('button', { name: /Provisioning.../i });

    expect(startBtn).toBeDefined();
    expect((startBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
