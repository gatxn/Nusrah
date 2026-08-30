export type Country = { code: string; name: string };

/** ISO 3166-1 alpha-2 codes + English short names. */
export const COUNTRIES: Country[] = [
  { code: "TZ", name: "Tanzania" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
  { code: "BI", name: "Burundi" },
  { code: "CD", name: "DR Congo" },
  { code: "ZM", name: "Zambia" },
  { code: "MW", name: "Malawi" },
  { code: "MZ", name: "Mozambique" },
  { code: "SO", name: "Somalia" },
  { code: "ET", name: "Ethiopia" },
  { code: "SD", name: "Sudan" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "TN", name: "Tunisia" },
  { code: "DZ", name: "Algeria" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Ivory Coast" },
  { code: "CM", name: "Cameroon" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "OM", name: "Oman" },
  { code: "BH", name: "Bahrain" },
  { code: "JO", name: "Jordan" },
  { code: "TR", name: "Turkey" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "AU", name: "Australia" },
];

/** Tanzania's regions (mainland + Zanzibar), used when country === "TZ". */
export const TANZANIA_REGIONS: string[] = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Kigoma",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pemba Kaskazini",
  "Pemba Kusini",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
  "Unguja Kaskazini",
  "Unguja Kusini",
  "Unguja Mjini Magharibi",
].filter((region, index, all) => all.indexOf(region) === index);

export function findCountryByName(name: string): Country | undefined {
  const normalized = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === normalized);
}

export function findCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

/** Regional-indicator-symbol trick — no emoji data file needed. */
export function codeToFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
