/**
 * =============================================================================
 * SOLAR AND LUNAR ANALEMMA - Logger Utility
 * =============================================================================
 */

import { TIMEZONE } from '../config';

/**
 * Logger class for timestamped console output
 * Uses Bolivian timezone (America/La_Paz)
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <>
export class Logger {
	/**
	 * Get current time formatted for logging
	 */
	static getTimestamp(): string {
		const now = new Date();
		return now.toLocaleString('es-BO', {
			timeZone: TIMEZONE.bolivia,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});
	}

	static log(message: string): void {
		console.log(`[${Logger.getTimestamp()}] ${message}`);
	}

	static info(message: string): void {
		console.log(`[${Logger.getTimestamp()}] ℹ️  ${message}`);
	}

	static success(message: string): void {
		console.log(`[${Logger.getTimestamp()}] ✅ ${message}`);
	}

	static warn(message: string): void {
		console.log(`[${Logger.getTimestamp()}] ⚠️  ${message}`);
	}

	static error(message: string): void {
		console.error(`[${Logger.getTimestamp()}] ❌ ${message}`);
	}

	static header(title: string): void {
		console.log('');
		console.log('='.repeat(70));
		console.log(`  ${title}`);
		console.log('='.repeat(70));
		console.log('');
	}
}
