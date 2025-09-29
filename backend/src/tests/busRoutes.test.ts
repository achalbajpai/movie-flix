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
import { supabase } from '../config/supabase';

describe('🚌 Bus Route API Tests with Supabase Database', () => {
  let app: Application;
  let futureDate: string;
  let authToken: string;
  let testUserId: string;

  const testUser = {
    user_id: "8b5c9a8f-9a3a-4a2b-8c7d-3e5f1a3b2c1d",
    email: "priya@example.com"
  };

  beforeAll(async () => {
    app = createApp();
    const date = new Date();
    date.setDate(date.getDate() + 7); 
    futureDate = date.toISOString().split('T')[0];
    testUserId = testUser.user_id;

    authToken = 'test-token';
  });

  describe('Input Validation', () => {
    test('should return 400 when no search parameters are provided', async () => {
      const response = await request(app)
        .get('/api/v1/buses/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should return 400 when required parameters are missing', async () => {
      const response = await request(app)
        .get('/api/v1/buses/search?source=delhi')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=invalid-date&passengers=1')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Successful Search Requests', () => {
    test('should return buses when valid search parameters are provided', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=${futureDate}&passengers=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

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
        .get(`/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=${futureDate}&passengers=1&limit=5&page=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.limit).toBe(5);
    });

    test('should handle URL encoded city names', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=new%20delhi&destination=mumbai&departureDate=${futureDate}&passengers=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    test('should return database metadata and filters from Supabase', async () => {
      const response = await request(app)
        .get(`/api/v1/buses/search?source=delhi&destination=mumbai&departureDate=${futureDate}&passengers=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

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