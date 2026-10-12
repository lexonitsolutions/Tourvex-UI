import holidays from "./holidays";
import cruises from "./cruises";
import events from "./events";
import visas from "./visas";
import activities from "./activities";

const CONFIGS = { activities, holidays, cruises, events, visas };

export const CATALOG_TYPES = Object.keys(CONFIGS);
export const catalogConfig = (type) => (Object.hasOwn(CONFIGS, type) ? CONFIGS[type] : null);
