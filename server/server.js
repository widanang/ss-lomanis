import express from 'express';
import cors from 'cors';
import multer from 'multer';
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import setup from './database.js'; // Import the setup function

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key';

app.use(cors());
app.use(express.json());

// Set up multer for file storage in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let db;

// --- AUTHENTICATION MIDDLEWARE ---
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Add user payload to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
};

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide username and password' });
  }

  try {
    // Check if it's the first user. If so, make them an admin.
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const role = userCount.count === 0 ? 'admin' : 'user';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const stmt = await db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    await stmt.run(username, hashedPassword, role);
    await stmt.finalize();

    res.status(201).json({ message: `User registered successfully as ${role}` });
  } catch (error) {
    if (error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
       return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({
        token,
        username: user.username,
        role: user.role,
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// --- USER MANAGEMENT (Admin Only) ---
app.get('/api/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await db.all('SELECT id, username, role FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.put('/api/users/:id/role', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
    }

    try {
        await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.status(200).json({ message: 'User role updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user role.' });
    }
});

// --- MANUAL STATS ROUTES ---
app.get('/api/manual-stats', protect, async (req, res) => {
    try {
        const stats = await db.all('SELECT * FROM manual_stats ORDER BY date DESC');
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manual stats' });
    }
});

app.post('/api/manual-stats', protect, async (req, res) => {
    const { date, delivery_success, delivery_pending, pickup_success, pickup_failed, cod_packages_count, submitted_by } = req.body;

    if (!date || !submitted_by) {
        return res.status(400).json({ error: 'Date and User are required.' });
    }

    try {
        // Using INSERT ... ON CONFLICT (UPSERT) to add or update stats for a given date
        const stmt = await db.prepare(`
            INSERT INTO manual_stats (date, delivery_success, delivery_pending, pickup_success, pickup_failed, cod_packages_count, submitted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                delivery_success = excluded.delivery_success,
                delivery_pending = excluded.delivery_pending,
                pickup_success = excluded.pickup_success,
                pickup_failed = excluded.pickup_failed,
                cod_packages_count = excluded.cod_packages_count,
                submitted_by = excluded.submitted_by
        `);
        await stmt.run(date, delivery_success || 0, delivery_pending || 0, pickup_success || 0, pickup_failed || 0, cod_packages_count || 0, submitted_by);
        await stmt.finalize();
        res.status(201).json({ message: 'Manual stats saved successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save manual stats.' });
    }
});

// --- PROTECTED DATA ROUTES ---

// Endpoint to get all existing data from DB
app.get('/api/data', protect, async (req, res) => {
  try {
    const pickupData = await db.all('SELECT * FROM pickup');
    const deliveryData = await db.all('SELECT * FROM delivery');
    res.json({ pickupData, deliveryData });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data from database.');
  }
});

// Endpoint for file upload
app.post('/api/upload', protect, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        
        const pickupSheetName = 'Pickup';
        const deliverySheetName = 'Delivery';

        if (!workbook.SheetNames.includes(pickupSheetName) || !workbook.SheetNames.includes(deliverySheetName)) {
            return res.status(400).json({ error: 'Invalid Excel file: It must contain both "Pickup" and "Delivery" sheets.' });
        }

        const pickupData = xlsx.utils.sheet_to_json(workbook.Sheets[pickupSheetName]);
        const deliveryData = xlsx.utils.sheet_to_json(workbook.Sheets[deliverySheetName]);
        
        // Use a transaction for bulk inserts
        await db.exec('BEGIN TRANSACTION');

        const pickupStmt = await db.prepare('INSERT OR REPLACE INTO pickup (AWB, Nama, Alamat, "No. HP", Tanggal, User) VALUES (?, ?, ?, ?, ?, ?)');
        for (const row of pickupData) {
            if (!row.AWB) continue; // Skip empty rows
            await pickupStmt.run(row.AWB, row.Nama, row.Alamat, row['No. HP'], row.Tanggal, row.User);
        }
        await pickupStmt.finalize();
        
        const deliveryStmt = await db.prepare('INSERT OR REPLACE INTO delivery (AWB, Status, Tanggal, User, "COD Amount") VALUES (?, ?, ?, ?, ?)');
        for (const row of deliveryData) {
            if (!row.AWB) continue; // Skip empty rows
            await deliveryStmt.run(row.AWB, row.Status, row.Tanggal, row.User, row['COD Amount']);
        }
        await deliveryStmt.finalize();

        await db.exec('COMMIT');

        res.json({ message: 'File processed and data saved successfully' });
    } catch (error) {
        await db.exec('ROLLBACK'); // Rollback transaction on error
        console.error('Error processing file:', error);
        
        let errorMessage = 'Error processing or saving file data.';
        if (error.message.includes('SQLITE_CONSTRAINT')) {
            errorMessage = 'Data conflict or constraint violation. Please check your data for duplicates or missing required fields.';
        } else if (error.message.includes('sheet_to_json')) {
            errorMessage = 'Error reading data from Excel sheets. Please ensure column headers are correct.';
        }

        res.status(500).json({ error: errorMessage, details: error.message });
    }
});

// Endpoint to ADD a single pickup record
app.post('/api/pickup', protect, async (req, res) => {
    try {
        const { AWB, Nama, Alamat, "No. HP": NoHP, Tanggal } = req.body;
        const User = req.user.username; // Automatically use logged-in user
        if (!AWB || !Tanggal) {
            return res.status(400).json({ error: 'AWB and Tanggal are required fields.' });
        }
        const stmt = await db.prepare('INSERT INTO pickup (AWB, Nama, Alamat, "No. HP", Tanggal, User) VALUES (?, ?, ?, ?, ?, ?)');
        await stmt.run(AWB, Nama, Alamat, NoHP, Tanggal, User);
        await stmt.finalize();
        res.status(201).json({ message: 'Pickup record added successfully' });
    } catch (error) {
        console.error('Error adding pickup record:', error);
        res.status(500).json({ error: 'Failed to add pickup record.', details: error.message });
    }
});

// Endpoint to ADD a single delivery record
app.post('/api/delivery', protect, async (req, res) => {
    try {
        const { AWB, Status, "COD Amount": CODAmount, Tanggal } = req.body;
        const User = req.user.username; // Automatically use logged-in user
        if (!AWB || !Tanggal) {
            return res.status(400).json({ error: 'AWB and Tanggal are required fields.' });
        }
        const stmt = await db.prepare('INSERT INTO delivery (AWB, Status, Tanggal, User, "COD Amount") VALUES (?, ?, ?, ?, ?)');
        await stmt.run(AWB, Status, Tanggal, User, CODAmount);
        await stmt.finalize();
        res.status(201).json({ message: 'Delivery record added successfully' });
    } catch (error) {
        console.error('Error adding delivery record:', error);
        res.status(500).json({ error: 'Failed to add delivery record.', details: error.message });
    }
});

// Endpoint to UPDATE a pickup record
app.put('/api/pickup/:awb', protect, async (req, res) => {
    const { awb } = req.params;
    const { Nama, Alamat, "No. HP": NoHP, Tanggal } = req.body;
    const User = req.user.username;
    try {
        await db.run(
            'UPDATE pickup SET Nama = ?, Alamat = ?, "No. HP" = ?, Tanggal = ?, User = ? WHERE AWB = ?',
            [Nama, Alamat, NoHP, Tanggal, User, awb]
        );
        res.status(200).json({ message: 'Pickup record updated successfully' });
    } catch (error) {
        console.error('Error updating pickup record:', error);
        res.status(500).send('Error updating pickup record.');
    }
});

// Endpoint to UPDATE a delivery record
app.put('/api/delivery/:awb', protect, async (req, res) => {
    const { awb } = req.params;
    const { Status, Tanggal, "COD Amount": CODAmount } = req.body;
    const User = req.user.username;
    try {
        await db.run(
            'UPDATE delivery SET Status = ?, Tanggal = ?, User = ?, "COD Amount" = ? WHERE AWB = ?',
            [Status, Tanggal, User, CODAmount, awb]
        );
        res.status(200).json({ message: 'Delivery record updated successfully' });
    } catch (error) {
        console.error('Error updating delivery record:', error);
        res.status(500).send('Error updating delivery record.');
    }
});

// Endpoint to DELETE a record from both tables
app.delete('/api/data/:awb', protect, isAdmin, async (req, res) => {
    const { awb } = req.params;
    try {
        await db.exec('BEGIN TRANSACTION');
        await db.run('DELETE FROM pickup WHERE AWB = ?', awb);
        await db.run('DELETE FROM delivery WHERE AWB = ?', awb);
        await db.exec('COMMIT');
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error deleting record:', error);
        res.status(500).send('Error deleting record.');
    }
});

// --- SERVER STARTUP ---
async function startServer() {
  db = await setup();
  console.log('Database connected and tables are ready.');

  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

startServer(); 