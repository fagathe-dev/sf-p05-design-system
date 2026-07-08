import { $ } from 'core-ts';
import { openDialog, closeDialog, DialogToggle } from '../components/modal';

export const closeAllDropdowns = (): void => {
  (
    $(
      '[data-ds-toggle="dropdown"][aria-expanded="true"]',
      true,
    ) as NodeListOf<HTMLElement>
  )?.forEach((toggle) => {
    toggle.setAttribute('aria-expanded', 'false');
    const menu = toggle.nextElementSibling;
    if (menu?.classList.contains('dropdown-menu'))
      menu.classList.remove('show');
  });
};

const handleDropdown = (trigger: HTMLElement): void => {
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  const menu = trigger.nextElementSibling;

  closeAllDropdowns();

  if (!isExpanded && menu?.classList.contains('dropdown-menu')) {
    trigger.setAttribute('aria-expanded', 'true');
    menu.classList.add('show');
  }
};

// --- LOGIQUE COLLAPSE ---
const slideUp = (element: HTMLElement): void => {
  element.style.height = `${element.scrollHeight}px`;
  element.classList.remove('show');
  element.classList.add('collapsing');

  element.offsetHeight; // Force reflow
  element.style.height = '0px';

  element.addEventListener(
    'transitionend',
    function handler() {
      element.classList.remove('collapsing');
      element.style.height = '';
      element.removeEventListener('transitionend', handler);
    },
    { once: true },
  );
};

const slideDown = (element: HTMLElement): void => {
  element.classList.add('collapsing');
  element.style.height = '0px';

  element.offsetHeight; // Force reflow
  element.style.height = `${element.scrollHeight}px`;

  element.addEventListener(
    'transitionend',
    function handler() {
      element.classList.remove('collapsing');
      element.classList.add('show');
      element.style.height = '';
      element.removeEventListener('transitionend', handler);
    },
    { once: true },
  );
};

const handleCollapse = (trigger: HTMLElement): void => {
  const targetSelector = trigger.getAttribute('data-ds-target');
  const target = targetSelector
    ? document.querySelector<HTMLElement>(targetSelector)
    : null;
  if (!target) return;

  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  const isAccordion = trigger.closest('.accordion');

  if (isAccordion && !isExpanded) {
    const activeTriggers = isAccordion.querySelectorAll<HTMLElement>(
      '[aria-expanded="true"]',
    );
    activeTriggers.forEach((activeTrigger) => {
      const activeTargetSel = activeTrigger.getAttribute('data-ds-target');
      const activeTarget = activeTargetSel
        ? document.querySelector<HTMLElement>(activeTargetSel)
        : null;
      if (activeTarget && activeTarget !== target) {
        activeTrigger.setAttribute('aria-expanded', 'false');
        slideUp(activeTarget);
      }
    });
  }

  trigger.setAttribute('aria-expanded', String(!isExpanded));

  if (isExpanded) {
    slideUp(target);
  } else {
    slideDown(target);
  }
};

// --- LOGIQUE SIDEBAR ---
const handleSidebar = (trigger: HTMLElement): void => {
  // Par défaut, on cible la sidebar principale si aucun target n'est défini
  const targetSelector =
    trigger.getAttribute('data-ds-target') || '.dashboard-sidebar';
  const sidebar = document.querySelector<HTMLElement>(targetSelector);
  const overlay = document.querySelector<HTMLElement>('.dashboard-overlay');

  if (sidebar) {
    const isOpen = sidebar.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  }

  if (overlay) {
    overlay.classList.toggle('is-visible');
  }
};

// --- LOGIQUE MODAL ---
export const handleBackdropClick = (
  event: MouseEvent,
  dialog: HTMLDialogElement,
): void => {
  if (!dialog.classList.contains('modal')) return;
  const rect = dialog.getBoundingClientRect();
  const isInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInDialog) {
    closeDialog(dialog);
  }
};

// --- LOGIQUE ACCORDION ---
const handleAccordion = (trigger: HTMLElement): void => {
  const targetSelector = trigger.getAttribute('data-ds-target');
  const target = targetSelector
    ? document.querySelector<HTMLElement>(targetSelector)
    : null;
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

  if (!target) return;

  // Fermer les autres items du même groupe si besoin
  const accordion = trigger.closest('.accordion');
  if (accordion) {
    const openItems = accordion.querySelectorAll('[aria-expanded="true"]');
    openItems.forEach((item) => {
      if (item !== trigger) {
        item.setAttribute('aria-expanded', 'false');
        const targetSel = item.getAttribute('data-ds-target');
        const targetEl = targetSel
          ? document.querySelector<HTMLElement>(targetSel)
          : null;
        if (targetEl) targetEl.classList.remove('show');
      }
    });
  }

  trigger.setAttribute('aria-expanded', String(!isExpanded));
  target.classList.toggle('show');
};

const handleModal = (trigger: HTMLElement, targetType: DialogToggle): void => {
  const targetSelector = trigger.getAttribute('data-ds-target');
  const targetElement = targetSelector
    ? document.querySelector<HTMLDialogElement>(targetSelector)
    : null;

  if (!targetElement) return;
  openDialog(targetElement, targetType);
};

// --- LE HANDLER PRINCIPAL EXPORTÉ ---
export const handleToggle = (trigger: HTMLElement, event: MouseEvent): void => {
  const targetType = trigger.getAttribute('data-ds-toggle');

  switch (targetType) {
    case 'accordion':
      event.preventDefault();
      handleAccordion(trigger);
      break;
    case 'collapse':
      event.preventDefault();
      handleCollapse(trigger);
      break;
    case 'dialog':
    case 'modal':
      event.preventDefault();
      handleModal(trigger, targetType as DialogToggle);
      break;
    case 'dropdown':
      event.preventDefault();
      handleDropdown(trigger);
      break;
    case 'sidebar':
      event.preventDefault();
      handleSidebar(trigger);
      break;
  }
};
