import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Camera } from '../../src/domain/entities/Camera';

describe('Camera Entity', () => {
    it('should set id equal to direction', () => {
        const camera = new Camera('https://example.com', 'north');
        assert.strictEqual(camera.id, 'north');
        assert.strictEqual(camera.direction, 'north');
    });

    it('should handle different directions', () => {
        const camera = new Camera('https://example.com', 'northeast');
        assert.strictEqual(camera.id, 'northeast');
    });
});
