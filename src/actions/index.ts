import { App } from 'obsidian';
import { LoadingModal, MessageModal, ErrorModal } from '../modals';
import util from '../util';
import { QuailPluginSettings } from '../interface';
import fm from "../frontmatter";
import aigen from './aigen';
import save from './save';
import publish from './publish';
import unpublish from './unpublish';
import send from './send';

async function uploadAttachment(client: any, image: any) {
  const formData = new FormData();
  const picArray = new Uint8Array(image.data).buffer;

  formData.append('file', new Blob([picArray], { type: image.mimeType }), image.name);

  const resp = await client.uploadAttachment(formData);
  return resp.view_url
}

async function arrangeArticle(app: App, client: any, settings: QuailPluginSettings) {
  const { title, content, frontmatter: frontmatterO, images, err } = await util.getActiveFileContent(app);
  if (err != null) {
    // @TODO: use error modal
    new MessageModal(app, { message: err.toString() }).open();
    return { frontmatter: null, content: null};
  }

  const frontmatter = fm.replaceFields(frontmatterO);

  const { verified, reason } = fm.verifyFrontmatter(frontmatter)
  if (!verified) {
    new MessageModal(app, {title: "Failed to verify the metadata",  message: reason }).open();
    return { frontmatter: null, content: null};
  }

  // upload images
  const oldUrls:string[] = [];
  const newUrls:string[] = [];
  for (let ix = 0; ix < images.length; ix++) {
    const img = images[ix];
    if (img) {
      try {
        const viewUrl = await uploadAttachment(client, img)
        newUrls.push(viewUrl)
        oldUrls.push(img.pathname)
        console.log(`upload image: ${img.pathname}, new url: ${viewUrl}`)
      } catch (e) {
        console.log("upload image error: ", e)
        new ErrorModal(app, new Error(e)).open();
        return { frontmatter: null, content: null};
      }
    }
  }

  // upload cover image
  if (frontmatter?.cover_image) {
    try {
      const viewUrl = await uploadAttachment(client, frontmatter.cover_image)
      frontmatter.cover_image_url = viewUrl;
      console.log(`upload cover: ${frontmatter.cover_image.pathname}, new url: ${viewUrl}`)
    } catch (e) {
      console.log("upload cover error: ", e)
      new ErrorModal(app, new Error(e)).open();
      return { frontmatter: null, content: null};
    }
  }

  // replace image urls
  const newContent = util.replaceImageUrls(content, oldUrls, newUrls).trim() || '';
  const fmt = fm.formalizeFrontmatter(frontmatter, newContent);

  return {
    title: title,
    frontmatter: fmt,
    content: newContent,
  }
}

export async function savePost(app: App, client: any, auxiliaClient:any, settings: QuailPluginSettings) {
  const { title, frontmatter, content } = await arrangeArticle(app, client, settings);
  if (content == null || title == null) {
    return;
  }

  const checkMetadata = (fm: any) => {
    const fields = ['slug', 'summary', 'tags'];
    for (let i = 0; i < fields.length; i++) {
      if (fm[fields[i]] === '' || fm[fields[i]] === null || fm[fields[i]] === undefined) {
        return false;
      }
    }
    return true
  }

  if (!checkMetadata(frontmatter)) {
    console.log("some metadata is empty, try to generate it by AI")
    const file = app.workspace.getActiveFile();
    if (file) {
      // try to generate metadata
      const fmc:any = await fm.suggestFrontmatter(auxiliaClient, title, content, [])
      const proc = (frontmatter:any) => {
        if (file) {
          const loadingModal = new LoadingModal(app)
          loadingModal.open();
          try {
            for (const key in fmc) {
              if (Object.prototype.hasOwnProperty.call(fmc, key)) {
                if (frontmatter[key] === '' || frontmatter[key] === null || frontmatter[key] === undefined) {
                  console.log(`update metadata: ${key} = ${fmc[key]}`)
                  frontmatter[key] = fmc[key];
                }
              }
            }
          } catch (e) {
            loadingModal.close();
            new ErrorModal(app, e).open();
          } finally {
            loadingModal.close();
          }
        }
      }
      app.fileManager.processFrontMatter(file, proc);
    } else {
      return ;
    }
  }

  let newContent = content;
  if (!settings.strictLineBreaks) {
    // \n -> \n\n
    newContent = newContent.replace(/\n/g, '\n\n');
  }

  const payload = {
    slug: frontmatter.slug,
    title: frontmatter.title || title,
    cover_image_url: frontmatter.cover_image_url,
    summary: frontmatter.summary,
    content: newContent,
    tags: frontmatter.tags,
    theme: frontmatter.theme,
    first_published_at: frontmatter.datetime,
  }

  let resp:any = null;
  try {
    resp = await client.createPost(settings.listID, payload);
  } catch (e) {
    new ErrorModal(app, e).open();
    return;
  } finally {
    //
  }

  return resp;
}

export function getActions(plugin: any) {
  const app = plugin.app;
  const settings = plugin.settings;
  const client = plugin.client;
  const auxiliaClient = plugin.auxiliaClient;

  const loginAction = [
    {
      id: 'quail-login',
      name: 'Login',
      callback: async () => {
        await plugin.login();
      }
    }
  ];

  // check token status and expiry
  if (settings.accessToken === '' || settings.refreshToken === '' || settings.tokenExpiry === '') {
    return loginAction;
  }

  return [
    publish(app, client, auxiliaClient, settings),
    unpublish(app, client, settings),
    save(app, client, auxiliaClient, settings),
    send(app, client, settings),
    aigen(app, auxiliaClient),
    {
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
    },
  ];
}
