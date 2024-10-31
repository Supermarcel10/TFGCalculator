import {calculateAlloy, MineralWithQuantity} from "@/app/functions/algorithm";
import {Alloy} from "@/app/types";
import {runTest} from "@test/app/functions/runner";


function createTestMinerals(name: string, produces: string, yields: number[], quantities: number[]): MineralWithQuantity[] {
	return yields.map((yieldValue, index) => ({
		mineral: {
			name: `${name} variant ${index + 1}`,
			produces,
			yield: yieldValue
		},
		quantity: quantities[index] || 50
	}));
}

describe('calculateAlloy algorithm', () => {
	const bronzeAlloy: Alloy = {
		name: 'Bronze',
		components: [
			{ mineral: 'tin', min: 8, max: 12 },
			{ mineral: 'copper', min: 88, max: 92 },
		],
	};

	const testCases = [
		{
			name: 'Exact minerals',
			minerals: [
				...createTestMinerals('tin', 'tin', [16], [3]),
				...createTestMinerals('copper', 'copper', [24, 36], [7, 6])
			],
			targetIngots: 3
		},
		{
			name: 'More than enough minerals',
			minerals: [
				...createTestMinerals('tin', 'tin', [16, 48, 72], [50, 3, 7]),
				...createTestMinerals('copper', 'copper', [24, 36, 48, 72], [7, 6, 6, 8])
			],
			targetIngots: 3
		},
		{
			name: 'With unused minerals',
			minerals: [
				...createTestMinerals('tin', 'tin', [16], [3]),
				...createTestMinerals('copper', 'copper', [24, 36], [7, 6]),
				...createTestMinerals('other', 'iron', [24], [3]),
				...createTestMinerals('other', 'silver', [36], [2])
			],
			targetIngots: 3
		}
	];

	const failureCases = [
		{
			name: 'No minerals',
			minerals: [],
			expectedMessage: 'Not enough total material available'
		},
		{
			name: 'Not enough total minerals',
			minerals: [
				...createTestMinerals('tin', 'tin', [16], [2]),
				...createTestMinerals('copper', 'copper', [24, 36], [7, 6])
			],
			expectedMessage: 'Not enough total material available'
		},
		{
			name: 'Not enough component minerals',
			minerals: [
				...createTestMinerals('tin', 'tin', [16], [32]),
				...createTestMinerals('copper', 'copper', [24, 36], [2, 2])
			],
			expectedMessage: 'Not enough copper for minimum requirement'
		}
	];

	describe('pass cases', () => {
		testCases.forEach(({ name, minerals, targetIngots }) => {
			it(`${name}`, () => {
				runTest({
					        targetIngots,
					        mineralVariants: minerals.length,
					        alloy: bronzeAlloy,
					        minerals
				        });
			});
		});
	});

	describe('fail cases', () => {
		failureCases.forEach(({ name, minerals, expectedMessage }) => {
			it(`${name}`, () => {
				const result = calculateAlloy(432, bronzeAlloy, minerals);

				expect(result.success).toBe(false);
				expect(result.message).toContain(expectedMessage);
			});
		});
	});
});
