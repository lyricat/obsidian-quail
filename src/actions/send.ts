import { App } from 'obsidian';
import { QuailPluginSettings } from '../interface';
import { LoadingModal, MessageModal, ErrorModal } from '../modals';
import util from '../util';
import { t } from 'src/i18n';
export default function send(app: App, client: any, settings: QuailPluginSettings) {
  return {
    id: 'deliver',
    name: 'Deliver',
    callback: async () => {
      const { frontmatter, err } = await util.getActiveFileContent(app);
      if (err != null) {
        new ErrorModal(app, new Error(err.toString())).open();
        return;
      }

      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      try {
        await client.deliverPost(settings.listID, frontmatter?.slug)
        new MessageModal(app, {
          title: t('message_modal.send_post.title'),
          message: t('message_modal.send_post.desc'),
          icon: '🚀',
        }).open();
      } catch (e) {
        loadingModal.close();
        new ErrorModal(app, e).open();
        return;
      } finally {
        loadingModal.close();
      }
    }
  };
}
