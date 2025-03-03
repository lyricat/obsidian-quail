import { App, Modal } from 'obsidian';
import { constructModalTitle } from './utils';

export class ErrorModal extends Modal {
    message = '';

    constructor(app: App, error: Error) {
        super(app);
        this.message = error.message;
    }

    onOpen() {
        const {contentEl} = this;
        const titleEl = constructModalTitle('Ooooops, something went wrong');
        contentEl.appendChild(titleEl);

        const p = document.createElement('p');
        p.className = 'text-center';
        p.appendText("Error Message");

        const pre = document.createElement('pre');
        pre.className = 'error-message';

        const code = document.createElement('code');

        code.appendText(this.message);
        pre.appendChild(code);
        p.appendChild(pre);
        contentEl.appendChild(p);
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}