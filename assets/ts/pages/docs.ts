// =============================================================================
// assets/ts/pages/docs.ts — Site de documentation : recherche dans le sommaire,
// sommaire de page (« Sur cette page ») avec suivi du défilement, ancres de titres
// =============================================================================

import { slugify } from 'core-ts';

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

// -----------------------------------------------------------------------------
// 1. Sommaire de la documentation : filtre, raccourci, page courante visible
// -----------------------------------------------------------------------------
const initSidebar = (): void => {
  const nav = document.querySelector<HTMLElement>('[data-docs-nav]');
  const input = document.querySelector<HTMLInputElement>('[data-docs-search]');
  if (!nav || !input) return;

  const sections = Array.from(nav.querySelectorAll<HTMLElement>('.sidebar-section'));
  const empty = nav.querySelector<HTMLElement>('[data-docs-search-empty]');

  const visibleLinks = (): HTMLAnchorElement[] =>
    Array.from(nav.querySelectorAll<HTMLAnchorElement>('.sidebar-link:not([hidden])'));

  input.addEventListener('input', () => {
    const query = normalize(input.value.trim());

    sections.forEach((section) => {
      const title = section.querySelector('.sidebar-section-title')?.textContent ?? '';
      const titleMatches = normalize(title).includes(query);
      const links = section.querySelectorAll<HTMLElement>('.sidebar-link');

      links.forEach((link) => {
        link.hidden = !titleMatches && !normalize(link.textContent ?? '').includes(query);
      });
      section.hidden = Array.from(links).every((link) => link.hidden);
    });

    if (empty) empty.hidden = visibleLinks().length > 0;
  });

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const first = visibleLinks()[0];
    if (first) window.location.assign(first.href);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      // Tiroir fermé sur mobile : on l'ouvre d'abord pour pouvoir donner le focus
      if (input.offsetParent === null) {
        document.querySelector<HTMLElement>('[data-ds-toggle="sidebar"]')?.click();
      }
      input.focus();
      input.select();
    }

    if (event.key === 'Escape') {
      document
        .querySelector<HTMLElement>('.docs-sidebar.is-open [data-ds-dismiss="sidebar"]')
        ?.click();
    }
  });

  // Page courante visible dans le sommaire (sans faire défiler la page)
  const current = nav.querySelector<HTMLElement>('.sidebar-link.active');
  if (current) {
    nav.scrollTop = current.offsetTop - nav.offsetTop - nav.clientHeight / 2;
  }
};

// -----------------------------------------------------------------------------
// 2. Sommaire de page et ancres de titres
// -----------------------------------------------------------------------------

// Titres de premier niveau des pages en sections ; les pages plus anciennes,
// sans .docs-section, n'ont que des h5 dans leurs blocs
const findHeadings = (content: HTMLElement): HTMLElement[] => {
  const headings = content.querySelectorAll<HTMLElement>(
    '.docs-section > h2, .docs-section > h3',
  );
  return Array.from(
    headings.length > 0 ? headings : content.querySelectorAll<HTMLElement>('.component-demo h5'),
  );
};

// L'id de la section sert d'ancre à son titre principal
const headingAnchor = (heading: HTMLElement, usedIds: Set<string>): string => {
  const section = heading.parentElement;
  if (heading.tagName === 'H2' && section?.id) return section.id;

  const base = slugify(heading.textContent ?? '') || 'section';
  let id = base;
  for (let suffix = 2; usedIds.has(id) || document.getElementById(id); suffix += 1) {
    id = `${base}-${suffix}`;
  }
  heading.id = id;
  return id;
};

const addHeadingLink = (heading: HTMLElement, id: string): void => {
  const link = document.createElement('a');
  link.className = 'docs-anchor';
  link.href = `#${id}`;
  link.textContent = '#';
  link.setAttribute('aria-label', `Lien vers « ${heading.textContent ?? ''} »`);
  heading.append(' ', link);
};

const initToc = (): void => {
  const toc = document.querySelector<HTMLElement>('[data-docs-toc]');
  const list = toc?.querySelector<HTMLElement>('[data-docs-toc-list]');
  const content = document.querySelector<HTMLElement>('[data-docs-content]');
  if (!toc || !list || !content) return;

  const headings = findHeadings(content);
  if (headings.length === 0) return;

  const usedIds = new Set<string>();
  const entries = headings.map((heading) => {
    const id = headingAnchor(heading, usedIds);
    usedIds.add(id);

    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = heading.textContent;
    link.className = 'docs-toc-link';
    if (heading.tagName === 'H3') link.classList.add('docs-toc-sublink');

    const item = document.createElement('li');
    item.append(link);
    list.append(item);

    addHeadingLink(heading, id);
    return { heading, link };
  });

  toc.hidden = false;

  // Suivi du défilement : le dernier titre passé sous la barre du haut est actif
  const offset = parseFloat(getComputedStyle(headings[0]).scrollMarginBlockStart) + 1;
  let frame = 0;
  const updateActive = (): void => {
    frame = 0;
    let active = entries[0];
    entries.forEach((entry) => {
      if (entry.heading.getBoundingClientRect().top <= offset) active = entry;
    });
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
    if (atBottom && document.documentElement.scrollHeight > window.innerHeight) {
      active = entries[entries.length - 1];
    }

    entries.forEach(({ link }) => {
      const isActive = link === active.link;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    },
    { passive: true },
  );
  updateActive();
};

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initToc();
});
