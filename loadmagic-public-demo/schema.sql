-- Complete schema for loadmagic-public-demo
-- This creates all tables and seed data needed for the demo

-- Users table with all correlation columns
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    session_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    csrf_token TEXT,
    correlation_id TEXT,
    dashboard1_shortid TEXT,
    dashboard1_shortid_timestamp TEXT,
    http_test_step2_token TEXT,
    http_test_step2_token_timestamp TEXT
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_token TEXT UNIQUE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_csrf_token ON users(csrf_token);
CREATE INDEX IF NOT EXISTS idx_users_correlation_id ON users(correlation_id);

-- Seed test users (passwords: testuser1=123, testuser2=456, adminuser=789)
INSERT INTO users (username, email, password_hash) VALUES
    ('testuser1', 'test1@example.com', 'hash123'),
    ('testuser2', 'test2@example.com', 'hash456'),
    ('adminuser', 'admin@example.com', 'admin789');

-- Seed products
INSERT INTO products (name, price, category, stock) VALUES
    ('Laptop Pro', 1299.99, 'Electronics', 50),
    ('Wireless Mouse', 29.99, 'Electronics', 200),
    ('Coffee Mug', 12.99, 'Home', 100),
    ('Running Shoes', 89.99, 'Sports', 75),
    ('Notebook', 5.99, 'Office', 300);
