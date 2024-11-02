import {calculateAlloy, MineralWithQuantity} from "@/app/functions/algorithm";
import {Alloy, Mineral} from "@/app/types";


const ACCEPTABLE_MEM_MB : number = 100;
const ACCEPTABLE_TIME_MS : number = 1000;

/**
 * Function to measure execution time and memory usage
 * @param fn Function to probe
 */
function measureMemoryUse<T>(fn: () => T): {fnReturn: T, memoryUsedMB: number } {
	const startMemory = process.memoryUsage().heapUsed;
	const fnReturn = fn();
	const endMemory = process.memoryUsage().heapUsed;
	const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // MB conversion

	return {
		fnReturn : fnReturn,
		memoryUsedMB : memoryUsed,
	};
}

/**
 * Function to generate test minerals
 * @param count Number of minerals to generate
 * @param baseType Type of produced mineral
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
 * @param testInputs Test inputs
 * @param testConfig Test configuration
 */
export function runTest(
		testInputs: {
			targetIngots: number,
			minerals?: MineralWithQuantity[],
			mineralVariants?: number,
			mineralQuantity?: number,
			alloy: Alloy,
		},
		testConfig: {
			success?: boolean,
			careless?: boolean,
			expectedMessage?: string,
			acceptableTimeMsOverride?: number,
			acceptableMemMbOverride?: number,
		} = {}
) {
	const {
		targetIngots,
		minerals,
		mineralVariants,
		mineralQuantity,
		alloy,
	} = testInputs;

	const {
		success = true,
		careless = false,
		expectedMessage,
		acceptableTimeMsOverride = ACCEPTABLE_TIME_MS,
		acceptableMemMbOverride = ACCEPTABLE_MEM_MB
	} = testConfig;

	const targetMb = targetIngots * 144;

	// Generate minerals with mixed types if needed
	if (!(minerals || (mineralVariants && mineralQuantity))) {
		throw new Error("Pre-defined minerals or number of variants with quantities need to be defined for runner!")
	}

	const testMinerals = minerals ?? [
		...generateTestMinerals(mineralVariants as number, 'tin').map(m => ({
			mineral: m,
			quantity: mineralQuantity as number
		})),
		...generateTestMinerals(mineralVariants as number, 'copper').map(m => ({
			mineral: m,
			quantity: mineralQuantity as number
		}))
	];

	const {fnReturn : result, memoryUsedMB} = measureMemoryUse(() => calculateAlloy(targetMb, alloy, testMinerals));

	if (result == null) {
		throw new Error("Result not returned!")
	}

	// Only run assertions if not careless
	if (!careless) {
		expect(result.success).toBe(success);
		expectedMessage && expect(result.message).toBe(expectedMessage);
		success && expect(result.outputMb).toBe(targetMb);

		// Performance acceptance checks
		expect(result.stats?.usage?.runtimeMs).toBeLessThan(acceptableTimeMsOverride);
		expect(result.stats?.usage?.memoryMB).toBeLessThan(acceptableMemMbOverride);
	}

	// Statistics
	console.log(`Performance Metrics:
  Target: ${targetIngots} ingots
  Mineral Variants: ${mineralVariants}
  Calculation Time: ${result.stats?.usage?.runtimeMs.toFixed(2)}ms
  Memory Used: ${memoryUsedMB.toFixed(2)}MB
  Success: ${result?.success}
  `);

	return {
		result,
		performance: {
			memoryUsedMB,
			targetIngots,
			mineralVariants,
		}
	};
}
