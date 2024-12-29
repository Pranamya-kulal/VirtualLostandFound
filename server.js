const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const engine = require('ejs-mate');
const multer = require('multer');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

// Set up multer to store uploaded files in the "uploads" folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Directory to save files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique file name
    }
});

const upload = multer({ storage: storage });

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '4sf22cs139', // Update with your password
    database: 'VirtualLostAndFound' // Replace with your actual database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Could not connect to database:', err);
        return;
    }
    console.log('Connected to the database!');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the "uploads" folder statically so images can be accessed via URLs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up EJS
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up session management
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true
}));

// Route for Registration Page
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle Registration Form Submission
app.post('/register', (req, res) => {
    const { username, password, email } = req.body;

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error during registration');
        }

        // Prepare SQL query to insert the new user into the database
        const sql = 'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)';

        // Execute the query
        db.query(sql, [username, hashedPassword, email], (err, result) => {
            if (err) {
                console.error('Error inserting user into database:', err);
                return res.status(500).send('Error during registration');
            }

            // Registration successful, redirect to login page
            res.redirect('/login');
        });
    });
});

// Route for Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login Form Submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query to find the user by username
    const sql = 'SELECT * FROM Users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user from database:', err);
            return res.status(500).send('An error occurred while logging in.');
        }

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password.');
        }

        const user = results[0];

        // Compare the provided password with the hashed password in the database
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('An error occurred');
            }

            if (!isMatch) {
                return res.status(401).send('Invalid username or password.');
            }

            // Store the user_id in the session
            req.session.user_id = user.user_id;

            // If credentials are correct, redirect to the home page
            res.redirect('/home');
        });
    });
});

// Route for Home Page
app.get('/home', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }

    // Query to fetch the username from the database using the user_id stored in the session
    const sql = 'SELECT username FROM Users WHERE user_id = ?';
    db.query(sql, [req.session.user_id], (err, results) => {
        if (err) {
            console.error('Error fetching username:', err);
            return res.status(500).send('An error occurred while fetching the username.');
        }

        // Assuming that the query returns a valid user
        const username = results[0].username;

        // Render the home page with the username
        res.render('home', { username: username, success: req.query.success || null });
    });
});

// Route for Reporting Lost Item Page
app.get('/report-lost', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');  // Redirect to login if not logged in
    }

    res.render('report-lost', {
        errorMessage: null,  // For any error messages
        item_name: '',
        item_description: ''
    });
});

// Handle Lost Item Submission
app.post('/submit-lost-item', upload.single('item_picture'), (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');  // Redirect to login if not logged in
    }

    const { item_name, item_description } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;  // Get the image path from the uploaded file

    // SQL query to insert the lost item into the Lost_Items table
    const sql = 'INSERT INTO Lost_Items (user_id, item_name, description, image_path) VALUES (?, ?, ?, ?)';
    db.query(sql, [req.session.user_id, item_name, item_description, image_path], (err, result) => {
        if (err) {
            console.error('Error inserting lost item:', err);
            return res.render('report-lost', {
                errorMessage: 'Error reporting lost item. Please try again.',
                item_name: item_name,
                item_description: item_description
            });
        }

        // Successful item reporting
        res.redirect('/home?success=Item reported successfully');
    });
});

// Route for Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Failed to logout');
        }

        // Redirect to login page after successful logout
        res.redirect('/login');
    });
});

// Route for Search Lost Items Page (GET method)
app.get('/search-lost', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');  // Redirect to login if not logged in
    }

    // Render search page with no results initially
    res.render('search-lost', { results: [], errorMessage: null });
});

// Handle Lost Item Search (POST method)
app.post('/search-lost', (req, res) => {
    const { searchQuery } = req.body;

    if (!searchQuery) {
        return res.render('search-lost', { results: [], errorMessage: 'Please enter a search query.' });
    }

    // SQL query to search for lost items by name or description
    const sql = 'SELECT * FROM Lost_Items WHERE item_name LIKE ? OR description LIKE ?';
    db.query(sql, [`%${searchQuery}%`, `%${searchQuery}%`], (err, results) => {
        if (err) {
            console.error('Error searching for lost items:', err);
            return res.status(500).send('Error searching for lost items');
        }

        // If items are found, render the search results page
        if (results.length === 0) {
            return res.render('search-lost', { results: [], errorMessage: 'No items found matching your search.' });
        }

        // Render search page with results
        res.render('search-lost', { results: results, errorMessage: null });
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
