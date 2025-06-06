import { TFile, App } from 'obsidian';

export default {
  getImagePaths : function (markdownContent: string) {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g; // matches markdown image syntax
    const matches:string[] = [];
    let match:RegExpExecArray|null = null;
    while ((match = imageRegex.exec(markdownContent))) {
      if (match && match.length > 2) {
        const item = match[2];
        if (!item.startsWith("https://") && !item.startsWith("http://")) {
          matches.push(item);
        }
      }
    }
    return matches;
  },

  getMimeType: function (ext: string) {
    const mimeTypeMap :Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    const mimeType = mimeTypeMap[ext.toLowerCase()];
    if (!mimeType) {
      return null
    }

    return mimeType;
  },

  getActiveFileFrontmatter: async function (app: App) {
    const file = app.workspace.getActiveFile();

    if (file === null) {
      return {frontmatter: null, content: ""}
    }

    const text = await app.vault.cachedRead(file);
    let content = text;

    const frontmatter:Record<string, any> = {}
    const fc = (app.metadataCache.getFileCache(file) as any)
    const fmc = fc?.frontmatter;
    const fmp = fc?.frontmatterPosition;
    if (fmc && fmp && fmc !== undefined) {
      const end = fmp.end.line + 1; // accont for ending ---
      content = text.split("\n").slice(end).join("\n");
      for (const key in fmc) {
        if (Object.prototype.hasOwnProperty.call(fmc, key)) {
          const item = fmc[key];
          frontmatter[key] = item;
        }
      }
    }

    return {
      frontmatter,
      position: fmp,
      content,
    }
  },

  getActiveFileMarkdown: async function (app: App) {
    const file = app.workspace.getActiveFile();
    if (file === null) {
      return ""
    }

    const text = await app.vault.cachedRead(file);
    let content = text;

    const fc = (app.metadataCache.getFileCache(file) as any)
    const fmc = fc?.frontmatter;
    const fmp = fc?.frontmatterPosition;
    if (fmc && fmp && fmc !== undefined) {
      const end = fmp.end.line + 1; // accont for ending ---
      content = text.split("\n").slice(end).join("\n");
    }

    return content;
  },


  getCoverImage: function (app:App, path: string) {
    const files = app.vault.getFiles();
    for (let ix = 0; ix < files.length; ix++) {
      const fd = files[ix];
      if (fd.path === path) {
        return fd;
      }
    }
    return null;
  },

  getImageFiles: function (app:App, currentMd: TFile) {
    const resolvedLinks = app.metadataCache.resolvedLinks;
    const files:TFile[] = [];
    for (const [mdFile, links] of Object.entries(resolvedLinks)) {
      if (currentMd.path === mdFile) {
        for (const [filePath, nr] of Object.entries(links)) {
          const ext = filePath.split('.').pop()?.toLocaleLowerCase() || "";
          if (this.getMimeType(ext) !== null) {
            try {
              const AttachFile: TFile =
                app.vault.getAbstractFileByPath(filePath) as TFile;
              if (AttachFile instanceof TFile) {
                files.push(AttachFile);
              }
            } catch (error) {
              console.error(`quaily.getImageFiles: error: ${error}`);
            }
          }
        }
      }
    }
    return files;
  },

  getActiveFileContent: async function (app: App) {
    const file = app.workspace.getActiveFile();
    if (file) {

      const { frontmatter: fmc, content } = await this.getActiveFileFrontmatter(app)

      const coverImagePath = fmc?.cover_image_url?.trim() || ""

      const imgFiles = this.getImageFiles(app, file);

      const coverFile = this.getCoverImage(app, coverImagePath);

      imgFiles.push(coverFile);

      let coverImage:any = null;
      const images:Array<any> = [];
      for (let ix = 0; ix < imgFiles.length; ix++) {
        const fd = imgFiles[ix];
        if (fd) {
          const mimeType = this.getMimeType(fd.extension)
          if (mimeType === "") {
            continue;
          }
          const img = await app.vault.readBinary(fd)
          if (img.byteLength) {
            console.log(`quaily.getActiveFileContent: found: ${fd.path}, size: ${img.byteLength}`);
            const imgWrapper = {
              pathname: fd.path,
              name: fd.name,
              data: img,
              mimeType,
            }
            if (fd.path === coverImagePath) {
              coverImage = imgWrapper
            }
            images.push(imgWrapper);
          }
        }
      }

      const title = file.name.replace(/\.md$/, '');

      return {
        title,
        content,
        frontmatter: {
          title: fmc?.title || '',
          slug: fmc?.slug || '',
          tags: fmc?.tags || '',
          datetime: fmc?.datetime || '',
          summary: fmc?.summary || '',
          cover_image_url: fmc?.cover_image_url || '',
          cover_image: coverImage,
        },
        images,
        err: null,
      }
    }
    return {
      title: "",
      content: "",
      frontmatter: null,
      images: [],
      err: "no active file",
    }
  },

  replaceImageUrls: function (content: string, oldUrls: string[], newUrls: string[]) {
    if (oldUrls.length !== newUrls.length) {
      console.log("quaily.replaceImageUrls: the number of old and new urls do not match, return original content");
      return content;
    }
    const urlMap: any = {};
    for (let ix = 0; ix < oldUrls.length; ix++) {
      const oldUrl = oldUrls[ix];
      const newUrl = newUrls[ix];
      urlMap[oldUrl] = {
        used: false,
        newUrl
      };
    }

    const lines = content.split("\n");
    const newLines = [];
    const secondRoundLines = [];
    const allImageURLs = [];

    // first round, replace ![alt](url) with ![alt](newUrl)
    // and replace ![[path]] with ![name](newUrl)
    for (let ix = 0; ix < lines.length; ix++) {
      const line = lines[ix];
      let newLine = line;
      if (line.startsWith("![") && line.endsWith(")")) {
        const match = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (match !== null && match.length > 1) {
          const oldUrl = decodeURIComponent(match[2]);
          if (urlMap[oldUrl]) {
            newLine = line.replace(`(${match[2]})`, `(${urlMap[oldUrl].newUrl})`);
            urlMap[oldUrl].used = true;
            allImageURLs.push(urlMap[oldUrl].newUrl)
          } else {
            console.log("quaily.replaceImageUrls: ignore image", oldUrl)
            allImageURLs.push(oldUrl)
          }
        }
      } else if (line.startsWith("![[") && line.endsWith("]]")) {
        const match = line.match(/!\[\[(.*?)\]\]/);
        if (match !== null && match.length > 0) {
          const oldUrl = decodeURIComponent(match[1]);
          const name = oldUrl.split("/").pop();
          if (urlMap[oldUrl]) {
            newLine = line.replace(`![[${match[1]}]]`, `![${name || oldUrl}](${urlMap[oldUrl].newUrl})`);
            urlMap[oldUrl].used = true;
            allImageURLs.push(urlMap[oldUrl].newUrl)
          } else {
            secondRoundLines.push({line, index: ix});
          }
        }
      }
      newLines.push(newLine);
    }

    // second round, replace ![[name]] with ![name](newUrl)
    // if it is a name, it could be duplicated, so we need to find the first unused one in the urlMap
    for (let ix = 0; ix < secondRoundLines.length; ix++) {
      const {index, line} = secondRoundLines[ix];
      let newLine = line;
      if (line.startsWith("![[") && line.endsWith("]]")) {
        const match = line.match(/!\[\[(.*?)\]\]/);
        if (match !== null && match.length > 0) {
          const name = decodeURIComponent(match[1]);
          let handled = false;
          for (const k in urlMap) {
            if (urlMap[k].used === false && k.endsWith(name)) {
              newLine = line.replace(`![[${match[1]}]]`, `![${name}](${urlMap[k].newUrl})`);
              handled = true;
              allImageURLs.push(urlMap[k].newUrl)
            }
          }
          if (!handled) {
            console.log("quaily.replaceImageUrls:ignore image", name)
            allImageURLs.push(name)
          }
        }
      }
      newLines[index] = newLine;
    }
    return {
      content: newLines.join("\n"),
      image_urls: allImageURLs,
    }
  },
}
