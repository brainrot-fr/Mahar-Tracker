import { n as cn } from "./skeleton-3wNi2Csj.js";
import "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/label.tsx
function Label({ className, ...props }) {
	return /* @__PURE__ */ jsx("label", {
		className: cn("text-sm font-medium text-muted", className),
		...props
	});
}
//#endregion
export { Label as t };
