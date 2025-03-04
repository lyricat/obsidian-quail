import { App } from 'obsidian';
import { MessageModal } from '../modals';
import fm from '../frontmatter';

export default function insertMetadata(app: App) {
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
              title: "Metadata already exists",
              message: "Please edit manually or use AI to generate it",
              icon: "🔔",
              iconColor: "orange"
            })
            modal.open();
          }
        }
        app.fileManager.processFrontMatter(file, proc);
      }
    }
  };
}