import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import channelsData from '../../data/channels.json';
import rulesData from '../../data/rules.json';
import platformsData from '../../data/platforms.json';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Banner,
  Accordion,
  CopyButton,
  SafeExternalLink,
} from '../../components';

export const HelplinesView: React.FC = () => {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = channelsData.filter((channel) => {
    const name = (channel.name[language] || channel.name.en).toLowerCase();
    const desc = (channel.description[language] || channel.description.en).toLowerCase();
    const num = channel.number ? channel.number.toLowerCase() : '';
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q) || desc.includes(q) || num.includes(q);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">{t('helplines.title')}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground pt-1">{t('helplines.subtitle')}</p>
      </div>

      <Banner variant="info" title="Official Standards & Verification">
        {t('helplines.verifiedNotice')}
      </Banner>

      {/* 4 Short Explainers (Section 8.10) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <span>💡</span>
          <span>Essential Knowledge &amp; Guidance</span>
        </h2>

        <div className="space-y-2">
          <Accordion
            title="What is sextortion and digital blackmail?"
            defaultOpen={false}
          >
            <div className="space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p>
                <strong>Sextortion</strong> occurs when someone threatens to distribute private, nude, or intimate images or videos of you (whether real, edited, or artificially generated with AI) unless you pay money, provide more intimate media, or submit to sexual favors.
              </p>
              <p>
                <strong>Key Safety Advice:</strong> Do NOT pay. Paying rarely stops extortion; it usually causes perpetrators to demand even more money. Do not delete chats, voice notes, or transaction histories, as they serve as vital legal evidence for law enforcement.
              </p>
            </div>
          </Accordion>

          <Accordion
            title="What does India's 24-hour takedown rule mean?"
            defaultOpen={false}
          >
            <div className="space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p>
                Under <strong>Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, all online intermediaries (social media platforms, messaging apps, and hosting services operating in India) are legally mandated to remove or disable access to reported non-consensual sexual, intimate, or morphed/deepfake content <strong>within 24 hours</strong> of receiving a complaint.
              </p>
              <p>
                If a platform fails to take down the material within 24 hours, it may lose its statutory safe-harbor immunity under Section 79 of the IT Act, making it liable for continuing to publish unlawful content.
              </p>
            </div>
          </Accordion>

          <Accordion
            title="How to find a link to the content on each platform"
            defaultOpen={false}
          >
            <div className="space-y-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p className="text-muted-foreground">
                Takedown complaints require exact web URLs (not just usernames) so grievance officers can immediately locate and disable the offending post:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {platformsData.map((plat) => (
                  <div key={plat.id} className="rounded-lg bg-surface/50 p-2.5 border border-border">
                    <strong className="text-foreground block text-xs">{plat.displayName}:</strong>
                    <span className="text-[11px] text-muted-foreground">
                      {plat.howToFindLink[language] || plat.howToFindLink.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Accordion>

          <Accordion
            title="How to talk to someone you trust"
            defaultOpen={false}
          >
            <div className="space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p>
                Experiencing digital blackmail or intimate imagery abuse is deeply distressing and isolating. Remember: <strong>you are the victim of a crime, and you are not to blame</strong>.
              </p>
              <p>
                Consider confiding in a trusted friend, family member, college counselor, or support helpline. Having someone sit with you while you document links or contact the 1930 helpline can significantly reduce anxiety. You can also use Pratikar&apos;s &quot;Helping someone&quot; mode to let an advocate handle filing on your behalf.
              </p>
            </div>
          </Accordion>
        </div>
      </div>

      {/* Statutory Escalation Ladder */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <span>🪜</span>
          <span>{t('helplines.escalationTitle')}</span>
        </h2>

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

      {/* Searchable National Helplines Grid (Section 8.10) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>📞</span>
            <span>National Emergency &amp; Support Channels</span>
          </h2>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search helplines by name or number..."
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredChannels.map((channel) => (
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
                <div className="flex flex-wrap items-center gap-2.5">
                  {channel.number && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${channel.number}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span>📞</span>
                        <span>Call {channel.number}</span>
                      </a>
                      <CopyButton text={channel.number} label="Copy" />
                    </div>
                  )}

                  {channel.url && (
                    <SafeExternalLink
                      href={channel.url}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-accent hover:bg-surface/80 transition-colors border border-border"
                    >
                      <span>🌐</span>
                      <span>{t('helplines.openPortal')} ↗</span>
                    </SafeExternalLink>
                  )}
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground">
                  Last verified: {channel.lastVerified}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
