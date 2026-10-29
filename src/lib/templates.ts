import type { Language, CaseRecord, LinkRecord } from '../types';

export interface ComplaintTemplateParams {
  caseRecord: CaseRecord;
  platformName: string;
  links: LinkRecord[];
  language: Language;
  grievanceOfficerEmail?: string;
}

export function generate24HourComplaint(params: ComplaintTemplateParams): {
  subject: string;
  body: string;
  mailtoUrl?: string;
} {
  const { caseRecord, platformName, links, language, grievanceOfficerEmail } = params;

  const complainantName = caseRecord.personalDetails?.name || '[Complainant / Anonymous Victim]';
  const complainantPhone = caseRecord.personalDetails?.phone || '[Provided Upon Official Request]';
  const complainantEmail = caseRecord.personalDetails?.email || '[Contact via Platform Message]';

  const helperText =
    caseRecord.mode === 'assisted' && caseRecord.helperName
      ? `(Submitted with assistance from advocate/representative: ${caseRecord.helperName})`
      : '';

  const linksList =
    links.length > 0
      ? links.map((l, i) => `${i + 1}. ${l.url} (Status: ${l.status}, First observed: ${l.firstSeenAt})`).join('\n')
      : '[Offending URL / Profile Link To Be Inserted]';

  const identifiersList =
    caseRecord.identifiers && caseRecord.identifiers.length > 0
      ? caseRecord.identifiers.join(', ')
      : 'Not explicitly disclosed';

  if (language === 'hi') {
    const subject = `तत्काल कानूनी नोटिस: आईटी नियम 2021 के नियम 3(2)(ख) के तहत 24 घंटे में सामग्री हटाने का अनुरोध - ${platformName}`;
    const body = `सेवा में,
शिकायत निवारण अधिकारी (Grievance Officer),
${platformName}

विषय: सूचना प्रौद्योगिकी (मध्यस्थ दिशा-निर्देश और डिजिटल मीडिया आचार संहिता) नियम, 2021 के नियम 3(2)(ख) एवं इलेक्ट्रॉनिकी एवं सूचना प्रौद्योगिकी मंत्रालय (MeitY) की मानक संचालन प्रक्रिया (11 नवंबर 2025) के तहत 24 घंटे के भीतर गैर-सहमति अंतरंग/मॉर्फ सामग्री को हटाने का औपचारिक नोटिस।

महोदय/महोदया,

1. शिकायतकर्ता की पहचान:
नाम: ${complainantName} ${helperText}
संपर्क: ${complainantEmail} | ${complainantPhone}

2. उल्लंघनकारी सामग्री का विवरण:
आपके प्लेटफॉर्म पर शिकायतकर्ता की स्पष्ट सहमति के बिना अंतरंग, यौन, अथवा कंप्यूटर द्वारा रूपांतरित/मॉर्फ (Deepfake) सामग्री प्रसारित की गई है।
सामग्री के यूआरएल (URLs) / प्रोफाइल:
${linksList}

आरोपी के उपयोगकर्ता नाम/पहचानकर्ता: ${identifiersList}

3. कानूनी अनिवार्यता (24 घंटे की समय-सीमा):
सूचना प्रौद्योगिकी नियम, 2021 के नियम 3(2)(ख) के अनुसार, किसी व्यक्ति के निजी क्षेत्र को प्रदर्शित करने वाली या गैर-सहमति यौन सामग्री की शिकायत मिलने के 24 घंटे के भीतर मध्यस्थ को ऐसी सामग्री को हटाना या उसकी पहुंच निष्क्रिय करना अनिवार्य है।
इसके अतिरिक्त, MeitY NCII SOP (दिनांक 11 नवंबर 2025) के तहत इस प्रकार के अपराधों पर त्वरित कार्रवाई का निर्देश है।

4. वैधानिक घोषणा:
शिकायतकर्ता सत्यनिष्ठा से घोषित करता है कि यह सामग्री बिना सहमति के प्रसारित की गई है और यह मेरी निजता तथा गरिमा का गंभीर उल्लंघन करती है।

कृपया इस शिकायत की प्राप्ति की पुष्टि करें, एक शिकायत संदर्भ/टिकट संख्या जारी करें, और वैधानिक 24 घंटे की अवधि के भीतर सामग्री को स्थायी रूप से हटाकर कृत कार्रवाई की सूचना दें। विफल रहने पर सूचना प्रौद्योगिकी अधिनियम की धारा 79 के तहत मध्यस्थ की विधिक सुरक्षा (Safe Harbour) समाप्त हो सकती है और औपचारिक आपराधिक शिकायत दर्ज की जाएगी।

भवदीय,
${complainantName}
दिनांक: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
[प्रतिकार (Pratikar) प्रणाली द्वारा वैधानिक प्रारूप में तैयार]`;

    const mailtoUrl = grievanceOfficerEmail
      ? `mailto:${encodeURIComponent(grievanceOfficerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

    return { subject, body, mailtoUrl };
  }

  if (language === 'mr') {
    const subject = `तातडीची कायदेशीर नोटीस: आयटी नियम २०२१ च्या नियम ३(२)(b) अंतर्गत २४ तासांत सामग्री हटवण्याची विनंती - ${platformName}`;
    const body = `प्रति,
तक्रार निवारण अधिकारी (Grievance Officer),
${platformName}

विषय: माहिती तंत्रज्ञान (मध्यस्थ मार्गदर्शक तत्त्वे आणि डिजिटल मीडिया आचारसंहिता) नियम, २०२१ च्या नियम ३(२)(b) आणि इलेक्ट्रॉनिक्स आणि माहिती तंत्रज्ञान मंत्रालय (MeitY) च्या SOP (११ नोव्हेंबर २०२५) नुसार २४ तासांच्या आत संमती नसलेली खाजगी/मॉर्फ सामग्री हटवण्याबाबत नोटीस.

महोदय/महोदया,

१. तक्रारदाराचा तपशील:
नाव: ${complainantName} ${helperText}
संपर्क: ${complainantEmail} | ${complainantPhone}

२. आक्षेपार्ह सामग्रीचा तपशील:
आपल्या प्लॅटफॉर्मवर तक्रारदाराच्या स्पष्ट संमतीशिवाय खाजगी, लैंगिक किंवा मॉर्फ (Deepfake) केलेली सामग्री प्रसारित करण्यात आली आहे.
सामग्रीचे URL / प्रोफाईल लिंक्स:
${linksList}

आरोपीचे युझरनेम/तपशील: ${identifiersList}

३. कायदेशीर बंधन (२४ तासांची मुदत):
माहिती तंत्रज्ञान नियम २०२१ च्या नियम ३(२)(b) नुसार, तक्रार प्राप्त झाल्यापासून २४ तासांच्या आत अशा प्रकारची सामग्री काढून टाकणे किंवा तिचा ॲक्सेस बंद करणे मध्यस्थावर बंधनकारक आहे.

४. कायदेशीर घोषणा:
तक्रारदार याद्वारे घोषित करतो/करते की ही सामग्री संमतीशिवाय प्रसारित केली गेली असून हा माझ्या गोपनीयतेचा आणि वैयक्तिक अधिकारांचा भंग आहे.

कृपया या तक्रारीची पोच पावती आणि तिकीट क्रमांक त्वरित द्यावा आणि २४ तासांच्या आत सामग्री हटवून केलेल्या कारवाईची माहिती द्यावी. अन्यथा आयटी कायद्याच्या कलम ७९ अंतर्गत मिळणारे संरक्षण रद्द होऊ शकते.

आपला/आपली नम्र,
${complainantName}
तारीख: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
[प्रतिकार (Pratikar) प्रणालीद्वारे कायदेशीर मसुदा तयार केला गेला]`;

    const mailtoUrl = grievanceOfficerEmail
      ? `mailto:${encodeURIComponent(grievanceOfficerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

    return { subject, body, mailtoUrl };
  }

  // Default: English
  const subject = `URGENT STATUTORY NOTICE: 24-Hour NCII Removal Request under Rule 3(2)(b) of IT Rules, 2021 - ${platformName}`;
  const body = `To,
The Resident Grievance Officer,
${platformName}

SUBJECT: URGENT STATUTORY NOTICE UNDER RULE 3(2)(b) OF THE INFORMATION TECHNOLOGY (INTERMEDIARY GUIDELINES AND DIGITAL MEDIA ETHICS CODE) RULES, 2021 AND MEITY NCII SOP (DATED 11 NOVEMBER 2025) FOR IMMEDIATE TAKEDOWN WITHIN 24 HOURS.

Dear Grievance Officer,

1. COMPLAINANT IDENTIFICATION:
Complainant Name: ${complainantName} ${helperText}
Contact Details: ${complainantEmail} | ${complainantPhone}

2. DETAILS OF OFFENDING INTIMATE CONTENT:
The following link(s) on your platform host or transmit non-consensual intimate imagery, sexually explicit material, or artificially generated / morphed (deepfake) depictions of the complainant without consent:
${linksList}

Known Offender Handle(s) / Identifiers: ${identifiersList}

3. STATUTORY 24-HOUR MANDATE:
Under Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, an intermediary is statutorily obligated to remove or disable access to content exposing the private area of an individual or depicting non-consensual sexual acts/morphing WITHIN TWENTY-FOUR (24) HOURS from receipt of a complaint.

Furthermore, the Ministry of Electronics and Information Technology (MeitY) Standard Operating Procedure on NCII (issued 11 November 2025) requires intermediaries to maintain priority response queues and furnish immediate grievance redressal for victims.

4. STATUTORY DECLARATION:
I hereby formally declare that:
(a) The depicted individual is myself (or an individual I am legally assisting);
(b) The imagery was captured, obtained, created, or distributed strictly WITHOUT consent;
(c) The continued publication of this content constitutes severe violation of fundamental privacy and dignity under Indian law.

Please immediately acknowledge receipt of this notice, furnish a formal Complaint Ticket Number / Reference ID, and confirm disabling of access within the statutory 24-hour window. Failure to comply extinguishes intermediary immunity under Section 79 of the Information Technology Act, 2000 and invites civil and criminal remedies.

Yours sincerely,
${complainantName}
Timestamp: ${new Date().toISOString()} (${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)
[Generated via Pratikar Privacy-First Redress Engine - Offline Verified Format]`;

  const mailtoUrl = grievanceOfficerEmail
    ? `mailto:${encodeURIComponent(grievanceOfficerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : undefined;

  return { subject, body, mailtoUrl };
}
