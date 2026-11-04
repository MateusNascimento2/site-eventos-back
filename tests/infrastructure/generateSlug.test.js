const { generateSlug } = require('../../src/infrastructure/security/generateSlug');

describe('generateSlug', () => {
  it('gera 12 caracteres seguros para URL', () => {
    expect(generateSlug()).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });

  it('não repete em mil sorteios', () => {
    const slugs = new Set(Array.from({ length: 1000 }, generateSlug));

    expect(slugs.size).toBe(1000);
  });
});
