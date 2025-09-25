/**
 * API Tests for Bus Booking System using Jest + Supertest
 *
 * These tests verify the most important endpoint: /api/v1/buses/search
 * Tests include:
 * - Input validation (missing/invalid parameters)
 * - Response format validation (paginated structure)
 * - Database integration (actual Supabase queries)
 * - Query parameter handling (limit, pagination)
 * - URL encoding for city names
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../app';

describe('🚌 Bus Route API Tests with Supabase Database', () => {
  let app: Application;
  let futureDate: string;

  beforeAll(() => {
    app = createApp();
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    futureDate = date.toISOString().split('T')[0];
  });

  describe('Input Validation', () => {
    test('should return 400 when no search parameters are provided', async () => {
      const response = await request(app)
        .get('/api/v1/buses/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should return 400 when required parameters are missing', async () => {
      const response = await request(app)
        .get('/api/v1/buses/search?source=delhi');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=invalid-date&passengers=1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Successful Search Requests', () => {
    test('should return buses when valid search parameters are provided', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=${futureDate}&passengers=1`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
    });
  });

  describe('Query Parameters', () => {
    test('should handle query parameters like limit and offset', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=${futureDate}&passengers=1&limit=5&page=1`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.limit).toBe(5);
    });

    test('should handle URL encoded city names', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=new%20delhi&destination=mumbai&departureDate=${futureDate}&passengers=1`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    test('should return database metadata and filters from Supabase', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=${futureDate}&passengers=1`);

      expect(response.status).toBe(200);

      expect(response.body.data.metadata).toBeDefined();
      expect(typeof response.body.data.metadata.searchTime).toBe('number');

      expect(response.body.data.filters).toBeDefined();
      expect(Array.isArray(response.body.data.filters.availableOperators)).toBe(true);
      expect(Array.isArray(response.body.data.filters.availableBusTypes)).toBe(true);
      expect(response.body.data.filters.priceRange).toBeDefined();

      const hasRealData = response.body.data.filters.availableOperators.length > 0 ||
                         response.body.data.filters.availableBusTypes.length > 0;
      expect(hasRealData).toBe(true);
    });
  });
});