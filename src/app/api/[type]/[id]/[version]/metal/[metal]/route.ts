import {InputMineral, MineralUseCase, SmeltingOutput} from "@/types";
import {NextResponse} from "next/server";
import {RouteParams} from "@/types/gameversions";
import {DataServiceError, getDataService} from "@/services/data/dataService";


export interface ApiResponse {
	material: SmeltingOutput;
	minerals: Record<string, InputMineral[]>;
}

interface RouteContext {
	params : RouteParams & {
		metal : string;
	};
}

export async function GET(
		request : Request,
		{params} : RouteContext
) {
	const {metal, type, id, version} = params;
	const {searchParams} = new URL(request.url);
	const uses = searchParams.getAll("uses").map(use => use as MineralUseCase);
	const decodedMetal = decodeURIComponent(metal).toLowerCase();

	try {
		const dataService = await getDataService({type, id, version});
		const metalResponse = await dataService.getOutput(decodedMetal);

		const filteredMinerals = filterMineralsByUses(metalResponse.minerals, uses);
		const mineralsObject = Object.fromEntries(filteredMinerals);

		return NextResponse.json(
				{
					material : metalResponse.material,
					minerals : mineralsObject
				});
	} catch (error) {
		if (error && error instanceof DataServiceError) {
			console.error(`${error.message}: ${error.originalError}`);
			return NextResponse.json(
					{message : error.message},
					{status : error.status}
			);
		}

		console.error(`Unknown failure to fetch ${decodedMetal}: ${error}`);
		return NextResponse.json(
				{error : `Unknown failure to fetch ${decodedMetal}: ${error}`,},
				{status : 500}
		);
	}
}

/**
 * Filters minerals based on their use cases using non-exclusive OR.
 * Returns true if no uses are specified or if the mineral has any of the specified uses.
 * @param minerals The map of InputMinerals to filter
 * @param uses Array of MineralUseCase to filter by
 * @returns Filtered map of InputMinerals
 */
function filterMineralsByUses(minerals : Map<string, InputMineral[]>, uses : MineralUseCase[]) : Map<string, InputMineral[]> {
	if (uses.length === 0) {
		return minerals;
	}

	minerals.forEach((component, key) => {
		minerals.set(key, component.filter(mineral => uses.some(use => mineral.uses?.includes(use))));
	});

	return minerals;
}