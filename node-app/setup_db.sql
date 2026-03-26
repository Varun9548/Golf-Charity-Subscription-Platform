-- Create the database
CREATE DATABASE IF NOT EXISTS greenheart_golf;
USE greenheart_golf;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    plan ENUM('monthly', 'yearly') DEFAULT 'monthly',
    giving_pct INT DEFAULT 10,
    charity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Charities table
CREATE TABLE IF NOT EXISTS charities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supporters_count INT DEFAULT 0,
    raised_amount DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    logo_url VARCHAR(255)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    course_name VARCHAR(100),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
    id INT AUTO_INCREMENT PRIMARY KEY,
    draw_date DATE NOT NULL,
    winning_numbers VARCHAR(50),
    status ENUM('pending', 'published') DEFAULT 'pending'
);

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    draw_id INT NOT NULL,
    match_count INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    proof_file VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (draw_id) REFERENCES draws(id) ON DELETE CASCADE
);

-- Insert initial charities
INSERT IGNORE INTO charities (id, name, category, supporters_count, raised_amount, description) VALUES 
(1, 'Macmillan Cancer Support', 'health', 840, 120000.00, 'Providing physical, financial and emotional support to help people live life as fully as they can.'),
(2, 'NSPCC', 'children', 620, 85000.00, 'Leading children''s charity fighting to end child abuse in the UK and Channel Islands.'),
(3, 'RSPCA', 'animals', 510, 64000.00, 'The oldest animal welfare charity in the world, rescuing, rehabilitating and rehoming animals.'),
(4, 'British Heart Foundation', 'health', 480, 56000.00, 'Funding world-class research to find cures and treatments for heart and circulatory diseases.'),
(5, 'Age UK', 'elderly', 390, 42000.00, 'The leading charity for older people, providing companionship, advice and support.'),
(6, 'Cancer Research UK', 'health', 960, 150000.00, 'Funding scientists, doctors and nurses to help beat cancer sooner.');
