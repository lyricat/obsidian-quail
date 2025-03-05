import { App, Modal } from 'obsidian';
import { constructModalTitle } from './utils';
import { t } from 'src/i18n';

export class PublishResultModal extends Modal {
  dialogTitle: string;
  url: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  client: any;

  constructor(app: App, client: any, {scene, url, title, summary, coverImageUrl }: { scene?: string, url: string, title?: string, summary?: string, coverImageUrl?: string }) {
    super(app);
    this.url = url;
    this.dialogTitle = t('publish_result_modal.title');
    this.title = title || '';
    this.summary = summary || '';
    this.coverImageUrl = coverImageUrl || null;
    this.client = client;
  }

  onOpen() {
    const {contentEl} = this;
    contentEl.empty();

    this.setTitle("");


    // Create container for content
    const container = contentEl.createDiv();
    Object.assign(container.style, {
      maxWidth: '600px',
    });

    constructModalTitle(container, this.dialogTitle);

    const postPreview = container.createDiv();
    Object.assign(postPreview.style, {
      margin: '0 0 1rem 0',
      display: 'flex',
      background: 'var(--background-primary)',
      padding: 'var(--size-4-3)',
      borderRadius: 'var(--radius-s)',
      border: '1px solid var(--background-modifier-border)'
    });

    // Add cover image if provided
    if (this.coverImageUrl) {
      const imageContainer = postPreview.createDiv();
      Object.assign(imageContainer.style, {
        margin: '0 1rem 0 0',
        width: '128px',
        height: '128px',
        flexBasis: '128px',
        minWidth: '128px',
        borderRadius: '2px',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
      });

      const img = imageContainer.createEl('img', {
        attr: {
          src: this.coverImageUrl,
          alt: 'Post cover image'
        }
      });
      Object.assign(img.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '2px'
      });
    }

    const postContent = postPreview.createDiv();

    // Add post title if provided
    if (this.title) {
      const postTitle = postContent.createEl('h3', {
        text: this.title
      });
      Object.assign(postTitle.style, {
        margin: '0 0 0.5rem 0',
        fontSize: '1.5em',
        fontWeight: '600'
      });
    }

    // Add summary if provided
    if (this.summary) {
      const summaryEl = postContent.createEl('p', {
        text: this.summary
      });
      // at most 2 lines
      Object.assign(summaryEl.style, {
        margin: '0',
        lineHeight: '1.5',
        color: 'var(--text-muted)',
        WebkitLineClamp: '2',
        WebkitBoxOrient: 'vertical',
        display: '-webkit-box',
        overflow: 'hidden'
      });
    }

    // Add URL with link
    const urlContainer = container.createDiv();
    Object.assign(urlContainer.style, {
      background: 'var(--background-secondary)',
      padding: '0.75rem',
      borderRadius: '6px',
      margin: '1rem 0',
      wordBreak: 'break-all'
    });

    const urlLink = urlContainer.createEl('a', {
      href: this.url,
      text: this.url
    });
    Object.assign(urlLink.style, {
    color: 'var(--text-accent)',
      textDecoration: 'none'
    });
    urlLink.setAttribute('target', '_blank');

    // Add action buttons
    const buttonContainer = container.createDiv();
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '0.5rem',
      justifyContent: 'center',
      marginBottom: '0.5rem'
    });

    // Copy link button
    const copyButton = buttonContainer.createEl('button', {
      text: t('publish_result_modal.copy_link')
    });
    Object.assign(copyButton.style, {
      minWidth: '100px'
    });
    copyButton.onclick = async () => {
      await navigator.clipboard.writeText(this.url);
      copyButton.setText(t('common.copied'));
      setTimeout(() => {
        copyButton.setText(t('publish_result_modal.copy_link'));
      }, 2000);
    };
    // Visit button
    const visitButton = buttonContainer.createEl('button', {
      cls: 'mod-cta',
      text: t('publish_result_modal.visit_post')
    });
    Object.assign(visitButton.style, {
      minWidth: '100px'
    });
    visitButton.onclick = () => {
      window.open(this.url, '_blank');
      this.close();
    };

  }

  onClose() {
    const {contentEl} = this;
    contentEl.empty();
  }
}