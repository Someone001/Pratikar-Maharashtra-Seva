function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generate24HourIcsFile(params: {
  platformName: string;
  submittedAt: string | Date;
  referenceNumber?: string;
}): string {
  const submitDate = new Date(params.submittedAt);
  const deadlineDate = new Date(submitDate.getTime() + 24 * 60 * 60 * 1000);
  const endDate = new Date(deadlineDate.getTime() + 30 * 60 * 1000); // 30-min event duration
  const now = new Date();

  const ref = params.referenceNumber ? ` (Ticket: ${params.referenceNumber})` : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pratikar//NCII 24h Takedown Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@pratikar.local`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(deadlineDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:24-Hour Takedown Deadline: ${params.platformName}${ref}`,
    `DESCRIPTION:Check if ${params.platformName} removed or disabled access to reported non-consensual content in compliance with Rule 3(2)(b) of India IT Rules, 2021.\\n\\nIf the intermediary has failed to comply within 24 hours, escalate immediately to:\\n1. Grievance Appellate Committee (GAC)\\n2. National Cybercrime Reporting Portal (cybercrime.gov.in / Helpline 1930)\\n3. Nearest Cyber Police Station for FIR.`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:30 minutes left until 24-hour statutory takedown deadline expires!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

