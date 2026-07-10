import express from 'express';
import multer from 'multer';
import { chatSession, clearMemory, ocrDocument, chatCallAgent } from '../services/gemini.js';
import { db } from '../services/db.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// AI Chatbot endpoint
router.post('/', async (req, res) => {
  try {
    const { sessionId, message, language, profile } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Increment chat analytics
    const analytics = db.getAnalytics();
    analytics.chatMessages = (analytics.chatMessages || 0) + 1;
    db.saveAnalytics(analytics);

    const schemes = db.getSchemes();
    const reply = await chatSession(sessionId, message, language || 'English', profile || {}, schemes);
    
    res.json(reply);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Clear conversation memory endpoint
router.post('/clear', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    
    clearMemory(sessionId);
    res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat memory' });
  }
});

// OCR Document Upload endpoint
router.post('/ocr', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file (document)' });
    }
    
    const { lang } = req.body;
    const result = await ocrDocument(req.file.buffer, req.file.mimetype, lang || 'English');
    res.json(result);
  } catch (error) {
    console.error('OCR route error:', error);
    res.status(500).json({ error: 'OCR Processing failed' });
  }
});

// Call Agent (Telugu Helpdesk) endpoint
router.post('/call-agent', async (req, res) => {
  try {
    const { sessionId, message, profile } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Track analytics
    const analytics = db.getAnalytics();
    analytics.callAgentMessages = (analytics.callAgentMessages || 0) + 1;
    db.saveAnalytics(analytics);

    const schemes = db.getSchemes();
    const reply = await chatCallAgent(sessionId, message, schemes, profile || {});

    res.json(reply);
  } catch (error) {
    console.error('Call Agent endpoint error:', error);
    res.status(500).json({ error: 'Call Agent processing failed' });
  }
});

export default router;
