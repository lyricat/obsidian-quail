import { App, PluginSettingTab, Setting } from 'obsidian';
import { QuailPlugin } from '../interface';
import manifest from '../../manifest.json';
import { ErrorModal, LoadingModal, MessageModal, PublishResultModal } from 'src/modals';

class QuailSettingTab extends PluginSettingTab {
	plugin: QuailPlugin;
  app: App;
	showDebugCounter = 0;
	showDebugSection = false;
	constructor(app: App, plugin: QuailPlugin) {
		super(app, plugin as never); // Type assertion to fix type mismatch
		this.plugin = plugin;
    this.app = app;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl("h5", { text: "Quaily" });

		if (this.plugin.isLogged()) {
			new Setting(containerEl)
				.setHeading()
				.setName('Hello, ' + this.plugin.settings.me.name)
				.setDesc('You are logged in as ' + this.plugin.settings.me.email)
				.addButton(button => button
					.setButtonText('Logout')
          .setWarning()
					.onClick(async () => {
						await this.plugin.clearTokens();
						this.display();
					})
				)
		} else {
			new Setting(containerEl)
        .setHeading()
        .setName('Login to Quaily')
        .setDesc('Please login to use the plugin')
        .addButton(button => button
          .setCta()
          .setButtonText('Login')
          .onClick(async () => {
            await this.plugin.login();
            this.display();
          })
        )
		}

		const chSec = new Setting(containerEl)
			.setName('Channel')
			.setDesc('Select the channel you want to use')
		if (this.plugin.settings.lists?.length !== 0) {
			chSec.addDropdown(dropdown => {
				if (this.plugin.settings.lists?.length === 0) {
					dropdown.addOption('none', 'No channel found');
				} else {
					for (let ix = 0; ix < this.plugin.settings.lists.length; ix++) {
						const list = this.plugin.settings.lists[ix];
						dropdown.addOption(list.id, list.title);
					}
				}
				dropdown.setValue(this.plugin.settings.listID);
				dropdown.onChange(async (value) => {
					this.plugin.settings.listID = value;
					await this.plugin.saveSettings();
				});
			})
		} else {
			chSec.addButton(button => button
				.setCta()
				.setButtonText('Create a channel')
				.onClick(async () => {
					window.open('https://quaily.com/dashboard', '_blank');
				})
			)
		}

		containerEl.createEl("h6", { text: "Editor" });


		new Setting(containerEl)
			.setName('Strict line breaks')
			.setDesc('Markdown specs ignore single line breaks. If you want to keep them, enable this option.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.strictLineBreaks)
				.onChange(async (value) => {
					this.plugin.settings.strictLineBreaks = value;
					await this.plugin.saveSettings();
				}));

		const version = containerEl.createDiv({
			cls: "setting-item",
		});

		version.innerText = `version: ${manifest.version}`;
		version.style.fontSize = "0.8em";
		version.style.width = "100%";
		version.style.textAlign = "left";
		version.style.color = "gray";
		version.onclick = () => {
			if (this.showDebugCounter === 4) {
				this.showDebugSection = !this.showDebugSection;
				this.showDebugCounter = 0;
				this.display();
			}
			this.showDebugCounter++;
		}

		if (!this.showDebugSection) {
			// debug section
			containerEl.createEl("h6", { text: "Debug" });

			const textareaContainer = containerEl.createDiv({
				cls: "setting-item",
			});

			const textarea = textareaContainer.createEl("textarea", {
				cls: "setting-item-control",
				attr: { placeholder: "Enter your settings here...", disabled: "true" },
			});

			textarea.style.width = "100%";
			textarea.style.height = "200px";
			textarea.style.textAlign = "left";
			textarea.value = `list id: ${this.plugin.settings.listID}
list slug: ${this.plugin.settings.listSlug}
access token: ${this.plugin.settings.accessToken}
refresh token: ${this.plugin.settings.refreshToken}
token expiry: ${this.plugin.settings.tokenExpiry}`;

      const buttonsSec = new Setting(containerEl)
      .setName('Dialog Test')
      buttonsSec.addButton(button => button
        .setButtonText('Publish')
        .onClick(async () => {
          new PublishResultModal(this.app, null, "https://quaily.com", "This is a test title", "This is a test summary. The gray fox jumps over the lazy dog.", "https://quaily.com/portal-images/illustration/finance-you-0.webp").open();
        })
      )
      buttonsSec.addButton(button => button
        .setButtonText('Message')
        .onClick(async () => {
          new MessageModal(this.app, { title: 'Test', message: 'This is a test message.', icon: '🤖', iconColor: 'blue' }).open();
        })
      )
      buttonsSec.addButton(button => button
        .setButtonText('Loading')
        .onClick(async () => {
          new LoadingModal(this.app).open();
        })
      )
      buttonsSec.addButton(button => button
        .setButtonText('Error')
        .onClick(async () => {
          new ErrorModal(this.app, new Error('This is a test error.')).open();
        })
      )
		}
	}
}

export default QuailSettingTab;