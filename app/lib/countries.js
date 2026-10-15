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

const ISO_CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(" ");
export const ALL_COUNTRIES = ISO_CODES.map((code) => ({ code, name: nameOf(code), flag: `/flags/${code.toLowerCase()}.svg` })).sort((a, b) => a.name.localeCompare(b.name));

const HAS_FLAG = new Set(Object.values(CURRENCY_COUNTRY));
export const flagFor = (code) => (HAS_FLAG.has(String(code).toLowerCase()) ? `/flags/${String(code).toLowerCase()}.svg` : null);
