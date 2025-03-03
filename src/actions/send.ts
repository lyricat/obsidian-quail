import { App } from 'obsidian';
import { QuailPluginSettings } from '../interface';
import { LoadingModal, MessageModal, ErrorModal } from '../modals';
import util from '../util';

export default function send(app: App, client: any, settings: QuailPluginSettings) {
  return {
    id: 'deliver',
    name: 'Deliver',
    callback: async () => {
      const { frontmatter, err } = await util.getActiveFileContent(app);
      if (err != null) {
        new MessageModal(app, { message: err.toString() }).open();
        return;
      }

      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      try {
        await client.deliverPost(settings.listID, frontmatter?.slug)
        new MessageModal(app, {
          title: "Delivery Requested",
          message: "This post has been added into the delivery queue. It may take a few minutes to send out."
        }).open();
      } catch (e) {
        loadingModal.close();
        console.log("deliver error: ", e)
        new ErrorModal(app, e).open();
        return;
      } finally {
        loadingModal.close();
      }
    }
  };
}
