import { App } from 'obsidian';
import { QuailPluginSettings } from '../interface';
import { LoadingModal, MessageModal, ErrorModal } from '../modals';
import util from '../util';

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
        console.log("unpublish: ", frontmatter?.slug)
        new MessageModal(app, {
          title: "Unpublish",
          message: "This post has been unpublished. It's non-visible on your readers.",
          icon: '📕',
          iconColor: 'red'
        }).open();
      } catch (e) {
        loadingModal.close();
        new ErrorModal(app, e).open();
      } finally {
        loadingModal.close();
      }
    }
  };
}
