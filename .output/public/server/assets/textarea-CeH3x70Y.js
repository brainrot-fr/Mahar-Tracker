import { n as cn } from "./skeleton-3wNi2Csj.js";
import "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/textarea.tsx
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ jsx("textarea", {
		className: cn("min-h-24 w-full rounded-md border border-border bg-elevated px-3 py-2 text-base text-fg placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
//#endregion
export { Textarea as t };
