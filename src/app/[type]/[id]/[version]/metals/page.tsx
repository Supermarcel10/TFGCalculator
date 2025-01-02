"use client";

import {SmeltingOutput, SmeltingOutputType} from "@/types";
import {useParams, useRouter} from "next/navigation";
import {HeadingWithBackButton} from "@/components/HeadingWithBackButton";
import {SelfCenteringGrid} from "@/components/SelfCenteringGrid";
import React, {useCallback, useEffect, useState} from "react";
import {ErrorComponent} from "@/components/ErrorComponent";
import {LoadingSpinner} from "@/components/LoadingSpinner";
import {capitaliseFirstLetterOfEachWord} from "@/functions/utils";
import {FilterBar} from "@/components/FilterBar";
import {CreationSelectionFilter} from "@/types/filters";


export default function Home() {
	const router = useRouter();
	const {type, id, version} = useParams();

	const [rawResult, setRawResult] = useState<SmeltingOutput[]>([]);
	const [filteredResult, setFilteredResult] = useState<SmeltingOutput[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filterType, setFilterType] = useState<CreationSelectionFilter>(CreationSelectionFilter.All);
	const [searchTerm, setSearchTerm] = useState("");

	const handleMetalSelect = useCallback((metal : SmeltingOutput) => {
		router.push(`/${type}/${id}/${version}/${metal.name}`);
	}, [router, type, id, version]);

	useEffect(() => {
		let result = rawResult;

		if (filterType !== CreationSelectionFilter.All) {
			result = result.filter(smeltingOutput =>
					                       filterType === CreationSelectionFilter.Metals
					                       ? smeltingOutput.type === SmeltingOutputType.METAL
					                       : smeltingOutput.type === SmeltingOutputType.ALLOY
			);
		}

		if (searchTerm) {
			const lowercaseSearch = searchTerm.toLowerCase();
			result = result.filter(metal => metal.name.toLowerCase().includes(lowercaseSearch)
			);
		}

		setFilteredResult(result);
	}, [rawResult, filterType, searchTerm]);

	useEffect(() => {
		fetch(`/api/${type}/${id}/${version}/metal`)
				.then(response => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					return response.json();
				})
				.then(data => {
					setRawResult(data);
					setFilteredResult(data);
				})
				.catch(error => {
					setError("Failed to load metals");
					console.error("Error fetching metals:", error);
				})
				.finally(() => {
					setIsLoading(false);
				});
	}, [type, id, version]);

	const renderMetalButton = useCallback((metal : SmeltingOutput) => {
		const displayMetalName = capitaliseFirstLetterOfEachWord(metal.name);

		return (
				<button
						key={metal.name}
						className="w-full aspect-square flex items-center justify-center p-4 rounded-lg shadow-md bg-teal-100 hover:bg-teal-200 transition-colors duration-200"
						onClick={() => handleMetalSelect(metal)}
						aria-label={`Select ${displayMetalName} metal`}
				>
            <span className="text-center text-black text-lg font-bold">
                {displayMetalName}
            </span>
				</button>
		);
	}, [handleMetalSelect]);

	return (
			<main
					className="container mx-auto px-4 py-8"
					role="main"
					aria-label="Metal Selection"
			>
				<div className="max-w-6xl mx-auto">
					<HeadingWithBackButton
							title="CHOOSE TARGET OUTPUT"
							ariaPreviousScreenName="home"
							handleBackURI="/"
					/>

					<FilterBar
							filterOptions={
								Object.values(CreationSelectionFilter)
								      .filter(value => typeof value === "number")
								      .map(value => ({
									      value,
									      label : CreationSelectionFilter[value]
								      }))}
							filterType={filterType}
							searchTerm={searchTerm}
							onFilterTypeChange={setFilterType}
							onSearchTermChange={setSearchTerm}
					/>

					{isLoading && <LoadingSpinner/>}
					{error && <ErrorComponent error={error}/>}

					{!isLoading && !error && filteredResult.length > 0 && (
							<SelfCenteringGrid
									elements={filteredResult}
									perRow={{
										default : 2,
										sm : 3,
										md : 4,
										lg : 5
									}}
									renderElement={renderMetalButton}
							/>
					)}

					{!isLoading && !error && filteredResult.length === 0 && (
							<p className="text-center text-teal-100 mt-4">
								No metals available for this selection.
							</p>
					)}
				</div>
			</main>
	);
}
