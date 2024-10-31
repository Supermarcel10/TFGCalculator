import {ErrorComponent} from "@/app/components/ErrorComponent";
import {AlloyProductionResult} from "@/app/functions/algorithm";
import React from "react";


const successFormatting = "bg-green-700 text-white";
const failureFormatting = "bg-yellow-400 text-black";

interface OutputResultProps {
	output : AlloyProductionResult | null;
	mbPerIngot : number;
}

export function OutputResultComponent({output, mbPerIngot} : Readonly<OutputResultProps>) {
	if (!output) return;

	const innerElement = GetInnerOutput(output, mbPerIngot);
	if (!innerElement) {
		return (
				<ErrorComponent error={"Unexpected output: Required materials not received!"}/>
		)
	}

	return (
			<div className={`rounded-lg shadow p-6 ${output.success ? successFormatting : failureFormatting}`}>
				<h2 className="text-xl text-center font-bold mb-4">OUTPUT</h2>
				{innerElement}
			</div>
	)
}

function GetInnerOutput(output : AlloyProductionResult, mbPerIngot : number) : React.JSX.Element | null {
	if (!output.success) return (<p className="text-lg text-center">{output.message}!</p>)
	if (output.usedMinerals.length == 0) return null;

	return (
			<div>
				<p className="text-xl text-center">Yields exactly {output.outputMb / mbPerIngot} ingots!</p>
				<div className="p-4">
					<div className="flex flex-wrap justify-center gap-4">
						{output.usedMinerals.map(usedMineral => {
							const mineralName = usedMineral.mineral.name;
							const mineralQuantity = usedMineral.quantity;

							return (
									<div key={mineralName}
									     className="bg-white text-black rounded-lg flex flex-col text-center w-full
								     md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]">
										<p className="mt-3 text-lg">{mineralName}</p>
										<p className="mb-3 text-sm">x{mineralQuantity}</p>
									</div>
							)
						})}
					</div>
				</div>
			</div>
	)
}
