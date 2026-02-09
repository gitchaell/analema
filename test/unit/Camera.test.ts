import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Camera } from '../../src/domain/entities/Camera';

describe('Camera Entity', () => {
	it('should initialize with direction and url', () => {
		const camera = new Camera('north', 'https://example.com');
		assert.strictEqual(camera.direction, 'north');
		assert.strictEqual(camera.url, 'https://example.com');
	});

	it('should handle different directions', () => {
		const camera = new Camera('northeast', 'https://example.com');
		assert.strictEqual(camera.direction, 'northeast');
	});
});
