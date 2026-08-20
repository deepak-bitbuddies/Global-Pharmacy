export const SalesCollectionMode = {
  Cash: "cash",
  PaytmOnline: "paytm_online",
  CreditDue: "credit_due",
} as const
export type SalesCollectionModeValue = (typeof SalesCollectionMode)[keyof typeof SalesCollectionMode]

// Raw `sales_lines.party_group` labels, as printed on Marg's "Party/Item Wise Sales" letterhead,
// that count as cash-in-hand vs. Paytm/online collection for the dashboard's Collection KPI cards
// and the Sales report's Mode filter/column. Anything else (due bills, doctor/party credit
// accounts, staff due, card payments, etc.) falls through to `CreditDue` — matched
// case/whitespace-insensitively since Marg's own export isn't consistent about casing across
// branches. Exported as arrays (not just the `Set`s below) so `repository.ts` can build a matching
// SQL `IN`/`NOT IN` clause for the Sales report's mode filter.
export const CASH_PARTY_GROUPS = ["CASH"] as const
export const PAYTM_ONLINE_PARTY_GROUPS = ["PAYTM", "DUE PATIENT"] as const

const CASH_PARTY_GROUP_SET = new Set<string>(CASH_PARTY_GROUPS)
const PAYTM_ONLINE_PARTY_GROUP_SET = new Set<string>(PAYTM_ONLINE_PARTY_GROUPS)

export function classifyPartyGroup(partyGroup: string): SalesCollectionModeValue {
  const normalized = partyGroup.trim().toUpperCase()
  if (CASH_PARTY_GROUP_SET.has(normalized)) return SalesCollectionMode.Cash
  if (PAYTM_ONLINE_PARTY_GROUP_SET.has(normalized)) return SalesCollectionMode.PaytmOnline
  return SalesCollectionMode.CreditDue
}
