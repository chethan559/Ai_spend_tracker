import { normalizeEndpoint } from '../utils/url';

describe('normalizeEndpoint', () => {
  it('should remove trailing slash', () => {
    expect(normalizeEndpoint('https://api.example.com/')).toBe(
      'https://api.example.com',
    );
  });

  it('should remove multiple trailing slashes', () => {
    expect(normalizeEndpoint('https://api.example.com///')).toBe(
      'https://api.example.com',
    );
  });

  it('should trim whitespace', () => {
    expect(normalizeEndpoint('  https://api.example.com  ')).toBe(
      'https://api.example.com',
    );
  });

  it('should add https:// if missing protocol', () => {
    expect(normalizeEndpoint('api.example.com')).toBe('https://api.example.com');
  });

  it('should keep http:// if specified', () => {
    expect(normalizeEndpoint('http://localhost:3000')).toBe(
      'http://localhost:3000',
    );
  });

  it('should handle URL with trailing slash and whitespace', () => {
    expect(normalizeEndpoint('  https://api.example.com/  ')).toBe(
      'https://api.example.com',
    );
  });

  it('should not modify already normalized URL', () => {
    expect(normalizeEndpoint('https://api.example.com')).toBe(
      'https://api.example.com',
    );
  });
});

