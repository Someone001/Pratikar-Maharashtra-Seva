import { describe, it, expect } from 'vitest';
import { generate24HourComplaint } from '../../src/lib/templates';
import { generate24HourIcsFile } from '../../src/lib/ics';
import type { CaseRecord, LinkRecord } from '../../src/types';

describe('Milestone 5: Workflow, Statutory Templates & Calendar Reminders', () => {
  const mockCase: CaseRecord = {
    id: 'case-test-workflow',
    nickname: 'Test Case 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: 'self',
    situation: ['threatened', 'morphed'],
    platforms: ['instagram'],
    demandsMade: { money: true, moreImages: false, other: false, notes: 'Demanded ₹5000' },
    offenderKnown: 'stranger',
    identifiers: ['@blackmailer_handle', '+91-9988776655'],
    personalDetails: {
      name: 'Priya Sharma',
      phone: '+91-9876543210',
      email: 'priya@example.com',
    },
    status: 'active',
  };

  const mockLinks: LinkRecord[] = [
    {
      id: 'link-1',
      caseId: mockCase.id,
      url: 'https://instagram.com/p/mock-post-1',
      platform: 'instagram',
      firstSeenAt: '2026-10-29T10:00:00Z',
      status: 'visible',
    },
  ];

  it('generates English 24-hour statutory takedown complaint with mandatory legal citations', () => {
    const result = generate24HourComplaint({
      caseRecord: mockCase,
      platformName: 'Instagram',
      links: mockLinks,
      language: 'en',
    });

    expect(result.subject).toContain('24-Hour NCII Removal Request');
    expect(result.subject).toContain('Rule 3(2)(b)');
    expect(result.body).toContain('Rule 3(2)(b) of the Information Technology');
    expect(result.body).toContain('Standard Operating Procedure on NCII (issued 11 November 2025)');
    expect(result.body).toContain('WITHIN TWENTY-FOUR (24) HOURS');
    expect(result.body).toContain('Section 79');
    expect(result.body).toContain('https://instagram.com/p/mock-post-1');
    expect(result.body).toContain('@blackmailer_handle');
    expect(result.body).toContain('Priya Sharma');
  });

  it('generates Hindi 24-hour statutory complaint citing Rule 3(2)(b) and MeitY SOP', () => {
    const result = generate24HourComplaint({
      caseRecord: mockCase,
      platformName: 'Instagram',
      links: mockLinks,
      language: 'hi',
    });

    expect(result.subject).toContain('आईटी नियम 2021 के नियम 3(2)(ख)');
    expect(result.subject).toContain('24 घंटे में सामग्री हटाने का अनुरोध');
    expect(result.body).toContain('नियम 3(2)(ख)');
    expect(result.body).toContain('11 नवंबर 2025');
    expect(result.body).toContain('धारा 79');
    expect(result.body).toContain('https://instagram.com/p/mock-post-1');
  });

  it('generates Marathi 24-hour statutory complaint citing Rule 3(2)(b) and MeitY SOP', () => {
    const result = generate24HourComplaint({
      caseRecord: mockCase,
      platformName: 'Instagram',
      links: mockLinks,
      language: 'mr',
    });

    expect(result.subject).toContain('आयटी नियम २०२१ च्या नियम ३(२)(b)');
    expect(result.subject).toContain('२४ तासांत सामग्री हटवण्याची विनंती');
    expect(result.body).toContain('नियम ३(२)(b)');
    expect(result.body).toContain('११ नोव्हेंबर २०२५');
    expect(result.body).toContain('कलम ७९');
    expect(result.body).toContain('https://instagram.com/p/mock-post-1');
  });

  it('generates RFC 5545 compliant .ics calendar file with 24-hour reminder', () => {
    const submittedAt = '2026-10-29T10:00:00.000Z';
    const ics = generate24HourIcsFile({
      platformName: 'Instagram',
      submittedAt,
      referenceNumber: 'TKT-99881',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:24-Hour Takedown Deadline: Instagram (Ticket: TKT-99881)');
    expect(ics).toContain('DTSTART:20261030T100000Z'); // Exactly 24 hours later!
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT30M');
    expect(ics).toContain('END:VCALENDAR');
  });
});
