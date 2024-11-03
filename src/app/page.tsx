"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";


export default function Home() {
	const router = useRouter();
	const [selectedVersion, setSelectedVersion] = useState("terrafirmagreg-1.20");

	const handleCalculate = () => {
		router.push(`/${selectedVersion}/alloys`);
	};

	return (
			<main
					className="container mx-auto px-4 py-8"
					role="main"
					aria-label="Alloy Calculator Home"
			>
				<div className="max-w-6xl text-center mx-auto mb-4">
					<h1 className="justify-center mx-auto text-4xl font-bold text-primary mb-8">
						TerraFirmaCraft Alloy Calculator
					</h1>
				</div>

				<div className="flex flex-col items-center mb-16">
					<h3 className="text-3xl font-bold text-center mb-4">Support My Work</h3>
					<div className="flex flex-row items-center justify-center gap-4">
						<iframe
								src="https://github.com/sponsors/Supermarcel10/button"
								rel="noopener noreferrer"
								title="Sponsor Supermarcel10"
								height="32"
								width="114"
								loading="lazy"
								aria-label="GitHub Sponsors button"
						/>
						<iframe
								src="https://ghbtns.com/github-btn.html?user=supermarcel10&repo=TFGCalculator&type=star&count=true&size=large"
								rel="noopener noreferrer"
								title="Star on GitHub"
								width="110"
								height="30"
								loading="lazy"
								aria-label="Star on GitHub button"
						/>
					</div>
				</div>

				<div className="max-w-6xl text-center mx-auto mb-16">
					<h3 className="text-3xl font-bold mb-4">Information</h3>
					<div className="flex justify-center">
						<p className="text-xl mb-8 max-w-prose">
							A utility designed to automatically, quickly and accurately determine the required minerals to produce an
							alloy. Unlike other calculators, this calculator is unique by abstracting as much work from the user in terms of calculation.

							Select the modpack below and click on the button!
						</p>
					</div>

					<h3 className="text-3xl font-bold mb-4">Have Suggestions?</h3>
					<div className="flex justify-center">
						<p className="text-xl mb-4 ">
							If you have suggestions, or would like something to improve, just create an{' '}
							<a
									href="https://github.com/Supermarcel10/TFGCalculator/issues/new/choose"
									target="_blank"
									className="text-teal-500"
							>
								issue on GitHub
							</a>
							{'.'}
						</p>
					</div>
				</div>

				<div className="flex flex-col items-center gap-4">
					<select
							value={selectedVersion}
							onChange={(e) => setSelectedVersion(e.target.value)}
							className="p-2 rounded border border-teal-500 bg-transparent text-teal-100"
							aria-label="Select game version"
					>
						<option value="terrafirmagreg-1.20">TerraFirmaGreg 1.20</option>
					</select>

					<button
							onClick={handleCalculate}
							className="px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors duration-200"
							aria-label="Go to alloy calculator"
					>
						Calculate
					</button>
				</div>
			</main>
	);
}