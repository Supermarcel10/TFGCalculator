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

const generateReverseFibonacci = (max: number) : number[] => {
	if (max <= 0) return [];

	const sequence: number[] = [];

	let next = 1;
	let prev = 1;

	for (let t = 1; t <= max; t = next + prev) {
		sequence.push(t);
		next = prev;
		prev = t;
	}

	return sequence.reverse();
};

const INGOT_SIZE = 144;
const MAX_BATCH_INGOTS = 8;
const MAX_BATCH_MB = MAX_BATCH_INGOTS * INGOT_SIZE;
const BATCH_SIZE_FIBONACCI_SEQ = generateReverseFibonacci(MAX_BATCH_INGOTS);

/**
 * Groups minerals by their production type, and sorts them from the highest yielding.
 * @param availableMinerals All available minerals.
 */
function groupAndSortMinerals(availableMinerals: MineralWithQuantity[]): Map<string, MineralWithQuantity[]> {
	const mineralsByType = new Map<string, MineralWithQuantity[]>();

	for (const mineralWithQty of availableMinerals) {
		const producedMineral = mineralWithQty.mineral.produces.toLowerCase();
		const typeGroup = mineralsByType.get(producedMineral) || [];
		const insertIndex = typeGroup.findIndex(item =>
				                                        item.mineral.yield < mineralWithQty.mineral.yield);

		if (insertIndex === -1) {
			typeGroup.push(mineralWithQty);
		} else {
			typeGroup.splice(insertIndex, 0, mineralWithQty);
		}

		mineralsByType.set(producedMineral, typeGroup);
	}

	return mineralsByType;
}

/**
 * Calculate the total available mB for each mineral production type.
 * @param mineralsByType Grouped minerals by their production type.
 */
function calculateAvailableMbByType(mineralsByType : Map<string, MineralWithQuantity[]>) : Map<string, number> {
	const totalAvailableByType = new Map<string, number>();

	mineralsByType.forEach((minerals: MineralWithQuantity[], type: string) => {
		const total = minerals.reduce(
				(sum: number, m: MineralWithQuantity): number => sum + (m.mineral.yield * m.quantity), 0
		);

		totalAvailableByType.set(type, total);
	});

	return totalAvailableByType;
}

function updateAvailableMinerals(
		currentMinerals: MineralWithQuantity[],
		usedMinerals: MineralWithQuantity[]
): MineralWithQuantity[] {
	const updatedMinerals = new Map<string, MineralWithQuantity>();

	// Initialize with current minerals
	currentMinerals.forEach(m => {
		updatedMinerals.set(m.mineral.name, {...m});
	});

	// Subtract used minerals
	usedMinerals.forEach(used => {
		const current = updatedMinerals.get(used.mineral.name);
		if (current) {
			current.quantity -= used.quantity;
			if (current.quantity <= 0) {
				updatedMinerals.delete(used.mineral.name);
			}
		}
	});

	return Array.from(updatedMinerals.values());
}

function consolidateUsedMinerals(minerals: MineralWithQuantity[]): MineralWithQuantity[] {
	const consolidated = new Map<string, MineralWithQuantity>();

	minerals.forEach(m => {
		const key = m.mineral.name;
		if (consolidated.has(key)) {
			consolidated.get(key)!.quantity += m.quantity;
		} else {
			consolidated.set(key, {...m});
		}
	});

	return Array.from(consolidated.values());
}

function getNextBatchSize(remainingMb: number, currentBatchSizeMb: number): number | null {
	for (let i = 0; i <= BATCH_SIZE_FIBONACCI_SEQ.length; ++i) {
		const potentialNextBatchMb = BATCH_SIZE_FIBONACCI_SEQ[i] * INGOT_SIZE;

		if (potentialNextBatchMb > remainingMb) continue;
		if (potentialNextBatchMb < currentBatchSizeMb) return potentialNextBatchMb;
	}

	return null;
}

