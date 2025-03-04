import { App, Modal } from 'obsidian';
import { constructModalTitle } from './utils';

export class PublishResultModal extends Modal {
  url: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  client: any;

  constructor(app: App, client: any, url: string, title?: string, summary?: string, coverImageUrl?: string) {
    super(app);
    this.url = url;
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

    constructModalTitle(container, 'Successfully Published! 🎉');

    // Add cover image if provided
    if (this.coverImageUrl) {
      const imageContainer = container.createDiv();
      Object.assign(imageContainer.style, {
        margin: '0 0 1rem 0',
      });

      const img = imageContainer.createEl('img', {
        attr: {
          src: this.coverImageUrl,
          alt: 'Post cover image'
        }
      });
      Object.assign(img.style, {
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
        maxHeight: '200px',
        borderRadius: '2px'
      });
    }

    // Add post title if provided
    if (this.title) {
      const postTitle = container.createEl('h3', {
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
      const summaryEl = container.createEl('p', {
        text: this.summary
      });
      Object.assign(summaryEl.style, {
        margin: '0 0 1rem 0',
        lineHeight: '1.5',
        color: 'var(--text-muted)'
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

    // Visit button
    const visitButton = buttonContainer.createEl('button', {
      cls: 'mod-cta',
      text: 'Visit Post'
    });
    Object.assign(visitButton.style, {
      minWidth: '100px'
    });
    visitButton.onclick = () => {
      window.open(this.url, '_blank');
      this.close();
    };

    // Copy link button
    const copyButton = buttonContainer.createEl('button', {
      text: 'Copy Link'
    });
    Object.assign(copyButton.style, {
      minWidth: '100px'
    });
    copyButton.onclick = async () => {
      await navigator.clipboard.writeText(this.url);
      copyButton.setText('Copied!');
      setTimeout(() => {
        copyButton.setText('Copy Link');
      }, 2000);
    };
  }

  onClose() {
    const {contentEl} = this;
    contentEl.empty();
  }
}