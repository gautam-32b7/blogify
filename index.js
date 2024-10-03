import express from 'express';
import pg from 'pg';
import axios from 'axios';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';

const app = express();
const port = 3000;
const saltRounds = 10;
const API_URL = 'http://localhost:4000';

// Database connection
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// Authentication
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Handle GET request for index.ejs
app.get('/', (req, res) => {
  res.render('index.ejs');
});

// Handle GET request for login.ejs
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

// Handle GET request for sign-up.ejs
app.get('/sign-up', (req, res) => {
  res.render('sign-up.ejs');
});

// Handle GET request for posts.ejs
app.get('/posts', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      const data = response.data;
      res.render('posts.ejs', {
        is_login: req.isAuthenticated,
        posts: data,
      });
    } catch (err) {
      console.log(err);
    }
  } else {
    res.render('login.ejs');
  }
});

// Handle GET request for my-posts.ejs
app.get('/my-posts', async (req, res) => {
  if (req.isAuthenticated()) {
    const response = await axios.get(`${API_URL}/my-posts/${req.user.id}`);
    const posts = response.data;
    res.render('my-posts.ejs', { is_login: req.isAuthenticated(), posts });
  } else {
    res.render('login.ejs');
  }
});

// Handle PATCH request for edit.ejs
app.get('/edit/:id', async (req, res) => {
  res.send('I will implement later');
});

// Handle post request (edit)
app.post('/edit', (req, res) => {
  res.send('I will implement later');
});

// Handle logout which will terminate the session
app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
});

// Handle GET request for new-post.ejs
app.get('/new-post', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('new-post.ejs', { is_login: req.isAuthenticated() });
  } else {
    res.render('/login.ejs');
  }
});

// Handle POST request for new-post.ejs
app.post('/new-post', async (req, res) => {
  const newPost = { ...req.body, user_id: req.user.id };
  try {
    const response = await axios.post(`${API_URL}/posts`, newPost);
    console.log(response.data);
    res.redirect('/posts');
  } catch (err) {
    console.log(err);
  }
});

// Handle DELETE request
app.get('/delete/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const response = await axios.delete(`${API_URL}/posts/${id}`);
    console.log(response.data);
    res.redirect('/my-posts');
  } catch (err) {
    console.log(err);
  }
});

// Handle POST request for login.ejs
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/login',
  })
);

// Handle POST request for sign-up.ejs
app.post('/sign-up', async (req, res) => {
  const username = req.body['username'];
  const password = req.body['password'];
  try {
    const checkResult = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (checkResult.rows.length > 0) {
      res.render('sign-up.ejs', { error: 'Username already exist' });
    } else {
      // Hashing a password
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
        } else {
          const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hash]
          );
          const user = result.rows[0];
          req.login(user, function (err) {
            if (err) {
              console.log(err);
            }
            res.redirect('/posts');
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// Passport strategy
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query('SELECT * FROM users WHERE username = $1', [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const hash_stored_password = user.password;

        // Load hash from password DB
        bcrypt.compare(password, hash_stored_password, (err, result) => {
          if (result) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }
        });
      } else {
        return cb('Username not found');
      }
    } catch (err) {
      console.log(err);
    }
  })
);

// serialize and deserialize
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
