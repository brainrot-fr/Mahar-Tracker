import { n as cn } from "./skeleton-PUJRkxBI.js";
import "react";
import { jsx } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
//#region src/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:opacity-90 active:scale-[0.98]",
			secondary: "bg-elevated text-fg border border-border hover:bg-surface",
			ghost: "text-fg hover:bg-elevated",
			danger: "bg-danger text-fg hover:opacity-90",
			link: "text-muted underline-offset-4 hover:underline hover:text-fg"
		},
		size: {
			sm: "h-9 rounded-sm px-3 text-sm",
			md: "h-11 rounded-md px-4 text-sm",
			lg: "h-12 rounded-lg px-5 text-base",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { Button as t };
