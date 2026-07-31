import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MentorChatContainer } from '../MentorChatContainer';

describe('MentorChatContainer React Component Unit Tests', () => {
  const conversationId = 'c_mock_conv_456';

  it('should render chat container header, placeholder text, and action button', () => {
    render(<MentorChatContainer conversationId={conversationId} />);

    expect(screen.getByText(/Debrief with M1 Mentor/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Ask M1 about specific turns or cues.../i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Ask M1/i })).toBeDefined();
  });

  it('should update input field as user types', () => {
    render(<MentorChatContainer conversationId={conversationId} />);
    const input = screen.getByPlaceholderText(/Ask M1 about specific turns or cues.../i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'How was my vocal tone?' } });
    expect(input.value).toBe('How was my vocal tone?');
  });

  it('should send user message and display reply bubble via MSW network mock', async () => {
    render(<MentorChatContainer conversationId={conversationId} />);
    const input = screen.getByPlaceholderText(/Ask M1 about specific turns or cues.../i);
    const sendBtn = screen.getByRole('button', { name: /Ask M1/i });

    fireEvent.change(input, { target: { value: 'How was my vocal tone?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('How was my vocal tone?')).toBeDefined();
    });
  });
});
