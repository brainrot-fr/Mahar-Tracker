import { n as AppShell, t as Card } from "./card-EbVh7PYj.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Smartphone } from "lucide-react";
//#region src/routes/download.tsx?tsr-split=component
function DownloadPage() {
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-3 text-metal",
			children: [/* @__PURE__ */ jsx(Smartphone, {
				className: "size-6",
				"aria-hidden": "true"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-wider",
				children: "Android app"
			})]
		}),
		/* @__PURE__ */ jsx("h1", {
			className: "mt-2 font-display text-3xl text-fg",
			children: "Take Ukhiya with you"
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-2 text-sm leading-relaxed text-muted",
			children: "Install the Android app to keep recording mahar savings from your phone. Your records stay connected when you sign in with the same account."
		}),
		/* @__PURE__ */ jsx(Card, {
			className: "mt-6 space-y-4",
			children: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("p", {
				className: "text-sm text-fg",
				children: "The Android package has not been published yet."
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs leading-relaxed text-subtle",
				children: "Configure VITE_ANDROID_APK_URL with the published APK URL and this page will become the download point automatically."
			})] })
		})
	] });
}
//#endregion
export { DownloadPage as component };
