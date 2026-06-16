import { chromium } from 'playwright';
import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('.');
const buildRoot = typeof nodeRepl !== 'undefined'
  ? resolve(nodeRepl.tmpDir, 'connoratkins-pdf-build')
  : root;
const tmpDir = resolve(buildRoot, 'tmp/pdfs');
const outputDir = resolve(buildRoot, 'output/pdf');
const sitePdfDir = typeof nodeRepl !== 'undefined'
  ? resolve(buildRoot, 'pdf')
  : resolve(root, 'pdf');
const websiteUrl = 'https://www.connoratkins.art';
const websiteLabel = 'www.connoratkins.art';

const colors = {
  bg: '#07090c',
  surface: '#13161b',
  surface2: '#1b2028',
  text: '#ffffff',
  muted: '#d3d7de',
  subtle: '#96a0ad',
  accent: '#f04b5f',
  accent2: '#5fd6cf',
  accent3: '#f4c85f',
  line: 'rgba(224,232,240,0.14)',
};

const contactLinks = [
  ['Pleasure Island, NC', null],
  ['atkinsconnorr@gmail.com', 'mailto:atkinsconnorr@gmail.com'],
  ['910-612-0538', 'tel:+19106120538'],
  [websiteLabel, websiteUrl],
  ['linkedin.com/in/connorratkins', 'https://www.linkedin.com/in/connorratkins'],
];

function link(label, href) {
  return href ? `<a href="${href}">${label}</a>` : `<span>${label}</span>`;
}

