import express from 'express';
import pg from 'pg';
import 'dotenv/config';

const app = express();
const port = 4000;

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

// GET all posts
app.get('/posts', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM posts ORDER BY id DESC');
    const posts = result.rows;
    res.json(posts);
  } catch (err) {}
});

// GET all my posts
app.get('/my-posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await db.query(
      'SELECT title, content, author, date, user_id, posts.id FROM users JOIN posts ON users.id = posts.user_id WHERE user_id = $1',
      [id]
    );
    const posts = result.rows;
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
});

// GET a specific post by id
app.get('/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = result.rows;
    res.json(post);
  } catch (err) {
    console.log(err);
  }
});

// POST a new post
app.post('/posts', async (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const author = req.body.author;
  const date = new Date();
  const user_id = req.body.user_id;
  try {
    const result = await db.query(
      'INSERT INTO posts (title, content, author, date, user_id) VALUES ($1, $2, $3, $4, $5)',
      [title, content, author, date, user_id]
    );
    res.json({ message: 'Data inserted sucessfully' });
  } catch (err) {
    console.log(err);
  }
});

// PATCH a post
app.patch('/posts/:id', (req, res) => {
  res.send('I will implement later');
});

// DELETE a specific post by id
app.delete('/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await db.query('DELETE FROM posts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.json({ message: 'Post deleted' });
    } else {
      res.json({ message: 'Post not deleted' });
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`API is running at port ${port}`);
});
