import React, { ReactNode, useEffect, useRef, useState, useCallback } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
	text: string;
	children: ReactNode;
	position?: TooltipPosition;
}

const OPPOSITE_POSITIONS = {
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left"
} as const;

const TOOLTIP_POSITIONS = {
	top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
	bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
	left: "right-full top-1/2 transform -translate-y-1/2 -translate-x-2",
	right: "left-full top-1/2 transform -translate-y-1/2 translate-x-2"
} as const;

interface OverflowResult {
	horizontal: "left" | "right" | null;
	vertical: "top" | "bottom" | null;
}

const Tooltip: React.FC<TooltipProps> = ({
	                                         text,
	                                         children,
	                                         position: initialPosition = "top"
                                         }) => {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState(initialPosition);
	const containerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`).current;

	const showTooltip = useCallback(() => setIsVisible(true), []);
	const hideTooltip = useCallback(() => setIsVisible(false), []);


	const handleMouseEnter = useCallback(() => showTooltip(), [showTooltip]);
	const handleMouseLeave = useCallback(() => hideTooltip(), [hideTooltip]);

	// Handle keyboard events
	const handleFocus = useCallback(() => showTooltip(), [showTooltip]);
	const handleBlur = useCallback(() => hideTooltip(), [hideTooltip]);
	const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
		if (event.key === 'Escape') {
			hideTooltip();
			triggerRef.current?.focus();
		}
	}, [hideTooltip]);

	useEffect(() => {
		if (!isVisible) return;

		const checkOverflow = (rect: DOMRect): OverflowResult => {
			const { innerWidth, innerHeight } = window;
			return {
				horizontal: rect.left < 0 ? "left" : rect.right > innerWidth ? "right" : null,
				vertical: rect.top < 0 ? "top" : rect.bottom > innerHeight ? "bottom" : null
			};
		};

		const calculateBestPosition = (tooltipRect: DOMRect, currentPosition: TooltipPosition): TooltipPosition => {
			const overflow = checkOverflow(tooltipRect);

			if (!overflow.horizontal && !overflow.vertical) {
				return currentPosition;
			}

			if (["left", "right"].includes(currentPosition) && overflow.horizontal) {
				return OPPOSITE_POSITIONS[currentPosition];
			}

			if (["top", "bottom"].includes(currentPosition) && overflow.vertical) {
				return OPPOSITE_POSITIONS[currentPosition];
			}

			return currentPosition;
		};

		const handleOverflow = (tooltipEl: HTMLDivElement, tooltipRect: DOMRect) => {
			const overflow = checkOverflow(tooltipRect);
			let transformX = "-50%";
			let transformY = "-50%";
			let left = "50%";
			let top = "50%";

			// Handle horizontal overflow
			if (overflow.horizontal === "left") {
				left = "0";
				transformX = "0";
			} else if (overflow.horizontal === "right") {
				left = "100%";
				transformX = "-100%";
			}

			// Handle vertical overflow
			if (overflow.vertical === "top") {
				top = "0";
				transformY = "0";
			} else if (overflow.vertical === "bottom") {
				top = "100%";
				transformY = "-100%";
			}

			// Single overflow
			if (["top", "bottom"].includes(position)) {
				tooltipEl.style.left = left;
				tooltipEl.style.transform = `translateX(${transformX})`;
			} else {
				tooltipEl.style.top = top;
				tooltipEl.style.transform = `translateY(${transformY})`;
			}

			// Both overflows
			if (overflow.horizontal && overflow.vertical) {
				tooltipEl.style.transform = `translate(${transformX}, ${transformY})`;
			}
		};

		const tooltipEl = tooltipRef.current;
		if (!tooltipEl || !containerRef.current) return;

		setPosition(initialPosition);
		tooltipEl.style.transform = "";
		tooltipEl.style.left = "";
		tooltipEl.style.top = "";

		requestAnimationFrame(() => {
			if (!tooltipEl) return;

			const tooltipRect = tooltipEl.getBoundingClientRect();
			const newPosition = calculateBestPosition(tooltipRect, initialPosition);

			if (newPosition !== position) {
				setPosition(newPosition);
			}

			handleOverflow(tooltipEl, tooltipRect);
		});
	}, [isVisible, initialPosition, position]);

	// Child Focusability
	const enhanceChild = (child: React.ReactElement) => {
		const existingTabIndex = child.props.tabIndex;
		const existingOnFocus = child.props.onFocus;
		const existingOnBlur = child.props.onBlur;
		const existingOnKeyDown = child.props.onKeyDown;

		return React.cloneElement(child, {
			ref: triggerRef,
			tabIndex: existingTabIndex ?? 0,
			'aria-describedby': tooltipId,
			onFocus: (e: React.FocusEvent) => {
				handleFocus();
				existingOnFocus?.(e);
			},
			onBlur: (e: React.FocusEvent) => {
				handleBlur();
				existingOnBlur?.(e);
			},
			onKeyDown: (e: React.KeyboardEvent) => {
				handleKeyDown(e);
				existingOnKeyDown?.(e);
			}
		});
	};

	return (
			<div className="relative inline-block" ref={containerRef}>
				<div
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
				>
					{React.isValidElement(children) ? enhanceChild(children) : children}
				</div>

				{isVisible && (
						<div
								ref={tooltipRef}
								id={tooltipId}
								role="tooltip"
								className={`absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg ${TOOLTIP_POSITIONS[position]}`}
						>
							{text}
						</div>
				)}
			</div>
	);
};

export default Tooltip;