import { App, SuggestModal } from 'obsidian';
import { MessageModal, ErrorModal } from '../modals';
import { QuailPluginSettings } from '../interface';

class ChannelSuggestModal extends SuggestModal<{title: string, id: string}> {
  channelList: Array<{title: string, id: string}>;
  onSelect: (item: {title: string, id: string}) => void;

  constructor(app: App, channelList: Array<{title: string, id: string}>, onSelect: (item: {title: string, id: string}) => void) {
    super(app);
    this.channelList = channelList;
    this.onSelect = onSelect;
    this.setPlaceholder("Select a channel");
  }

  getSuggestions(): Array<{title: string, id: string}> {
    return this.channelList;
  }

  renderSuggestion(item: {title: string, id: string}, el: HTMLElement) {
    el.createEl("div", { text: item.title });
  }

  onChooseSuggestion(item: {title: string, id: string}) {
    this.onSelect(item);
  }
}

export default function setChannel(app: App, settings: QuailPluginSettings, saveSettings: () => Promise<void>) {
  return {
    id: 'quail-set-channel',
    name: 'Set Default Channel',
    callback: async () => {
      try {
        const lists = settings.lists;
        if (!lists || lists.length === 0) {
          new MessageModal(app, {
            title: "No Channels Found",
            message: "You don't have any channels available.",
            icon: "⚠️",
            iconColor: "orange"
          }).open();
          return;
        }

        const channelList = lists.map((list: any) => ({
          title: list.title,
          id: list.id
        }));

        new ChannelSuggestModal(app, channelList, async (item) => {
          for (let ix = 0; ix < lists.length; ix++) {
            if (lists[ix].id === item.id) {
              settings.listID = lists[ix].id;
              settings.listSlug = lists[ix].slug;
              await saveSettings();
              new MessageModal(app, {
                title: "Success",
                message: `Default channel set to: ${item.title}`,
                icon: "✅",
                iconColor: "green"
              }).open();
              return;
            }
          }
        }).open();
      } catch (e) {
        new ErrorModal(app, e).open();
      }
    }
  };
}