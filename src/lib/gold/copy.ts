export const APP_NAME = "Ukhiya";
export const APP_TAGLINE = "Mahar tracker for zar-e-surkh-e-khalis";
export const APP_SHORT_DESCRIPTION =
  "Record money set aside toward mahar and convert it to 24K gold-equivalent grams.";

export const MAHDI_HONORIFIC = "Khalifatullah Hazrat Syed Muhammad Mahdi e Mau'ood A.S.";
export const QASIM_HONORIFIC = "Hazrat Bandagi Miyan Syed Qasim Mujtahid-e-giroh-e-Mahdavia R.H.";

export const PURITY_TRADITION = "zar-e-surkh-e-khalis";
export const PURITY_TRADITION_LABEL = "Zar-e-surkh-e-khalis (24K)";

export const MAHAR_ORIGIN =
  `${MAHDI_HONORIFIC} taught that all Mahdavis will pay a mahar of 9 ukhiya; those of the Aal (descendants through daughters) will pay 10 ukhiya; and those of the Aulaad (his children) will pay 11 ukhiya.`;

export const ZAR_E_SURKH_ORIGIN =
  `${PURITY_TRADITION} — gold in its purest form — was introduced during the period of, and by, ${QASIM_HONORIFIC}. This tracker uses the 24K consumer buying price so the equivalent stays khalis, without jewelry making charges.`;

export const TRACKER_DISCLAIMER =
  "This app does not buy, sell, trade, transfer, or store gold. You record money set aside toward mahar. Figures are 24K gold-equivalent estimates from market prices, not proof of physical ownership and not an investment product.";

export const ONBOARDING_ACCEPT_LABEL =
  "I understand this app only tracks mahar savings as their 24K gold-equivalent (zar-e-surkh-e-khalis) and does not purchase gold for me.";

export const ONBOARDING_MAHDI_ACKNOWLEDGEMENT =
  "I acknowledge Masoom-anil-khata Khalifatullah Hazrat Syed Muhammad Mahdi-e-Mau'ood (Jeevanpuri) A.S as the promised Mahdi that RasoolAllah S.A.W.S promised.";

export const ONBOARDING_PRIVACY_NOTE =
  "No data is captured for analytics, advertising, or hidden tracking. The data you enter is stored only to provide your mahar tracker, and the complete source code is open source and available for inspection on";

export const UKHIYA_MAHAR: Record<
  9 | 10 | 11,
  { who: string; whoShort: string; teaching: string }
> = {
  9: {
    who: "All Mahdavis",
    whoShort: "Mahdavis",
    teaching: "Mahdi A.S. taught that all Mahdavis will pay a mahar of 9 ukhiya.",
  },
  10: {
    who: "Aal — descendants through daughters",
    whoShort: "Aal",
    teaching: "Those of the Aal of Mahdi A.S. (descendants through daughters) will pay a mahar of 10 ukhiya.",
  },
  11: {
    who: "Aulaad — children of Mahdi A.S.",
    whoShort: "Aulaad",
    teaching: "Those of the Aulaad (children) of Mahdi A.S. will pay a mahar of 11 ukhiya.",
  },
};

export function maharTargetLabel(ukhiya: number): string {
  const meta = UKHIYA_MAHAR[ukhiya as 9 | 10 | 11];
  if (!meta) return `${ukhiya} ukhiya mahar`;
  return `${ukhiya} ukhiya · ${meta.whoShort}`;
}

export const ERRORS = {
  confirmDisclaimer:
    "Please confirm that Ukhiya tracks mahar savings as 24K gold-equivalent (zar-e-surkh-e-khalis) and does not purchase gold.",
  confirmMahdiAcknowledgement: "Please acknowledge the promised Mahdi before continuing.",
  targetAlreadySet: "A mahar target is already set. Change it from Settings.",
  changeTargetPhrase:
    "Type CHANGE TARGET to confirm. Completed grams stay the same; remaining grams and percentage are recalculated against the new mahar.",
  noActiveTarget: "No active mahar target to change.",
  goalNotSaved: "Mahar target was not saved.",
  targetNotUpdated: "Mahar target was not updated.",
  confirmManualPrice: "Confirm the 24K consumer buying price before saving this mahar entry.",
  missingIdempotency: "Missing idempotency key.",
  setTargetFirst: "Choose a mahar of 9, 10, or 11 ukhiya before recording money set aside.",
  entryNotSaved: "This mahar entry was not saved. Look up the 24K price again and try once more.",
  entryNotFound: "This mahar entry was not found.",
  typeConfirmDelete:
    "Type CONFIRM to permanently remove this entry from your mahar history.",
  typeDeleteAccount: "Type DELETE ACCOUNT to remove your Ukhiya mahar records.",
  permittedTarget: "Mahar must be 9, 10, or 11 ukhiya in this version.",
  timestampSave:
    "The 24K price time could not be stored. Look up the price again — past dates never silently reuse today's rate.",
  historicalUnavailable:
    "No provider could supply a 24K price for that past date. Today's price was not used. Enter the 24K consumer buying price you actually observed for zar-e-surkh-e-khalis, or pick a date we already have a snapshot for.",
  quoteUnavailable:
    "No gold-price provider could be reached. You can enter a 24K consumer buying price for zar-e-surkh-e-khalis manually if that fallback is enabled.",
  manualDisabled: "Manual price entry is disabled by the product owner.",
};
