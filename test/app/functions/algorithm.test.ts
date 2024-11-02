import {MineralWithQuantity} from "@/app/functions/algorithm";
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

	const performanceTestCases = [
		{
			name: '100 ingots',
			targetIngots: 100,
			mineralVariants: 9,
			mineralQuantity: 50
		},
		{
			name: '500 ingots',
			targetIngots: 500,
			mineralVariants: 9,
			mineralQuantity: 500
		},
		{
			name: '1000 ingots',
			targetIngots: 1000,
			mineralVariants: 20,
			mineralQuantity: 1000
		}
	];

	describe('base functionality test', () => {
		describe('pass cases', () => {
			testCases.forEach(({ name, minerals, targetIngots }) => {
				it(`${name}`, () => {
					runTest({
						        targetIngots,
						        alloy: bronzeAlloy,
						        minerals
					        });
				});
			});
		});

		describe('fail cases', () => {
			failureCases.forEach(({ name, minerals, expectedMessage }) => {
				it(`${name}`, () => {
					runTest({
						        targetIngots: 3,
						        alloy: bronzeAlloy,
						        minerals
					        },
					        {
						        success: false,
						        expectedMessage: expectedMessage,
					        });
				});
			});
		});
	})

	describe('stress tests', () => {
		test.each(performanceTestCases)(
				'should handle production of $name efficiently',
				({targetIngots, mineralVariants, mineralQuantity}) => {
					runTest(
							{
								targetIngots,
								mineralVariants,
								mineralQuantity,
								alloy : bronzeAlloy,
							});
				}
		);
	});

	describe('weird edge cases, where subpar outputs noted in past', () => {
		it('brass 5, 15/15/15/15/15/15 & 15/15/15', () => {
			const targetIngot = 5;
			const availableMinerals = [
				{
					mineral: {
						name: "Raw Tetrahedrite",
						yield: 31,
						produces: "copper"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Rich Raw Tetrahedrite",
						yield: 42,
						produces: "copper"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Poor Raw Tetrahedrite",
						yield: 21,
						produces: "copper"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Raw Copper",
						yield: 36,
						produces: "copper"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Rich Raw Copper",
						yield: 48,
						produces: "copper"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Poor Raw Copper",
						yield: 24,
						produces: "copper"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Raw Sphalerite",
						yield: 31,
						produces: "zinc"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Rich Raw Sphalerite",
						yield: 42,
						produces: "zinc"
					},
					quantity: 15
				},
				{
					mineral: {
						name: "Poor Raw Sphalerite",
						yield: 21,
						produces: "zinc"
					},
					quantity: 15
				},
			];
			const brassAlloy: Alloy = {
				name: 'Brass',
				components: [
					{ mineral: 'zinc', min: 8, max: 12 },
					{ mineral: 'copper', min: 88, max: 92 },
				],
			};

			runTest(
					{
						targetIngots: targetIngot,
						minerals: availableMinerals,
						alloy: brassAlloy
					},
			);
		});
	})
});
