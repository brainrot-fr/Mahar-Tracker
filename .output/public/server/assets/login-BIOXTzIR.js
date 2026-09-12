import { n as APP_TAGLINE, s as TRACKER_DISCLAIMER, t as APP_NAME } from "./copy-C__m_4Lq.js";
import { a as supabaseConfigured, i as supabase } from "./client-D0zp5Mdu.js";
import { a as signInWithGoogle, i as useCurrentUserState, t as Skeleton } from "./skeleton-PUJRkxBI.js";
import { t as Button } from "./button-DIjsGSUW.js";
import { t as Input } from "./input-BmcVG4ky.js";
import { t as Label } from "./label-CQF5E2iB.js";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/login.tsx?tsr-split=component
function Login() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [mode, setMode] = useState("in");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState(null);
	const [message, setMessage] = useState(null);
	const [busy, setBusy] = useState(false);
	if (isPending) return /* @__PURE__ */ jsx("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6",
		children: /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full max-w-sm" })
	});
	if (user) return /* @__PURE__ */ jsx(Navigate, { to: "/" });
	async function onEmail(e) {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setBusy(true);
		try {
			if (mode === "up") {
				const { error: err } = await supabase.auth.signUp({
					email,
					password,
					options: { data: { full_name: name || email.split("@")[0] } }
				});
				if (err) throw new Error(err.message ?? "Could not create account");
				setMessage("Account created. Check your email to confirm it, then sign in.");
				setMode("in");
				setPassword("");
				return;
			} else {
				const { error: err } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (err) throw new Error(err.message ?? "Could not sign in");
			}
			const { data } = await supabase.auth.getSession();
			if (!data.session) throw new Error("Sign-in did not create a session. Check your credentials and email confirmation.");
			await navigate({ to: "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-bg px-6 py-10",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "font-display text-sm tracking-wide text-metal",
				children: APP_NAME
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "mt-2 font-display text-3xl text-fg",
				children: "Sign in"
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-2 text-sm text-muted",
				children: [APP_TAGLINE, ". Your mahar records stay on your account."]
			}),
			/* @__PURE__ */ jsx(Button, {
				type: "button",
				variant: "secondary",
				className: "w-full",
				disabled: busy || !supabaseConfigured,
				onClick: async () => {
					setError(null);
					setMessage(null);
					setBusy(true);
					try {
						await signInWithGoogle();
					} catch (err) {
						setError(err instanceof Error ? err.message : "Google sign-in failed");
						setBusy(false);
					}
				},
				children: "Continue with Google"
			}),
			!supabaseConfigured && /* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm text-danger",
				children: "Supabase is not configured. Copy `.env.example` to `.env` and add your project values."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-subtle",
				children: [
					/* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-border" }),
					"or email",
					/* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-border" })
				]
			}),
			/* @__PURE__ */ jsxs("form", {
				onSubmit: onEmail,
				className: "space-y-3",
				children: [
					mode === "up" && /* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "name",
							children: "Name"
						}), /* @__PURE__ */ jsx(Input, {
							id: "name",
							value: name,
							onChange: (e) => setName(e.target.value),
							autoComplete: "name"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "email",
							children: "Email"
						}), /* @__PURE__ */ jsx(Input, {
							id: "email",
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							autoComplete: "email"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "password",
							children: "Password"
						}), /* @__PURE__ */ jsx(Input, {
							id: "password",
							type: "password",
							required: true,
							minLength: 8,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							autoComplete: mode === "up" ? "new-password" : "current-password"
						})]
					}),
					message && /* @__PURE__ */ jsx("p", {
						className: "text-sm text-metal",
						children: message
					}),
					error && /* @__PURE__ */ jsx("p", {
						className: "text-sm text-danger",
						children: error
					}),
					/* @__PURE__ */ jsx(Button, {
						type: "submit",
						className: "w-full",
						disabled: busy,
						children: busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in with email"
					})
				]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline",
				onClick: () => setMode(mode === "up" ? "in" : "up"),
				children: mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-10 text-xs leading-relaxed text-subtle",
				children: [
					TRACKER_DISCLAIMER,
					" ",
					/* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "underline underline-offset-2",
						children: "Back"
					})
				]
			})
		]
	});
}
//#endregion
export { Login as component };
