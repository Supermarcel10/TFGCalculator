import { Alloy } from "@/app/types";
import { runTest } from "@test/app/functions/runner";

describe('Alloy Algorithm Performance Tests', () => {
	const bronzeAlloy: Alloy = {
		name: 'Bronze',
		components: [
			{ mineral: 'tin', min: 8, max: 12 },
			{ mineral: 'copper', min: 88, max: 92 },
		],
	};

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

	test.each(performanceTestCases)(
			'should handle production of $name efficiently',
			({ targetIngots, mineralVariants, mineralQuantity }) => {
				runTest(
						{
							targetIngots,
							mineralVariants,
							mineralQuantity,
							alloy: bronzeAlloy,
						});
			}
	);
});