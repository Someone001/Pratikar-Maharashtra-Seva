import React from 'react';
import { useI18n } from '../../lib/i18n';
import channelsData from '../../data/channels.json';
import rulesData from '../../data/rules.json';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Banner } from '../../components';

export const HelplinesView: React.FC = () => {
  const { t, language } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('helplines.title')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('helplines.subtitle')}</p>
      </div>

      <Banner variant="info" title="Official Standards & Verification">
        {t('helplines.verifiedNotice')}
      </Banner>

      {/* Statutory Escalation Ladder */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>🪜</span>
          <span>{t('helplines.escalationTitle')}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rulesData.escalationLadder.map((step) => (
            <Card key={step.level} className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    L{step.level}
                  </span>
                  <Badge variant="info" size="sm">
                    {step.timeframeHours}h Window
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold pt-2">
                  {step.name[language] || step.name.en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.action[language] || step.action.en}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* National Helplines Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>📞</span>
          <span>National Emergency &amp; Support Channels</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channelsData.map((channel) => (
            <Card key={channel.id} className="border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold">
                    {channel.name[language] || channel.name.en}
                  </CardTitle>
                  <Badge variant={channel.verified ? 'verified' : 'unverified'} size="sm">
                    {channel.verified ? t('common.verified') : t('common.unverified')}
                  </Badge>
                </div>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  {channel.description[language] || channel.description.en}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  {channel.number && (
                    <a
                      href={`tel:${channel.number}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <span>📞</span>
                      <span>Call {channel.number}</span>
                    </a>
                  )}

                  {channel.url && (
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-accent hover:bg-surface/80 transition-colors"
                    >
                      <span>🌐</span>
                      <span>{t('helplines.openPortal')} ↗</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Governing Legal Provisions & SOP */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>⚖️</span>
          <span>{t('helplines.ruleCitation')}</span>
        </h3>

        <div className="space-y-3">
          {rulesData.legalReferences.map((ref) => (
            <Card key={ref.id} variant="muted">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold">
                      {ref.title[language] || ref.title.en}
                    </CardTitle>
                    <p className="text-xs font-mono text-primary font-semibold mt-0.5">
                      {ref.citation}
                    </p>
                  </div>
                  <Badge variant={ref.verified ? 'verified' : 'unverified'} size="sm">
                    Verified: {ref.lastVerified}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>{ref.summary[language] || ref.summary.en}</p>
                {ref.sourceUrl && (
                  <a
                    href={ref.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-accent underline font-mono text-[11px]"
                  >
                    View Official Gazette / MeitY Notification ↗
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
