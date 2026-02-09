import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Camera } from '../../src/domain/entities/Camera';
import { Location } from '../../src/domain/entities/Location';

describe('Location Entity', () => {
	it('should generate ID and Name correctly from country, state, and city', () => {
		const cameras: Camera[] = [];
		const location = new Location(
			'UTC',
			'UTC+0',
			'USA',
			'Arizona',
			'Phoenix',
			'15:30',
			'20:00',
			cameras
		);

		assert.strictEqual(location.id, 'usa-arizona-phoenix');
		assert.strictEqual(location.name, 'Phoenix, Arizona, USA');
	});

	it('should handle spaces and special chars in slug generation', () => {
		const cameras: Camera[] = [];
		const location = new Location(
			'UTC',
			'UTC+0',
			'Some Country',
			'New York',
			'New York City',
			'15:30',
			'20:00',
			cameras
		);

		assert.strictEqual(location.id, 'some-country-new-york-new-york-city');
		assert.strictEqual(location.name, 'New York City, New York, Some Country');
	});
});
