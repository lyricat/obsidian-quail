import { App } from 'obsidian';
import { LoadingModal, ErrorModal, PublishResultModal } from '../modals';
import { QuailPluginSettings } from '../interface';
import { savePost } from './index';

export default function save(app: App, client: any, auxiliaClient: any, settings: QuailPluginSettings) {
  return {
    id: 'save',
    name: 'Save',
    callback: async () => {
      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      let pt: any = null;
      try {
        pt = await savePost(app, client, auxiliaClient, settings);
      } catch (e) {
        new ErrorModal(app, e).open();
        loadingModal.close();
        return;
      } finally {
        loadingModal.close();
      }

      const slug = pt?.slug || '';
      if (slug) {
        const payload:any = {
          title: pt.title,
          summary: pt.summary,
          coverImageUrl: pt.cover_image_url
        }
        if (pt?.published_at !== null) {
          payload.url = `https://quaily.com/${settings.listSlug}/p/${slug}`;
          payload.scene = 'publish';
        } else {
          payload.scene = 'save';
        }
        new PublishResultModal(app, client, payload).open();
      }
    }
  };
}
