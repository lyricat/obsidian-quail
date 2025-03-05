import { App, Modal } from 'obsidian';
import { constructModalTitle } from './utils';
import { t } from 'src/i18n';
export class ErrorModal extends Modal {
  message = '';

  constructor(app: App, error: Error) {
    super(app);
    this.message = error.message;
  }

  onOpen() {
    const {contentEl} = this;
    constructModalTitle(contentEl, t('error_modal.title'));

    const p = document.createElement('p');
    Object.assign(p.style, {
      color: 'var(--text-muted)',
      textAlign: 'center',
    });
    p.appendText(t('error_modal.message'));

    const pre = document.createElement('pre');
    pre.className = 'error-message';
    Object.assign(pre.style, {
      fontSize: '0.8rem',
    });

    const code = document.createElement('code');

    code.appendText(this.message);
    pre.appendChild(code);
    p.appendChild(pre);
    contentEl.appendChild(p);

    const buttonContainer = contentEl.createDiv();
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '0.5rem',
      justifyContent: 'center',
      marginBottom: '0.5rem'
    });

    // Visit button
    const visitButton = buttonContainer.createEl('button', {
      cls: 'mod-cta',
      text: t('common.close')
    });
    Object.assign(visitButton.style, {
      minWidth: '100px'
    });
    visitButton.onclick = () => {
      this.close();
    };

    // Copy link button
    const copyButton = buttonContainer.createEl('button', {
      text: t('error_modal.copy')
    });
    Object.assign(copyButton.style, {
      minWidth: '100px'
    });
    copyButton.onclick = async () => {
    await navigator.clipboard.writeText(this.message);
      copyButton.setText(t('common.copied'));
      setTimeout(() => {
        copyButton.setText(t('error_modal.copy'));
      }, 2000);
    };
  }

  onClose() {
    const {contentEl} = this;
    contentEl.empty();
  }
}