import {Alloy, AlloyComponent, Mineral} from "@/app/types";

export interface MineralWithQuantity {
	mineral: Mineral;
	quantity: number;
}

export interface AlloyProductionResult {
	outputMb: number;
	usedMinerals: MineralWithQuantity[];
	success: boolean;
	message?: string;
}

const INGOT_SIZE = 144;
const MAX_BATCH_INGOTS = 8;
const MAX_BATCH_MB = MAX_BATCH_INGOTS * INGOT_SIZE;

/**
 * Generates a reverse Fibonacci sequence up to a maximum value
 * @param max The maximum value for generating the Fibonacci sequence
 * @returns An array of Fibonacci numbers in reverse order
 */
const generateReverseFibonacci = (max: number): number[] => {
	if (max <= 0) return [];
	const sequence: number[] = [];
	let [next, prev] = [1, 1];
	for (let t = 1; t <= max; t = next + prev) {
		sequence.push(t);
		[next, prev] = [prev, t];
	}
	return sequence.reverse();
};

const BATCH_SIZE_FIBONACCI_SEQ = generateReverseFibonacci(MAX_BATCH_INGOTS);

/**
 * Groups minerals by their production type, and sorts them from the highest yielding.
 * @param availableMinerals All available minerals.
 */
const groupAndSortMinerals = (availableMinerals: MineralWithQuantity[]): Map<string, MineralWithQuantity[]> => {
	const mineralsByType = new Map<string, MineralWithQuantity[]>();
	for (const mineralWithQty of availableMinerals) {
		const producedMineral = mineralWithQty.mineral.produces.toLowerCase();
		const typeGroup = mineralsByType.get(producedMineral) || [];
		const insertIndex = typeGroup.findIndex(item => item.mineral.yield < mineralWithQty.mineral.yield);

		insertIndex === -1
		? typeGroup.push(mineralWithQty)
		: typeGroup.splice(insertIndex, 0, mineralWithQty);

		mineralsByType.set(producedMineral, typeGroup);
	}
	return mineralsByType;
};

/**
 * Calculates the total available material in millibuckets for each mineral type
 * @param mineralsByType Grouped minerals by production type
 * @returns A map of total available millibuckets for each mineral type
 */
const calculateAvailableMbByType = (mineralsByType: Map<string, MineralWithQuantity[]>): Map<string, number> => {
	const totalAvailableByType = new Map<string, number>();
	mineralsByType.forEach((minerals, type) => {
		const total = minerals.reduce((sum, m) => sum + (m.mineral.yield * m.quantity), 0);
		totalAvailableByType.set(type, total);
	});
	return totalAvailableByType;
};

/**
 * Updates the available minerals after using some minerals
 * @param currentMinerals Current list of available minerals
 * @param usedMinerals Minerals that have been used
 * @returns Updated list of available minerals
 */
const updateAvailableMinerals = (
		currentMinerals: MineralWithQuantity[],
		usedMinerals: MineralWithQuantity[]
): MineralWithQuantity[] => {
	const updatedMinerals = new Map(currentMinerals.map(m => [m.mineral.name, {...m}]));

	usedMinerals.forEach(used => {
		const current = updatedMinerals.get(used.mineral.name);
		if (current) {
			current.quantity -= used.quantity;
			if (current.quantity <= 0) updatedMinerals.delete(used.mineral.name);
		}
	});

	return Array.from(updatedMinerals.values());
};

/**
 * Consolidates used minerals, combining duplicates
 * @param minerals List of minerals to consolidate
 * @returns Consolidated list of minerals
 */
const consolidateUsedMinerals = (minerals: MineralWithQuantity[]): MineralWithQuantity[] => {
	const consolidated = new Map<string, MineralWithQuantity>();
	minerals.forEach(m => {
		const key = m.mineral.name;
		consolidated.set(key, consolidated.has(key)
		                      ? {...m, quantity: consolidated.get(key)!.quantity + m.quantity}
		                      : {...m}
		);
	});
	return Array.from(consolidated.values());
};

/**
 * Determines the next batch size based on remaining material and current batch size
 * @param remainingMb Remaining material in millibuckets
 * @param currentBatchSizeMb Current batch size in millibuckets
 * @returns Next batch size or null if no suitable size found
 */
const getNextBatchSize = (remainingMb: number, currentBatchSizeMb: number): number | null => {
	for (const size of BATCH_SIZE_FIBONACCI_SEQ) {
		const potentialNextBatchMb = size * INGOT_SIZE;
		if (potentialNextBatchMb > remainingMb) continue;
		if (potentialNextBatchMb < currentBatchSizeMb) return potentialNextBatchMb;
	}
	return null;
};

