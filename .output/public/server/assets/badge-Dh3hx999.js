import { n as cn } from "./skeleton-3wNi2Csj.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/badge.tsx
function Badge({ className, tone = "muted", ...props }) {
	return /* @__PURE__ */ jsx("span", {
		className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
			muted: "bg-elevated text-muted border-border",
			ok: "bg-ok/15 text-ok border-ok/30",
			warn: "bg-warn/15 text-warn border-warn/30",
			danger: "bg-danger/15 text-danger border-danger/30",
			metal: "bg-metal/15 text-metal border-metal/30"
		}[tone], className),
		...props
	});
}
//#endregion
export { Badge as t };
