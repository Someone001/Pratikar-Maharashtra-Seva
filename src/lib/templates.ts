import type { Language, CaseRecord, LinkRecord, ReportRecord, EvidenceEntry } from '../types';

const MANDATORY_FOOTER = '\n\n---\nPrepared with Pratikar, an information and organisation tool. This is not legal advice.';

export interface ComplaintTemplateParams {
  caseRecord: CaseRecord;
  platformName: string;
  links: LinkRecord[];
  language: Language;
  grievanceOfficerEmail?: string;
  anonymous?: boolean;
}

/**
 * 1. Platform Takedown Request (Section 9.1)
 */
export function generate24HourComplaint(params: ComplaintTemplateParams): {
  subject: string;
  body: string;
  mailtoUrl?: string;
} {
  const { caseRecord, platformName, links, language, grievanceOfficerEmail, anonymous = false } = params;

  const complainantName = anonymous
    ? '[Anonymous Complainant / Name Withheld for Safety]'
    : caseRecord.personalDetails?.name || '[Complainant Name]';

  const complainantPhone = anonymous
    ? '[Contact via Email Only]'
    : caseRecord.personalDetails?.phone || '[Phone Provided on Official Request]';

  const complainantEmail = caseRecord.personalDetails?.email || '[Contact via Platform Reporting Channel]';

  const helperText =
    caseRecord.mode === 'assisted' && caseRecord.helperName
      ? `(Submitted with assistance from advocate/representative: ${caseRecord.helperName})`
      : '';

  const linksList =
    links.length > 0
      ? links.map((l, i) => `${i + 1}. ${l.url} (Status: ${l.status}, First observed: ${l.firstSeenAt})`).join('\n')
      : '[Offending URL / Profile Link]';

  const identifiersList =
    caseRecord.identifiers && caseRecord.identifiers.length > 0
      ? caseRecord.identifiers.join(', ')
      : 'Not explicitly disclosed';

  if (language === 'hi') {
    const subject = `24 घंटे में सामग्री हटाने का अनुरोध (आईटी नियम 2021 के नियम 3(2)(ख)) - ${platformName}`;
    const body = `सेवा में,
शिकायत निवारण अधिकारी (Resident Grievance Officer),
${platformName}

विषय: सूचना प्रौद्योगिकी नियम, 2021 के नियम 3(2)(ख) एवं MeitY SOP (11 नवंबर 2025) के तहत 24 घंटे में सामग्री हटाने का अनुरोध।

महोदय/महोदया,

1. शिकायतकर्ता का विवरण:
नाम: ${complainantName} ${helperText}
संपर्क: ${complainantEmail} | ${complainantPhone}

2. आक्रामक सामग्री की लिंक:
${linksList}

पहचाने गए आरोपी / यूजरनेम: ${identifiersList}

3. वैधानिक 24 घंटे की समय-सीमा:
सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश और डिजिटल मीडिया आचार संहिता) नियम, 2021 के नियम 3(2)(ख) के अनुसार, किसी व्यक्ति के निजी क्षेत्र को प्रदर्शित करने वाली या गैर-सहमति यौन कृत्यों/मॉर्फिंग वाली सामग्री को शिकायत मिलने के 24 घंटे के भीतर हटाना या उसकी पहुंच को अक्षम करना मध्यस्थ के लिए अनिवार्य है।

MeitY SOP (जारी 11 नवंबर 2025) के तहत ऐसी शिकायतों का प्राथमिकता से निवारण आवश्यक है। समय पर कार्रवाई न करने पर मध्यस्थ को धारा 79 के तहत प्राप्त संरक्षण समाप्त हो सकता है।

4. वैधानिक घोषणा:
मैं घोषणा करता/करती हूँ कि यह सामग्री मेरी स्पष्ट सहमति के बिना बनाई या वितरित की गई है। कृपया तुरंत पावती संदर्भ संख्या प्रदान करें और 24 घंटे में सामग्री हटाना सुनिश्चित करें।

भवदीय,
${complainantName}
दिनांक: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST${MANDATORY_FOOTER}`;

    const mailtoUrl = grievanceOfficerEmail
      ? `mailto:${encodeURIComponent(grievanceOfficerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

    return { subject, body, mailtoUrl };
  }

  if (language === 'mr') {
    const subject = `२४ तासांत सामग्री हटवण्याची विनंती (आयटी नियम २०२१ च्या नियम ३(२)(b)) - ${platformName}`;
    const body = `प्रति,
तक्रार निवारण अधिकारी (Resident Grievance Officer),
${platformName}

विषय: माहिती तंत्रज्ञान नियम २०२१ च्या नियम ३(२)(b) आणि MeitY SOP (११ नोव्हेंबर २०२५) अंतर्गत २४ तासांत सामग्री हटवण्याची विनंती.

महोदय/महोदया,

१. तक्रारदाराचा तपशील:
नाव: ${complainantName} ${helperText}
संपर्क: ${complainantEmail} | ${complainantPhone}

२. आक्षेपार्ह सामग्रीच्या लिंक्स:
${linksList}

आरोपीचे तपशील / युझरनेम: ${identifiersList}

३. वैधानिक २४ तासांची मुदत:
माहिती तंत्रज्ञान नियम २०२१ च्या नियम ३(२)(b) नुसार तक्रार प्राप्त झाल्यापासून २४ तासांच्या आत अशी सामग्री काढून टाकणे किंवा तिचा ॲक्सेस बंद करणे मध्यस्थावर बंधनकारक आहे.

MeitY SOP (११ नोव्हेंबर २०२५) चे पालन न केल्यास मध्यस्थाचे कलम ७९ अंतर्गत संरक्षण समाप्त होऊ शकते.

४. कायदेशीर घोषणा:
तक्रारदार याद्वारे घोषित करतो/करते की ही सामग्री स्पष्ट संमतीशिवाय प्रसारित करण्यात आली आहे. कृपया तक्रारीची पोच पावती व संदर्भ क्रमांक द्यावा आणि २४ तासांच्या आत सामग्री हटवल्याची खात्री करावी.

आपला/आपली नम्र,
${complainantName}
तारीख: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST${MANDATORY_FOOTER}`;

    const mailtoUrl = grievanceOfficerEmail
      ? `mailto:${encodeURIComponent(grievanceOfficerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

    return { subject, body, mailtoUrl };
  }

  // Legal default: English (Section 9.1)
  const subject = `24-Hour NCII Removal Request (Rule 3(2)(b), IT Rules 2021) - ${platformName}`;
  const body = `To,
The Resident Grievance Officer,
${platformName}

SUBJECT: 24-Hour NCII Removal Request (Rule 3(2)(b), IT Rules 2021) - ${platformName}

Dear Grievance Officer,

1. COMPLAINANT IDENTIFICATION:
Name: ${complainantName} ${helperText}
Contact: ${complainantEmail} | ${complainantPhone}

2. DETAILS OF OFFENDING INTIMATE CONTENT:
The following link(s) on your platform host or transmit non-consensual intimate imagery, sexually explicit material, or artificially generated / morphed (deepfake) depictions without consent:
${linksList}

Known Offender Identifier(s): ${identifiersList}

3. STATUTORY 24-HOUR MANDATE:
Under Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, an intermediary is statutorily obligated to remove or disable access to content exposing the private area of an individual or depicting non-consensual sexual acts/morphing WITHIN TWENTY-FOUR (24) HOURS from receipt of a complaint.

Furthermore, the Ministry of Electronics and Information Technology (MeitY) Standard Operating Procedure on NCII (issued 11 November 2025) requires intermediaries to maintain priority response queues and furnish immediate grievance redressal. Failure to expeditiously remove offending intimate content forfeits safe harbour immunity under Section 79 of the Information Technology Act, 2000.

4. STATUTORY DECLARATION:
I hereby formally declare that:
(a) The depicted individual is myself (or an individual I am legally assisting);
(b) The imagery was captured, obtained, created, or distributed strictly WITHOUT consent;
(c) The continued publication of this content constitutes severe violation of fundamental privacy and dignity under Indian law.

Please immediately acknowledge receipt of this notice, furnish a formal Complaint Ticket Number / Reference ID, prevent re-upload where supported, and confirm disabling of access within the statutory 24-hour window.

Yours sincerely,
${complainantName}
Timestamp: ${new Date().toISOString()} (${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)${MANDATORY_FOOTER}`;

  const mailtoUrl = grievanceOfficerEmail
    ? `mailto:${encodeURIComponent(grievanceOfficerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : undefined;

  return { subject, body, mailtoUrl };
}

/**
 * 2. Follow-Up / Escalation after Missed 24-Hour Deadline (Section 9.2)
 */
export function generateGrievanceFollowUp(params: {
  caseRecord: CaseRecord;
  report: ReportRecord;
  language: Language;
}): { subject: string; body: string } {
  const { caseRecord, report, language } = params;
  const complainantName = caseRecord.personalDetails?.name || '[Complainant / Anonymous Victim]';
  const refText = report.referenceNumber ? `(Reference Number: ${report.referenceNumber})` : '(Prior Complaint Notice)';

  if (language === 'hi') {
    const subject = `अनुवर्ती नोटिस: 24 घंटे की वैधानिक समय-सीमा समाप्त होने के बाद भी सामग्री नहीं हटाई गई - ${report.platform}`;
    const body = `सेवा में,
मुख्य शिकायत निवारण अधिकारी,
${report.platform}

विषय: आईटी नियम 2021 के नियम 3(2)(ख) के तहत दर्ज शिकायत ${refText} पर 24 घंटे बीत जाने के उपरांत तत्काल कार्रवाई हेतु अनुवर्ती नोटिस।

महोदय/महोदया,

शिकायतकर्ता ने दिनांक ${report.submittedAt} को आपके प्लेटफॉर्म पर गैर-सहमति अंतरंग सामग्री को 24 घंटे के भीतर हटाने का वैधानिक नोटिस दिया था।

वैधानिक 24 घंटे की समय-सीमा समाप्त हो चुकी है, किंतु आक्षेपार्ह सामग्री पर संतोषजनक कार्रवाई नहीं की गई है। आईटी अधिनियम की धारा 79 के तहत आपकी मध्यस्थ प्रतिरक्षा (Safe Harbour) समाप्त होने के कगार पर है।

कृपया तत्काल इस सामग्री को हटाएं और लिखित स्पष्टीकरण दें। अन्यथा यह मामला शिकायत अपीलीय समिति (GAC), राष्ट्रीय साइबर अपराध पोर्टल (NCRP 1930), और स्थानीय पुलिस साइबर सेल को भेजा जा रहा है।

भवदीय,
${complainantName}${MANDATORY_FOOTER}`;
    return { subject, body };
  }

  if (language === 'mr') {
    const subject = `पाठपुरावा नोटीस: २४ तासांची मुदत संपूनही सामग्री न हटवल्याबाबत - ${report.platform}`;
    const body = `प्रति,
मुख्य तक्रार निवारण अधिकारी,
${report.platform}

विषय: आयटी नियम २०२१ च्या नियम ३(२)(b) अंतर्गत तक्रार ${refText} वर २४ तास उलटून गेल्यावर त्वरित कारवाईबाबत.

महोदय/महोदया,

तक्रारदाराने दिनांक ${report.submittedAt} रोजी आपल्याकडे २४ तासांच्या आत खाजगी/मॉर्फ सामग्री हटवण्याबाबत नोटीस दिली होती.

कायदेशीर २४ तासांची मुदत संपूनही आवश्यक ती कारवाई करण्यात आलेली नाही. कृपया ही सामग्री तात्काळ हटवून लेखी खुलासा द्यावा. अन्यथा ही बाब तक्रार अपीलीय समिती (GAC) आणि राष्ट्रीय सायबर क्राईम पोर्टलकडे वर्ग करण्यात येईल.

आपला/आपली नम्र,
${complainantName}${MANDATORY_FOOTER}`;
    return { subject, body };
  }

  const subject = `URGENT FOLLOW-UP: Statutory 24-Hour Removal Deadline Expired - ${report.platform} ${refText}`;
  const body = `To,
The Chief Grievance Officer,
${report.platform}

SUBJECT: URGENT FOLLOW-UP / STATUTORY DEFAULT NOTICE: Failure to comply with Rule 3(2)(b) of IT Rules, 2021 within 24 hours ${refText}

Dear Grievance Officer,

On ${report.submittedAt}, a formal statutory complaint was lodged with your intermediary requesting immediate removal of non-consensual intimate/morphed imagery.

The statutory 24-hour compliance deadline has now EXPIRED without verification of complete removal.

Under Rule 3(2)(b) of the IT Rules, 2021 and MeitY SOP dated 11 November 2025, failure to disable access within 24 hours compromises intermediary protection under Section 79 of the IT Act, 2000.

You are hereby requested to:
1. Immediately disable public and private access to the reported links;
2. Furnish written confirmation of action taken;
3. State reasons for the delay in statutory compliance.

Failure to resolve immediately will compel escalation to the Grievance Appellate Committee (GAC), the National Cybercrime Reporting Portal (1930), and appropriate law enforcement authorities for FIR registration.

Yours sincerely,
${complainantName}${MANDATORY_FOOTER}`;

  return { subject, body };
}

/**
 * 3. NCRP / 1930 Preparation Sheet (Section 9.3)
 */
export function generateNcrpPrepSheet(params: {
  caseRecord: CaseRecord;
  links: LinkRecord[];
  reports: ReportRecord[];
  language: Language;
}): { checklist: string[]; readOutSummary: string } {
  const { caseRecord, links, reports } = params;

  const checklist = [
    'Original URLs / Web links of offending posts, stories, or profiles',
    'Timestamps when the content was first observed and when threats were received',
    'Offender handles, usernames, phone numbers, or email addresses',
    'Screenshots of blackmail or extortion chats (stored securely offline)',
    'Payment transaction IDs, UPI handles, or account details (if money was extorted)',
    'Platform grievance ticket or reference numbers already logged',
  ];

  const linksStr = links.map((l) => l.url).join(', ') || 'Documented in evidence log';
  const reportsStr = reports.map((r) => `${r.platform}: ${r.referenceNumber || 'Reported'}`).join('; ') || 'Direct reporting';

  const readOutSummary = `National Cybercrime Reporting Portal (cybercrime.gov.in) & 1930 Call Prep:
Incident Summary:
- Type of Abuse: Non-Consensual Intimate Imagery / Morphing / Sextortion
- Platforms Involved: ${caseRecord.platforms.join(', ') || 'Online platforms'}
- Offender Identifiers: ${caseRecord.identifiers?.join(', ') || 'Unknown'}
- Extortion Demands: ${caseRecord.demandsMade.money ? 'Financial extortion attempted' : 'Threats to circulate'}
- Target Links: ${linksStr}
- Prior Platform Notices: ${reportsStr}
- Statement: I am reporting an urgent non-consensual intimate imagery and sextortion offence under the Information Technology Act and Indian Penal provisions. Takedown notices were served to intermediaries under Rule 3(2)(b). Evidence hashes and chat records are preserved on my device.${MANDATORY_FOOTER}`;

  return { checklist, readOutSummary };
}

/**
 * 4. Police Complaint Summary (Section 9.4)
 */
export function generatePoliceComplaintSummary(params: {
  caseRecord: CaseRecord;
  links: LinkRecord[];
  reports: ReportRecord[];
  evidence: EvidenceEntry[];
  redactPersonalDetails?: boolean;
}): string {
  const { caseRecord, links, reports, evidence, redactPersonalDetails = false } = params;

  const name = redactPersonalDetails ? '[REDACTED COMPLAINANT]' : caseRecord.personalDetails?.name || '[Name Provided]';
  const phone = redactPersonalDetails ? '[REDACTED]' : caseRecord.personalDetails?.phone || '[Phone Provided]';
  const email = redactPersonalDetails ? '[REDACTED]' : caseRecord.personalDetails?.email || '[Email Provided]';
  const identifiers = redactPersonalDetails
    ? (caseRecord.identifiers || []).map(() => '[REDACTED_HANDLE]').join(', ')
    : (caseRecord.identifiers || []).join(', ') || 'Unknown / Not identified';

  return `FORMAL COMPLAINT SUMMARY FOR LAW ENFORCEMENT & CYBER CELL
============================================================
CASE IDENTIFIER: ${caseRecord.id}
Generated: ${new Date().toISOString()} (${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)

1. COMPLAINANT INFORMATION:
Name: ${name}
Contact: ${email} | ${phone}
Assisted Filing: ${caseRecord.mode === 'assisted' ? `Yes, assisted by ${caseRecord.helperName || 'Representative'}` : 'Self'}

2. INCIDENT PARTICULARS:
Classification: Non-Consensual Intimate Imagery (NCII) / Extortion / Digital Impersonation
Situation Type: ${caseRecord.situation.join(', ')}
Offender Known: ${caseRecord.offenderKnown}
Offender Handle(s) / Phone(s): ${identifiers}
Demands Made: ${[caseRecord.demandsMade.money && 'Money', caseRecord.demandsMade.moreImages && 'Additional Images', caseRecord.demandsMade.other && 'Other Coercion'].filter(Boolean).join(', ') || 'None noted'}
Demands Notes: ${caseRecord.demandsMade.notes || 'None'}

3. REPORTED LINKS & PLATFORMS:
${links.map((l, i) => `[${i + 1}] ${l.platform}: ${l.url} (Status: ${l.status})`).join('\n') || 'None recorded'}

4. STATUTORY NOTICES SERVED (Rule 3(2)(b) IT Rules, 2021):
${reports.map((r, i) => `[${i + 1}] ${r.platform} (${r.channel}): Submitted at ${r.submittedAt}, Due: ${r.dueAt}, Outcome: ${r.outcome}, Ticket: ${r.referenceNumber || 'N/A'}`).join('\n') || 'No formal platform notices logged yet.'}

5. EVIDENCE LOG & SHA-256 HASH VERIFICATION:
Total Cryptographic Entries: ${evidence.length}
${evidence.map((e) => `• Seq #${e.seq} [${e.type}] @ ${e.createdAt} | SHA-256: ${e.hash.substring(0, 16)}...`).join('\n') || 'No entries logged.'}

6. RELIEF REQUESTED FROM POLICE:
1. Registration of formal First Information Report (FIR) under applicable sections of the Information Technology Act (Sections 66E, 67, 67A) and BNS/IPC provisions.
2. Direction to social media intermediaries to preserve server logs, IP addresses, and registration data of offending accounts.
3. Urgent blocking and takedown orders to prevent further circulation.${MANDATORY_FOOTER}`;
}

/**
 * 5. Evidence Preservation Summary & Draft Statement (Section 9.5)
 */
export function generateEvidencePreservationSummary(params: {
  caseRecord: CaseRecord;
  evidence: EvidenceEntry[];
  chainValid: boolean;
}): string {
  const { caseRecord, evidence, chainValid } = params;

  return `EVIDENCE PRESERVATION RECORD & INTEGRITY SUMMARY
============================================================
CASE SHORT CODE: ${caseRecord.id.substring(0, 8).toUpperCase()}
Generated Timestamp: ${new Date().toISOString()} (${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)
Cryptographic Hash Chain Status: ${chainValid ? 'VERIFIED (All SHA-256 links intact)' : 'INTEGRITY ALERT (Broken link detected)'}

1. WHAT THIS EVIDENCE RECORD PROVES AND DOES NOT PROVE:
• Tamper-Evident Status: Each entry is chained using SHA-256 where entry(n) links to entry(n-1). Any modification to past entries alters subsequent hashes.
• Honest Limitations: This evidence log is maintained entirely client-side on this device. It is "tamper-evident", not "tamper-proof", and does not constitute a certified statutory electronic evidence certificate without forensic verification.

2. CHRONOLOGICAL EVIDENCE TABLE:
${evidence.map((e) => `Seq: #${e.seq} | Time: ${e.createdAt} | Type: ${e.type} | Hash: ${e.hash.substring(0, 16)}... | Prev: ${e.prevHash.substring(0, 16)}...`).join('\n') || 'No entries in ledger.'}

3. DRAFT STATEMENT FOR LEGAL COUNSEL (Electronic Evidence Preparation):
"I, the undersigned complainant, have recorded the timestamps, URLs, message notes, and digital SHA-256 hashes of digital evidence items related to this incident using an offline client-side logging application on my device. The digital fingerprints shown above correspond to the unmodified files and communications preserved on my storage media."
[DRAFT TEMPLATE ONLY - REQUIRES INDEPENDENT LEGAL REVIEW]${MANDATORY_FOOTER}`;
}
