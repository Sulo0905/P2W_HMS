// Simple test to check if server can start
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    token: 'test-token',
    role: 'Admin',
    user: { username: 'test', id: '123' }
  });
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/`);
});