function calculateViableBatchScale(
		batch: AlloyProductionResult,
		availableMinerals: MineralWithQuantity[]
): number {
	return batch.usedMinerals.reduce((minBatches, usedMineral) => {
		const available = availableMinerals.find(m => m.mineral.name === usedMineral.mineral.name)!;
		const possibleBatches = Math.floor(available.quantity / usedMineral.quantity);
		return Math.min(minBatches, possibleBatches);
	}, Number.MAX_SAFE_INTEGER);
}

function scaleBatch(
		batchResult: AlloyProductionResult,
		scale : number
) : AlloyProductionResult {
	return {
		success: batchResult.success,
		usedMinerals: batchResult.usedMinerals.map(mineral => ({
			mineral: mineral.mineral,
			quantity: mineral.quantity * scale
		})),
		outputMb: batchResult.outputMb * scale
	}
}

function calculateSingleBatch(
		targetMb: number,
		components: AlloyComponent[],
		availableMinerals: MineralWithQuantity[]
): AlloyProductionResult {
	const mineralsByType = groupAndSortMinerals(availableMinerals);

	 /**
	 Helper function to calculate total mB from a combination
	 */
	function calculateTotalMb(minerals: MineralWithQuantity[]): number {
		return minerals.reduce((sum, m) => sum + (m.mineral.yield * m.quantity), 0);
	}

	/**
	 * Helper function to check if combination is valid
 	 */
	function isValidCombination(minerals: MineralWithQuantity[]): boolean {
		const totalMb = calculateTotalMb(minerals);

		if (Math.abs(Math.round(totalMb) - Math.round(targetMb)) > 0) {
			return false;
		}

		// Group minerals by type and calculate mB for each
		const mbByType = new Map<string, number>();
		for (const mineral of minerals) {
			const type = mineral.mineral.produces;
			const mb = mineral.mineral.yield * mineral.quantity;
			mbByType.set(type, (mbByType.get(type) ?? 0) + mb);
		}

		// Check percentages
		for (const component of components) {
			const mineralType = component.mineral.toLowerCase();
			const mb = mbByType.get(mineralType) ?? 0;
			const percentage = (mb / totalMb) * 100;

			if (percentage < component.min || percentage > component.max) {
				return false;
			}
		}

		return true;
	}

	let currentCombination: MineralWithQuantity[] = [];

	// Process one component at a time
	for (const component of components) {
		const mineralType = component.mineral.toLowerCase();
		const minerals = mineralsByType.get(mineralType) || [];
		const minMb = (component.min / 100) * targetMb;
		const maxMb = (component.max / 100) * targetMb;

		// Get all possible combinations for this component
		const componentCombinations: MineralWithQuantity[][] = [];

		// Sort minerals by yield for efficiency
		const sortedMinerals = [...minerals].sort(
				(a, b) => b.mineral.yield - a.mineral.yield
		);

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
				if (current.index >= sortedMinerals.length || current.mb > maxMb) {
					continue;
				}

				const mineral = sortedMinerals[current.index];

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

function findValidCombinationBatched(
		targetMb: number,
		components: AlloyComponent[],
		availableMinerals: MineralWithQuantity[]
): AlloyProductionResult | null {
	const batchResults: AlloyProductionResult[] = [];
	let remainingMb = targetMb;
	let currentBatchSizeMb = MAX_BATCH_MB;

	let currentRun = 0;

	while (remainingMb > 0) {
		currentRun = ++currentRun;
		const nextBatchSize = getNextBatchSize(remainingMb, currentBatchSizeMb);

		if (!nextBatchSize) {
			// TODO: Add backtracking logic here if all batches are exhausted
			break;
		}

		const batchResult = calculateSingleBatch(nextBatchSize, components, availableMinerals);

		if (batchResult && batchResult.success) {
			const scale = calculateViableBatchScale(batchResult, availableMinerals);
			const scaledBatchResult = scaleBatch(batchResult, scale);

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

	// TODO: Handle cases where target is unmet with backtracking if necessary
	return null;
}

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

	if (!result) {
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
