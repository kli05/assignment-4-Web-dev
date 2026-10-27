CREATE DATABASE IF NOT EXISTS library_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  membership_id VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','member') NOT NULL DEFAULT 'member'
);

CREATE TABLE IF NOT EXISTS books (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  author     VARCHAR(255) NOT NULL,
  genre      VARCHAR(100) NOT NULL,
  isbn       VARCHAR(30)  NOT NULL,
  isbn_clean VARCHAR(30)  NOT NULL UNIQUE,
  quantity   INT NOT NULL DEFAULT 0,
  CHECK (quantity >= 0)
);

CREATE TABLE IF NOT EXISTS borrow_records (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  book_id       INT NULL,
  user_id       INT NULL,
  book_title    VARCHAR(255) NOT NULL,
  user_name     VARCHAR(100) NOT NULL,
  membership_id VARCHAR(50)  NOT NULL,
  borrowed_at   DATETIME NOT NULL,
  due_at        DATETIME NOT NULL,
  returned_at   DATETIME NULL,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  book_id        INT NULL,
  book_title     VARCHAR(255) NOT NULL,
  type           VARCHAR(30)  NOT NULL,
  quantity       INT NOT NULL,
  stock_after    INT NOT NULL,
  member_id      INT NULL,
  member_name    VARCHAR(100) NULL,
  recorded_by_id INT NULL,
  recorded_by    VARCHAR(100) NOT NULL,
  created_at     DATETIME NOT NULL,
  FOREIGN KEY (book_id)        REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (member_id)      REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO users (name, membership_id, password_hash, role) VALUES
  ('Administrator', 'ADMIN001', '$2a$10$L/eI.NNCc7q4cg8xXU3kSe.pBhDAEwg3PbA2LF1W5myDyrx936vZ2', 'admin');