/**
 * Calculates the maximum viable scale for a batch based on available minerals
 * @param batch The batch production result
 * @param availableMinerals Currently available minerals
 * @returns The maximum scale factor for the batch
 */
const calculateViableBatchScale = (
		batch: AlloyProductionResult,
		availableMinerals: MineralWithQuantity[]
): number => Math.min(...batch.usedMinerals.map(usedMineral => {
	const available = availableMinerals.find(m => m.mineral.name === usedMineral.mineral.name)!;
	return Math.floor(available.quantity / usedMineral.quantity);
}), Number.MAX_SAFE_INTEGER);

/**
 * Scales a batch production result
 * @param batchResult The original batch production result
 * @param scale The scale factor to apply
 * @returns Scaled batch production result
 */
const scaleBatch = (
		batchResult: AlloyProductionResult,
		scale: number
): AlloyProductionResult => ({
	success: batchResult.success,
	usedMinerals: batchResult.usedMinerals.map(mineral => ({
		mineral: mineral.mineral,
		quantity: mineral.quantity * scale
	})),
	outputMb: batchResult.outputMb * scale
});

/**
 * Calculates a single batch of alloy production
 * @param targetMb Target volume in millibuckets
 * @param components Required alloy components
 * @param availableMinerals Available minerals for production
 * @returns Batch production result
 */
function calculateSingleBatch(
		targetMb: number,
		components: AlloyComponent[],
		availableMinerals: MineralWithQuantity[]
): AlloyProductionResult {
	const mineralsByType = groupAndSortMinerals(availableMinerals);

	const calculateTotalMb = (minerals: MineralWithQuantity[]): number =>
			minerals.reduce((sum, m) => sum + (m.mineral.yield * m.quantity), 0);

	const isValidCombination = (minerals: MineralWithQuantity[]): boolean => {
		const totalMb = calculateTotalMb(minerals);
		if (Math.abs(Math.round(totalMb) - Math.round(targetMb)) > 0) return false;

		// Group minerals by type and calculate mB for each
		const mbByType = new Map<string, number>();
		minerals.forEach(mineral => {
			const type = mineral.mineral.produces;
			const mb = mineral.mineral.yield * mineral.quantity;
			mbByType.set(type, (mbByType.get(type) ?? 0) + mb);
		});

		// Check percentages
		return components.every(component => {
			const mineralType = component.mineral.toLowerCase();
			const mb = mbByType.get(mineralType) ?? 0;
			const percentage = (mb / totalMb) * 100;
			return percentage >= component.min && percentage <= component.max;
		});
	};

	let currentCombination: MineralWithQuantity[] = [];

	// Process one component at a time
	for (const component of components) {
		const mineralType = component.mineral.toLowerCase();
		const minerals = mineralsByType.get(mineralType) || [];
		const minMb = (component.min / 100) * targetMb;
		const maxMb = (component.max / 100) * targetMb;

		// Get all possible combinations for this component
		const componentCombinations: MineralWithQuantity[][] = [];

		// Generate combinations iteratively
		function generateComponentCombinations() {
			const stack: Array<{
				minerals: MineralWithQuantity[],
				index: number,
				mb: number
			}> = [{
				minerals: [],
				index: 0,
				mb: 0
			}];

			while (stack.length > 0) {
				const current = stack.pop()!;

				// If we have a valid amount for this component, save it
				if (current.mb >= minMb && current.mb <= maxMb) {
					componentCombinations.push([...current.minerals]);
				}

				// If we've processed all minerals or exceeded max, continue
				if (current.index >= minerals.length || current.mb > maxMb) {
					continue;
				}

				const mineral = minerals[current.index];

				// Try using different quantities of this mineral
				for (let qty = 0; qty <= mineral.quantity; qty++) {
					const newMb = current.mb + (mineral.mineral.yield * qty);
					if (newMb > maxMb) break;

					const newMinerals = qty > 0 ? [
						...current.minerals,
						{ mineral: mineral.mineral, quantity: qty }
					] : current.minerals;

					stack.push(
							{
								minerals: newMinerals,
								index: current.index + 1,
								mb: newMb
							}
					);
				}
			}
		}

		generateComponentCombinations();

		// If no valid combinations for this component, return null
		if (componentCombinations.length === 0) {
			return {
				outputMb: 0,
				usedMinerals: [],
				success: false,
				message: `No valid combinations found for component: ${component.mineral}`
			};
		}

		// Try each combination with current combination
		let foundValidCombination = false;
		for (const combination of componentCombinations) {
			const testCombination = [...currentCombination, ...combination];

			// For the last component, check if the entire combination is valid
			if (component === components[components.length - 1]) {
				if (isValidCombination(testCombination)) {
					currentCombination = testCombination;
					foundValidCombination = true;
					break;
				}
			} else {
				// For other components, add them and continue
				currentCombination = testCombination;
				foundValidCombination = true;
				break;
			}
		}

		if (!foundValidCombination) {
			return {
				outputMb: 0,
				usedMinerals: [],
				success: false,
				message: `No valid combination found for component: ${component.mineral}`
			};
		}
	}

	return {
		outputMb: calculateTotalMb(currentCombination),
		usedMinerals: currentCombination,
		success: true
	};
}

