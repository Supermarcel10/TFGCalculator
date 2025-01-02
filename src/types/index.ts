export interface SmeltingOutput {
	name : string;
	components : SmeltingComponent[];
	producible? : boolean;
	type : SmeltingOutputType;
}

export interface MetalSmeltingOutput extends SmeltingOutput {
	default? : SmeltingComponentDefaultOption[];
}

export interface AlloySmeltingOutput extends SmeltingOutput {}

export enum SmeltingOutputType {
	METAL,
	ALLOY
}

/**
 * Guard function to determine if SmeltingOutput is of a given type
 * @param output Unknown output type
 * @param outputType Check against given output type
 */
export function isOutputType(output : SmeltingOutput, outputType : SmeltingOutputType) {
	return output.type === outputType;
}

export interface SmeltingComponent {
	mineral : string;
	min : number;
	max : number;
}

export enum SmeltingComponentDefaultOption {
	BLOCK = "block",
	INGOT = "ingot",
	NUGGET = "nugget",

	ROD = "rod",
}

export interface InputMineral {
	name : string;
	produces : string;
	yield : number;
	uses? : MineralUseCase[];
}

export interface QuantifiedInputMineral extends InputMineral {
	quantity : number;
}

export enum MineralUseCase {
	Vessel = "vessel",
	Crucible = "crucible",
	Bloomery = "bloomery",
	BlastFurnace = "blast_furnace"
}

export enum DesiredOutputTypes {
	Ingot,
	Nugget,
	Millibucket
}
