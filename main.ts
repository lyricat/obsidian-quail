import { Plugin } from 'obsidian';
import { getActions } from './src/actions';
import { QuailPluginSettings } from './src/interface';
import { Client, AuxiliaClient } from 'quail-js';
import { startLoginElectron, refreshToken } from './src/oauth/oauth';
import QuailSettingTab from './src/setting';

const DEFAULT_SETTINGS: QuailPluginSettings = {
	listID: '',
	listSlug: '',
	strictLineBreaks: true,
	useEnglishCmds: false,
	useFirstImageAsCover: false,
	// tokens
	accessToken: '',
	refreshToken: '',
	tokenExpiry: '',
	// user info
	me: null,
	lists: [],
}

export default class QuailPlugin extends Plugin implements QuailPlugin {
	settings: QuailPluginSettings;
	client: any;
	auxiliaClient: any;

	async onload() {
		await this.loadSettings();

		await this.updateToken();

		this.getClients();

		if (this.isLogged()) {
			const q = [
				this.updateChannels(),
				this.updateMe(),
			];

			await Promise.all(q);

			await this.saveSettings();
		}

		await this.loadActions();
		// const actions = getActions(this.client, this);
		// for (let ix = 0; ix < actions.length; ix++) {
		// 	const action:any = actions[ix];
		// 	this.addCommand(action);
		// }

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new QuailSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	getClients() {
		this.client = new Client({
			access_token: this.settings.accessToken,
			apibase: 'https://api.quail.ink',
			debug: false,
		});
		this.auxiliaClient = new AuxiliaClient({
			access_token: this.settings.accessToken,
			apibase: 'https://api.quail.ink',
			debug: false,
		});
	}

	async loadActions() {
		const actions = getActions(this);
		if (actions.length === 0) {
			console.error("quaily.loadActions: no actions found");
			return;
		} else if (actions.length === 1 && actions[0].id === 'quail-login') {
			this.addCommand(actions[0]);
		} else {
			(this.app as any).commands.removeCommand('quail-login');
			for (let ix = 0; ix < actions.length; ix++) {
				const action:any = actions[ix];
				this.addCommand(action);
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateChannels() {
		const lists = await this.client.getUserLists(this.settings.me.id);
		this.settings.lists = lists;
		let found = false;
		for (let ix = 0; ix < lists.length; ix++) {
			const list = lists[ix];
			if (`${list.id}` === this.settings.listID || list.slug === this.settings.listSlug) {
				found = true;
				this.settings.listID = list.id;
				this.settings.listSlug = list.slug;
				break;
			}
		}
		if (!found) {
			if (lists.length > 0) {
				this.settings.listID = lists[0].id;
				this.settings.listSlug = lists[0].slug;
			} else {
				this.settings.listID = '';
				this.settings.listSlug = '';
			}
		}
	}

	async updateMe() {
		try {
			const me = await this.client.getMe();
			this.settings.me = me;
		} catch (err) {
			this.clearTokens();
			return
		}
	}

	async login() {
		try {
			console.log("quaily.login: oauth flow start");
			// Start the login flow in a popup
			const token = await startLoginElectron();
			// if your auth server is at localhost:8080
			console.log("quaily.login: token expiry:", token.expiry);
			this.settings.accessToken = token.access_token;
			this.settings.refreshToken = token.refresh_token;
			this.settings.tokenExpiry = token.expiry;

			// update the client
			this.getClients();

			// get user info
			const me = await this.client.getMe();
			this.settings.me = me;

			// get lists
			await this.updateChannels();

			await this.saveSettings();

			await this.loadActions();
			// store them somewhere safe (e.g. Obsidian plugin storage)
		} catch (err) {
			console.error("quaily.login: oauth flow error:", err);
		}
	}

	async refreshToken() {
		try {
			console.log("quaily.refreshToken: refresh flow start");
			// Start the login flow in a popup
			const token = await refreshToken(this.settings.refreshToken)
			// if your auth server is at localhost:8080
			console.log("quaily.refreshToken: access token expiry:", token.expiry);
			this.settings.accessToken = token.access_token;
			this.settings.refreshToken = token.refresh_token;
			this.settings.tokenExpiry = token.expiry;
			await this.saveSettings();
		} catch (err) {
			console.error("quaily.refreshToken: refresh token flow error:", err);
		}
	}

	async clearTokens() {
		console.log("quaily.clearTokens: clear tokens");
		this.settings.accessToken = '';
		this.settings.refreshToken = '';
		this.settings.tokenExpiry = '';
		await this.saveSettings();
		await this.loadActions();
	}

	isLogged () {
		if (this.settings.accessToken === ''
			|| this.settings.refreshToken === ''
			|| this.settings.tokenExpiry === ''
			|| this.settings.me === null
			|| this.settings.lists?.length === 0
		) {
			return false;
		}
		return true
	}

	updateToken() {
		if (this.settings.tokenExpiry !== '') {
			const expiry = new Date(this.settings.tokenExpiry);
			const now = new Date();
			const refreshTokenThreshold = 3600*24*364*1000;
			const accessTokenThreshold = 3600*12*1000;
			if (expiry.getTime() <= now.getTime() - refreshTokenThreshold) {
				// if the expiry is more than 364 days ago, need to login again
				console.log("quaily.updateToken: token expired, clear tokens", expiry, now);
				this.clearTokens();
			} else if (expiry.getTime() <= now.getTime() - accessTokenThreshold) {
				// refresh the token if it's less than 12 hours from expiry
				console.log("quaily.updateToken: token expired, refresh token", expiry, now);
				this.refreshToken();
			} else {
				this.refreshToken();
				console.log("quaily.updateToken: token is still valid, nothing to do");
			}
		} else {
			console.log("quaily.updateToken: no token found, clear tokens");
			this.clearTokens();
		}
	}
}
