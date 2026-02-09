import * as path from 'node:path';

/** Directory for saving captured screenshots */
export const CAPTURES_DIR = path.join(process.cwd(), 'captures');

/** Timezone configuration */
export const TIMEZONE = {
	bolivia: 'America/La_Paz',
	boliviaOffset: 'UTC-4',
} as const;
