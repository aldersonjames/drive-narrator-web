import request from 'supertest';

describe('POI provider gating integration', () => {
  const loadApp = async () => {
    jest.resetModules();
    const mod = await import('../../src/api/app');
    return mod.default;
  };

  afterEach(() => {
    delete process.env.FOURSQUARE_API_KEY;
  });

  it('locks Foursquare when credentials are missing', async () => {
    const app = await loadApp();

    const response = await request(app)
      .get('/api/preferences?profileId=traveler-001')
      .set('x-traveler-id', 'traveler-001');

    expect(response.status).toBe(200);
    expect(response.body.providerCapabilities.foursquare.locked).toBe(true);
    expect(response.body.providerCapabilities.foursquare.available).toBe(false);
  });

  it('unlocks Foursquare when credentials are configured', async () => {
    process.env.FOURSQUARE_API_KEY = 'test-key';
    const app = await loadApp();

    const response = await request(app)
      .get('/api/preferences?profileId=traveler-001')
      .set('x-traveler-id', 'traveler-001');

    expect(response.status).toBe(200);
    expect(response.body.providerCapabilities.foursquare.locked).toBe(false);
    expect(response.body.providerCapabilities.foursquare.available).toBe(true);
  });
});