function contactBar() {
  return contactLinks.map(([label, href]) => link(label, href)).join('<span class="sep">|</span>');
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

const sharedCss = `
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 8.5in;
    min-height: 11in;
    background: ${colors.bg};
    color: ${colors.text};
    font-family: Poppins, Inter, Arial, Helvetica, sans-serif;
    line-height: 1.32;
  }
  a { color: inherit; text-decoration: none; }
  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.34in;
    background:
      linear-gradient(140deg, rgba(240, 75, 95, 0.10), transparent 34%),
      linear-gradient(320deg, rgba(95, 214, 207, 0.09), transparent 36%),
      ${colors.bg};
  }
  .header {
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background: linear-gradient(135deg, ${colors.surface2}, ${colors.surface});
    padding: 0.18in 0.22in 0.16in;
    box-shadow: 0 18px 48px rgba(0,0,0,0.3);
  }
  .name-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.18in;
  }
  h1 {
    margin: 0;
    font-size: 27px;
    line-height: 1;
    letter-spacing: 0;
    font-weight: 800;
  }
  .mark {
    color: ${colors.accent3};
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    border: 1px solid ${colors.accent3};
    border-radius: 5px;
    padding: 5px 8px;
    white-space: nowrap;
  }
  .role {
    margin-top: 8px;
    color: ${colors.accent2};
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .contact {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-top: 8px;
    color: ${colors.muted};
    font-size: 8.5px;
  }
  .contact a { color: ${colors.text}; }
  .sep { color: ${colors.accent}; }
  .tagline {
    margin: 0.12in 0 0;
    color: ${colors.muted};
    font-size: 9px;
  }
  .layout {
    display: grid;
    grid-template-columns: 2.08in 1fr;
    gap: 0.16in;
    margin-top: 0.16in;
  }
  .panel, .section {
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background: ${colors.surface};
  }
  .panel {
    padding: 0.14in;
  }
  .section {
    padding: 0.14in 0.16in;
    margin-bottom: 0.12in;
  }
  h2 {
    margin: 0 0 0.08in;
    color: ${colors.accent3};
    font-size: 9.7px;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 0;
  }
  h3 {
    margin: 0;
    color: ${colors.text};
    font-size: 9.4px;
    line-height: 1.2;
  }
  .meta {
    color: ${colors.accent2};
    font-size: 8.2px;
    font-weight: 800;
    margin-top: 2px;
  }
  p {
    margin: 0;
    color: ${colors.muted};
    font-size: 8.8px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    position: relative;
    margin: 0 0 5px;
    padding-left: 11px;
    color: ${colors.muted};
    font-size: 8.15px;
  }
  li::before {
    content: "-";
    position: absolute;
    left: 0;
    color: ${colors.accent3};
    font-weight: 800;
  }
  .panel li { font-size: 7.95px; margin-bottom: 4px; }
  .work-item { margin-bottom: 0.1in; }
  .work-item:last-child, .section:last-child { margin-bottom: 0; }
  .portfolio-line {
    display: grid;
    grid-template-columns: 0.55in 1fr;
    gap: 0.06in;
    margin-bottom: 0.05in;
    font-size: 8.1px;
    color: ${colors.muted};
  }
  .portfolio-line strong { color: ${colors.accent2}; }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 8px;
    font-size: 8.1px;
    color: ${colors.text};
  }
  .links a { color: ${colors.text}; }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.1in;
  }
  .letter-layout {
    display: grid;
    grid-template-columns: 2.15in 1fr;
    gap: 0.16in;
    margin-top: 0.16in;
  }
  .letter-body p {
    font-size: 10.3px;
    line-height: 1.46;
    margin-bottom: 0.14in;
  }
  .address p {
    font-size: 8.5px;
    margin-bottom: 0.04in;
  }
  .subject {
    color: ${colors.accent3};
    font-weight: 800;
  }
`;

function resumeHtml() {
  return `<!doctype html>
  <html>
    <head><meta charset="utf-8"><title>Connor Atkins Resume</title><style>${sharedCss}</style></head>
    <body>
      <main class="page">
        <header class="header">
          <div class="name-row">
            <h1>Connor Atkins</h1>
            <div class="mark">Portfolio 2026</div>
          </div>
          <div class="role">Creative Production | Video Editing | Graphic Design | Brand Development | HVACR Field Experience</div>
          <div class="contact">${contactBar()}</div>
          <p class="tagline">Multidisciplinary creative with 12 years of editing and design practice, formal film/video education, and field-tested reliability.</p>
        </header>
        <div class="layout">
          <aside>
            <section class="panel">
              <h2>Profile Snapshot</h2>
              ${list([
                '12 years self-taught editing and design practice',
                '3 years formal film/video education',
                'Hands-on HVACR field experience',
                'Portfolio across commercial, documentary, branding, student film, sports, and music work',
              ])}
            </section>
            <section class="panel" style="margin-top:0.12in">
              <h2>Core Strengths</h2>
              ${list([
                'Adobe Creative Cloud workflows for video editing, graphic design, layout, branding, and visual development',
                'Short-form pacing, commercial edits, interview/documentary work, student films, sports edits, and music edits',
                'Brand identity support including logo concepts, apparel visuals, business cards, streamer assets, and promos',
                'Practical field discipline from HVACR work: safety awareness, customer awareness, troubleshooting, and follow-through',
                'Strong communication, persistence, adaptability, and a steady improvement mindset',
              ])}
            </section>
            <section class="panel" style="margin-top:0.12in">
              <h2>Tools & Focus</h2>
              ${list([
                'Adobe Creative Cloud',
                'Video editing and post-production',
                'Graphic design and brand development',
                'Production planning and visual storytelling',
                'Web portfolio maintenance',
                'Job-site communication and field problem-solving',
              ])}
            </section>
            <section class="panel" style="margin-top:0.12in">
              <h2>Portfolio Links</h2>
              <div class="links">
                <a href="${websiteUrl}">${websiteLabel}</a>
                <a href="https://www.youtube.com/@CNNREDITS">youtube.com/@CNNREDITS</a>
                <a href="https://www.youtube.com/@C6NNR">youtube.com/@C6NNR</a>
                <a href="https://www.linkedin.com/in/connorratkins">linkedin.com/in/connorratkins</a>
              </div>
            </section>
          </aside>
          <section>
            <div class="section">
              <h2>Professional Summary</h2>
              <p>Multidisciplinary creative with 12 years of self-taught editing and design practice, 3 years of formal film/video education, and hands-on HVACR field experience at Michael and Son Services. Brings production instincts, design taste, practical problem-solving, strong communication, and a persistent improvement mindset to creative, technical, and customer-facing work.</p>
            </div>
            <div class="section">
              <h2>Experience</h2>
              <div class="work-item">
                <h3>Creative Production / Video Editing / Graphic Design</h3>
                <div class="meta">Self-Directed and Freelance Work | 2011 - Present</div>
                ${list([
                  'Built and refined a portfolio spanning portrait reels, school film work, music/sports edits, graphics, branding, and web presentation.',
                  'Edited commercial, interview, documentary, student film, and social content with attention to pacing, story clarity, and clean visual flow.',
                  'Created brand systems and visuals including logos, apparel graphics, business cards, streamer assets, and promotional material.',
                  'Organized creative work for portfolio presentation, connecting video, design, branding, and web/UI skills into a cohesive body of work.',
                  'Used long-term self-directed practice to improve editing judgment, design taste, communication, and delivery under changing expectations.',
                ])}
              </div>
              <div class="work-item">
                <h3>HVACR Installer / Field Work</h3>
                <div class="meta">Michael and Son Services | 2021 - Present</div>
                ${list([
                  'Performed HVACR installer and field work for Michael and Son Services, building hands-on technical confidence in real job-site environments.',
                  'Developed job-site discipline, patience, safety awareness, and calm problem-solving while working in physically demanding conditions.',
                  'Supported installation and field-service tasks with attention to reliability, cleanliness, customer awareness, and professional communication.',
                  'Applied practical troubleshooting habits from trade work to creative production: diagnose the issue, adapt quickly, and finish cleanly.',
                ])}
              </div>
            </div>
            <div class="section">
              <h2>Education</h2>
              <div class="two-col">
                <div>
                  <h3>Cape Fear Community College</h3>
                  <div class="meta">Film and Video Production Technologies</div>
                  <p>Dean's List for most attended terms; completed substantial production coursework with approximately 15 credits remaining.</p>
                </div>
                <div>
                  <h3>Eugene Ashley High School</h3>
                  <div class="meta">Adobe Creative Cloud Program</div>
                  <p>Early foundation in Adobe Creative Cloud, digital design, and video editing.</p>
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Selected Portfolio Areas</h2>
              <div class="portfolio-line"><strong>Video</strong><span>783 Photo to Video Commercial, nonprofit documentary, interview work, student films, sports edits, and music edits</span></div>
              <div class="portfolio-line"><strong>Design</strong><span>2016-2026 graphic archive, brand identities, apparel concepts, 3D/2D experiments, and client-ready visuals</span></div>
              <div class="portfolio-line"><strong>Branding</strong><span>Logo systems, apparel branding, business card concepts, local business visuals, and social identity work</span></div>
            </div>
            <div class="section">
              <h2>Career Focus</h2>
              ${list([
                'Creative production teams needing an editor/designer who can move from concept through execution, revision, and delivery.',
                'Brand, media, and content roles that value visual taste, hands-on grit, field-tested reliability, and continuous improvement.',
              ])}
            </div>
          </section>
        </div>
      </main>
    </body>
  </html>`;
}

function coverLetterHtml() {
  return `<!doctype html>
  <html>
    <head><meta charset="utf-8"><title>Connor Atkins Cover Letter</title><style>${sharedCss}</style></head>
    <body>
      <main class="page">
        <header class="header">
          <div class="name-row">
            <h1>Connor Atkins</h1>
            <div class="mark">Cover Letter</div>
          </div>
          <div class="role">Creative Production | Video Editing | Graphic Design | HVACR Field Experience</div>
          <div class="contact">${contactBar()}</div>
        </header>
        <div class="letter-layout">
          <aside>
            <section class="panel address">
              <h2>Recipient</h2>
              <p>[Month Day, Year]</p>
              <p>[Hiring Manager Name]</p>
              <p>[Company Name]</p>
              <p>[Company Street Address]</p>
              <p>[City, State ZIP]</p>
              <p class="subject">Re: [Job Title / Opportunity]</p>
            </section>
            <section class="panel" style="margin-top:0.12in">
              <h2>Customize</h2>
              ${list([
                'Replace every bracketed field before sending.',
                'Mention one specific project, need, or company value.',
                'Keep the final letter to one page.',
              ])}
            </section>
            <section class="panel" style="margin-top:0.12in">
              <h2>Portfolio</h2>
              <div class="links">
                <a href="${websiteUrl}">${websiteLabel}</a>
                <a href="https://www.youtube.com/@CNNREDITS">youtube.com/@CNNREDITS</a>
                <a href="https://www.youtube.com/@C6NNR">youtube.com/@C6NNR</a>
                <a href="https://www.linkedin.com/in/connorratkins">linkedin.com/in/connorratkins</a>
              </div>
            </section>
          </aside>
          <section class="section letter-body">
            <p>Dear [Hiring Manager Name],</p>
            <p>I am excited to apply for the [Job Title] position with [Company Name]. I bring a multidisciplinary background in creative production, video editing, graphic design, brand development, and hands-on HVACR field experience at Michael and Son Services. That mix has shaped the way I work: creative, practical, steady under pressure, and focused on making the final result clean and useful.</p>
            <p>My portfolio includes commercial edits, documentary and interview work, student films, sports and music edits, brand identity concepts, apparel graphics, business cards, and social-ready visual assets. Through long-term self-directed practice and formal film/video coursework, I have built strong production instincts, Adobe Creative Cloud familiarity, and a habit of improving each project through feedback, revision, and attention to detail.</p>
            <p>My HVACR field experience adds a practical layer to my creative background. Working in real job-site environments strengthened my safety awareness, communication, troubleshooting, reliability, and ability to stay composed in demanding conditions. I believe that combination would help me contribute to [Company Name] with both creative judgment and dependable follow-through.</p>
            <p>I would appreciate the opportunity to discuss how my background, portfolio, and work ethic align with the needs of your team. Thank you for your time and consideration.</p>
            <p>Sincerely,<br>Connor Atkins</p>
          </section>
        </div>
      </main>
    </body>
  </html>`;
}

async function renderDocument(browser, html, htmlPath, pdfPath, screenshotPath) {
  await writeFile(htmlPath, html, 'utf8');
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await page.close();
}

async function firstExistingPath(paths) {
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {
      // Try the next installed browser path.
    }
  }
  return null;
}

