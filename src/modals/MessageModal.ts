import { App, Modal } from 'obsidian';
import { constructModalTitle } from './utils';

export class MessageModal extends Modal {
    message = '';
    title = '';

    constructor(app: App, { title, message }: any) {
        super(app);
        this.message = message;
        this.title = title || 'A Message from Quail';
    }

    onOpen() {
        const {contentEl} = this;
        const text = this.message.replace(/\n/g, '<br/>');
        const titleEl = constructModalTitle(this.title);
        contentEl.appendChild(titleEl);

        const p = document.createElement('p');
        p.className = 'text-center';
        p.appendText(text);
        contentEl.appendChild(p);
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}