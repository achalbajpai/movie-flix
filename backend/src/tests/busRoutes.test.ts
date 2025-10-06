/**
 * API Tests for Movie Booking System using Jest + Supertest
 *
 * These tests verify the movie search endpoint: /api/v1/movies
 * Tests include:
 * - Basic search behavior (no params and with filters)
 * - Response format validation (array structure)
 * - Database integration (actual Supabase queries)
 * - Query parameter handling (genre, language, city, date)
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../app';
import { supabase } from '../config/supabase';

describe('🎥 Movie Route API Tests with Supabase Database', () => {
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

  describe('Basic Search Behavior', () => {
    test('should return 200 and list movies when no search parameters are provided', async () => {
      const response = await request(app)
        .get('/api/v1/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });

    test('should return movies when filtering by genre and language', async () => {
      const response = await request(app)
        .get('/api/v1/movies?genre=Action&language=English')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Successful Search Requests', () => {
    test('should return movies with expected movie fields when searching by city and date', async () => {
      const response = await request(app)
        .get(`/api/v1/movies?city=Bangalore&date=${futureDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const first = response.body.data[0];
        // repository.search returns items with movie_id, title and show_count/min_price/theaters
        expect(first.movie_id || first.movieId || first.id).toBeDefined();
        expect(first.title).toBeDefined();
      }
    });
  });

  describe('Query Parameters', () => {
    test('should handle genre and language query parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/movies?genre=Drama&language=Hindi`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should handle URL encoded city names', async () => {
      const response = await request(app)
        .get(`/api/v1/movies?city=new%20delhi&date=${futureDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Database Integration', () => {
    test('should return movie search results with show metadata from Supabase', async () => {
      const response = await request(app)
        .get(`/api/v1/movies?city=delhi&date=${futureDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', testUserId);

      expect(response.status).toBe(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const first = response.body.data[0];
        expect(typeof first.show_count === 'number' || first.show_count === undefined).toBeTruthy();
        expect(typeof first.min_price === 'number' || first.min_price === undefined).toBeTruthy();
        expect(Array.isArray(first.theaters) || first.theaters === undefined).toBeTruthy();
      }
    });
  });
});