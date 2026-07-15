let admin;

try {
  admin = require('firebase-admin');
} catch (err) {
  module.exports = (req, res) => {
    res.status(500).json({ error: 'firebase-admin is not installed. Run "npm install firebase-admin".' });
  };
}

if (admin) {
  // Load service account JSON from env or (development) local file
  const fs = require('fs');
  const path = require('path');

  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || null;

  // Development convenience: if env var not set, look for a local service account file
  if (!serviceAccountJson && process.env.NODE_ENV !== 'production') {
    try {
      const projectRoot = path.resolve(__dirname, '..');
      const files = fs.readdirSync(projectRoot);
      const match = files.find(f => f.toLowerCase().includes('firebase-adminsdk') && f.toLowerCase().endsWith('.json'));
      if (match) {
        const filePath = path.join(projectRoot, match);
        serviceAccountJson = fs.readFileSync(filePath, 'utf8');
        console.log('Loaded local Firebase service account from', match);
      }
    } catch (e) {
      // ignore - will handle below
    }
  }

  if (!serviceAccountJson) {
    module.exports = (req, res) => {
      res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT env var is not set. For local dev, place service account JSON in project root with "firebase-adminsdk" in its filename.' });
    };
  } else {
    let serviceAccount;
    try {
      let cleanedJson = serviceAccountJson.trim();
      if ((cleanedJson.startsWith("'") && cleanedJson.endsWith("'")) || 
          (cleanedJson.startsWith('"') && cleanedJson.endsWith('"'))) {
        cleanedJson = cleanedJson.slice(1, -1);
      }
      serviceAccount = JSON.parse(cleanedJson);
    } catch (err) {
      module.exports = (req, res) => {
        res.status(500).json({ error: 'Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ' + String(err.message) });
      };
    }

    if (serviceAccount) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      module.exports = async (req, res) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) return res.status(401).json({ error: 'Missing Authorization Bearer token' });

        try {
          const decoded = await admin.auth().verifyIdToken(token);
          res.json({ uid: decoded.uid, email: decoded.email, claims: decoded });
        } catch (err) {
          res.status(401).json({ error: err.message || 'Invalid token' });
        }
      };
    }
  }
}
