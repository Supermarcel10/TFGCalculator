import {ErrorComponent} from "@/components/ErrorComponent";
import {MineralAccordion} from "@/components/MineralAccordion";
import {OutputResult} from "@/components/OutputResult";
import {calculateMetal, MetalProductionResult} from "@/functions/algorithm";
import {capitaliseFirstLetterOfEachWord, getBaseMineralFromOverride} from "@/functions/utils";
import {DesiredOutputTypes, InputMineral, MineralUseCase, QuantifiedInputMineral, SmeltingComponent, SmeltingComponentDefaultOption, SmeltingOutput} from "@/types";
import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {ApiResponse} from "@/app/api/[type]/[id]/[version]/metal/[metal]/route";


interface MetalDisplayProps {
	metal? : string;
}

export function MetalComponentDisplay({metal} : Readonly<MetalDisplayProps>) {
	const {type, id, version} = useParams();

	const [mixture, setMixture] = useState<SmeltingOutput | null>(null);
	const [minerals, setMinerals] = useState<Map<string, QuantifiedInputMineral[]>>(new Map());
	const [unit, setUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [desiredOutputInUnits, setDesiredOutputInUnits] = useState<number>(0);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCalculating, setIsCalculating] = useState<boolean>(false);
	const [isResultAlteredSinceLastCalculation, setIsResultAlteredSinceLastCalculation] = useState<boolean>(false);
	const [result, setResult] = useState<MetalProductionResult | null>(null);
	const [error, setError] = useState<Error | string | null>(null);

	// TODO: Utilise the version specific constants instead.
	const mbPerDefault = new Map<SmeltingComponentDefaultOption, number>(
			[
				[SmeltingComponentDefaultOption.INGOT, 144],
				[SmeltingComponentDefaultOption.NUGGET, 16]
			]
	);

	useEffect(() => {
		if (!metal) {
			return;
		}

		fetch(`/api/${type}/${id}/${version}/metal/${metal}`)
				.then(response => response.ok
				                  ? response.json() as Promise<ApiResponse>
				                  : Promise.reject(`HTTP error! status: ${response.status}`))
				.then(data => {
					setMixture(data.material);
					setMinerals(new Map(
							Object.entries(data.minerals).map(([name, minerals]) => [
								                                  name,
								                                  minerals.map(m => ({...m, quantity : 0}))
							                                  ]
							)
					));
				})
				.catch(error => {
					setError("Error fetching metal details");
					console.error("Error fetching metal details:", error);
				})
				.finally(() => setIsLoading(false));
	}, [type, id, version, metal]);

	const handleDesiredTargetChange = (e : React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
		setDesiredOutputInUnits(isNaN(value) ? 0 : value);
		setIsResultAlteredSinceLastCalculation(true);
	};

	const handleMineralQuantityChange = (mineralName : string, e : React.ChangeEvent<HTMLInputElement>) => {
		const newQty = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
		setMinerals(prevMinerals => updateMineralQuantity(prevMinerals, mineralName, newQty));
		setIsResultAlteredSinceLastCalculation(true);
	};

	const updateMineralQuantity = (
			prevMinerals : Map<string, QuantifiedInputMineral[]>,
			mineralName : string,
			newQuantity : number
	) : Map<string, QuantifiedInputMineral[]> => {
		const newMap = new Map(prevMinerals);

		for (const [componentName, mineralArray] of newMap.entries()) {
			const updatedMinerals = [...mineralArray];

			for (let i = 0; i < updatedMinerals.length; i++) {
				if (updatedMinerals[i].name === mineralName) {
					updatedMinerals[i] = {
						...updatedMinerals[i],
						quantity : newQuantity
					};
				}
			}

			newMap.set(componentName, updatedMinerals);
		}

		return newMap;
	};

	// TODO: Possibly might need to get rid of this and do it dynamically for TFC (no nuggets)
	const unitToMbConversion : Record<DesiredOutputTypes, number> = {
		[DesiredOutputTypes.Ingot] : mbPerDefault.get(SmeltingComponentDefaultOption.INGOT) ?? 144,
		[DesiredOutputTypes.Nugget] : mbPerDefault.get(SmeltingComponentDefaultOption.NUGGET) ?? 16,
		[DesiredOutputTypes.Millibucket] : 1
	} as const;

	const getDesiredOutputInMb = () : number => desiredOutputInUnits * (unitToMbConversion[unit] ?? 1);

	const handleCalculate = async() => {
		if (!mixture || !minerals || isCalculating) {
			return;
		}

		setIsCalculating(true);
		await new Promise(resolve => setTimeout(resolve, 0));

		try {
			const mineralWithQuantities : Map<string, QuantifiedInputMineral[]> = new Map();

			// Keep non-zero quantities
			for (const [category, mineralArray] of minerals) {
				const nonZeroMinerals = mineralArray.filter(m => m.quantity > 0);

				if (nonZeroMinerals.length > 0) {
					mineralWithQuantities.set(category, nonZeroMinerals);
				}
			}

			setResult(calculateMetal(getDesiredOutputInMb(), mixture, mineralWithQuantities));
		} catch (err) {
			setError(`Failed to calculate! ${err}`);
			console.error("Error calculating:", err);
		} finally {
			setIsCalculating(false);
			setIsResultAlteredSinceLastCalculation(false);
		}
	};

	const handleKeyPress = async(e : React.KeyboardEvent) => {
		if (e.key === "Enter") {
			await handleCalculate();
		}
	};

	const isReadyToShowInputs : boolean =
			desiredOutputInUnits !== 0
			&& !isLoading;

	const isReadyToShowOutputs : boolean =
			desiredOutputInUnits !== 0
			&& !isResultAlteredSinceLastCalculation
			&& !error;

	// TODO: Fix defaults based on new structure
	// function defaultOverride(mineral : string, defaultOption : SmeltingComponentDefaultOption) : QuantifiedInputMineral {
	// 	return {
	// 		name : `${capitaliseFirstLetterOfEachWord(mineral + " " + defaultOption)}`,
	// 		produces : mineral,
	// 		yield : mbPerDefault.get(defaultOption) ?? 0,
	// 		uses : [
	// 			MineralUseCase.Vessel,
	// 			MineralUseCase.Crucible
	// 		],
	// 		quantity : 0
	// 	};
	// }

	// function componentDefaultAvailable(component : SmeltingComponent, defaultOption : SmeltingComponentDefaultOption) {
	// 	return component.default?.includes(defaultOption);
	// }

	return (
			<div className="container mx-auto p-4 grid grid-cols-1 gap-6">
				<div className="bg-white text-black rounded-lg shadow p-6">
					<h2 className="text-xl text-center font-bold mb-4">CONSTRAINTS</h2>
					<p className="text-lg text-center mb-8">Enter any constraints and target ingot count!</p>

					{/* Count Input */}
					{/* TODO: Investigate some issues with dark reader related to this */}
					<div className="mb-6">
						<label htmlFor="desiredOutputCount" className="block mb-2 text-gray-700">Desired Quantity</label>
						<div className="flex">
							<input
									type="number"
									id="desiredOutputCount"
									value={desiredOutputInUnits === 0 ? "" : desiredOutputInUnits}
									placeholder="0"
									onChange={handleDesiredTargetChange}
									onKeyDown={handleKeyPress}
									min="0"
									className="flex-1 p-2 rounded-l border border-r-0 border-gray-300 bg-white text-gray-700 no-spinners"
							/>
							<select
									value={unit}
									onChange={(e) => setUnit(e.target.value as unknown as DesiredOutputTypes)}
									className="w-24 p-2 rounded-r border border-l-0 border-gray-300 bg-white text-gray-700"
									aria-label="unit"
							>
								<option value={DesiredOutputTypes.Ingot} aria-label="ingots">Ingot(s)</option>
								<option value={DesiredOutputTypes.Nugget} aria-label="nuggets">Nugget(s)</option>
								<option value={DesiredOutputTypes.Millibucket} aria-label="milli-bucket">mB</option>
							</select>
						</div>
					</div>
				</div>

				<ErrorComponent error={error}/>
				{isReadyToShowOutputs && <OutputResult output={result} unit={unit} conversions={unitToMbConversion}/>}

				{isReadyToShowInputs && <div className="bg-white text-black rounded-lg shadow p-6">
					<h2 className="text-xl text-center font-bold mb-4">INPUT</h2>
					<p className="text-lg text-center mb-8">Enter all available minerals in your inventory!</p>

					{/* Minerals */}
					{mixture?.components.map(component => {
						const mineralName = component.mineral.toLowerCase();
						const componentMinerals = minerals.get(mineralName) ?? [];

						if (componentMinerals.length === 0) {
							return (
									<ErrorComponent
											key={mineralName}
											error={`Failed to retrieve mineral ${mineralName}`}
											className="mb-6"
									/>
							);
						}

						// for (const defaultOption in SmeltingComponentDefaultOption) {
						// 	const alreadyExists = componentMinerals.some(m => m.name.toLowerCase().includes(defaultOption.toLowerCase()));
						// 	const shouldDefault = componentDefaultAvailable(component, defaultOption as SmeltingComponentDefaultOption);
						//
						// 	if (!alreadyExists && shouldDefault) {
						// 		componentMinerals.push(defaultOverride(component.mineral, defaultOption as SmeltingComponentDefaultOption));
						// 	}
						// }

						return (
								<MineralAccordion
										key={mineralName}
										title={capitaliseFirstLetterOfEachWord(mineralName)}
										minerals={componentMinerals}
										onQuantityChange={handleMineralQuantityChange}
										onInputKeyPress={handleKeyPress}
								/>
						);
					})}

					{/* Calculate Button */}
					<div className="mt-6 text-center">
						<button
								onClick={handleCalculate}
								disabled={isCalculating}
								className={`px-4 py-2 mt-6 rounded transition-colors ${
										isCalculating
										? "bg-gray-400 cursor-not-allowed"
										: "bg-green-600 hover:bg-green-700"
								} text-white`}
						>
							{isCalculating ? "Calculating..." : "Calculate"}
						</button>
					</div>
				</div>}
			</div>
	);
}
