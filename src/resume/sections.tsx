import type { ReactNode } from 'react';
import { Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import type { Entry, EntriesSection, Profile, ReferencesSection, Section, SkillsSection } from '../model/types';
import { sliceSection } from '../model/defaults';

// Section renderers. Markup is plain and semantic so the exported HTML and
// PDF stay readable by applicant tracking systems; all looks live in resume.css.

const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);

function Heading({ section, continued }: { section: Section; continued: boolean }) {
  if (!section.showTitle || !section.title.trim()) return null;
  return (
    <h2 className="rg-heading">
      <span>{section.title}</span>
      {continued && <span className="rg-continued"> (continued)</span>}
    </h2>
  );
}

const stripUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
const href = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

function profileLink(kind: 'linkedin' | 'github', value: string): { text: string; url: string } {
  const v = value.trim();
  if (/^(https?:\/\/)?(www\.)?(linkedin|github)\.com\//i.test(v)) {
    return { text: stripUrl(v), url: href(v) };
  }
  // A bare handle.
  const url = kind === 'linkedin' ? `https://linkedin.com/in/${v}` : `https://github.com/${v}`;
  return { text: stripUrl(url), url };
}

interface ContactItem {
  key: string;
  icon: ReactNode;
  text: string;
  url?: string;
}

function contactItems(p: Profile): ContactItem[] {
  const items: ContactItem[] = [];
  const iconProps = { size: '1em', strokeWidth: 2, 'aria-hidden': true } as const;
  if (p.email.trim()) items.push({ key: 'email', icon: <Mail {...iconProps} />, text: p.email.trim(), url: `mailto:${p.email.trim()}` });
  if (p.phone.trim()) items.push({ key: 'phone', icon: <Phone {...iconProps} />, text: p.phone.trim(), url: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (p.website.trim()) items.push({ key: 'website', icon: <Globe {...iconProps} />, text: stripUrl(p.website.trim()), url: href(p.website.trim()) });
  if (p.linkedin.trim()) items.push({ key: 'linkedin', icon: <Linkedin {...iconProps} />, ...profileLink('linkedin', p.linkedin) });
  if (p.github.trim()) items.push({ key: 'github', icon: <Github {...iconProps} />, ...profileLink('github', p.github) });
  if (p.location.trim()) items.push({ key: 'location', icon: <MapPin {...iconProps} />, text: p.location.trim() });
  return items;
}

function Bullets({ items }: { items: string[] }) {
  const list = clean(items);
  if (!list.length) return null;
  return (
    <ul className="rg-bullets">
      {list.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

function Tags({ items }: { items: string[] }) {
  const list = clean(items);
  if (!list.length) return null;
  return (
    <ul className="rg-tags">
      {list.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

/** Paragraphs separated by blank lines; a paragraph of "- " or "• " lines becomes a list. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim());
        if (lines.every((l) => /^[-•*]\s+/.test(l))) {
          return <Bullets key={i} items={lines.map((l) => l.replace(/^[-•*]\s+/, ''))} />;
        }
        return (
          <p key={i} className="rg-paragraph">
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {l}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

function EntryTitle({ entry }: { entry: Entry }) {
  if (!entry.title.trim()) return null;
  return (
    <h3 className="rg-entry-title">
      {entry.url.trim() ? <a href={href(entry.url.trim())}>{entry.title}</a> : entry.title}
    </h3>
  );
}

function EntryBody({ entry }: { entry: Entry }) {
  return (
    <>
      {entry.note.trim() && <div className="rg-entry-note">{entry.note}</div>}
      {entry.description.trim() && <p className="rg-entry-desc">{entry.description}</p>}
      <Bullets items={entry.bullets} />
      <Tags items={entry.tags} />
    </>
  );
}

function EntryView({ entry, variant }: { entry: Entry; variant: string }) {
  const sub = entry.subtitle.trim();
  const loc = entry.location.trim();
  const dates = entry.dates.trim();

  if (variant === 'compact') {
    return (
      <div className="rg-entry" data-item>
        <div className="rg-entry-row">
          <div className="rg-entry-line">
            <EntryTitle entry={entry} />
            {sub && <span className="rg-entry-org">{sub}</span>}
            {loc && <span className="rg-entry-loc">{loc}</span>}
          </div>
          {dates && <span className="rg-entry-dates">{dates}</span>}
        </div>
        <EntryBody entry={entry} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className="rg-entry" data-item>
        <EntryTitle entry={entry} />
        {sub && <div className="rg-entry-org">{sub}</div>}
        {(dates || loc) && <div className="rg-entry-meta">{[dates, loc].filter(Boolean).join(' · ')}</div>}
        <EntryBody entry={entry} />
      </div>
    );
  }

  // standard and timeline share markup; timeline differs only in CSS.
  return (
    <div className="rg-entry" data-item>
      <div className="rg-entry-row">
        <EntryTitle entry={entry} />
        {dates && <span className="rg-entry-dates">{dates}</span>}
      </div>
      {(sub || loc) && (
        <div className="rg-entry-row rg-entry-subrow">
          {sub && <span className="rg-entry-org">{sub}</span>}
          {loc && <span className="rg-entry-loc">{loc}</span>}
        </div>
      )}
      <EntryBody entry={entry} />
    </div>
  );
}

function Entries({ section }: { section: EntriesSection }) {
  return (
    <div className="rg-entries">
      {section.items.map((e) => (
        <EntryView key={e.id} entry={e} variant={section.variant} />
      ))}
    </div>
  );
}

function Skills({ section }: { section: SkillsSection }) {
  const groups = section.groups.filter((g) => g.name.trim() || clean(g.skills).length);
  if (section.variant === 'lines' || section.variant === 'grid') {
    return (
      <div className="rg-skill-groups">
        {groups.map((g) => (
          <p key={g.id} className="rg-skill-line" data-item>
            {g.name.trim() && <strong className="rg-skill-name">{g.name}</strong>}
            <span className="rg-skill-list">{clean(g.skills).join(', ')}</span>
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="rg-skill-groups">
      {groups.map((g) => (
        <div key={g.id} className="rg-skill-group" data-item>
          {g.name.trim() && <h3 className="rg-skill-name">{g.name}</h3>}
          <Tags items={g.skills} />
        </div>
      ))}
    </div>
  );
}

function References({ section }: { section: ReferencesSection }) {
  if (!section.items.length) {
    return section.emptyText.trim() ? <p className="rg-paragraph rg-muted">{section.emptyText}</p> : null;
  }
  return (
    <div className="rg-reference-list">
      {section.items.map((r) => (
        <div key={r.id} className="rg-reference" data-item>
          {r.name.trim() && <h3 className="rg-entry-title">{r.name}</h3>}
          {(r.role || r.organization) && (
            <div className="rg-entry-org">{[r.role, r.organization].map((s) => s.trim()).filter(Boolean).join(', ')}</div>
          )}
          {(r.email || r.phone) && (
            <div className="rg-entry-meta">{[r.email, r.phone].map((s) => s.trim()).filter(Boolean).join(' · ')}</div>
          )}
          {r.note.trim() && <div className="rg-entry-note">{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function SectionBody({ section, profile }: { section: Section; profile: Profile }) {
  switch (section.type) {
    case 'header':
      return (
        <>
          <h1 className="rg-name">{profile.name || 'Your Name'}</h1>
          {profile.headline.trim() && <p className="rg-headline">{profile.headline}</p>}
        </>
      );
    case 'contact':
      return (
        <ul className="rg-contact-list">
          {contactItems(profile).map((c) => (
            <li key={c.key} className={`rg-contact-${c.key}`}>
              <span className="rg-icon">{c.icon}</span>
              {c.url ? <a href={c.url}>{c.text}</a> : <span>{c.text}</span>}
            </li>
          ))}
        </ul>
      );
    case 'text':
      return <RichText text={section.body} />;
    case 'experience':
    case 'education':
      return <Entries section={section} />;
    case 'skills':
      return <Skills section={section} />;
    case 'list': {
      const items = clean(section.items);
      if (section.variant === 'inline') return <p className="rg-paragraph rg-inline-list">{items.join('  ·  ')}</p>;
      return (
        <ul className={section.variant === 'plain' ? 'rg-plain-list' : 'rg-bullets'}>
          {items.map((t, i) => (
            <li key={i} data-item>
              {t}
            </li>
          ))}
        </ul>
      );
    }
    case 'references':
      return <References section={section} />;
    case 'spacer':
      return null;
  }
}

export function SectionView({
  section,
  profile,
  placementId,
  from,
  to,
}: {
  section: Section;
  profile: Profile;
  placementId?: string;
  from?: number;
  to?: number;
}) {
  const shown = from || to !== undefined ? sliceSection(section, from, to) : section;
  const Tag = section.type === 'header' ? 'header' : 'section';
  return (
    <Tag
      className={`rg-section rg-${section.type} rg-${section.type}--${section.variant}`}
      data-section-id={section.id}
      data-placement-id={placementId}
      style={section.type === 'spacer' ? { height: `${section.height}cm` } : undefined}
    >
      <Heading section={section} continued={!!from && from > 0} />
      <SectionBody section={shown} profile={profile} />
    </Tag>
  );
}
