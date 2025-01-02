"use client";

import {GameVersionSelector} from "@/components/GameVersionSelector";
import GitHubButton from "react-github-btn";


export default function Home() {
	return (
			<main
					className="container mx-auto px-4 py-8"
					role="main"
					aria-label="Metal Calculator Home"
			>
				<div className="max-w-6xl text-center mx-auto mb-4">
					<h1 className="justify-center mx-auto text-4xl font-bold text-primary mb-8">
						TerraFirmaCraft Metal Calculator
					</h1>
				</div>

				<div className="flex flex-col items-center mb-8">
					<h3 className="text-3xl font-bold text-center mb-4">Support My Work</h3>
					<div className="flex flex-row items-center justify-center gap-4">
						<GitHubButton
								href="https://github.com/sponsors/Supermarcel10"
								data-color-scheme="no-preference: light; light: dark; dark: light;"
								data-size="large"
								data-icon="octicon-heart"
								aria-label="Sponsor on GitHub">
							Sponsor
						</GitHubButton>
						<GitHubButton
								href="https://github.com/Supermarcel10/TFCCalculator"
								data-color-scheme="no-preference: light; light: dark; dark: light;"
								data-size="large"
								data-icon="octicon-star"
								data-show-count="true"
								aria-label="Star on GitHub">
							Star
						</GitHubButton>
					</div>
				</div>

				<div className="max-w-6xl text-center mx-auto mb-8">
					<h3 className="text-3xl font-bold mb-4">Information</h3>
					<div className="flex justify-center">
						<p className="text-xl max-w-prose">
							A utility designed to automatically, quickly and accurately determine the required minerals to produce an
							metal. Unlike other calculators, this calculator is unique by abstracting as much work from the user in
							terms of calculation.

							Select the modpack below and click on the button!
						</p>
					</div>
				</div>

				<div className="max-w-6xl text-center mx-auto mb-8">
					<h3 className="text-3xl font-bold mb-4">Have Suggestions?</h3>
					<div className="flex justify-center">
						<p className="text-xl max-w-prose">
							If you have suggestions, or would like something to improve, just create an{" "}
							<a
									href="https://github.com/Supermarcel10/TFGCalculator/issues/new/choose"
									target="_blank"
							>
								issue on GitHub
							</a>
							{"."}
						</p>
					</div>
				</div>

				<GameVersionSelector/>
			</main>
	);
}