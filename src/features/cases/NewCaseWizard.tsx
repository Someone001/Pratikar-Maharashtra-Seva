import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import { saveCase, saveLink } from '../../lib/storage';
import { appendEvidenceEntry } from '../../lib/hashchain';
import { parseAndValidateUrlList, type ValidatedUrlResult } from '../../lib/urlValidator';
import type { CaseRecord, IncidentSituation, OffenderRelationship } from '../../types';
import platformsData from '../../data/platforms.json';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Field,
  TextArea,
  Select,
  Checkbox,
  Stepper,
  Banner,
  Dialog,
} from '../../components';

const DRAFT_STORAGE_KEY = 'pratikar_new_case_draft_v1';

export interface NewCaseWizardProps {
  onCaseCreated: (createdCase: CaseRecord) => void;
  onCancel: () => void;
}

export const NewCaseWizard: React.FC<NewCaseWizardProps> = ({ onCaseCreated, onCancel }) => {
  const { language } = useI18n();
  const { activeKey } = useVault();

  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [nickname, setNickname] = useState('Case 1');
  const [mode, setMode] = useState<'self' | 'assisted'>('self');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [helperName, setHelperName] = useState('');

  const [situation, setSituation] = useState<IncidentSituation[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [otherPlatformName, setOtherPlatformName] = useState('');
  const [isVisibleOnline, setIsVisibleOnline] = useState(true);

  const [rawLinksInput, setRawLinksInput] = useState('');
  const [validatedLinks, setValidatedLinks] = useState<ValidatedUrlResult[]>([]);
  const [isLinkHelpOpen, setIsLinkHelpOpen] = useState(false);

  const [demandMoney, setDemandMoney] = useState(false);
  const [demandMoreImages, setDemandMoreImages] = useState(false);
  const [demandOther, setDemandOther] = useState(false);
  const [demandsNotes, setDemandsNotes] = useState('');

  const [offenderKnown, setOffenderKnown] = useState<OffenderRelationship>('unknown');
  const [identifiersText, setIdentifiersText] = useState('');

  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [complainantEmail, setComplainantEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.nickname) setNickname(d.nickname);
        if (d.mode) setMode(d.mode);
        if (d.helperName) setHelperName(d.helperName);
        if (d.situation) setSituation(d.situation);
        if (d.platforms) setPlatforms(d.platforms);
        if (d.rawLinksInput) {
          setRawLinksInput(d.rawLinksInput);
          setValidatedLinks(parseAndValidateUrlList(d.rawLinksInput));
        }
        if (d.demandMoney !== undefined) setDemandMoney(d.demandMoney);
        if (d.demandMoreImages !== undefined) setDemandMoreImages(d.demandMoreImages);
        if (d.demandsNotes) setDemandsNotes(d.demandsNotes);
        if (d.offenderKnown) setOffenderKnown(d.offenderKnown);
        if (d.identifiersText) setIdentifiersText(d.identifiersText);
        if (d.currentStep !== undefined) setCurrentStep(d.currentStep);
      }
    } catch {
      // Ignore corrupted draft
    }
  }, []);

  // Autosave draft on changes
  useEffect(() => {
    try {
      const draft = {
        nickname,
        mode,
        helperName,
        situation,
        platforms,
        rawLinksInput,
        demandMoney,
        demandMoreImages,
        demandsNotes,
        offenderKnown,
        identifiersText,
        currentStep,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore localStorage write error
    }
  }, [
    nickname,
    mode,
    helperName,
    situation,
    platforms,
    rawLinksInput,
    demandMoney,
    demandMoreImages,
    demandsNotes,
    offenderKnown,
    identifiersText,
    currentStep,
  ]);

  const handleLinksChange = (text: string) => {
    setRawLinksInput(text);
    const parsed = parseAndValidateUrlList(text);
    setValidatedLinks(parsed);
  };

  const toggleSituation = (sit: IncidentSituation) => {
    setSituation((prev) => (prev.includes(sit) ? prev.filter((s) => s !== sit) : [...prev, sit]));
  };

  const togglePlatform = (platId: string) => {
    setPlatforms((prev) => (prev.includes(platId) ? prev.filter((p) => p !== platId) : [...prev, platId]));
  };

  const stepsList = [
    { id: 'mode', title: '1. Who is using' },
    { id: 'situation', title: '2. What happened' },
    { id: 'platforms', title: '3. Where' },
    { id: 'links', title: '4. Web Links' },
    { id: 'threats', title: '5. Demands' },
    { id: 'offender', title: '6. Offender' },
    { id: 'personal', title: '7. Details' },
    { id: 'review', title: '8. Review' },
  ];

  const handleNext = () => {
    setError(null);
    if (currentStep === 0 && mode === 'assisted' && !consentAgreed) {
      setError('You must confirm consent from the affected individual to proceed.');
      return;
    }
    if (currentStep === 1 && situation.length === 0) {
      setError('Please select at least one description of what occurred.');
      return;
    }
    if (currentStep < stepsList.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleCreateCase = async () => {
    if (!activeKey) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const allPlatforms = [...platforms];
      if (otherPlatformName.trim()) {
        allPlatforms.push(otherPlatformName.trim());
      }

      const newCase: CaseRecord = {
        id: crypto.randomUUID(),
        nickname: nickname.trim() || 'Case 1',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        mode,
        helperName: mode === 'assisted' ? helperName.trim() : undefined,
        situation,
        platforms: allPlatforms,
        demandsMade: {
          money: demandMoney,
          moreImages: demandMoreImages,
          other: demandOther,
          notes: demandsNotes.trim() || undefined,
        },
        offenderKnown,
        identifiers: identifiersText
          .split(/[\r\n,]+/)
          .map((id) => id.trim())
          .filter(Boolean),
        personalDetails:
          complainantName || complainantPhone || complainantEmail
            ? {
                name: complainantName.trim() || undefined,
                phone: complainantPhone.trim() || undefined,
                email: complainantEmail.trim() || undefined,
              }
            : undefined,
        status: 'active',
      };

      // 1. Save Case record
      await saveCase(newCase, activeKey);

      // 2. Save Validated Links
      for (const link of validatedLinks) {
        if (link.isValid) {
          await saveLink(
            {
              id: crypto.randomUUID(),
              caseId: newCase.id,
              url: link.normalized,
              platform: platforms[0] || 'Web',
              firstSeenAt: now.toISOString(),
              status: isVisibleOnline ? 'visible' : 'unknown',
            },
            activeKey,
          );
        }
      }

      // 3. Log initial evidence hash-chain entry
      await appendEvidenceEntry(
        newCase.id,
        'note',
        {
          note: `Incident case created: ${newCase.nickname}. Situation: ${situation.join(', ')}.`,
        },
        activeKey,
      );

      // Clear draft on successful creation
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      onCaseCreated(newCase);
    } catch (err) {
      console.error('Failed to create case:', err);
      setError('An error occurred while saving the case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          New Incident Intake Wizard
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground pt-1">
          Step-by-step documentation. Progress is automatically autosaved on this device.
        </p>
      </div>

      <Stepper
        steps={stepsList}
        activeStep={currentStep}
        onSelectStep={(idx) => setCurrentStep(idx)}
      />

      <Card className="border-border shadow-md">
        {/* STEP 1: Who is using this */}
        {currentStep === 0 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">1. Who is using this application?</CardTitle>
              <CardDescription>
                Tell us whether you are documenting your own situation or assisting someone else.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Case Nickname (Neutral Label)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., Case 1"
                hint="Use a neutral name. Avoid identifying names if others may see your screen."
              />

              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reporting Role:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('self')}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      mode === 'self'
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                        : 'border-border bg-surface text-foreground hover:bg-surface/80'
                    }`}
                  >
                    <div className="font-bold text-sm">👤 I am the affected person</div>
                    <p className="text-xs text-muted-foreground pt-1 font-normal">
                      Documenting my own incident for 24-hour takedown and evidence preservation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('assisted')}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      mode === 'assisted'
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                        : 'border-border bg-surface text-foreground hover:bg-surface/80'
                    }`}
                  >
                    <div className="font-bold text-sm">🤝 I am helping someone else</div>
                    <p className="text-xs text-muted-foreground pt-1 font-normal">
                      Friend, family member, volunteer, or advocate filing on their behalf.
                    </p>
                  </button>
                </div>
              </div>

              {mode === 'assisted' && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <Field
                    label="Helper Name or Organization (Optional)"
                    value={helperName}
                    onChange={(e) => setHelperName(e.target.value)}
                    placeholder="e.g., Friend / Student Volunteer"
                  />

                  <Checkbox
                    label="Consent Confirmation: The affected person has agreed I can record and organize this for them."
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                  />
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* STEP 2: What Happened */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">2. What happened?</CardTitle>
              <CardDescription>
                Select all statements that apply to this incident in plain words.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'shared' as IncidentSituation, label: 'Private images or videos were posted or shared without consent' },
                { id: 'threatened' as IncidentSituation, label: 'Someone is threatening to share private images (sextortion / blackmail)' },
                { id: 'morphed' as IncidentSituation, label: 'Fake, edited, or AI-generated deepfake images of me were created or shared' },
                { id: 'fakeProfile' as IncidentSituation, label: 'A fake profile is impersonating me using my name, photos, or details' },
                { id: 'other' as IncidentSituation, label: 'Other online harassment or abuse' },
              ].map((item) => (
                <label
                  key={item.id}
                  htmlFor={`situation-${item.id}`}
                  className={`rounded-xl border p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                    situation.includes(item.id)
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-surface text-foreground hover:bg-surface/80'
                  }`}
                >
                  <input
                    id={`situation-${item.id}`}
                    type="checkbox"
                    checked={situation.includes(item.id)}
                    onChange={() => toggleSituation(item.id)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </CardContent>
          </>
        )}

        {/* STEP 3: Where */}
        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">3. Where is the content appearing?</CardTitle>
              <CardDescription>
                Select the platforms involved. Indian law requires all intermediaries to remove non-consensual imagery within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {platformsData.map((plat) => {
                  const isChecked = platforms.includes(plat.id);
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => togglePlatform(plat.id)}
                      className={`rounded-lg border p-2.5 text-xs text-left font-medium transition-all ${
                        isChecked
                          ? 'border-primary bg-primary text-primary-foreground font-semibold'
                          : 'border-border bg-surface text-foreground hover:bg-surface/80'
                      }`}
                    >
                      {plat.displayName}
                    </button>
                  );
                })}
              </div>

              <Field
                label="Other Platform Name (if not listed above)"
                value={otherPlatformName}
                onChange={(e) => setOtherPlatformName(e.target.value)}
                placeholder="e.g., Specific website or discussion forum"
              />

              <div className="pt-2">
                <Checkbox
                  label="Is this content or profile actively visible online right now?"
                  checked={isVisibleOnline}
                  onChange={(e) => setIsVisibleOnline(e.target.checked)}
                />
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 4: Links */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-bold">4. Web Links (URLs)</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLinkHelpOpen(true)}
                  className="text-xs text-primary"
                >
                  🔍 How to find links
                </Button>
              </div>
              <CardDescription>
                Paste the exact links to the posts, profiles, or channels. Paste multiple links one per line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextArea
                label="Links (one per line)"
                value={rawLinksInput}
                onChange={(e) => handleLinksChange(e.target.value)}
                rows={4}
                placeholder="https://instagram.com/p/example-post&#10;https://facebook.com/example-profile"
                hint="Links are validated in memory. Cyrillic/Greek look-alike domain checks are performed."
              />

              {/* Parsed & Validated Links Preview */}
              {validatedLinks.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Validated Links ({validatedLinks.length}):
                  </span>
                  <div className="space-y-1.5">
                    {validatedLinks.map((v, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-2.5 text-xs border ${
                          v.isValid
                            ? v.isLookalike
                              ? 'border-warning/50 bg-warning-surface/20 text-warning'
                              : 'border-border bg-surface text-foreground'
                            : 'border-danger/50 bg-danger/10 text-danger'
                        }`}
                      >
                        <div className="font-mono break-all">{v.normalized || v.raw}</div>
                        {v.lookalikeWarning && (
                          <p className="text-[11px] font-semibold text-warning pt-1">
                            ⚠️ {v.lookalikeWarning}
                          </p>
                        )}
                        {!v.isValid && (
                          <p className="text-[11px] text-danger pt-1">{v.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* STEP 5: Threats or Demands */}
        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">5. Demands and Blackmail Threats</CardTitle>
              <CardDescription>
                Document what demands were made. Official authorities advise never paying extortionists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Banner variant="warning" title="Immediate Advisory: Do Not Pay or Negotiate">
                Cybercrime authorities strongly advise against paying extortion demands or sending additional photos. Paying rarely stops threats and usually leads to escalating demands. Do not delete threatening messages; they serve as critical statutory evidence.
              </Banner>

              <div className="space-y-2 pt-1">
                <Checkbox
                  label="Offender demanded money, ransom, or cryptocurrency"
                  checked={demandMoney}
                  onChange={(e) => setDemandMoney(e.target.checked)}
                />
                <Checkbox
                  label="Offender demanded more intimate photos or video calls"
                  checked={demandMoreImages}
                  onChange={(e) => setDemandMoreImages(e.target.checked)}
                />
                <Checkbox
                  label="Other coercion or conditional demands were made"
                  checked={demandOther}
                  onChange={(e) => setDemandOther(e.target.checked)}
                />
              </div>

              <TextArea
                label="Factual Notes on Demands"
                value={demandsNotes}
                onChange={(e) => setDemandsNotes(e.target.value)}
                rows={3}
                placeholder="e.g., Demanded payment by 6 PM today via UPI or threatened to send pictures to contacts."
                hint="Security notice: Do NOT enter full bank account, credit card, or Aadhaar numbers."
              />
            </CardContent>
          </>
        )}

        {/* STEP 6: Offender Information */}
        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">6. Do you know who is doing this?</CardTitle>
              <CardDescription>
                Record any factual handles or numbers without attempting to contact or confront the person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Relationship to Offender"
                value={offenderKnown}
                onChange={(e) => setOffenderKnown(e.target.value as OffenderRelationship)}
                options={[
                  { value: 'unknown', label: 'Unknown / Anonymous' },
                  { value: 'expartner', label: 'Ex-partner / Ex-spouse' },
                  { value: 'acquaintance', label: 'Acquaintance / Colleague / Peer' },
                  { value: 'stranger', label: 'Complete Stranger' },
                  { value: 'preferNot', label: 'Prefer not to say' },
                ]}
              />

              <TextArea
                label="Known Handles, Usernames, or Phone Numbers"
                value={identifiersText}
                onChange={(e) => setIdentifiersText(e.target.value)}
                rows={3}
                placeholder="@username&#10;+91 98765 43210&#10;telegram_handle"
                hint="Enter one handle or number per line. Do not contact or warn the offender."
              />
            </CardContent>
          </>
        )}

        {/* STEP 7: Optional Personal Details */}
        {currentStep === 6 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">7. Complainant Contact Details (Optional)</CardTitle>
              <CardDescription>
                Leaving these blank is completely fine. If entered, they are only stored inside your local encrypted vault to prefill formal complaints and can be redacted when printing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field
                label="Full Name (Optional)"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                placeholder="Leave blank for anonymous preparation"
              />
              <Field
                label="Contact Phone Number (Optional)"
                type="tel"
                value={complainantPhone}
                onChange={(e) => setComplainantPhone(e.target.value)}
                placeholder="+91..."
              />
              <Field
                label="Contact Email Address (Optional)"
                type="email"
                value={complainantEmail}
                onChange={(e) => setComplainantEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </CardContent>
          </>
        )}

        {/* STEP 8: Review & Generate Action Plan */}
        {currentStep === 7 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg font-bold">8. Review and Generate Action Plan</CardTitle>
              <CardDescription>
                Review your documented details. Creating this case will generate a personalized 8-step statutory redress action plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Case Nickname:</span>{' '}
                  <strong className="text-foreground">{nickname}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Reporting Mode:</span>{' '}
                  <strong className="text-foreground">{mode === 'assisted' ? `Helper (${helperName || 'Volunteer'})` : 'Self'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Situations:</span>{' '}
                  <strong className="text-foreground">{situation.join(', ')}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Platforms:</span>{' '}
                  <strong className="text-foreground">{[...platforms, otherPlatformName].filter(Boolean).join(', ')}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Validated Links Count:</span>{' '}
                  <strong className="text-foreground">{validatedLinks.filter((l) => l.isValid).length}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Demands:</span>{' '}
                  <strong className="text-foreground">
                    {[demandMoney && 'Money', demandMoreImages && 'More Images', demandOther && 'Other'].filter(Boolean).join(', ') || 'None specified'}
                  </strong>
                </div>
              </div>

              <Banner variant="info" title="Cryptographic Integrity">
                Creating this case will encrypt all entered records using your local PBKDF2/AES-GCM key and initialize an immutable SHA-256 evidence hash chain.
              </Banner>
            </CardContent>
          </>
        )}

        {error && (
          <div className="px-6 pb-2 text-xs text-danger font-medium" role="alert">
            {error}
          </div>
        )}

        <CardFooter className="flex justify-between border-t border-border/40 pt-4">
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={() => setCurrentStep((prev) => prev - 1)}>
              ← Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {currentStep < stepsList.length - 1 ? (
            <Button onClick={handleNext}>Next Step →</Button>
          ) : (
            <Button size="lg" isLoading={isSubmitting} onClick={handleCreateCase}>
              Create Case & Open Action Plan ✓
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Guide: How to Find Links Modal */}
      <Dialog
        isOpen={isLinkHelpOpen}
        onClose={() => setIsLinkHelpOpen(false)}
        title="How to Find Links on Common Platforms"
        description="Tips to copy clean web URLs for your takedown notice"
        maxWidth="md"
        footer={<Button onClick={() => setIsLinkHelpOpen(false)}>Done</Button>}
      >
        <div className="space-y-3 text-xs">
          {platformsData.map((plat) => (
            <div key={plat.id} className="rounded-lg bg-surface p-2.5 border border-border">
              <strong className="text-foreground block mb-0.5">{plat.displayName}</strong>
              <p className="text-muted-foreground">
                {plat.howToFindLink[language] || plat.howToFindLink.en}
              </p>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};
