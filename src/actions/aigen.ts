import util from '../util';
import fm from "../frontmatter";
import { LoadingModal, ErrorModal } from '../modals';
import { App } from 'obsidian';

const aigen = function (app: App, auxiliaClient: any) {
  return {
    id: 'ai-gen-metadata',
    name: 'Generate metadata by AI',
    callback: async () => {
      const content = await util.getActiveFileMarkdown(app);
      const file = app.workspace.getActiveFile();
      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      if (file) {
        const title = file.name.replace(/\.md$/, '');
        const fmc:any = await fm.suggestFrontmatter(auxiliaClient, title, content, [])
        const proc = (frontmatter: any) => {
          if (file) {
            try {
              for (const key in fmc) {
                if (Object.prototype.hasOwnProperty.call(fmc, key)) {
                  frontmatter[key] = fmc[key];
                }
              }
            } catch (e) {
              new ErrorModal(app, e).open();
            } finally {
              loadingModal.close();
            }
          }
        }
        app.fileManager.processFrontMatter(file, proc);
      } else {
        loadingModal.close();
      }
    }
  }
}

export default aigen;