import React from "react";

interface ErrorProps {
	error : Error | string | null;
	className?: string;
}

export function ErrorComponent({error, className} : Readonly<ErrorProps>) {
	if (!error) return;

	return (
			<div className={`${className} bg-red-700 text-white text-center rounded-lg shadow p-6`}>
				<h2 className="text-xl font-bold mb-4">ERROR</h2>
				<p>{error instanceof Error ? error.message : error}</p>
				<div className="bg-white text-black rounded-lg mt-4">
					<h2 className="text-xl font-bold pt-4">Struggling?</h2>
					<p className="text-lg pt-2 p-4">
						If this issue persists,{' '}
						<a href="https://github.com/Supermarcel10/TFGCalculator/issues/new/choose" target="_blank"> open an issue </a>
						{' '}with a screenshot of the entire page; we{'\''}ll investigate!
					</p>
				</div>
			</div>
	)
}
