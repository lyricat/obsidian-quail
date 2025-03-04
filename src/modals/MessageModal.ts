import { App, Modal } from 'obsidian';

export class MessageModal extends Modal {
    message = '';
    title = '';
    icon = '🤖';
    iconColor = 'accent';
    iconColors:any = {
      'green': {
        'dimm-1': 'rgba(16, 185, 129, .05)',
        'dimm-2': 'rgba(16, 185, 129, .2)',
      },
      'red': {
        'dimm-1': 'rgba(244, 63, 94, .05)',
        'dimm-2': 'rgba(244, 63, 94, .2)',
      },
      'orange': {
        'dimm-1': 'rgba(234, 179, 8, .05)',
        'dimm-2': 'rgba(234, 179, 8, .2)',
      },
      'blue': {
        'dimm-1': 'rgba(13, 117, 252, .05)',
        'dimm-2': 'rgba(13, 117, 252, .2)',
      },
    }
    actions: any[] = [];

    constructor(app: App, { title, message, icon, iconColor, actions }: any) {
      super(app);
      this.message = message;
      this.title = title || 'A Message from Quaily';
      this.icon = icon || '🤖';
      this.iconColor = iconColor || 'accent';
      this.actions = actions || [{
        text: 'OK',
        primary: true,
        click: () => {
          this.close();
        }
      }];
    }

    onOpen() {
      const {contentEl} = this;

      this.setTitle("")

      const text = this.message.replace(/\n/g, '<br/>');

      //
      const container = contentEl.createDiv();
      Object.assign(container.style, {
        display: 'flex',
        margin: '0',
        flexDirection: 'column',
        alignItems: 'center',
      });
      const iconWrapper = container.createDiv();
      Object.assign(iconWrapper.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 0 1.5rem 0'
      });
      const iconInner = iconWrapper.createDiv();
      Object.assign(iconInner.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0',
        borderRadius: '50em',
        padding: '0.5rem',
      });
      if (this.iconColors[this.iconColor]) {
        Object.assign(iconInner.style, {
          backgroundColor: this.iconColors[this.iconColor]['dimm-2'],
          boxShadow: `0 0 0 8px ${this.iconColors[this.iconColor]['dimm-1']}`,
        });
      } else {
        Object.assign(iconInner.style, {
          backgroundColor: `hsl(calc(var(--accent-h) - 1), calc(var(--accent-s) * 1.01), calc(var(--accent-l) * 1.4))`,
          boxShadow: `0 0 0 8px hsl(calc(var(--accent-h) - 1), calc(var(--accent-s) * 1.01), calc(var(--accent-l) * 1.47))`,
        });
      }
      const icon = iconInner.createDiv();
      Object.assign(icon.style, {
        height: '22px',
        width: '22px',
        borderRadius: '50em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
      icon.innerText = this.icon;


      const content = container.createDiv();
      Object.assign(content.style, {
        flex: '1',
        margin: '0 1rem',
        textAlign: 'center',
      });

      const t = content.createEl('h2', {
        text: this.title,
      });
      Object.assign(t.style, {
        fontSize: '1rem',
        fontWeight: 'bold',
        margin: '0 0 0.5rem 0',
      });

      const p = content.createDiv();
      Object.assign(p.style, {
        lineHeight: '1.5',
        color: 'var(--text-muted)',
        margin: '0 0 1rem 0',
      });
      p.innerHTML = text;

      // Add a button to close the modal
      const buttonContainer = container.createDiv();
      Object.assign(buttonContainer.style, {
        display: 'flex',
        justifyContent: 'center',
        margin: '0 0 0.5rem 0',
        gap: '0.5rem',
      });
      for (const action of this.actions) {
        const button = buttonContainer.createEl('button', {
          text: action.text,
        });
        Object.assign(button.style, {
          minWidth: '100px'
        });
        if (action.primary) {
          button.classList.add('mod-cta');
        }
        if (action.danger) {
          button.classList.add('mod-warning');
        }
        if (action.close) {
          button.addEventListener('click', () => {
            this.close();
          });
        } else {
          if (action.click) {
            button.addEventListener('click', () => {
              action.click(this);
            });
          }
        }
        button.focus();
      }
    }

    onClose() {
      const {contentEl} = this;
      contentEl.empty();
    }
}