await mkdir(tmpDir, { recursive: true });
await mkdir(outputDir, { recursive: true });
await mkdir(sitePdfDir, { recursive: true });

const browserPath = await firstExistingPath([
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]);
const browser = await chromium.launch({
  executablePath: browserPath ?? undefined,
  headless: true,
});
try {
  const resumePdf = resolve(outputDir, 'Connor-Atkins-Resume-2026.pdf');
  const coverPdf = resolve(outputDir, 'Connor-Atkins-Cover-Letter-2026.pdf');
  const resumeHtmlPath = resolve(outputDir, 'Connor-Atkins-Resume-2026.html');
  const coverHtmlPath = resolve(outputDir, 'Connor-Atkins-Cover-Letter-2026.html');
  const resumePreview = resolve(tmpDir, 'resume-preview.png');
  const coverPreview = resolve(tmpDir, 'cover-letter-preview.png');
  await renderDocument(
    browser,
    resumeHtml(),
    resumeHtmlPath,
    resumePdf,
    resumePreview,
  );
  await renderDocument(
    browser,
    coverLetterHtml(),
    coverHtmlPath,
    coverPdf,
    coverPreview,
  );
  await copyFile(resumePdf, resolve(sitePdfDir, '2026 Resume, Connor Atkins.pdf'));
  await copyFile(coverPdf, resolve(sitePdfDir, '2026 Cover Letter, Connor Atkins.pdf'));
  const manifest = {
    buildRoot,
    resumePdf,
    coverPdf,
    resumeHtmlPath,
    coverHtmlPath,
    resumePreview,
    coverPreview,
    siteResumePdf: resolve(sitePdfDir, '2026 Resume, Connor Atkins.pdf'),
    siteCoverPdf: resolve(sitePdfDir, '2026 Cover Letter, Connor Atkins.pdf'),
  };
  await writeFile(resolve(buildRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  if (typeof nodeRepl !== 'undefined') {
    nodeRepl.write(JSON.stringify(manifest, null, 2));
  }
} finally {
  await browser.close();
}
