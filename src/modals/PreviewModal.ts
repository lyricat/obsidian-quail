import { App, Modal, Setting } from 'obsidian';
import * as QRCode from 'qrcode';
import { constructModalTitle } from './utils';
import { t } from 'src/i18n';
export class PreviewModal extends Modal {
  private url: string;

  constructor(app: App, url: string) {
    super(app);
    this.url = url;
  }

  async onOpen() {
    const { contentEl } = this;
    this.setTitle("");

    const container = contentEl.createDiv();
    Object.assign(container.style, {
      maxWidth: '600px',
    });

    constructModalTitle(container, t('preview_modal.title'));

    const hint = container.createDiv({
      text: t('preview_modal.hint'),
    });
    Object.assign(hint.style, {
      background: 'var(--background-secondary)',
      padding: '0.8rem',
      borderRadius: '6px',
      margin: '0 0 1rem 0',
      wordBreak: 'break-all',
      color: 'var(--text-accent)',
    });

    // the top container is the container for the QR code and the text
    const topContainer = container.createDiv();
    Object.assign(topContainer.style, {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '0 0 1rem 0',
      background: 'var(--background-primary)',
      padding: 'var(--size-4-3)',
      borderRadius: 'var(--radius-s)',
      border: '1px solid var(--background-modifier-border)'
    });

    const topContainerLeft = topContainer.createDiv();
    Object.assign(topContainerLeft.style, {
      flex: 1,
    });
    const topContainerLeftTitle = topContainerLeft.createDiv({
      text: t('preview_modal.mobile.title'),
    });
    topContainerLeftTitle.classList.add('setting-item-name');

    const topContainerLeftDesc = topContainerLeft.createDiv({
      text: t('preview_modal.mobile.desc'),
    });
    topContainerLeftDesc.classList.add('setting-item-description');

    const topContainerRight = topContainer.createDiv();
    Object.assign(topContainerRight.style, {
    });

    // Create container for QR code with some padding
    const qrContainer = topContainerRight.createDiv({ cls: 'quail-qr-container' });
    // Create canvas for QR code
    const canvas = document.createElement('canvas');
    qrContainer.appendChild(canvas);

    try {
      await QRCode.toCanvas(canvas, this.url, {
        width: 200,
        margin: 1,
      });

    } catch (err) {
      qrContainer.createEl('p', { text: `Failed to generate QR code: ${err}` });
    }

    // Add button to open in browser
    const buttonContainer = contentEl.createDiv();
    Object.assign(buttonContainer.style, {
      margin: '0',
      background: 'var(--background-primary)',
      padding: '0.8rem 0.8rem 0 0.8rem',
      borderRadius: 'var(--radius-s)',
      border: '1px solid var(--background-modifier-border)'
    });
    new Setting(buttonContainer)
      .setName(t('preview_modal.desktop.title'))
      .setDesc(t('preview_modal.desktop.desc'))
      .addButton((btn) =>
        btn.setButtonText(t('preview_modal.preview'))
          .setCta()
          .onClick(() => {
            window.open(this.url, '_blank');
            this.close();
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}