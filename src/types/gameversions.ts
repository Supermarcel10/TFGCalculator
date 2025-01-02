export type VersionType = "mod" | "modpack";

export interface Constants {
	nuggetMb? : number;
	ingotMb? : number;
	blockMb? : number;
}

export interface BaseGameVersion {
	id : string;
	displayName : string;
	version : string;
	gameVersion : string;
	constants : Constants;
	supported : boolean;
}

export interface ModpackVersion extends BaseGameVersion {}

export interface ModVersion extends BaseGameVersion {}

export interface GameVersions {
	modpack : ModpackVersion[];
	mod : ModVersion[];
	lastUpdated : string;
	version : string;
	schemaVersion : string;
}

export interface RouteParams {
	type : VersionType;
	id : string;
	version : string;
}
