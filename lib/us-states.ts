/**
 * US states + DC for standard review “reviewing from” dropdown.
 * Stored values are USPS-style codes; "OTHER" = outside / prefer not to specify as a US state.
 */
export const US_STATES_AND_DC = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
] as const;

export const REVIEWER_STATE_OTHER = "OTHER" as const;

export const REVIEWER_STATE_ENUM = [
  ...US_STATES_AND_DC.map(([code]) => code),
  REVIEWER_STATE_OTHER,
] as const;

export type ReviewerStateCode = (typeof REVIEWER_STATE_ENUM)[number];

const labelByCode = new Map<string, string>(
  US_STATES_AND_DC.map(([code, name]) => [code, name]),
);

export function reviewerStateLabel(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (value === REVIEWER_STATE_OTHER) return "Other";
  return labelByCode.get(value) ?? value;
}

export const reviewerStateSelectOptions: Array<{ value: string; label: string }> = [
  ...US_STATES_AND_DC.map(([code, name]) => ({ value: code, label: name })),
  { value: REVIEWER_STATE_OTHER, label: "Other" },
];
