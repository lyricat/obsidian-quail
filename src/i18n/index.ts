import en from './lang/en.json'
import ja from './lang/ja.json'
import zh from './lang/zh.json'
import zhTw from './lang/zh-tw.json'

const supportedLangs = [
  'en', 'ja', 'zh', 'zh-tw',
];

export const messages:any = {
  en, ja, zh, 'zh-tw': zhTw,
}

function detectLang() {
  let lang = window.localStorage.getItem('language');
  if (lang && supportedLangs.includes(lang)) {
    return lang
  }

  lang = navigator.language.toLowerCase();
  if (lang.length > 5) {
    lang = lang.substring(0, 5);
  }

  if (lang && supportedLangs.includes(lang)) {
    return lang
  } else {
    return 'en'
  }
}

function t(name: string, data?: Record<string, string>) {
  const lang = detectLang();
  const locale = messages[lang];
  let msg = "";

  if (locale) {
    msg = locale[name];
    if (typeof msg === "undefined") {
      msg = messages.en[name];
      if (typeof msg === "undefined") {
        msg = name;
      }
    }
  }

  if (data) {
    for (const key in data) {
      msg = msg.replace(`{${key}}`, data[key]);
    }
  }

  return msg;
}

export {
  t,
  detectLang,
}