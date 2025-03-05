import { App, Notice } from 'obsidian';
import { QuailPluginSettings } from '../interface';
import { LoadingModal, ErrorModal } from '../modals';
import util from '../util';
import { t } from 'src/i18n';


export default function unpublish(app: App, client: any, settings: QuailPluginSettings) {
  return {
    id: 'unpublish',
    name: 'Unpublish',
    callback: async () => {
      const { frontmatter, err } = await util.getActiveFileContent(app);
      if (err != null) {
        new ErrorModal(app, new Error(err)).open();
        return;
      }

      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      try {
        await client.unpublishPost(settings.listID, frontmatter?.slug);
        new Notice(t('notices.unpublish_success'));
      } catch (e) {
        loadingModal.close();
        new ErrorModal(app, e).open();
      } finally {
        loadingModal.close();
      }
    }
  };
}
