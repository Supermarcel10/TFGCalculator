import {cache} from "react";
import {RouteParams} from "@/types/gameversions";
import {AlloySmeltingOutput, InputMineral, isOutputType, MetalSmeltingOutput, SmeltingOutput, SmeltingOutputType} from "@/types";
import {promises as fs} from "fs";
import path from "path";


interface RawMineralsJson {
	[mineralName : string] : InputMineral[];
}

interface MetalsListResponse {
	metals : MetalSmeltingOutput[];
	alloys : AlloySmeltingOutput[];
}

export interface OutputResponse {
	material : SmeltingOutput;
	minerals : Map<string, InputMineral[]>;
}

export class DataServiceError extends Error {
	constructor(
			public readonly status: number,
			message: string,
			public readonly originalError?: unknown
	) {
		super(message);
		this.name = 'DataServiceError';
	}
}

export class DataService {
	private constructor(
			private readonly dataPath : string
	) {}

	static async initialize(params : RouteParams) : Promise<DataService> {
		const dataPath = path.join(process.cwd(), "src", "data", params.type, params.id, params.version);
		return new DataService(dataPath);
	}

	async getOutputs() : Promise<SmeltingOutput[]> {
		try {
			const filePath = path.join(this.dataPath, "outputs.json");
			const fileContent = await fs.readFile(filePath, "utf-8");
			const rawData : MetalsListResponse = JSON.parse(fileContent);

			return [
				...rawData.metals.map(metal => ({
					name : metal.name,
					components : [
						{
							mineral : metal.name,
							min : 100,
							max : 100
						}
					],
					producible : metal.producible ?? true,
					type: SmeltingOutputType.METAL,
					default: metal.default
				})),
				...rawData.alloys.map(alloy => ({
					name : alloy.name,
					components : alloy.components ?? [],
					producible : alloy.producible ?? true,
					type: SmeltingOutputType.ALLOY
				}))
			];
		} catch (error) {
			throw new DataServiceError(
				500,
				`Failed to load outputs from ${this.dataPath}`,
				error
			);
		}
	}

	async getOutput(outputName : string) : Promise<OutputResponse> {
		try {
			const outputs = await this.getOutputs();
			outputs.forEach(output => console.log(output.components));

			const smeltingOutput = outputs.find(
					(output : SmeltingOutput) => output.name.toLowerCase() === outputName.toLowerCase()
			) || null;

			if (smeltingOutput) {
				return {
					material : smeltingOutput,
					minerals : await this.getMineralsForOutput(smeltingOutput)
				};
			}
		} catch (error) {
			throw new DataServiceError(
					500,
					`Failed to load output ${outputName} for ${this.dataPath}`,
					error
			);
		}

		throw new DataServiceError(
				404,
				`Output ${outputName} not found!`
		);
	}

	private async getMineralsForOutput(output : SmeltingOutput) : Promise<Map<string, InputMineral[]>> {
		const minerals = await this.loadMinerals();

		return isOutputType(output, SmeltingOutputType.ALLOY)
		       ? this.getMineralsForAlloy(output, minerals)
		       : this.getMineralsForMetal(output, minerals);
	}

	private async getMineralsForMetal(metal : SmeltingOutput, minerals : RawMineralsJson) : Promise<Map<string, InputMineral[]>> {
		const metalMinerals = minerals[metal.name.toLowerCase()];
		if (!metalMinerals) {
			throw new DataServiceError(
					404,
					`No minerals found for ${metal.name}!`
			);
		}

		return new Map<string, InputMineral[]>([[metal.name, metalMinerals]]);
	}

	private async getMineralsForAlloy(alloy : SmeltingOutput, minerals : RawMineralsJson) : Promise<Map<string, InputMineral[]>> {
		const combinedMinerals = new Map<string, InputMineral[]>;

		alloy.components.forEach(component => {
			const componentMinerals = minerals[component.mineral.toLowerCase()];
			if (!componentMinerals) {
				throw new DataServiceError(
						404,
						`No minerals found for ${alloy.name} with name ${component.mineral}!`
				);
			}

			combinedMinerals.set(component.mineral.toLowerCase(), componentMinerals);
		});

		return combinedMinerals;
	}

	private async loadMinerals() : Promise<RawMineralsJson> {
		try {
			const filePath = path.join(this.dataPath, "minerals.json");
			const fileContent = await fs.readFile(filePath, "utf-8");
			return JSON.parse(fileContent);
		} catch (error) {
			throw new DataServiceError(
					500,
					`Failed to load minerals from ${this.dataPath}`,
					error
			);
		}
	}
}

export const getDataService = cache(async(params : RouteParams) : Promise<DataService> => {
	if (!params.type || !params.id || !params.version) {
		throw new DataServiceError(
				400,
				"Missing required parameters: type, id, and version are required"
		);
	}

	return DataService.initialize(params);
});
