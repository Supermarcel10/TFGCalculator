import {ErrorComponent} from "@/app/components/ErrorComponent";
import {MineralAccordion} from "@/app/components/MineralAccordion";
import {OutputResultComponent} from "@/app/components/OutputResultComponent";
import {AlloyProductionResult, calculateAlloy, MineralWithQuantity} from "@/app/functions/algorithm";
import {capitaliseFirstLetterOfEachWord, getBaseMineralFromOverride} from "@/app/functions/utils";
import {Alloy, AlloyComponent, Mineral, MineralUse} from "@/app/types";
import React, {useEffect, useState} from "react";


interface AlloyDisplayProps {
	alloy? : string;
}


export function AlloyComponentDisplay({alloy} : Readonly<AlloyDisplayProps>) {
	const [alloyMixture, setAlloyMixture] = useState<Alloy | null>(null);
	const [alloyMinerals, setAlloyMinerals] = useState<Mineral[]>([]);
	const [targetIngotCount, setTargetIngotCount] = useState<number>(0);
	const [mineralQuantities, setMineralQuantities] = useState<Map<string, number>>(new Map());

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCalculating, setIsCalculating] = useState<boolean>(false);
	const [result, setResult] = useState<AlloyProductionResult | null>(null);
	const [isResultAlteredSinceLastCalculation, setIsResultAlteredSinceLastCalculation] = useState<boolean>(false);
	const [error, setError] = useState<Error | string | null>(null);

	const mbPerIngot : number = 144;
	const mbPerNugget : number = 16;

	useEffect(() => {
		if (!alloy) return;
		if (alloyMixture && alloyMinerals) return;

		const fetchAlloyDetails = fetch(`/api/alloy/${encodeURIComponent(alloy)}`)
				.then(response => response.json())
				.then(data => setAlloyMixture(data))
				.catch(error => console.error("Error fetching alloy details:", error));

		const fetchAlloyMinerals = fetch(`api/alloy/${encodeURIComponent(alloy)}/minerals`)
				.then(response => response.json())
				.then(data => setAlloyMinerals(data))
				.catch(error => console.error("Error fetching alloy minerals:", error))

		Promise.all([fetchAlloyDetails, fetchAlloyMinerals])
		       .then(() => {
			       setIsLoading(false);
		       })
	}, [alloy, alloyMixture, alloyMinerals]);

	const handleIngotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		setTargetIngotCount(isNaN(value) ? 0 : value);
		setIsResultAlteredSinceLastCalculation(true);
	};

	const handleMineralQuantityChange = (mineralName: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		setMineralQuantities(prev => new Map(prev).set(mineralName, isNaN(value) ? 0 : value));
		setIsResultAlteredSinceLastCalculation(true);
	};

	const handleCalculate = () => {
		if (!alloyMixture || !alloyMinerals || isCalculating) return;

		setIsCalculating(true);

		try {
			const mineralWithQuantities: MineralWithQuantity[] = Array.from(mineralQuantities.entries()).map(
					([mineralName, quantity]) => {
						let mineral = alloyMinerals.find(m => m.name === mineralName);

						if (!mineral) {
							const baseMineralName = getBaseMineralFromOverride(mineralName);

							if (mineralName.toLowerCase().includes('ingot')) {
								mineral = ingotOverride(baseMineralName);
							} else if (mineralName.toLowerCase().includes('nugget')) {
								mineral = nuggetOverride(baseMineralName);
							}
						}

						return {
							mineral: mineral!,
							quantity
						};
					}).filter(m => m.quantity > 0);
			setResult(calculateAlloy(targetIngotCount * mbPerIngot, alloyMixture, mineralWithQuantities));
		} catch (e) {
			console.log(e);
			if (e instanceof Error) {
				setError(e);
			} else {
				setError(String(e));
			}
		} finally {
			setIsCalculating(false);
			setIsResultAlteredSinceLastCalculation(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleCalculate();
		}
	};

	// Group minerals by what they produce
	const groupedMinerals = React.useMemo(() => {
		if (!alloyMinerals) return new Map<string, Mineral[]>();

		const grouped = new Map<string, Mineral[]>();
		alloyMinerals.forEach(mineral => {
			const produces = mineral.produces.toLowerCase();
			if (!grouped.has(produces)) {
				grouped.set(produces, []);
			}
			grouped.get(produces)?.push(mineral);
		});
		return grouped;
	}, [alloyMinerals]);

	const isReadyToShowInputs : boolean =
			targetIngotCount !== 0
			&& !isLoading;

	const isReadyToShowOutputs : boolean =
			targetIngotCount !== 0
			&& !isResultAlteredSinceLastCalculation
			&& !error;

	const ingotOverride = (mineral: string): Mineral => {
		return {
			name: `${capitaliseFirstLetterOfEachWord(mineral)} Ingot`,
				produces: mineral,
				yield: mbPerIngot,
				uses: [
					MineralUse.Vessel,
					MineralUse.Crucible
				],
		}
	}

	const nuggetOverride = (mineral: string): Mineral=> {
		return {
			name: `${capitaliseFirstLetterOfEachWord(mineral)} Nugget`,
			produces: mineral,
			yield: mbPerNugget,
			uses: [
				MineralUse.Vessel,
				MineralUse.Crucible
			],
		}
	}

	function componentIngotAvailable(component : AlloyComponent) : boolean {
		return component.hasIngot == null || component.hasIngot;
	}

	function componentNugetAvailable(component : AlloyComponent) : boolean {
		return component.hasNugget == null || component.hasNugget;
	}

	return (
			<div className="container mx-auto p-4" onKeyDown={handleKeyPress}>
				<div className="grid grid-cols-1 gap-6">
					<div className="bg-white text-black rounded-lg shadow p-6">
						<h2 className="text-xl text-center font-bold mb-4">CONSTRAINTS</h2>
						<p className="text-lg text-center mb-8">Enter any constraints and target ingot count!</p>

						{/* Ingot Count Input */}
						<div className="mb-6">
							<label htmlFor="ingotCount" className="text-gray-700 block mb-2">Desired Ingot Quantity</label>
							<input
								type="number"
								id="ingotCount"
								value={targetIngotCount === 0 ? '' : targetIngotCount}
								placeholder="0"
								onChange={handleIngotCountChange}
								min="0"
								className="w-full p-2 border border-gray-300 rounded"
						/>
						</div>
					</div>

					<ErrorComponent error={error}/>
					{isReadyToShowOutputs && <OutputResultComponent output={result} mbPerIngot={mbPerIngot}/>}

					{isReadyToShowInputs && <div className="bg-white text-black rounded-lg shadow p-6">
						<h2 className="text-xl text-center font-bold mb-4">INPUT</h2>
						<p className="text-lg text-center mb-8">Enter all available minerals in your inventory!</p>

						{/* Minerals */}
						{alloyMixture?.components.map(component => {
							const mineral = component.mineral.toLowerCase();
							let componentMinerals = groupedMinerals.get(mineral) || [];

							if (componentMinerals.length === 0) {
								return (
										<ErrorComponent
												key={mineral}
												error={`Failed to retrieve mineral ${mineral}`}
												className="mb-8"
										/>
								);
							}

							componentMinerals = [...componentMinerals];

							const hasIngot = componentMinerals.some(m => m.name.toLowerCase().includes('ingot'));
							const hasNugget = componentMinerals.some(m => m.name.toLowerCase().includes('nugget'));

							if (!hasIngot && componentIngotAvailable(component)) {
								componentMinerals.push(ingotOverride(component.mineral));
							}

							if (!hasNugget && componentNugetAvailable(component)) {
								componentMinerals.push(nuggetOverride(component.mineral));
							}

							return (
									<MineralAccordion
											key={mineral}
											title={capitaliseFirstLetterOfEachWord(mineral)}
											minerals={componentMinerals}
											mineralQuantities={mineralQuantities}
											onQuantityChange={handleMineralQuantityChange}
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
			</div>
	);
}
