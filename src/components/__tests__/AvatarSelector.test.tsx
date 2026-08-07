import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AvatarSelector } from '../AvatarSelector';

describe('AvatarSelector React Component Unit Tests', () => {
  const defaultProps = {
    id: 'test-avatar-select',
    label: 'Select Sparring Partner Replica',
    value: 'r291e545fd67',
    onChange: vi.fn(),
    disabled: false,
  };

  it('should render avatar selector select dropdown and options', () => {
    render(<AvatarSelector {...defaultProps} />);

    expect(screen.getByLabelText('Select Sparring Partner Replica')).toBeDefined();
    expect(screen.getByDisplayValue('Gabby (Sparring Partner)')).toBeDefined();
  });

  it('should trigger onChange callback when user selects a different replica', () => {
    render(<AvatarSelector {...defaultProps} />);
    const select = screen.getByLabelText('Select Sparring Partner Replica');

    fireEvent.change(select, { target: { value: 'r4ba1277e4fb' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('r4ba1277e4fb');
  });
});
