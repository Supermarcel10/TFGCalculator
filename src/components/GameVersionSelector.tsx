import {ErrorComponent} from "@/components/ErrorComponent";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {LoadingSpinner} from "@/components/LoadingSpinner";
import {BaseGameVersion, GameVersions, VersionType} from "@/types/gameversions";


export function GameVersionSelector() {
	const router = useRouter();
	const [options, setOptions] = useState<GameVersions | null>(null);
	const [selectedType, setSelectedType] = useState<VersionType>("modpack");
	const [selectedOption, setSelectedOption] = useState<BaseGameVersion | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPackages = async() => {
			const response = await fetch("/api/options");
			if (!response.ok) {
				throw new Error("Failed to fetch options");
			}

			return response;
		};

		fetchPackages()
				.then(async(response) => {
					const data = await response.json();
					setOptions(data);

					// Auto-select first supported package if available
					if (data.modpack.length > 0) {
						setSelectedOption(data.modpack[0]);
					}
				})
				.catch((err) => {
					setError("Failed to load options");
					console.error(err);
				})
				.finally(() => setIsLoading(false));
	}, []);

	const handleCalculate = () => {
		if (!selectedOption) {
			return;
		}

		const versionPath = `${selectedOption.gameVersion}_${selectedOption.version}`;
		router.push(`/${selectedType}/${selectedOption.id}/${versionPath}/metals`);
	};

	if (isLoading) {
		return (
				<LoadingSpinner/>
		);
	}

	if (error) {
		return (
				<ErrorComponent error={error}/>
		);
	}

	return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
					<div className="flex flex-col sm:flex-row justify-center w-full gap-4">
						<select
								value={selectedType}
								onChange={(e) => {
									const newType = e.target.value as VersionType;
									setSelectedType(newType);
									setSelectedOption(options?.[newType]?.[0] || null);
								}}
								className="w-full sm:w-32 p-2 rounded border border-teal-500 bg-transparent text-teal-100"
								aria-label="Select type"
						>
							<option value="modpack">Modpack</option>
							<option value="mod">Mod</option>
						</select>

						<select
								value={selectedOption?.id || ""}
								onChange={(e) => {
									const selected = options?.[selectedType].find(
											p => p.id === e.target.value
									);
									setSelectedOption(selected || null);
								}}
								className="w-full sm:w-72 p-2 rounded border border-teal-500 bg-transparent text-teal-100"
								aria-label={`Select ${selectedType}`}
						>
							{options?.[selectedType].map((pkg) => (
									<option key={pkg.id} value={pkg.id}>
										{pkg.displayName} ({pkg.version})
									</option>
							))}
						</select>
					</div>

					<button
							onClick={handleCalculate}
							disabled={!selectedOption}
							className="w-full sm:w-auto px-6 py-2 rounded primary"
							aria-label="Go to calculator"
					>
						Calculate
					</button>
				</div>
			</div>
	);
}