import { App } from 'obsidian';
import { MessageModal } from '../modals';
import fm from '../frontmatter';
import { t } from 'src/i18n';
import aigen from './aigen';

export default function insertMetadata(app: App, auxiliaClient: any) {
  return {
    id: 'insert-metadata',
    name: 'Insert metadata template',
    callback: async () => {
      const file = app.workspace.getActiveFile();
      if (file) {
        const proc = (frontmatter: any) => {
          if (frontmatter === null || Object.values(frontmatter).length === 0) {
            const fmc:any = fm.emptyFrontmatter()
            for (const key in fmc) {
              if (Object.prototype.hasOwnProperty.call(fmc, key)) {
                frontmatter[key] = fmc[key];
              }
            }
          } else {
            const modal = new MessageModal(app, {
              title: t('message_modal.metadata_exists.title'),
              message: t('message_modal.metadata_exists.desc'),
              icon: "🔔",
              iconColor: "orange",
              actions: [{
                text: t('common.ai_generate'),
                primary: true,
                click: (dialog: any) => {
                  aigen(app, auxiliaClient).callback();
                  dialog.close();
                }
              },{
                text: t('common.cancel'),
                close: true,
              }]
            })
            modal.open();
          }
        }
        app.fileManager.processFrontMatter(file, proc);
      }
    }
  };
}