/**
 * Finds a valid combination of minerals for alloy production using batched approach
 * @param targetMb Target volume in millibuckets
 * @param components Required alloy components
 * @param availableMinerals Available minerals for production
 * @returns Alloy production result
 */
function findValidCombinationBatched(
		targetMb: number,
		components: AlloyComponent[],
		availableMinerals: MineralWithQuantity[]
): AlloyProductionResult {
	const batchResults: AlloyProductionResult[] = [];
	let remainingMb = targetMb;
	let currentBatchSizeMb = MAX_BATCH_MB;

	let currentRun = 0;

	while (remainingMb > 0) {
		currentRun = ++currentRun;
		const nextBatchSize = getNextBatchSize(remainingMb, currentBatchSizeMb);

		if (!nextBatchSize) {
			//* Potential place for backtracking (if necessary in the future)
			//? Calculate with maths the change percentage of there being a possibility for backtracking to make any difference here?
			//? If there is a reported number of not found cases, this might actually be necessary
			break;
		}

		const batchResult = calculateSingleBatch(nextBatchSize, components, availableMinerals);

		if (batchResult?.success) {
			const scale = calculateViableBatchScale(batchResult, availableMinerals);
			const scaledBatchResult = scale > 1 ? scaleBatch(batchResult, scale) : batchResult;

			batchResults.push(scaledBatchResult);
			remainingMb -= scaledBatchResult.outputMb;
			availableMinerals = updateAvailableMinerals(availableMinerals, scaledBatchResult.usedMinerals);
		}

		currentBatchSizeMb = nextBatchSize;
	}

	const totalOutputMb = batchResults.reduce((sum, result) => sum + result.outputMb, 0);
	const consolidatedMinerals = batchResults.flatMap(batch => batch.usedMinerals);
	const finalUsedMinerals = consolidateUsedMinerals(consolidatedMinerals);

	if (totalOutputMb >= targetMb) {
		return {
			outputMb: totalOutputMb,
			usedMinerals: finalUsedMinerals,
			success: true
		};
	}

	//* Potential place for backtracking (if necessary in the future)
	//? Calculate with maths the change percentage of there being a possibility for backtracking to make any difference here?
	//? If there is a reported number of not found cases, this might actually be necessary
	return {
		outputMb: 0,
		usedMinerals: [],
		success: false,
		message: `No valid combination found!`
	};
}

/**
 * Calculates alloy production based on target volume and alloy specifications
 * @param targetMb Target volume in millibuckets
 * @param targetAlloy Alloy specifications
 * @param availableMinerals Available minerals for production
 * @returns Alloy production result
 */
export function calculateAlloy(
		targetMb: number,
		targetAlloy: Alloy,
		availableMinerals: MineralWithQuantity[]
): AlloyProductionResult {
	const mineralsByType = groupAndSortMinerals(availableMinerals);
	const totalAvailableByType = calculateAvailableMbByType(mineralsByType);

	// Check if we have enough total material
	const totalAvailable = Array.from(totalAvailableByType.values()).reduce(
			(sum, val) => sum + val, 0
	);

	if (totalAvailable < targetMb) {
		return {
			outputMb: 0,
			usedMinerals: [],
			success: false,
			message: "Not enough total material available"
		};
	}

	// Check minimum requirements for each component
	for (const component of targetAlloy.components) {
		const mineralType = component.mineral.toLowerCase();
		const minRequired = (component.min / 100) * targetMb;
		const available = totalAvailableByType.get(mineralType) ?? 0;

		if (available < minRequired) {
			return {
				outputMb: 0,
				usedMinerals: [],
				success: false,
				message: `Not enough ${mineralType} for minimum requirement`
			};
		}
	}

	const result = findValidCombinationBatched(targetMb, targetAlloy.components, availableMinerals);

	if (!result.success) {
		return {
			outputMb: 0,
			usedMinerals: [],
			success: false,
			message: "Could not find valid combination of materials"
		};
	}

	return {
		outputMb: targetMb,
		usedMinerals: result.usedMinerals,
		success: true
	};
}
