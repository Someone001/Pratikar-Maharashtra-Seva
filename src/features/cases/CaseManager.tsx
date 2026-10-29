import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import { getCases, saveCase, deleteCase } from '../../lib/storage';
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
  Dialog,
  Badge,
} from '../../components';

export interface CaseManagerProps {
  activeCaseId: string | null;
  onSelectCase: (caseRecord: CaseRecord) => void;
}

export const CaseManager: React.FC<CaseManagerProps> = ({
  activeCaseId,
  onSelectCase,
}) => {
  const { t } = useI18n();
  const { activeKey } = useVault();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null);

  // Form State
  const [nickname, setNickname] = useState('');
  const [mode, setMode] = useState<'self' | 'assisted'>('self');
  const [helperName, setHelperName] = useState('');
  const [situation, setSituation] = useState<IncidentSituation[]>(['threatened']);
  const [platforms, setPlatforms] = useState<string[]>(['instagram']);
  const [demandMoney, setDemandMoney] = useState(false);
  const [demandMoreImages, setDemandMoreImages] = useState(false);
  const [demandOther, setDemandOther] = useState(false);
  const [demandNotes, setDemandNotes] = useState('');
  const [offenderKnown, setOffenderKnown] = useState<OffenderRelationship>('unknown');
  const [identifiersText, setIdentifiersText] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [complainantEmail, setComplainantEmail] = useState('');

  const loadCases = useCallback(async () => {
    if (!activeKey) return;
    try {
      const loaded = await getCases(activeKey);
      setCases(loaded);
      if (loaded.length > 0 && !activeCaseId && loaded[0]) {
        onSelectCase(loaded[0]);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  }, [activeKey, activeCaseId, onSelectCase]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const openCreateModal = () => {
    setEditingCase(null);
    setNickname(`Case ${cases.length + 1}`);
    setMode('self');
    setHelperName('');
    setSituation(['threatened']);
    setPlatforms(['instagram']);
    setDemandMoney(false);
    setDemandMoreImages(false);
    setDemandOther(false);
    setDemandNotes('');
    setOffenderKnown('unknown');
    setIdentifiersText('');
    setComplainantName('');
    setComplainantPhone('');
    setComplainantEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: CaseRecord) => {
    setEditingCase(c);
    setNickname(c.nickname);
    setMode(c.mode);
    setHelperName(c.helperName || '');
    setSituation(c.situation);
    setPlatforms(c.platforms);
    setDemandMoney(c.demandsMade.money);
    setDemandMoreImages(c.demandsMade.moreImages);
    setDemandOther(c.demandsMade.other);
    setDemandNotes(c.demandsMade.notes || '');
    setOffenderKnown(c.offenderKnown);
    setIdentifiersText(c.identifiers?.join('\n') || '');
    setComplainantName(c.personalDetails?.name || '');
    setComplainantPhone(c.personalDetails?.phone || '');
    setComplainantEmail(c.personalDetails?.email || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKey) return;

    const identifiers = identifiersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const now = new Date().toISOString();
    const caseRecord: CaseRecord = {
      id: editingCase ? editingCase.id : crypto.randomUUID(),
      nickname: nickname.trim() || `Case ${cases.length + 1}`,
      createdAt: editingCase ? editingCase.createdAt : now,
      updatedAt: now,
      mode,
      helperName: mode === 'assisted' && helperName.trim() ? helperName.trim() : undefined,
      situation,
      platforms,
      demandsMade: {
        money: demandMoney,
        moreImages: demandMoreImages,
        other: demandOther,
        notes: demandNotes.trim() || undefined,
      },
      offenderKnown,
      identifiers: identifiers.length > 0 ? identifiers : undefined,
      personalDetails:
        complainantName || complainantPhone || complainantEmail
          ? {
              name: complainantName.trim() || undefined,
              phone: complainantPhone.trim() || undefined,
              email: complainantEmail.trim() || undefined,
            }
          : undefined,
      status: editingCase ? editingCase.status : 'active',
    };

    await saveCase(caseRecord, activeKey);
    setIsModalOpen(false);
    await loadCases();
    onSelectCase(caseRecord);
  };

  const handleDelete = async (caseId: string) => {
    if (!activeKey) return;
    if (window.confirm('Are you sure you want to delete this case and its associated evidence?')) {
      await deleteCase(caseId, activeKey);
      await loadCases();
    }
  };

  const toggleSituation = (item: IncidentSituation) => {
    setSituation((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item],
    );
  };

  const togglePlatform = (platId: string) => {
    setPlatforms((prev) =>
      prev.includes(platId) ? prev.filter((p) => p !== platId) : [...prev, platId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('cases.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('cases.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<span>+</span>}>
          {t('cases.newCaseBtn')}
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card variant="muted" className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">{t('cases.noCases')}</p>
          <Button onClick={openCreateModal}>{t('cases.newCaseBtn')}</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((c) => {
            const isSelected = c.id === activeCaseId;
            return (
              <Card
                key={c.id}
                className={`transition-all cursor-pointer ${
                  isSelected ? 'border-primary ring-1 ring-primary/40 bg-primary/5' : 'hover:border-border/80'
                }`}
                onClick={() => onSelectCase(c)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">{c.nickname}</CardTitle>
                      <CardDescription className="text-xs">
                        {c.mode === 'self' ? t('cases.modeSelf') : `${t('cases.modeAssisted')} (${c.helperName || 'Helper'})`}
                      </CardDescription>
                    </div>
                    <Badge variant={c.status === 'active' ? 'info' : 'neutral'} size="sm">
                      {c.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {c.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground capitalize"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                    {c.situation.map((s) => (
                      <span key={s} className="rounded bg-surface/50 px-1.5 py-0.5">
                        #{s}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(c);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Case Creation & Edit Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCase ? t('cases.updateCaseBtn') : t('cases.newCaseBtn')}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          <Field
            label={t('cases.nickname')}
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g., Case 1"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t('cases.mode')}
              value={mode}
              onChange={(e) => setMode(e.target.value as 'self' | 'assisted')}
              options={[
                { value: 'self', label: t('cases.modeSelf') },
                { value: 'assisted', label: t('cases.modeAssisted') },
              ]}
            />

            {mode === 'assisted' && (
              <Field
                label={t('cases.helperName')}
                value={helperName}
                onChange={(e) => setHelperName(e.target.value)}
                placeholder="Your name or organization"
              />
            )}
          </div>

          {/* Situation checkboxes */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <span className="block text-sm font-medium text-foreground">
              {t('cases.situationTitle')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'shared', label: t('cases.situationShared') },
                { id: 'threatened', label: t('cases.situationThreatened') },
                { id: 'morphed', label: t('cases.situationMorphed') },
                { id: 'fakeProfile', label: t('cases.situationFakeProfile') },
                { id: 'other', label: t('cases.situationOther') },
              ].map((item) => (
                <Checkbox
                  key={item.id}
                  label={item.label}
                  checked={situation.includes(item.id as IncidentSituation)}
                  onChange={() => toggleSituation(item.id as IncidentSituation)}
                />
              ))}
            </div>
          </div>

          {/* Platforms Involved */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <span className="block text-sm font-medium text-foreground">
              {t('cases.platformsTitle')}
            </span>
            <div className="flex flex-wrap gap-2">
              {platformsData.map((plat) => {
                const isSelected = platforms.includes(plat.id);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => togglePlatform(plat.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground font-semibold'
                        : 'border-border bg-surface text-foreground hover:bg-surface/80'
                    }`}
                  >
                    {plat.displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demands */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <span className="block text-sm font-medium text-foreground">
              {t('cases.demandsTitle')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Checkbox
                label={t('cases.demandMoney')}
                checked={demandMoney}
                onChange={(e) => setDemandMoney(e.target.checked)}
              />
              <Checkbox
                label={t('cases.demandMoreImages')}
                checked={demandMoreImages}
                onChange={(e) => setDemandMoreImages(e.target.checked)}
              />
              <Checkbox
                label={t('cases.demandOther')}
                checked={demandOther}
                onChange={(e) => setDemandOther(e.target.checked)}
              />
            </div>
            {(demandMoney || demandMoreImages || demandOther) && (
              <Field
                label={t('cases.demandNotes')}
                value={demandNotes}
                onChange={(e) => setDemandNotes(e.target.value)}
                placeholder="Brief factual note (e.g. demanded ₹5,000 on UPI)"
              />
            )}
          </div>

          {/* Offender details */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <Select
              label={t('cases.offenderTitle')}
              value={offenderKnown}
              onChange={(e) => setOffenderKnown(e.target.value as OffenderRelationship)}
              options={[
                { value: 'unknown', label: t('cases.offenderUnknown') },
                { value: 'expartner', label: t('cases.offenderExpartner') },
                { value: 'acquaintance', label: t('cases.offenderAcquaintance') },
                { value: 'stranger', label: t('cases.offenderStranger') },
                { value: 'preferNot', label: t('cases.offenderPreferNot') },
              ]}
            />

            <TextArea
              label={t('cases.identifiersTitle')}
              value={identifiersText}
              onChange={(e) => setIdentifiersText(e.target.value)}
              placeholder="@username_on_instagram, +91-9876543210 (one per line)"
              hint={t('cases.identifiersHint')}
              rows={2}
            />
          </div>

          {/* Complainant personal details (Optional) */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <span className="block text-sm font-medium text-foreground">
              {t('cases.personalDetailsTitle')}
            </span>
            <p className="text-xs text-muted-foreground">
              {t('cases.personalDetailsNotice')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Field
                label={t('cases.complainantName')}
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                placeholder="Full Name"
              />
              <Field
                label={t('cases.complainantPhone')}
                value={complainantPhone}
                onChange={(e) => setComplainantPhone(e.target.value)}
                placeholder="+91..."
              />
              <Field
                label={t('cases.complainantEmail')}
                value={complainantEmail}
                onChange={(e) => setComplainantEmail(e.target.value)}
                placeholder="email@domain.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editingCase ? t('cases.updateCaseBtn') : t('cases.saveCaseBtn')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
