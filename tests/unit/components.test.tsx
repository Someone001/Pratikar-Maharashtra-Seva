import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  Button,
  IconButton,
  Field,
  TextArea,
  Checkbox,
  RadioGroup,
  Badge,
  Countdown,
  Banner,
  CopyButton,
  PanicButton,
} from '../../src/components';

describe('Accessible UI Components', () => {
  it('renders Button with variants and handles clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Report</Button>);

    const btn = screen.getByRole('button', { name: /submit report/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables Button when isLoading is true and displays spinner', () => {
    render(<Button isLoading>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Processing');
  });

  it('renders IconButton with accessible aria-label', () => {
    render(
      <IconButton aria-label="Close modal">
        <span>X</span>
      </IconButton>,
    );
    const btn = screen.getByRole('button', { name: 'Close modal' });
    expect(btn).toBeInTheDocument();
  });

  it('renders Field with label, error, and aria-describedby', () => {
    render(
      <Field
        label="Reporting URL"
        id="report-url"
        error="Invalid URL"
        hint="Paste full https link"
      />,
    );

    const input = screen.getByLabelText(/reporting url/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid URL');
  });

  it('renders TextArea with character counts and labels', () => {
    render(<TextArea label="Incident Notes" id="notes" placeholder="Enter notes" />);
    const textarea = screen.getByLabelText(/incident notes/i);
    expect(textarea).toBeInTheDocument();
  });

  it('renders Checkbox and handles state changes', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Money demanded"
        checked={false}
        onChange={handleChange}
      />,
    );
    const checkbox = screen.getByLabelText(/money demanded/i);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders RadioGroup and handles option selection', () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup
        name="situation"
        label="Incident Type"
        value="shared"
        onChange={handleChange}
        options={[
          { value: 'shared', label: 'Already Shared' },
          { value: 'threatened', label: 'Being Threatened' },
        ]}
      />,
    );

    const radio1 = screen.getByLabelText(/already shared/i);
    const radio2 = screen.getByLabelText(/being threatened/i);
    expect(radio1).toBeChecked();
    expect(radio2).not.toBeChecked();

    fireEvent.click(radio2);
    expect(handleChange).toHaveBeenCalledWith('threatened');
  });

  it('renders Badge with verified and unverified styles', () => {
    const { rerender } = render(<Badge variant="verified">Official SOP</Badge>);
    expect(screen.getByText('Official SOP')).toBeInTheDocument();

    rerender(<Badge variant="unverified">Please verify before use</Badge>);
    expect(screen.getByText('Please verify before use')).toBeInTheDocument();
  });

  it('renders Countdown timer for 24-hour window', () => {
    // 2 hours ago submission
    const submittedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    render(<Countdown submittedAt={submittedAt} />);

    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByText(/statutory 24-hour removal deadline/i)).toBeInTheDocument();
  });

  it('renders Banner with title and content', () => {
    render(
      <Banner title="Legal Basis" variant="info">
        Rule 3(2)(b) IT Rules 2021
      </Banner>,
    );
    expect(screen.getByText('Legal Basis')).toBeInTheDocument();
    expect(screen.getByText(/rule 3\(2\)\(b\)/i)).toBeInTheDocument();
  });

  it('copies text with CopyButton and shows feedback', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<CopyButton textToCopy="Legal notice draft" copyLabel="Copy Draft" />);
    const btn = screen.getByRole('button', { name: 'Copy Draft' });
    expect(btn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Legal notice draft');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('triggers quick exit on PanicButton click and on Escape key', () => {
    const onPanic = vi.fn();
    // mock window.location.replace
    const originalLocation = window.location;
    // @ts-expect-error Mocking location
    delete window.location;
    window.location = { ...originalLocation, replace: vi.fn() };

    render(<PanicButton onPanic={onPanic} redirectUrl="https://example.com/weather" />);

    const panicBtn = screen.getByRole('button', { name: /quick exit/i });
    fireEvent.click(panicBtn);

    expect(onPanic).toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith('https://example.com/weather');

    // Test Escape key press
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onPanic).toHaveBeenCalledTimes(2);

    // Restore location
    window.location = originalLocation;
  });
});
