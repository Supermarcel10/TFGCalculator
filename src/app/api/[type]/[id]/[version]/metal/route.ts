import {NextResponse} from "next/server";
import {RouteParams, VersionType} from "@/types/gameversions";
import {DataServiceError, getDataService} from "@/services/data/dataService";


interface RouteContext {
	params : {
		type : VersionType;
		id : string;
		version : string;
	};
}

export async function GET(
		_ : Request,
		context : RouteContext
) {
	const {type, id, version} = context.params;

	try {
		const routeParams : RouteParams = {type, id, version};
		const dataService = await getDataService(routeParams);
		return NextResponse.json(await dataService.getOutputs());
	} catch (error) {
		if (error && error instanceof DataServiceError) {
			console.error(`${error.message}: ${error.originalError}`);
			return NextResponse.json(
				{message : error.message},
				{status : error.status}
			);
		}

		console.error(`Failed to fetch metals data: ${error}`);
		return NextResponse.json(
				{error : "Failed to fetch metals data"},
				{status : 500}
		);
	}
}