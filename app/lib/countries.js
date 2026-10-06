// Country list for the phone code and nationality selects: ISO code + dialling code, names from the runtime's own data.
import { CURRENCY_COUNTRY } from "./currencies";

const RAW = [
  ["AE", "971"], ["SA", "966"], ["QA", "974"], ["KW", "965"], ["BH", "973"], ["OM", "968"], ["JO", "962"], ["EG", "20"], ["LB", "961"], ["IQ", "964"],
  ["IN", "91"], ["PK", "92"], ["BD", "880"], ["LK", "94"], ["NP", "977"], ["PH", "63"], ["ID", "62"], ["MY", "60"], ["SG", "65"], ["TH", "66"],
  ["VN", "84"], ["CN", "86"], ["HK", "852"], ["JP", "81"], ["KR", "82"], ["GB", "44"], ["IE", "353"], ["FR", "33"], ["DE", "49"], ["IT", "39"],
  ["ES", "34"], ["PT", "351"], ["NL", "31"], ["BE", "32"], ["CH", "41"], ["AT", "43"], ["SE", "46"], ["NO", "47"], ["DK", "45"], ["FI", "358"],
  ["PL", "48"], ["RU", "7"], ["UA", "380"], ["TR", "90"], ["GR", "30"], ["US", "1"], ["CA", "1"], ["MX", "52"], ["BR", "55"], ["AR", "54"],
  ["AU", "61"], ["NZ", "64"], ["ZA", "27"], ["KE", "254"], ["NG", "234"], ["MA", "212"], ["TZ", "255"], ["MU", "230"], ["AZ", "994"], ["KZ", "7"],
  ["UZ", "998"], ["GE", "995"], ["AM", "374"], ["IL", "972"], ["IR", "98"], ["AF", "93"],
];

let names;
const nameOf = (code) => {
  try {
    names ||= new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(code) || code;
  } catch {
    return code;
  }
};

export const COUNTRIES = RAW.map(([code, dial]) => ({ code, dial: `+${dial}`, name: nameOf(code) })).sort((a, b) => a.name.localeCompare(b.name));

const HAS_FLAG = new Set(Object.values(CURRENCY_COUNTRY));
export const flagFor = (code) => (HAS_FLAG.has(String(code).toLowerCase()) ? `/flags/${String(code).toLowerCase()}.svg` : null);
