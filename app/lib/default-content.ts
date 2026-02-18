import { ProfileData } from './schema';

// ─── Security Utilities ───────────────────────────────────────────────────────

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Must be applied to ALL user-supplied strings before HTML interpolation.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes a URL to only allow safe protocols.
 * Blocks javascript:, data:, vbscript: and other dangerous URI schemes.
 */
function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Allow our own proxy URLs (relative)
  if (trimmed.startsWith('/api/')) {
    return escapeHtml(trimmed);
  }
  // Only allow http://, https://, protocol-relative //, and data:image/
  if (/^https?:\/\//i.test(trimmed) || /^\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  // Allow bare domains
  if (/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return escapeHtml('https://' + trimmed);
  }
  return ''; // Return empty string instead of '#' to avoid broken images
}

/**
 * Wraps LinkedIn CDN URLs through our server-side proxy to avoid 403 hotlinking errors.
 * Non-LinkedIn URLs are returned as-is.
 */
function proxyLinkedInUrl(url: string): string {
  if (!url) return url;
  // Already proxied
  if (url.startsWith('/api/proxy-image')) return url;
  // Only proxy LinkedIn CDN URLs
  if (url.includes('media.licdn.com') || url.includes('static.licdn.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// ─── Icon Maps ────────────────────────────────────────────────────────────────

// Map expertise areas to relevant Font Awesome icons
const expertiseIconMap: Record<string, string> = {
  'digital marketing': 'fa-solid fa-bullhorn',
  'marketing': 'fa-solid fa-bullhorn',
  'branding': 'fa-solid fa-chart-line',
  'consulting': 'fa-solid fa-chart-line',
  'branding & consulting': 'fa-solid fa-chart-line',
  'strategy': 'fa-solid fa-share-nodes',
  'gtm': 'fa-solid fa-share-nodes',
  'go-to-market': 'fa-solid fa-share-nodes',
  'technology': 'fa-solid fa-microchip',
  'ai': 'fa-solid fa-brain',
  'artificial intelligence': 'fa-solid fa-brain',
  'machine learning': 'fa-solid fa-brain',
  'data': 'fa-solid fa-database',
  'analytics': 'fa-solid fa-chart-bar',
  'finance': 'fa-solid fa-coins',
  'accounting': 'fa-solid fa-calculator',
  'leadership': 'fa-solid fa-people-group',
  'management': 'fa-solid fa-sitemap',
  'sales': 'fa-solid fa-handshake',
  'design': 'fa-solid fa-palette',
  'engineering': 'fa-solid fa-gear',
  'education': 'fa-solid fa-graduation-cap',
  'training': 'fa-solid fa-chalkboard-user',
  'public speaking': 'fa-solid fa-microphone',
  'speaking': 'fa-solid fa-microphone',
  'healthcare': 'fa-solid fa-heart-pulse',
  'legal': 'fa-solid fa-scale-balanced',
  'hr': 'fa-solid fa-users',
  'human resources': 'fa-solid fa-users',
  'operations': 'fa-solid fa-gears',
  'product': 'fa-solid fa-box',
  'startup': 'fa-solid fa-rocket',
  'entrepreneurship': 'fa-solid fa-rocket',
  'content': 'fa-solid fa-pen-nib',
  'writing': 'fa-solid fa-pen-nib',
  'social media': 'fa-solid fa-hashtag',
  'cloud': 'fa-solid fa-cloud',
  'cybersecurity': 'fa-solid fa-shield-halved',
  'sustainability': 'fa-solid fa-leaf',
  'research': 'fa-solid fa-microscope',
  'photography': 'fa-solid fa-camera',
  'video': 'fa-solid fa-video',
  'music': 'fa-solid fa-music',
  'real estate': 'fa-solid fa-building',
  'architecture': 'fa-solid fa-drafting-compass',
  'supply chain': 'fa-solid fa-truck',
  'logistics': 'fa-solid fa-truck',
  'automation': 'fa-solid fa-robot',
};

function getIconForExpertise(area: string): string {
  const lower = area.toLowerCase().trim();
  // Try exact match first
  if (expertiseIconMap[lower]) return expertiseIconMap[lower];
  // Try partial match
  for (const [key, icon] of Object.entries(expertiseIconMap)) {
    if (lower.includes(key) || key.includes(lower)) return icon;
  }
  // Default icon
  return 'fa-solid fa-check-circle';
}

// Map impact items to relevant icons
const impactIconMap: Record<string, string> = {
  'speak': 'fa-solid fa-chalkboard-user',
  'train': 'fa-solid fa-chalkboard-user',
  'teach': 'fa-solid fa-chalkboard-user',
  'mentor': 'fa-solid fa-chalkboard-user',
  'travel': 'fa-solid fa-people-group',
  'awareness': 'fa-solid fa-people-group',
  'community': 'fa-solid fa-people-group',
  'reach': 'fa-solid fa-people-group',
  'digital': 'fa-solid fa-bullhorn',
  'market': 'fa-solid fa-bullhorn',
  'grow': 'fa-solid fa-chart-line',
  'revenue': 'fa-solid fa-chart-line',
  'client': 'fa-solid fa-handshake',
  'partner': 'fa-solid fa-handshake',
  'build': 'fa-solid fa-hammer',
  'creat': 'fa-solid fa-lightbulb',
  'innovat': 'fa-solid fa-lightbulb',
  'launch': 'fa-solid fa-rocket',
  'fund': 'fa-solid fa-coins',
  'invest': 'fa-solid fa-coins',
  'automat': 'fa-solid fa-robot',
  'ai': 'fa-solid fa-brain',
  'lead': 'fa-solid fa-flag',
  'award': 'fa-solid fa-trophy',
  'publish': 'fa-solid fa-newspaper',
  'research': 'fa-solid fa-microscope',
};

function getIconForImpact(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, icon] of Object.entries(impactIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return 'fa-solid fa-star';
}

// ─── Profile Renderer ─────────────────────────────────────────────────────────

export const renderProfile = (data: Partial<ProfileData>) => {
  const {
    fullName = "Your Name",
    tagline = "Professional Tagline",
    aboutMe = "Tell us about yourself...",
    profilePhoto = "https://cdn.mygrid.club/media/eemf6Wctnw89SoWZ1716925946.jpg",
    topHighlights = [],
    personalStory30 = "",
    professionalTitle = "",
    expertiseAreas = [],
    expertiseDescriptions = [],
    certifications = [],
    socialLinks = {},
    brands = [],
    positions = [],
    education = [],
    skills = [],
    impactHeadline = "",
    impactStory = "",
    professionSpecificImpact = {},
    awards = [],
    mediaFeatures = [],
    contact = { emailPrimary: '', phonePrimary: '' },
    superpower = "",
    knownFor = "",
    speakingTopics = [],
    testimonials = [],
    personalTouch,
  } = data;

  // ── Escape all user-supplied text ──
  const eName = escapeHtml(fullName);
  const eTagline = escapeHtml(tagline);
  const eAboutMe = escapeHtml(aboutMe);
  const eTitle = escapeHtml(professionalTitle);
  const eStory = escapeHtml(personalStory30);
  const sPhoto = sanitizeUrl(proxyLinkedInUrl(profilePhoto));
  const eImpactHeadline = escapeHtml(impactHeadline);
  const eSuperpower = escapeHtml(superpower);
  const eKnownFor = escapeHtml(knownFor);

  // Build impact items as structured entries (icon + text pairs)
  const impactItems: { icon: string; html: string }[] = [];

  // Parse impact story into separate items if it contains line breaks or bullet points
  if (impactStory) {
    const lines = impactStory
      .split(/[\n•·\-]/)
      .map(l => l.trim())
      .filter(l => l.length > 10);

    if (lines.length > 1) {
      lines.forEach(line => {
        impactItems.push({
          icon: getIconForImpact(line),
          html: escapeHtml(line),
        });
      });
    } else {
      impactItems.push({
        icon: getIconForImpact(impactStory),
        html: eImpactHeadline
          ? `<span class="highlight-blue">${eImpactHeadline}:</span> ${escapeHtml(impactStory)}`
          : escapeHtml(impactStory),
      });
    }
  } else if (impactHeadline) {
    impactItems.push({
      icon: 'fa-solid fa-star',
      html: `<span class="highlight-blue">${eImpactHeadline}</span>`,
    });
  }

  // Add profession-specific impact entries
  if (professionSpecificImpact && typeof professionSpecificImpact === 'object') {
    Object.entries(professionSpecificImpact).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        impactItems.push({
          icon: getIconForImpact(key + ' ' + value),
          html: `<span class="highlight-blue">${escapeHtml(key)}:</span> ${escapeHtml(value)}`,
        });
      }
    });
  }

  const hasImpact = impactItems.length > 0;
  const hasAwards = awards && awards.length > 0;
  const hasMediaFeatures = mediaFeatures && mediaFeatures.length > 0;
  const hasSpeakingTopics = speakingTopics && speakingTopics.length > 0;
  const hasTestimonials = testimonials && testimonials.length > 0;
  const hasCertifications = certifications && certifications.length > 0;
  const hasEducation = education && education.length > 0;
  const hasSkills = skills && skills.length > 0;
  const hasPersonalTouch = personalTouch && (personalTouch.funFact || personalTouch.motto || (personalTouch.hobbies && personalTouch.hobbies.length > 0));

  // Build expertise role cards
  const roleCards = expertiseAreas.length > 0
    ? expertiseAreas.slice(0, 3).map((area, idx) => {
      const icon = getIconForExpertise(area);
      const desc = expertiseDescriptions?.[idx] || '';
      return `
        <div class="role-card">
          <div class="role-icon"><i class="${icon}"></i></div>
          <div class="role-title">${escapeHtml(area)}</div>
          ${desc ? `<div class="role-desc">${escapeHtml(desc)}</div>` : ''}
        </div>`;
    }).join('')
    : skills.length > 0
      ? skills.slice(0, 3).map(skill => `
        <div class="role-card">
          <div class="role-icon"><i class="${getIconForExpertise(skill)}"></i></div>
          <div class="role-title">${escapeHtml(skill)}</div>
        </div>`).join('')
      : `<div class="role-card">
          <div class="role-icon"><i class="fa-solid fa-check-circle"></i></div>
          <div class="role-title">Your expertise will appear here</div>
        </div>`;

  // Build brands section with logos
  const brandEntries = positions.length > 0
    ? positions.slice(0, 4)
    : brands.length > 0
      ? brands.slice(0, 4).map(b => ({ company: b.name || '', title: b.role || '', logo: b.logo, duration: b.duration }))
      : [];

  const brandsHtml = brandEntries.length > 0
    ? brandEntries.map(b => {
      const companyName = ((b as { company?: string }).company || '').trim();
      const safeName = escapeHtml(companyName);
      if (b.logo) {
        const safeLogo = sanitizeUrl(proxyLinkedInUrl(b.logo));
        return `<div class="logo-placeholder" style="padding:0;overflow:hidden;background:#fff;border:1px solid #eee;border-radius:8px;">
          <img src="${safeLogo}" alt="${safeName}" style="height:45px;max-width:110px;object-fit:contain;" onerror="this.style.display='none';this.parentElement.textContent='${safeName}'" />
        </div>`;
      }
      const displayName = companyName.length > 15 ? escapeHtml(companyName.slice(0, 14)) + '…' : safeName;
      return `<div class="logo-placeholder" style="background:#fff;border:1px solid #eee;border-radius:8px;font-size:12px;">${displayName}</div>`;
    }).join('')
    : '<div class="logo-placeholder" style="opacity:0.4;font-size:12px;">Your brands will appear here</div>';

  // Build summary blurb from profile data
  const summaryParts: string[] = [];
  if (superpower) summaryParts.push(`Superpower: ${eSuperpower}.`);
  if (knownFor) summaryParts.push(`Known for: ${eKnownFor}.`);
  if (expertiseAreas.length > 0) {
    summaryParts.push(`With core expertise in ${expertiseAreas.map(e => escapeHtml(e)).join(', ')}, ${fullName !== 'Your Name' ? escapeHtml(fullName.split(' ')[0]) : 'this professional'} continues to make an impact in their industry.`);
  }
  if (personalTouch?.motto) summaryParts.push(`"${escapeHtml(personalTouch.motto)}"`);
  const summaryText = summaryParts.join(' ');

  // ── Social link helpers (sanitized) ──
  const sLinkedin = sanitizeUrl(socialLinks.linkedin || '');
  const sInstagram = sanitizeUrl(socialLinks.instagram || '');
  const sFacebook = sanitizeUrl(socialLinks.facebook || '');
  const sTwitter = sanitizeUrl(socialLinks.twitter || '');
  const sYoutube = sanitizeUrl(socialLinks.youtube || '');
  const sWebsite = sanitizeUrl(socialLinks.website || '');
  const sCompanyWebsite = sanitizeUrl(socialLinks.companyWebsite || '');

  return `
<div class="content-wrapper">
  <div class="header-container no-break">
    <div class="profile-photo">
      <img src="${sPhoto}" alt="${eName}" onerror="this.src='https://cdn.mygrid.club/media/eemf6Wctnw89SoWZ1716925946.jpg'">
    </div>

    <div class="profile-details">
      <h1 class="name">${eName}</h1>
      <div class="title">${eTitle || eTagline}</div>

      <ul class="stats-list">
        ${topHighlights.length > 0
      ? topHighlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')
      : '<li>Your key highlights will appear here</li>'}
      </ul>

      <div class="social-links">
        ${sLinkedin ? `<a href="${sLinkedin}" class="social-icon" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-linkedin"></i></a>` : ''}
        ${sInstagram ? `<a href="${sInstagram}" class="social-icon" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i></a>` : ''}
        ${sFacebook ? `<a href="${sFacebook}" class="social-icon" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-facebook"></i></a>` : ''}
        ${sTwitter ? `<a href="${sTwitter}" class="social-icon" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-x-twitter"></i></a>` : ''}
        ${sYoutube ? `<a href="${sYoutube}" class="social-icon" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-youtube"></i></a>` : ''}
        ${sWebsite || sCompanyWebsite
      ? (() => {
        const rawUrl = (socialLinks.website || socialLinks.companyWebsite) ?? '';
        const displayUrl = rawUrl.replace(/^https?:\/\//, '');
        const truncated = displayUrl.length > 30 ? displayUrl.slice(0, 27) + '...' : displayUrl;
        return `<a href="${sWebsite || sCompanyWebsite}" class="website" target="_blank" rel="noopener noreferrer">${escapeHtml(truncated)}</a>`;
      })()
      : ''}
      </div>
    </div>
  </div>

  <div class="story-section-container">
    ${eStory ? `
    <div class="prompt-box no-break" style="background-color: #FFF8E1; border-color: #FFD54F; flex-grow: 0; padding: 16px 20px; margin-top: 20px;">
      <div style="color: #F57F17; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">✨ Personal Story</div>
      <div style="color: #5D4037; font-size: 15px; font-weight: 500; font-style: italic; line-height: 1.5;">"${eStory}"</div>
    </div>
    ` : ''}

    <div class="prompt-box no-break" style="margin-top: 20px;">
      <div class="prompt-text">${eAboutMe}</div>
    </div>
  </div>

  <div class="roles-section no-break" style="margin-top: 20px;">
    <div class="section-title">KEY ROLES AND EXPERTISE</div>
    <div class="roles-grid">${roleCards}</div>
  </div>

  <div class="brands-section no-break" style="margin-top: 20px;">
    <div class="brands-title">BRANDS WORKED</div>
    <div class="brands-logos">${brandsHtml}</div>
  </div>

  <div class="pdf-page-break"></div>

  ${hasImpact ? `
  <div class="section-box impact-section no-break" style="margin-top: 20px;">
    <div class="section-header impact-header">IMPACT AND OUTREACH</div>
    ${impactItems.slice(0, 5).map(item => `
      <div class="impact-item">
        <div class="impact-icon"><i class="${item.icon}"></i></div>
        <div class="impact-text">${item.html}</div>
      </div>
    `).join('')}
  </div>
  ` : `
  <div class="section-box impact-section no-break" style="margin-top: 20px;">
    <div class="section-header impact-header">IMPACT AND OUTREACH</div>
    <div class="impact-item">
      <div class="impact-icon"><i class="fa-solid fa-star"></i></div>
      <div class="impact-text" style="opacity:0.4;">Your impact story will appear here as you share it with the AI.</div>
    </div>
  </div>
  `}

  ${hasAwards ? `
  <div class="section-box awards-section no-break" style="margin-top: 20px;">
    <div class="section-header awards-header">AWARDS AND RECOGNITION</div>
    <ul class="awards-list">
      ${awards.slice(0, 5).map(a => `<li><span class="bold-green">${escapeHtml(a.title || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}:</span> ${a.organization ? `By ${escapeHtml(a.organization)}` : ''}</li>`).join('')}
    </ul>
    ${hasMediaFeatures ? `
    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #DCE775;">
      <div style="font-size: 11px; font-weight: 700; color: #2E5848; text-transform: uppercase; margin-bottom: 6px;">Media Features</div>
      ${mediaFeatures.map(m => `
        <div style="font-size: 12px; margin-bottom: 4px;">
          ${m.url ? `<a href="${sanitizeUrl(m.url)}" style="color: #2E86C1; text-decoration: none;" target="_blank" rel="noopener noreferrer">${escapeHtml(m.name || '')} ↗</a>` : escapeHtml(m.name || '')}
        </div>
      `).join('')}
    </div>
    ` : ''}
    <div class="award-badge-icon"><i class="fa-solid fa-award"></i></div>
  </div>
  ` : `
  <div class="section-box awards-section no-break" style="margin-top: 20px;">
    <div class="section-header awards-header">AWARDS AND RECOGNITION</div>
    <ul class="awards-list">
      <li style="opacity:0.4;">No awards listed yet.</li>
    </ul>
    <div class="award-badge-icon"><i class="fa-solid fa-award"></i></div>
  </div>
  `}

  ${hasSpeakingTopics ? `
  <div class="section-box keynote-section no-break" style="margin-top: 20px;">
    <div class="section-header keynote-header">KEYNOTE SPEAKER / SESSIONS</div>
    <div class="logos-grid">
      ${speakingTopics.slice(0, 4).map(t => `
        <div class="logo-placeholder" style="flex-direction:column;height:auto;">
          <div style="font-weight:700;font-size:13px;color:#A84418;">${escapeHtml(t.title || '')}</div>
          ${t.description ? `<div style="font-size:10px;color:#888;margin-top:2px;">${escapeHtml(t.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${hasTestimonials ? `
  <div class="section-box no-break" style="background-color: #F3E5F5; border: 1px solid #CE93D8; padding: 20px; margin-top: 20px;">
    <div class="section-header" style="color: #6A1B9A;">TESTIMONIALS</div>
    ${testimonials.map(t => `
      <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 8px;">
        <div style="font-style: italic; font-size: 13px; color: #4A148C; line-height: 1.5;">"${escapeHtml(t.quote || '')}"</div>
        <div style="font-size: 11px; color: #7B1FA2; margin-top: 6px; font-weight: 600;">— ${escapeHtml(t.personName || '')}${t.designation ? `, ${escapeHtml(t.designation)}` : ''}${t.company ? ` at ${escapeHtml(t.company)}` : ''}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${hasEducation ? `
  <div class="section-box education-section no-break" style="background-color: #f0f7ff; border: 1px solid #cce4ff; padding: 20px; margin-top: 20px;">
    <div class="section-header" style="color: #0056b3;">EDUCATION</div>
    <ul class="stats-list" style="margin-top: 10px; list-style: none; padding: 0;">
      ${education.map(e => `
        <li style="margin-bottom: 10px; display: flex; align-items: start; gap: 10px;">
          <i class="fa-solid fa-graduation-cap" style="color: #0056b3; margin-top: 4px;"></i>
          <div>
            <span style="font-weight: bold; display: block;">${escapeHtml(e.schoolName || '')}</span>
            <span style="font-size: 12px; opacity: 0.8; display: block;">${escapeHtml(e.degreeName || '')}${e.fieldOfStudy ? ` in ${escapeHtml(e.fieldOfStudy)}` : ''} ${e.duration ? `(${escapeHtml(e.duration)})` : ''}</span>
          </div>
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${hasCertifications ? `
  <div class="section-box certifications-section no-break" style="background-color: #E8F5E9; border: 1px solid #A5D6A7; padding: 20px; margin-top: 20px;">
    <div class="section-header" style="color: #2E7D32;">CERTIFICATIONS</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${certifications.map(cert => `
        <span style="background: #C8E6C9; padding: 5px 12px; border-radius: 12px; font-size: 12px; color: #1B5E20; font-weight: 500;">
          <i class="fa-solid fa-certificate" style="margin-right: 4px;"></i>${escapeHtml(cert)}
        </span>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${hasSkills ? `
  <div class="section-box skills-section no-break" style="background-color: #f7f7f7; border: 1px solid #ddd; padding: 20px; margin-top: 20px;">
    <div class="section-header" style="color: #333;">SKILLS &amp; COMPETENCIES</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${skills.slice(0, 15).map(skill => `
        <span style="background: #eee; padding: 4px 10px; border-radius: 12px; font-size: 11px;">${escapeHtml(skill)}</span>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${hasPersonalTouch ? `
  <div class="section-box no-break" style="background-color: #E0F7FA; border: 1px solid #80DEEA; padding: 20px; margin-top: 20px;">
    <div class="section-header" style="color: #00695C;">PERSONAL TOUCH</div>
    ${personalTouch?.motto ? `<div style="font-style:italic; font-size:14px; color:#004D40; text-align:center; margin-bottom:8px;">"${escapeHtml(personalTouch.motto)}"</div>` : ''}
    ${personalTouch?.funFact ? `<div style="font-size:12px; color:#00695C; margin-bottom:4px;">🎯 Fun Fact: ${escapeHtml(personalTouch.funFact)}</div>` : ''}
    ${personalTouch?.hobbies && personalTouch.hobbies.length > 0 ? `
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
        ${personalTouch.hobbies.map(h => `<span style="background:#B2EBF2; padding:3px 10px; border-radius:10px; font-size:11px; color:#004D40;">${escapeHtml(h)}</span>`).join('')}
      </div>
    ` : ''}
  </div>
  ` : ''}

  ${summaryText ? `
  <div class="section-box summary-section no-break" style="margin-top: 20px;">
    ${summaryText}
  </div>
  ` : ''}

  <div class="section-box contact-section no-break" style="margin-top: 20px;">
    <div class="contact-grid">
      <div class="contact-item">
        <i class="fa-solid fa-mobile-screen contact-icon"></i>
        <div class="contact-text">${escapeHtml(contact.phonePrimary || 'N/A')}</div>
      </div>
      <div class="contact-item">
        <i class="fa-regular fa-envelope contact-icon"></i>
        <div class="contact-text">${escapeHtml(contact.emailPrimary || 'N/A')}</div>
      </div>
      <div class="contact-item">
        <i class="fa-solid fa-globe contact-icon"></i>
        <div class="contact-text">${escapeHtml(socialLinks.website || socialLinks.linkedin || 'N/A')}</div>
      </div>
    </div>
  </div>
</div>
`.trim();
};
