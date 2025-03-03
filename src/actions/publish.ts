import { App } from 'obsidian';
import { LoadingModal, MessageModal, ErrorModal, PublishResultModal } from '../modals';
import { QuailPluginSettings } from '../interface';
import { savePost } from './index';

export default function publish(app: App, client: any, auxiliaClient: any, settings: QuailPluginSettings) {
  return {
    id: 'quail-publish',
    name: 'Publish',
    callback: async () => {
      const file = app.workspace.getActiveFile();
      if (file !== null) {
        const loadingModal = new LoadingModal(app)
        loadingModal.open();

        let pt:any = null;
        try {
          pt = await savePost(app, client, auxiliaClient, settings);
        } catch (e) {
          new ErrorModal(app, e).open();
          loadingModal.close();
          return;
        }

        try {
          pt = await client.publishPost(settings.listID, pt.slug);
        } catch (e) {
          new ErrorModal(app, e).open();
          loadingModal.close();
          return;
        } finally {
          loadingModal.close();
        }

        const slug = pt.slug || '';
        if (slug) {
          const viewUrl = `https://quaily.com/${settings.listSlug}/p/${slug}`;
          new PublishResultModal(app, client, viewUrl, pt.title, pt.summary	, pt.cover_image_url).open();
        } else {
          new MessageModal(app, { message: "resp.slug is empty." }).open();
        }
      }
    }
  };
}
