/**
 * API calls for analytics and user statistics
 */

import { authenticatedFetch } from './enhancedApi';

// Get base URL
const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
};

/**
 * Get user dashboard statistics
 */
export const getUserStats = async () => {
  try {
    const url = `${getBaseUrl()}/v1/analytics/stats`;
    // Send client's IANA timezone so server can compute weekly activity in user's local days
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    const response = await authenticatedFetch(url, { method: 'GET', headers: { 'X-Client-Timezone': tz } });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Get user analysis history
 * @param {string} emotionFilter - Filter by emotion (optional)
 */
export const getUserHistory = async (emotionFilter = null) => {
  try {
    let url = `${getBaseUrl()}/v1/analytics/history`;
    
    if (emotionFilter && emotionFilter !== 'all') {
      url += `?emotion_filter=${encodeURIComponent(emotionFilter)}`;
    }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  const response = await authenticatedFetch(url, { method: 'GET', headers: tz ? { 'X-Client-Timezone': tz } : {} });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Save analysis result to user's history
 * @param {Object} analysisData - Analysis result data
 */
export const saveAnalysisResult = async (analysisData) => {
  try {
    const url = `${getBaseUrl()}/v1/analytics/save-analysis`;
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Get user profile stats for the Account page
 */
export const getUserProfileStats = async () => {
  try {
    const stats = await getUserStats();
    
    return {
      totalAnalyses: stats.total_analyses || 0,
      streak: stats.streak || 0,
      mostFrequentEmotion: stats.most_frequent_emotion || null
    };
  } catch (error) {
    console.error('Error getting profile stats:', error);
    // Return default values on error
    return {
      totalAnalyses: 0,
      streak: 0,
      mostFrequentEmotion: null
    };
  }
};