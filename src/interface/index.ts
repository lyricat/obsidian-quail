export interface QuailPluginSettings {
	listID: string;
	listSlug: string;

	accessToken: string;
	refreshToken: string;
	tokenExpiry: string;

	me: any;
	lists: any;

	strictLineBreaks: boolean;
}

export interface QuailImageItem {
	pathname: string;
	formalized_pathname: string;
	name: string;
	data: ArrayBuffer;
	mimeType: string;
}