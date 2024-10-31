import {AlloyProductionResult, calculateAlloy, MineralWithQuantity} from "@/app/functions/algorithm";
import {Alloy, Mineral} from "@/app/types";


const ACCEPTABLE_MEM_MB : number = 100;
const ACCEPTABLE_TIME_MS : number = 1000;

/**
 * Function to measure execution time and memory usage
 * @param fn Function to probe
 */
function measureExecutionTimeAndMemoryUse(fn: () => void): { timeTakenMs: number, memoryUsedMB: number } {
	const start = process.hrtime.bigint();
	const startMemory = process.memoryUsage().heapUsed;
	fn();
	const endMemory = process.memoryUsage().heapUsed;
	const end = process.hrtime.bigint();

	const timeTaken = Number(end - start) / 1_000_000; // ms conversion
	const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // MB conversion

	return {
		memoryUsedMB : timeTaken,
		timeTakenMs : memoryUsed,
	};
}

/**
 *
 * @param count
 * @param baseType
 */
function generateTestMinerals(count: number, baseType: string = 'tin'): Mineral[] {
	return Array.from({length: count}, (_, i) => ({
		name: `${baseType} variant ${i + 1}`,
		produces: baseType,
		yield: 16 * (i + 1)
	}));
}

/**
 * Test Runner
 * @param testConfig Test configuration
 */
export function runTest(
		testConfig: {
			targetIngots: number,
			minerals?: MineralWithQuantity[],
			mineralVariants: number,
			mineralQuantity?: number,
			alloy: Alloy,
			acceptableTimeMsOverride?: number,
			acceptableMemMbOverride?: number,
		}
) {
	const {
		targetIngots,
		minerals,
		mineralVariants,
		mineralQuantity = 50,
		alloy,
		acceptableTimeMsOverride = ACCEPTABLE_TIME_MS,
		acceptableMemMbOverride = ACCEPTABLE_MEM_MB
	} = testConfig;

	const targetMb = targetIngots * 144;

	// Generate minerals with mixed types if needed
	const testMinerals = minerals ?? [
		...generateTestMinerals(mineralVariants, 'tin').map(m => ({
			mineral: m,
			quantity: mineralQuantity
		})),
		...generateTestMinerals(mineralVariants, 'copper').map(m => ({
			mineral: m,
			quantity: mineralQuantity
		}))
	];

	// Measure execution
	let result: AlloyProductionResult | null = null;
	const {timeTakenMs, memoryUsedMB} = measureExecutionTimeAndMemoryUse(() => {
		result = calculateAlloy(targetMb, alloy, testMinerals);
	});

	// Assertions
	if (result == null) {
		throw new Error("Result not returned!")
	}

	result = result as AlloyProductionResult;
	expect(result.success).toBe(true);
	expect(result.outputMb).toBe(targetMb);

	console.log(`Performance Metrics:
  Target: ${targetIngots} ingots
  Mineral Variants: ${mineralVariants}
  Calculation Time: ${timeTakenMs.toFixed(2)}ms
  Memory Used: ${memoryUsedMB.toFixed(2)}MB
  Success: ${result.success}
  `);

	// Performance acceptance checks
	expect(timeTakenMs).toBeLessThan(acceptableTimeMsOverride);
	expect(memoryUsedMB).toBeLessThan(acceptableMemMbOverride);

	return {
		result,
		performance: {
			timeTakenMs,
			memoryUsedMB,
			targetIngots,
			mineralVariants
		}
	};
}
