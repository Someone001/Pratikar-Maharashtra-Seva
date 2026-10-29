export type Language = 'en' | 'hi' | 'mr';
export type TextSize = 'normal' | 'large' | 'xlarge';

export interface LocalizedString {
  en: string;
  hi: string;
  mr: string;
}

export interface KdfParams {
  name: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string; // Base64 encoded salt
}

export interface EncryptedPayload {
  iv: string; // Base64 encoded 12-byte IV
  ciphertext: string; // Base64 encoded ciphertext
}

export interface Vault {
  version: number;
  kdf: KdfParams;
  verifier: EncryptedPayload;
  createdAt: string; // ISO 8601 UTC
}

export interface PlaintextSettings {
  language: Language;
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
  camouflageMode: boolean;
  autoLockMinutes: number; // 1, 5, 15, or -1 (never)
  quickExitUrl?: string; // default https://www.google.com
  devanagariNumerals?: boolean;
}

export type IncidentSituation =
  | 'shared'
  | 'threatened'
  | 'morphed'
  | 'fakeProfile'
  | 'other';

export type OffenderRelationship =
  | 'unknown'
  | 'expartner'
  | 'acquaintance'
  | 'stranger'
  | 'preferNot';

export interface CaseDemands {
  money: boolean;
  moreImages: boolean;
  other: boolean;
  notes?: string;
}

export interface ComplainantDetails {
  name?: string;
  phone?: string;
  email?: string;
}

export type CaseStatus = 'active' | 'resolved' | 'archived';

export interface CaseRecord {
  id: string; // UUID v4
  nickname: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
  mode: 'self' | 'assisted';
  helperName?: string;
  situation: IncidentSituation[];
  platforms: string[];
  demandsMade: CaseDemands;
  offenderKnown: OffenderRelationship;
  identifiers?: string[];
  personalDetails?: ComplainantDetails;
  status: CaseStatus;
}

export type LinkStatus = 'visible' | 'removed' | 'unknown';

export interface LinkRecord {
  id: string;
  caseId: string;
  url: string;
  platform: string;
  firstSeenAt: string;
  notes?: string;
  status: LinkStatus;
}

export type ReportChannel =
  | 'platform'
  | 'followup'
  | 'escalation'
  | 'ncrp'
  | 'police';

export type ReportOutcome =
  | 'pending'
  | 'acknowledged'
  | 'removed'
  | 'partial'
  | 'rejected'
  | 'noResponse';

export interface ReportRecord {
  id: string;
  caseId: string;
  platform: string;
  channel: ReportChannel;
  submittedAt: string;
  referenceNumber?: string;
  linkIds: string[];
  dueAt: string; // Statutory 24-hour deadline
  outcome: ReportOutcome;
  outcomeAt?: string;
  notes?: string;
}

export type EvidenceType =
  | 'note'
  | 'link_seen'
  | 'threat_received'
  | 'report_submitted'
  | 'platform_reply'
  | 'file_hash'
  | 'outcome';

export interface EvidenceEntry {
  id: string;
  caseId: string;
  seq: number;
  createdAt: string; // ISO UTC
  tzOffsetMinutes: number;
  type: EvidenceType;
  fields: Record<string, unknown>;
  prevHash: string; // SHA-256 hex or "0" * 64 for genesis
  hash: string; // SHA-256 hex
}

export type AuditAction = 'unlock' | 'lock' | 'export' | 'import' | 'wipe';

export interface AuditEvent {
  id: string;
  type: AuditAction;
  timestamp: string; // ISO UTC
}

