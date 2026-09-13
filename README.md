# Mahar-Tracker

An app to track the payment of 9 or 10 or 11 ukhiya gold zar-e-surkh-e-khalis for Mahdavis.

## Supabase setup

Create `.env` from `.env.example` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
and `SUPABASE_DB_URL` from your Supabase project. Web sign-in returns to the current site
origin automatically, while the Android build uses `com.mahartracker.app://auth/callback`.

For `SUPABASE_DB_URL`, use Supabase Connect's **transaction pooler** URL on port `6543`, not
`db.<project-ref>.supabase.co:5432`. The direct database hostname may resolve only to IPv6 on
some networks. URL-encode special password characters, for example `@` as `%40`.

Enable Google under Supabase Auth > Providers. In Supabase Auth > URL Configuration, set the Site
URL to the deployed app URL and add both the deployed app URL and
`com.mahartracker.app://auth/callback` to the Redirect URLs. In the Google OAuth client, register
the Supabase callback URL shown on the Google provider page (normally
`https://<project-ref>.supabase.co/auth/v1/callback`), not the app URL. Apply
`migrations/0002_ukhiya.sql`, `migrations/0003_refresh_gold_provider.sql`,
and `migrations/0004_add_live_metals_provider.sql` in the Supabase SQL editor. Supabase owns all
email/password and Google sessions; the server verifies the Supabase access token before every
per-user query.

## Android download

Set `VITE_ANDROID_APK_URL` to the URL of the published APK. The web app exposes it at `/download`
and in the bottom navigation. No APK binary is committed to this repository.

## Android APK

This project uses Capacitor as a native Android shell around the deployed web app. The Capacitor
configuration defaults to `https://mahar-tracker.vercel.app`; set `CAPACITOR_SERVER_URL` only when
using a different deployment, then run:

```bash
npm run android:build
```

The APK WebView must be able to reach this URL. Do not use `10.0.2.2` or a local development
address for a phone APK unless the phone can reach that computer on the same network. A page-load
timeout is a server URL/network issue, not an OAuth redirect URI issue. OAuth redirects are only
needed after the app has loaded: configure the deployed HTTPS callback and
`com.mahartracker.app://auth/callback` in Supabase Auth, and register the Google OAuth client
redirect URI required by that Supabase setup.
The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. Open the native
project with `npm run android:open`. Add `com.mahartracker.app://auth/callback` to Supabase Auth
redirect URLs and configure the Google provider before testing Google sign-in in the APK.
Capacitor 8 requires JDK 21; `scripts/setup-android-arch.sh` installs and selects it on Arch Linux.

For a release APK, copy `android/key.properties.example` to `android/key.properties`, fill in a
private signing keystore, then run `npm run android:release`. Without `key.properties`, Gradle
produces an unsigned release artifact.

## GitHub Releases

The `Android release` workflow builds and publishes a signed APK whenever a tag such as `v1.0.0` is
pushed. Configure these GitHub Actions values before creating the first tag:

- Repository variable `CAPACITOR_SERVER_URL` (optional; defaults to the production URL)
- Repository variable `VITE_SUPABASE_URL`
- Repository secrets `VITE_SUPABASE_ANON_KEY`, `ANDROID_KEYSTORE_BASE64`,
  `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`

Encode the upload keystore for `ANDROID_KEYSTORE_BASE64` with `base64 -w 0 your-upload-key.jks`.
The workflow uploads `app-release.apk` to the GitHub release. The website's `/download` page uses
`/api/download/apk`, which finds the newest public GitHub release and redirects to its APK asset.
No APK URL environment variable is required, so each later tag becomes available automatically.
