import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Ensure database files exist
function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(SCHEMES_FILE)) {
    fs.writeFileSync(SCHEMES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(ANALYTICS_FILE)) {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ searches: 0, chatMessages: 0, schemeViews: {} }, null, 2), 'utf-8');
  }
}

// Initialize database paths
initDb();

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading database file: ${filePath}`, error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing database file: ${filePath}`, error);
    return false;
  }
}

export const db = {
  getSchemes: () => readJsonFile(SCHEMES_FILE),
  saveSchemes: (schemes) => writeJsonFile(SCHEMES_FILE, schemes),
  
  getUsers: () => readJsonFile(USERS_FILE),
  saveUsers: (users) => writeJsonFile(USERS_FILE, users),

  getFeedback: () => readJsonFile(FEEDBACK_FILE),
  saveFeedback: (feedback) => writeJsonFile(FEEDBACK_FILE, feedback),

  getAnalytics: () => {
    try {
      const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return { searches: 0, chatMessages: 0, schemeViews: {} };
    }
  },
  saveAnalytics: (analytics) => writeJsonFile(ANALYTICS_FILE, analytics)
};
