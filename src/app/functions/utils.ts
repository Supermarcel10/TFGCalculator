export function capitaliseFirstLetterOfEachWord(input: string): string {
	if (!input) return input;

	return input
			.split(/[ _]+/)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
}

export function getBaseMineralFromOverride(mineralName: string): string {
	return mineralName
			.toLowerCase()
			.replace(' ingot', '')
			.replace(' nugget', '')
			.replace(' ', '_');
}