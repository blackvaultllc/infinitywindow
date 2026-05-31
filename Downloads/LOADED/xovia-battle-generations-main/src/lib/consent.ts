// Bumping this number forces every signed-in user to re-accept the consent gate.
// Coordinate updates with src/routes/terms.tsx — anytime the legal text changes
// materially, increment this so users re-consent to the new version.
export const CONSENT_VERSION = 1;

export const CONSENT_HIGHLIGHTS = [
  {
    title: "You are at least 18 years old",
    body: "Exodia NFT Battle is intended for adults. By accepting, you confirm you are 18+ and legally able to enter contracts in your jurisdiction.",
  },
  {
    title: "EXOD is an in-game utility token, not a security",
    body: "EXOD has no expectation of profit, no claim on company earnings, and no governance rights. It is not an investment instrument. Treat it as game currency.",
  },
  {
    title: "No financial advice. No guarantees of value",
    body: "Cards, packs, and listings have no guaranteed market value. Prices may go down or to zero. We do not promise returns. Spend only what you can afford to lose.",
  },
  {
    title: "You are responsible for your recovery key",
    body: "We do not store your recovery phrase in plain text and cannot recover lost keys. If you lose your password AND your recovery phrase, your account is permanently locked.",
  },
  {
    title: "Geographic restrictions apply",
    body: "Access is prohibited from jurisdictions where NFT trading or related activities are unlawful. You confirm you are not in a restricted jurisdiction (see Terms).",
  },
  {
    title: "Binding arbitration & class action waiver",
    body: "Disputes are resolved by individual binding arbitration. You waive the right to participate in any class action against Exodia Holdings LLC.",
  },
  {
    title: "Tax responsibility",
    body: "You are solely responsible for reporting and paying any taxes that arise from your activity on the platform.",
  },
  {
    title: "Account termination & cooperation with law enforcement",
    body: "We may suspend or terminate accounts at our discretion, including for suspicious activity, sanctioned regions, or legal process.",
  },
] as const;