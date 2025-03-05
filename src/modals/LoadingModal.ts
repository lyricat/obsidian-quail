import { App, Modal } from 'obsidian';
import { t } from 'src/i18n';

export class LoadingModal extends Modal {
  private loadingInterval: number | null = null;
  private frames: string[] = [
    '😐', '😐', '😐', '😐', '😐', '😐', '😐', '😐','😐', '😐', '😐', '😑',
    '😐', '😐', '😐', '😐', '😑'
  ];
  private currentFrame = 0;
  private loadingTextElement: HTMLElement | null = null;
  private asciiArtElement: HTMLElement | null = null;
  private loadingTexts = [
    t('loading_modal.text.loading'),
    t('loading_modal.text.still_loading'),
    t('loading_modal.text.almost_there'),
    t('loading_modal.text.just_a_moment'),
    t('loading_modal.text.working_on_it')
  ];
  private textIndex = 0;
  private textOpacity = 1.0;
  private fadeDirection = 'out';

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    this.setTitle("")

    const {contentEl} = this;
    this.asciiArtElement = document.createElement('pre');
    this.asciiArtElement.className = 'loading-ascii-art';
    Object.assign(this.asciiArtElement.style, {
      fontSize: '40px',
      lineHeight: '1.2',
      margin: '1rem 0',
      textAlign: 'center',
    });
    contentEl.appendChild(this.asciiArtElement);

    this.loadingTextElement = document.createElement('p');
    this.loadingTextElement.className = 'text-center loading-text';
    Object.assign(this.loadingTextElement.style, {
      marginTop: '10px',
      transition: 'opacity 0.3s ease',
      fontSize: '0.7rem',
    });
    this.loadingTextElement.setText(this.loadingTexts[this.textIndex]);
    contentEl.appendChild(this.loadingTextElement);

    this.updateFrame();
    this.loadingInterval = window.setInterval(() => {
      this.updateFrame();
    }, 100);
  }

  updateFrame() {
    if (!this.asciiArtElement || !this.loadingTextElement) return;

    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    const cuteArt = [
      " " + this.frames[this.currentFrame] + " ",
    ].join("\n");

    this.asciiArtElement.setText(cuteArt);

    if (this.fadeDirection === 'out') {
      this.textOpacity -= 0.1;
      if (this.textOpacity <= 0) {
        this.textOpacity = 0;
        this.fadeDirection = 'in';
        this.textIndex = (this.textIndex + 1) % this.loadingTexts.length;
        this.loadingTextElement.setText(this.loadingTexts[this.textIndex]);
      }
    } else {
      this.textOpacity += 0.1;
      if (this.textOpacity >= 1) {
        this.textOpacity = 1;
        this.fadeDirection = 'out';
      }
    }

    this.loadingTextElement.style.opacity = this.textOpacity.toString();
  }

  onClose() {
    const {contentEl} = this;
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
    contentEl.empty();
  }
}