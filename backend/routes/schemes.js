import express from 'express';
import { db } from '../services/db.js';
import { searchSchemes, checkEligibility, runRuleBasedEligibility } from '../services/gemini.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Optional Authentication Middleware to get user context if available
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

// Get all schemes
router.get('/', (req, res) => {
  try {
    const schemes = db.getSchemes();
    res.json(schemes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve schemes' });
  }
});

// Search schemes (supports Natural Language via AI)
router.get('/search', async (req, res) => {
  try {
    const { q, lang } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query parameter (q) is required' });

    // Track analytics search
    const analytics = db.getAnalytics();
    analytics.searches = (analytics.searches || 0) + 1;
    db.saveAnalytics(analytics);

    const schemes = db.getSchemes();
    const results = await searchSchemes(q, schemes, lang || 'English');
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get personalized recommendations based on profile
router.post('/recommendations', (req, res) => {
  try {
    const profile = req.body;
    const schemes = db.getSchemes();
    
    // Score/Filter schemes based on rule checks
    const recommended = schemes.map(scheme => {
      const evaluation = runRuleBasedEligibility(scheme, profile, 'English');
      return {
        ...scheme,
        eligibilityStatus: evaluation
      };
    });

    // Sort: Eligible first, then popularity
    recommended.sort((a, b) => {
      if (a.eligibilityStatus.eligible && !b.eligibilityStatus.eligible) return -1;
      if (!a.eligibilityStatus.eligible && b.eligibilityStatus.eligible) return 1;
      return b.popularity - a.popularity;
    });

    res.json(recommended);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get scheme by ID
router.get('/:id', optionalAuthenticate, (req, res) => {
  try {
    const { id } = req.params;
    const schemes = db.getSchemes();
    const schemeIndex = schemes.findIndex(s => s.id === id);
    
    if (schemeIndex === -1) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    // Increment popularity
    schemes[schemeIndex].popularity = (schemes[schemeIndex].popularity || 0) + 1;
    db.saveSchemes(schemes);

    // Track analytics scheme views
    const analytics = db.getAnalytics();
    if (!analytics.schemeViews) analytics.schemeViews = {};
    analytics.schemeViews[id] = (analytics.schemeViews[id] || 0) + 1;
    db.saveAnalytics(analytics);

    // If authenticated, add to recently viewed list
    if (req.user) {
      const users = db.getUsers();
      const userIndex = users.findIndex(u => u.id === req.user.id);
      if (userIndex !== -1) {
        let recently = users[userIndex].recentlyViewed || [];
        // Remove duplicate if exists
        recently = recently.filter(item => item !== id);
        // Add to front
        recently.unshift(id);
        // Limit to 5
        if (recently.length > 5) recently.pop();
        users[userIndex].recentlyViewed = recently;
        db.saveUsers(users);
      }
    }

    res.json(schemes[schemeIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve scheme' });
  }
});

// Compare schemes
router.post('/compare', (req, res) => {
  try {
    const { schemeIds } = req.body;
    if (!Array.isArray(schemeIds) || schemeIds.length === 0) {
      return res.status(400).json({ error: 'schemeIds array is required' });
    }

    const schemes = db.getSchemes();
    const comparison = schemes.filter(s => schemeIds.includes(s.id));
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare schemes' });
  }
});

// Run live/dynamic AI Eligibility Checker
router.post('/:id/check-eligibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile, lang } = req.body;
    
    if (!profile) return res.status(400).json({ error: 'Profile is required' });

    const schemes = db.getSchemes();
    const scheme = schemes.find(s => s.id === id);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

    const result = await checkEligibility(scheme, profile, lang || 'English');
    res.json(result);
  } catch (error) {
    console.error('Eligibility endpoint error:', error);
    res.status(500).json({ error: 'Eligibility check failed' });
  }
});

export default router;
