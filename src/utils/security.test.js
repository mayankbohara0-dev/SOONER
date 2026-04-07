import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeInput, validateEmail, validatePassword, validateName, checkRateLimit, resetRateLimit } from './security';

describe('Security Utility Tests', () => {
  describe('Input Validation & Sanitization', () => {
    it('should strip XSS tags from input', () => {
      const dirty = '<script>alert(1)</script>Hello';
      const clean = sanitizeInput(dirty);
      expect(clean).toBe('alert(1)Hello'); // Expected considering exact regex behavior: <[^>]*>|javascript:|on\w+\s*=|data:/gi
    });

    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
    });

    it('should validate strong passwords', () => {
      const strong = validatePassword('StrongPass123!');
      expect(strong.valid).toBe(true);
      
      const weak = validatePassword('weak');
      expect(weak.valid).toBe(false);
      expect(weak.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      resetRateLimit('test_action');
    });

    it('should allow actions within limit', () => {
      const res = checkRateLimit('test_action', 3);
      expect(res.allowed).toBe(true);
    });

    it('should block actions exceeding limit', () => {
      checkRateLimit('test_action', 2);
      checkRateLimit('test_action', 2);
      const res3 = checkRateLimit('test_action', 2);
      expect(res3.allowed).toBe(false);
      expect(res3.retryAfterMs).toBeDefined();
    });
  });
});
