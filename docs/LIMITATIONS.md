# Technical & Legal Limitations of Pratikar

**Document Scope:** Plain-language disclosure of system capabilities, evidentiary status, and legal caveats.

---

## 1. What Pratikar Is NOT

To protect users from false expectations during high-stress crises, every screen and exported document in Pratikar clearly presents what the tool is and is not:

1. **NOT Legal Advice**: Pratikar is an organizational and informational tool designed to help users structure facts and cite applicable statutory rules. It does not provide legal representation, legal strategy, or personalized attorney counsel.
2. **NOT a Content Removal Service**: Pratikar does not possess administrative access to social media servers, hosting providers, or telecom networks. It generates the statutory notice that the user must submit to the platform.
3. **NOT an Identity Tracker**: Pratikar cannot de-anonymize anonymous Instagram handles, trace IP addresses, or unmask burner phone numbers. De-anonymization and server log preservation require lawful warrants issued to law enforcement agencies under the Bharatiya Nagarik Suraksha Sanhita (BNSS) and IT Act.
4. **NOT Connected to the Police or Government**: Pratikar operates 100% locally on your personal device. It does not automatically file police complaints or register cybercrime portal cases.

---

## 2. Evidentiary Status of the SHA-256 Hash Chain

Pratikar maintains an append-only, cryptographic SHA-256 hash chain:

$$\text{Hash}_n = \text{SHA-256}(\text{Seq} \parallel \text{Timestamp} \parallel \text{Type} \parallel \text{FieldsJSON} \parallel \text{Hash}_{n-1})$$

### 2.1 Tamper-Evident, NOT Tamper-Proof
* **What it proves**: The hash chain proves that the sequence of records in your local vault has not been altered, rearranged, or backdated since the time the entries were created. If any record is modified, the downstream hashes fail mathematical verification.
* **What it does NOT prove**: It does not prove that the initial statements recorded were true in the objective world. Anyone can record an inaccurate statement into a hash chain; the chain merely guarantees that the statement has not been tampered with since entry.

### 2.2 Why the Hash Chain is NOT a Section 65B Certificate
Under Indian evidence law (Section 65B of the Indian Evidence Act, 1872; now Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 - BSA), electronic records submitted in court must be accompanied by a formal certificate signed by a person occupying a responsible official position in relation to the operation of the relevant device or management of the relevant activities.
* Pratikar cannot issue a statutory Section 65B / Section 63 certificate because an automated client-side script is not a legal witness or certifier under Indian law.
* The exported summary is a structured **complainant evidence annexure**. In court, the complainant or their legal counsel must sign their own verification affidavit or Section 63 BSA certificate explaining how they operated their device and recorded the facts.

---

## 3. When to Engage Police and Legal Counsel

While Pratikar provides immediate self-help for invoking the 24-hour statutory takedown rule, users should immediately engage law enforcement and an attorney in the following situations:

1. **Extortion Demands Involving Financial Extortion**:
   If an extortionist demands money (UPI, bank transfer, crypto), contact the **National Cybercrime Helpline at 1930** immediately and file an FIR at your local cyber police station. Indian police have mechanisms to freeze illicit beneficiary bank accounts within the "golden hour".
2. **Physical Threats or Domestic Violence**:
   If you face physical stalking, domestic threats, or fear for your physical safety, call **112** immediately or visit your nearest police station or One Stop Centre (Sakhi Centre).
3. **Minors Affected (< 18 Years Old)**:
   Under Indian law (POCSO Act, 2012), any non-consensual sexual depiction of a person under 18 constitutes child abuse material. The victim or guardian must report directly to **Childline 1098**, the local police, or the POCSO portal at `cybercrime.gov.in`.
4. **Platform Non-Compliance / Missed 24-Hour Window**:
   If a platform fails to remove non-consensual intimate imagery within 24 hours of receiving your complaint:
   * Use Pratikar's **Follow-Up / Escalation Generator** to serve notice to their Grievance Officer noting forfeiture of safe harbour immunity under Section 79.
   * File an appeal with the **Grievance Appellate Committee (GAC)** at `gac.gov.in`.
   * File a complaint on `cybercrime.gov.in` and consult an advocate for filing a writ petition or magistrate complaint.
