import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware to authenticate JWT
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// User Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    const users = db.getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      profile: {
        age: '',
        gender: '',
        occupation: '',
        income: '',
        state: '',
        education: '',
        disability: false,
        caste: '',
        isFarmer: false
      },
      favorites: [],
      recentlyViewed: []
    };
    
    users.push(newUser);
    db.saveUsers(users);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, profile: newUser.profile } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = db.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile: user.profile, favorites: user.favorites, recentlyViewed: user.recentlyViewed } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get User Profile
router.get('/profile', authenticateToken, (req, res) => {
  const users = db.getUsers();
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    favorites: user.favorites,
    recentlyViewed: user.recentlyViewed
  });
});

// Update User Profile
router.put('/profile', authenticateToken, (req, res) => {
  const users = db.getUsers();
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  const updatedProfile = {
    ...users[userIndex].profile,
    ...req.body
  };
  
  users[userIndex].profile = updatedProfile;
  db.saveUsers(users);
  
  res.json({ message: 'Profile updated successfully', profile: updatedProfile });
});

// Add Favorite Scheme
router.post('/favorites', authenticateToken, (req, res) => {
  const { schemeId } = req.body;
  if (!schemeId) return res.status(400).json({ error: 'Scheme ID required' });
  
  const users = db.getUsers();
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  if (!users[userIndex].favorites) {
    users[userIndex].favorites = [];
  }
  
  if (!users[userIndex].favorites.includes(schemeId)) {
    users[userIndex].favorites.push(schemeId);
    db.saveUsers(users);
  }
  
  res.json({ message: 'Scheme added to favorites', favorites: users[userIndex].favorites });
});

// Remove Favorite Scheme
router.delete('/favorites/:schemeId', authenticateToken, (req, res) => {
  const { schemeId } = req.params;
  const users = db.getUsers();
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  if (users[userIndex].favorites) {
    users[userIndex].favorites = users[userIndex].favorites.filter(id => id !== schemeId);
    db.saveUsers(users);
  }
  
  res.json({ message: 'Scheme removed from favorites', favorites: users[userIndex].favorites });
});

// Get User Favorites
router.get('/favorites', authenticateToken, (req, res) => {
  const users = db.getUsers();
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const schemes = db.getSchemes();
  const favoriteSchemes = schemes.filter(s => (user.favorites || []).includes(s.id));
  
  res.json(favoriteSchemes);
});

export default router;
