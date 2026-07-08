// =============================================================================
// assets/ts/pages/demo-ui.ts — Logique spécifique aux pages de documentation
// =============================================================================

import {
  copyWithButtonFeedback,
  initClipboardHandlers,
  convertMarkdownToHtml,
  FormManager,
  $,
} from 'core-ts'; // Assure-toi que les imports correspondent à la réalité de ta librairie

import { Alert, Toast } from '@components/index'; // Assure-toi que les imports correspondent à la réalité de ta librairie

// -----------------------------------------------------------------------------
// 1. INITIALISATION DES BOUTONS DE COPIE AUTO SUR LES BLOCS <PRE>
// -----------------------------------------------------------------------------
const initCodeBlocksCopy = (): void => {
  const codeBlocks = document.querySelectorAll<HTMLPreElement>('pre');

  codeBlocks.forEach((preEl) => {
    const codeEl = preEl.querySelector('code');
    if (!codeEl) return;

    // Ne pas cibler le pre du composant CodeBlock natif s'il a déjà un bouton dans son header
    if (preEl.closest('.code-block')) return;

    if (preEl.querySelector('.btn-copy-code')) return;

    preEl.style.position = 'relative';

    const copyBtn = document.createElement('button');
    copyBtn.className =
      'btn btn-sm btn-ghost-secondary btn-copy-code position-absolute top-0 end-0 m-2';
    copyBtn.innerHTML = '<i class="ri-clipboard-line"></i> Copier';
    copyBtn.style.opacity = '0.8';

    copyBtn.addEventListener('mouseenter', () => (copyBtn.style.opacity = '1'));
    copyBtn.addEventListener(
      'mouseleave',
      () => (copyBtn.style.opacity = '0.8'),
    );

    copyBtn.addEventListener('click', async () => {
      await copyWithButtonFeedback(copyBtn, codeEl.textContent || '', {
        successMessage: '<i class="ri-check-line"></i> Copié !',
        errorMessage: '<i class="ri-error-warning-line"></i> Erreur',
        feedbackDuration: 2000,
      });
    });

    preEl.appendChild(copyBtn);
  });
};

const initFeedbackDemo = (): void => {
  // Test Alert
  if ($('#btn-alert-test') instanceof HTMLElement) {
    ($('#btn-alert-test') as HTMLElement)?.addEventListener('click', () => {
      new Alert(
        'Ceci est une alerte dynamique créée via TypeScript !',
        'success',
      );
    });
  }

  // Test Toast
  if ($('#btn-toast-test') instanceof HTMLElement) {
    ($('#btn-toast-test') as HTMLElement)?.addEventListener('click', () => {
      new Toast('Opération effectuée avec succès.', 'success');
    });
  }
};

// -----------------------------------------------------------------------------
// 2. DÉMO : MARKDOWN
// -----------------------------------------------------------------------------
const initMarkdownDemo = (): void => {
  const mdInput = document.getElementById(
    'demo-md-input',
  ) as HTMLTextAreaElement | null;
  const mdPreview = document.getElementById('demo-md-preview');

  if (!mdInput || !mdPreview) return;

  // Fonction de mise à jour
  const updatePreview = () => {
    mdPreview.innerHTML = convertMarkdownToHtml(mdInput.value);
  };

  // Écoute les frappes en temps réel
  mdInput.addEventListener('input', updatePreview);

  // Premier rendu au chargement
  updatePreview();
};

// -----------------------------------------------------------------------------
// 3. DÉMO : CLIPBOARD (Presse-papier)
// -----------------------------------------------------------------------------
const initClipboardDemo = (): void => {
  // Initialise l'attribut auto data-copy-target présent sur la page
  initClipboardHandlers();

  // Démo de la copie programmatique
  const btnFeedback = document.getElementById('demo-btn-feedback');
  const inputToCopy = document.getElementById(
    'demo-copy-input',
  ) as HTMLInputElement | null;

  if (!btnFeedback || !inputToCopy) return;

  btnFeedback.addEventListener('click', async () => {
    await copyWithButtonFeedback(btnFeedback, inputToCopy.value, {
      successMessage: '<i class="ri-check-double-line"></i> Copié !',
      errorMessage: '<i class="ri-error-warning-line"></i> Erreur',
      feedbackDuration: 2500,
    });
  });
};

// -----------------------------------------------------------------------------
// 4. DÉMO : FORMMANAGER
// -----------------------------------------------------------------------------
// Mise à jour de demo-ui.ts pour utiliser $
const initFormManagerDemo = (): void => {
  const formEl = $('#demo-form-manager') as HTMLFormElement;
  const outputJson = $('#fm-output-json') as HTMLElement;

  if (!formEl || !outputJson) return;

  const fm = new FormManager({ form: formEl });

  ($('#fm-btn-get') as HTMLElement)?.addEventListener('click', () => {
    outputJson.textContent = JSON.stringify(fm.getData(), null, 2);
  });

  // Bouton : Remplissage Auto
  ($('#fm-btn-fill') as HTMLElement)?.addEventListener('click', () => {
    fm.fillData({
      name: 'Alice Developer',
      email: 'alice@typescript.dev',
      role: 'admin',
      tags: ['typescript', 'php'],
    });
    // Met à jour l'affichage json
    outputJson.textContent = JSON.stringify(fm.getData(), null, 2);
  });

  // Bouton : Simuler des erreurs
  ($('#fm-btn-validate') as HTMLElement)?.addEventListener('click', () => {
    fm.validateData({
      name: 'Le nom doit contenir au moins 3 caractères.',
      email: "Format d'email invalide.",
    });
  });

  // Bouton : Reset
  ($('#fm-btn-reset') as HTMLElement)?.addEventListener('click', () => {
    fm.reset();
    outputJson.textContent =
      '// Formulaire réinitialisé.\n// Cliquez sur "Extraire Data"';
  });
};

// =============================================================================
// ORCHESTRATEUR GLOBAL
// =============================================================================
const initDemoUI = (): void => {
  initCodeBlocksCopy();
  initMarkdownDemo();
  initClipboardDemo();
  initFormManagerDemo();
  initFeedbackDemo();
};

document.addEventListener('DOMContentLoaded', initDemoUI);
