import { ProfileData } from './schema';

export const renderProfile = (data: Partial<ProfileData>) => {
    const {
        fullName = "Your Name",
        tagline = "Professional Tagline",
        aboutMe = "Tell us about yourself...",
        profilePhoto = "https://cdn.mygrid.club/media/eemf6Wctnw89SoWZ1716925946.jpg",
        topHighlights = [],
        professionalTitle = "",
        expertiseAreas = [],
        socialLinks = {},
        brands = [],
        positions = [],
        education = [],
        skills = [],
        impactHeadline = "Impact Created",
        impactStory = "Describe your impact here...",
        awards = [],
        contact = { emailPrimary: "email@example.com", phonePrimary: "+91 00000 00000", website: "www.yoursite.com" }
    } = data;

    return `
<div class="page" id="page1">
    <div class="page-1-content">
        <div class="header-container">
            <div class="profile-photo">
                <img src="${profilePhoto}" alt="${fullName}" onerror="this.src='https://cdn.mygrid.club/media/eemf6Wctnw89SoWZ1716925946.jpg'">
            </div>

            <div class="profile-details">
                <h1 class="name">${fullName}</h1>
                <div class="title">${professionalTitle || tagline}</div>

                <ul class="stats-list">
                    ${topHighlights.length > 0
            ? topHighlights.map(h => `<li>${h}</li>`).join('')
            : '<li>Founder & Tech Generalist</li><li>Helping businesses adopt AI</li><li>Content Creator (50k+)</li>'}
                </ul>

                <div class="social-links">
                    ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" class="social-icon"><i class="fa-brands fa-linkedin"></i></a>` : ''}
                    ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" class="social-icon"><i class="fa-brands fa-instagram"></i></a>` : ''}
                    ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" class="social-icon"><i class="fa-brands fa-x-twitter"></i></a>` : ''}
                    ${socialLinks.website || socialLinks.companyWebsite ? `<a href="${socialLinks.website || socialLinks.companyWebsite}" class="website">${(socialLinks.website || socialLinks.companyWebsite).replace(/^https?:\/\//, '')}</a>` : ''}
                </div>
            </div>
        </div>

        <div class="prompt-box">
            <div class="prompt-text">
                ${aboutMe}
            </div>
        </div>

        <div class="roles-section">
            <div class="section-title">KEY ROLES AND EXPERTISE</div>
            <div class="roles-grid">
                ${expertiseAreas.length > 0
            ? expertiseAreas.map(exp => `
                    <div class="role-card">
                        <div class="role-icon"><i class="fa-solid fa-check-circle"></i></div>
                        <div class="role-title">${exp}</div>
                    </div>
                    `).join('')
            : skills.slice(0, 3).map(skill => `
                    <div class="role-card">
                        <div class="role-icon"><i class="fa-solid fa-check-circle"></i></div>
                        <div class="role-title">${skill}</div>
                    </div>
                    `).join('')}
            </div>
        </div>

        <div class="brands-section">
            <div class="brands-title">EXPERIENCE & BRANDS</div>
            <div class="brands-logos">
                ${positions.length > 0
            ? positions.slice(0, 4).map(p => `
                        <div class="logo-placeholder" style="flex-direction: column; height: auto; text-align: center; border: 1px solid #ddd; padding: 5px; border-radius: 8px;">
                            <span style="font-size: 10px; opacity: 0.8; display: block;">${p.company}</span>
                            <span style="font-weight: bold; font-size: 12px; display: block;">${p.title}</span>
                        </div>
                    `).join('')
            : brands.map(b => `<div class="logo-placeholder">${b.name}</div>`).join('')}
                ${positions.length === 0 && brands.length === 0 ? '<div class="logo-placeholder">Brand A</div><div class="logo-placeholder">Brand B</div>' : ''}
            </div>
        </div>
    </div>
</div>

<!-- PAGE 2 -->
<div class="page" id="page2">
    <div class="page-2-content">
        ${education.length > 0 ? `
        <div class="section-box" style="background-color: #f0f7ff; border: 1px solid #cce4ff;">
            <div class="section-header" style="color: #0056b3;">EDUCATION</div>
            <ul class="stats-list" style="margin-top: 10px; list-style: none; padding: 0;">
                ${education.map(e => `
                    <li style="margin-bottom: 15px; display: flex; align-items: start; gap: 10px;">
                        <i class="fa-solid fa-graduation-cap" style="color: #0056b3; margin-top: 4px;"></i>
                        <div>
                            <span style="font-weight: bold; display: block;">${e.schoolName}</span>
                            <span style="font-size: 12px; opacity: 0.8; display: block;">${e.degreeName}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''} ${e.duration ? `(${e.duration})` : ''}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        ${skills.length > 0 ? `
        <div class="section-box" style="background-color: #f7f7f7; border: 1px solid #ddd;">
            <div class="section-header" style="color: #333;">SKILLS & COMPETENCIES</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                ${skills.slice(0, 15).map(skill => `
                    <span style="background: #eee; padding: 4px 10px; border-radius: 12px; font-size: 11px;">${skill}</span>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section-box impact-section">
            <div class="section-header impact-header">IMPACT AND OUTREACH</div>
            
            <div class="impact-text-wrapper">
                <h3 class="highlight-blue">${impactHeadline}</h3>
                <p>${impactStory}</p>
            </div>
        </div>

        <div class="section-box awards-section">
            <div class="section-header awards-header">AWARDS AND RECOGNITION</div>

            <ul class="awards-list">
                ${awards.map(a => `<li><span class="bold-green">${a.title} (${a.year}):</span> By ${a.organization}</li>`).join('')}
                ${awards.length === 0 ? '<li>No awards listed yet.</li>' : ''}
            </ul>

            <div class="award-badge-icon">
                <i class="fa-solid fa-award"></i>
            </div>
        </div>

        <div class="section-box contact-section">
            <div class="contact-grid">
                <div class="contact-item">
                    <i class="fa-solid fa-mobile-screen contact-icon"></i>
                    <div class="contact-text">${contact.phonePrimary || 'N/A'}</div>
                </div>
                <div class="contact-item">
                    <i class="fa-regular fa-envelope contact-icon"></i>
                    <div class="contact-text">${contact.emailPrimary || 'N/A'}</div>
                </div>
                <div class="contact-item">
                    <i class="fa-solid fa-globe contact-icon"></i>
                    <div class="contact-text">${socialLinks.website || socialLinks.linkedin || 'N/A'}</div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
};
