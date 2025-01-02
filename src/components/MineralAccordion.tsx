import {QuantifiedInputMineral} from "@/types";
import React, {useState} from "react";


interface MineralAccordionProps {
	title: string;
	minerals: QuantifiedInputMineral[];
	onQuantityChange: (mineralName: string, e: React.ChangeEvent<HTMLInputElement>) => void;
	onInputKeyPress: (e: React.KeyboardEvent) => Promise<void>;
}

export function MineralAccordion({ title, minerals, onQuantityChange, onInputKeyPress }: Readonly<MineralAccordionProps>) {
	const [isOpen, setIsOpen] = useState(false);

	return (
			<div className="border rounded-lg mb-4">
				<button
						className="w-full p-4 text-left flex justify-between items-center text-black bg-teal-100 hover:bg-teal-200 rounded-lg"
						onClick={() => setIsOpen(!isOpen)}
				>
					<span className="font-semibold">{title.toUpperCase()}</span>
					<span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
				</button>

				{isOpen && (
						<div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{minerals.map(mineral => (
									<div key={mineral.name} className="flex flex-col">
										<label htmlFor={mineral.name} className="text-sm text-gray-700 mb-1">
											{mineral.name} ({mineral.yield} mB)
										</label>
										<input
												type="number"
												id={mineral.name}
												value={mineral.quantity === 0 ? '' : mineral.quantity}
												placeholder="0"
												onChange={(e) => onQuantityChange(mineral.name, e)}
												onKeyDown={onInputKeyPress}
												min="0"
												className="w-full p-2 border bg-white border-gray-300 rounded no-spinners"
										/>
									</div>
							))}
						</div>
				)}
			</div>
	);
}