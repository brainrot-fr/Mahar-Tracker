import { n as cn } from "./skeleton-3wNi2Csj.js";
import "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/input.tsx
function Input({ className, ...props }) {
	return /* @__PURE__ */ jsx("input", {
		className: cn("h-11 w-full rounded-md border border-border bg-elevated px-3 text-base text-fg placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:opacity-40", className),
		...props
	});
}
//#endregion
export { Input as t };
