/**
 * Pexels API Service
 * Provides stock photo search and browsing functionality
 * API Documentation: https://www.pexels.com/api/documentation/
 */

const axios = require('axios');

class PexelsService {
  constructor() {
    // Use rotating API keys from environment
    this.apiKeys = [1, 2, 3, 4, 5, 6, 7]
      .map(n => process.env[`PEXELS_API_KEY_${n}`])
      .filter(Boolean);
    this.currentKeyIndex = 0;
    this.baseUrl = 'https://api.pexels.com/v1';
    
    if (this.apiKeys.length === 0) {
      console.warn('⚠️  No PEXELS_API_KEY_* environment variables set. Stock photo features will be disabled.');
    }
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000
    });
  }

  /**
   * Get current API key and rotate to next
   */
  getApiKey() {
    if (this.apiKeys.length === 0) return null;
    const key = this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
    this.currentKeyIndex++;
    return key;
  }

  /**
   * Check if Pexels API is configured
   */
  isConfigured() {
    return this.apiKeys.length > 0;
  }

  /**
   * Search for photos
   * @param {string} query - Search query
   * @param {number} page - Page number (default: 1)
   * @param {number} perPage - Results per page (default: 20, max: 80)
   * @param {string} orientation - Photo orientation: landscape, portrait, square
   * @param {string} size - Minimum photo size: large(24MP+), medium(12MP+), small(4MP+)
   * @param {string} color - Desired photo color (red, orange, yellow, green, turquoise, blue, violet, pink, brown, black, gray, white)
   * @returns {Promise<Object>} Search results
   */
  async searchPhotos(query, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Pexels API key not configured');
    }

    const {
      page = 1,
      perPage = 20,
      orientation = null,
      size = null,
      color = null,
      locale = 'en-US'
    } = options;

    try {
      const params = {
        query,
        page,
        per_page: Math.min(perPage, 80), // Max 80 per page
        locale
      };

      if (orientation) params.orientation = orientation;
      if (size) params.size = size;
      if (color) params.color = color;

      const response = await this.client.get('/search', { 
        params,
        headers: { 'Authorization': this.getApiKey() }
      });
      
      return {
        success: true,
        data: {
          photos: response.data.photos.map(photo => this.formatPhoto(photo)),
          page: response.data.page,
          perPage: response.data.per_page,
          totalResults: response.data.total_results,
          nextPage: response.data.next_page,
          prevPage: response.data.prev_page
        }
      };
    } catch (error) {
      console.error('Pexels search error:', error.message);
      throw new Error(`Failed to search photos: ${error.message}`);
    }
  }

  /**
   * Get curated photos (editor's picks)
   * @param {number} page - Page number
   * @param {number} perPage - Results per page
   * @returns {Promise<Object>} Curated photos
   */
  async getCuratedPhotos(page = 1, perPage = 20) {
    if (!this.isConfigured()) {
      throw new Error('Pexels API key not configured');
    }

    try {
      const response = await this.client.get('/curated', {
        headers: { 'Authorization': this.getApiKey() },
        params: {
          page,
          per_page: Math.min(perPage, 80)
        }
      });

      return {
        success: true,
        data: {
          photos: response.data.photos.map(photo => this.formatPhoto(photo)),
          page: response.data.page,
          perPage: response.data.per_page,
          totalResults: response.data.total_results,
          nextPage: response.data.next_page,
          prevPage: response.data.prev_page
        }
      };
    } catch (error) {
      console.error('Pexels curated error:', error.message);
      throw new Error(`Failed to get curated photos: ${error.message}`);
    }
  }

  /**
   * Get a specific photo by ID
   * @param {number} photoId - Photo ID
   * @returns {Promise<Object>} Photo details
   */
  async getPhoto(photoId) {
    if (!this.isConfigured()) {
      throw new Error('Pexels API key not configured');
    }

    try {
      const response = await this.client.get(`/photos/${photoId}`, {
        headers: { 'Authorization': this.getApiKey() }
      });
      
      return {
        success: true,
        data: this.formatPhoto(response.data)
      };
    } catch (error) {
      console.error('Pexels get photo error:', error.message);
      throw new Error(`Failed to get photo: ${error.message}`);
    }
  }

  /**
   * Get popular photos
   * @param {number} page - Page number
   * @param {number} perPage - Results per page
   * @returns {Promise<Object>} Popular photos
   */
  async getPopularPhotos(page = 1, perPage = 20) {
    // Pexels doesn't have a dedicated "popular" endpoint
    // We'll use curated as it contains high-quality, popular photos
    return this.getCuratedPhotos(page, perPage);
  }

  /**
   * Get photos by category/collection
   * @param {string} category - Category name (e.g., 'nature', 'business', 'technology')
   * @param {number} page - Page number
   * @param {number} perPage - Results per page
   * @returns {Promise<Object>} Category photos
   */
  async getPhotosByCategory(category, page = 1, perPage = 20) {
    return this.searchPhotos(category, { page, perPage });
  }

  /**
   * Get collections (featured collections from Pexels)
   * @param {number} page - Page number
   * @param {number} perPage - Results per page
   * @returns {Promise<Object>} Collections
   */
  async getCollections(page = 1, perPage = 20) {
    if (!this.isConfigured()) {
      throw new Error('Pexels API key not configured');
    }

    try {
      const response = await this.client.get('/collections/featured', {
        headers: { 'Authorization': this.getApiKey() },
        params: {
          page,
          per_page: Math.min(perPage, 80)
        }
      });

      return {
        success: true,
        data: {
          collections: response.data.collections.map(collection => ({
            id: collection.id,
            title: collection.title,
            description: collection.description,
            mediaCount: collection.media_count,
            photosCount: collection.photos_count,
            videosCount: collection.videos_count
          })),
          page: response.data.page,
          perPage: response.data.per_page,
          totalResults: response.data.total_results,
          nextPage: response.data.next_page,
          prevPage: response.data.prev_page
        }
      };
    } catch (error) {
      console.error('Pexels collections error:', error.message);
      throw new Error(`Failed to get collections: ${error.message}`);
    }
  }

  /**
   * Format photo data for consistent response
   * @param {Object} photo - Raw photo data from Pexels
   * @returns {Object} Formatted photo data
   */
  formatPhoto(photo) {
    return {
      id: photo.id,
      width: photo.width,
      height: photo.height,
      url: photo.url,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      photographerId: photo.photographer_id,
      avgColor: photo.avg_color,
      alt: photo.alt || photo.description || '',
      src: {
        original: photo.src.original,
        large2x: photo.src.large2x,
        large: photo.src.large,
        medium: photo.src.medium,
        small: photo.src.small,
        portrait: photo.src.portrait,
        landscape: photo.src.landscape,
        tiny: photo.src.tiny
      },
      liked: photo.liked || false
    };
  }

  /**
   * Get predefined categories for browsing
   * @returns {Array} List of popular categories
   */
  getCategories() {
    return [
      { id: 'nature', name: 'Nature', icon: '🌿' },
      { id: 'business', name: 'Business', icon: '💼' },
      { id: 'technology', name: 'Technology', icon: '💻' },
      { id: 'people', name: 'People', icon: '👥' },
      { id: 'food', name: 'Food', icon: '🍔' },
      { id: 'travel', name: 'Travel', icon: '✈️' },
      { id: 'architecture', name: 'Architecture', icon: '🏛️' },
      { id: 'fashion', name: 'Fashion', icon: '👗' },
      { id: 'fitness', name: 'Fitness', icon: '💪' },
      { id: 'animals', name: 'Animals', icon: '🐾' },
      { id: 'abstract', name: 'Abstract', icon: '🎨' },
      { id: 'city', name: 'City', icon: '🌆' },
      { id: 'workspace', name: 'Workspace', icon: '🖥️' },
      { id: 'minimal', name: 'Minimal', icon: '⚪' },
      { id: 'background', name: 'Backgrounds', icon: '🖼️' }
    ];
  }

  /**
   * Get usage statistics (for monitoring)
   * Note: Pexels doesn't provide usage stats via API
   * This is a placeholder for future implementation
   */
  async getUsageStats() {
    return {
      configured: this.isConfigured(),
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : null,
      message: 'Pexels API does not provide usage statistics'
    };
  }
}

module.exports = new PexelsService();
