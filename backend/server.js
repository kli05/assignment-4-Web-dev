require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 5000;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "library_db";

const LOAN_LIMIT = 3;
const LOAN_PERIOD_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let pool = null;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function catchAsync(handler) {
  return function (req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function normalizeIsbn(isbn) {
  return String(isbn).replace(/-/g, "").replace(/ /g, "").toLowerCase();
}

function isbnLooksValid(isbn) {
  const digits = normalizeIsbn(isbn);
  return /^[0-9]{9}[0-9x]$/.test(digits) || /^[0-9]{13}$/.test(digits);
}

function prettyDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isoOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return new Date(value).toISOString();
}

function idToText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function shapeAccount(row) {
  return {
    id: idToText(row.id),
    name: row.name,
    membershipId: row.membership_id,
    role: row.role,
    activeLoans: Number(row.active_loans || 0),
  };
}

function shapeBook(row) {
  return {
    id: idToText(row.id),
    title: row.title,
    author: row.author,
    genre: row.genre,
    isbn: row.isbn,
    quantity: row.quantity,
  };
}

function shapeLoan(row) {
  return {
    id: idToText(row.id),
    bookId: idToText(row.book_id),
    bookTitle: row.book_title,
    userId: idToText(row.user_id),
    userName: row.user_name,
    membershipId: row.membership_id,
    borrowedAt: isoOrNull(row.borrowed_at),
    dueAt: isoOrNull(row.due_at),
    returnedAt: isoOrNull(row.returned_at),
  };
}

function shapeLedgerRow(row) {
  return {
    id: idToText(row.id),
    date: isoOrNull(row.created_at),
    bookId: idToText(row.book_id),
    bookTitle: row.book_title,
    type: row.type,
    quantity: row.quantity,
    stockAfter: row.stock_after,
    memberId: idToText(row.member_id),
    memberName: row.member_name || "",
    recordedById: idToText(row.recorded_by_id),
    recordedBy: row.recorded_by,
  };
}

function toRowId(value) {
  const number = Number(value);
  if (Number.isInteger(number) === false || number < 1) {
    return null;
  }

  return number;
}

async function prepareDatabase() {
  const bootstrapConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  await bootstrapConn.query(
    "CREATE DATABASE IF NOT EXISTS `" + DB_NAME + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
  );
  await bootstrapConn.end();
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      membership_id VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','member') NOT NULL DEFAULT 'member'
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      genre VARCHAR(100) NOT NULL,
      isbn VARCHAR(30) NOT NULL,
      isbn_clean VARCHAR(30) NOT NULL UNIQUE,
      quantity INT NOT NULL DEFAULT 0,
      CHECK (quantity >= 0)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      book_id INT NULL,
      user_id INT NULL,
      book_title VARCHAR(255) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      membership_id VARCHAR(50) NOT NULL,
      borrowed_at DATETIME NOT NULL,
      due_at DATETIME NOT NULL,
      returned_at DATETIME NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      book_id INT NULL,
      book_title VARCHAR(255) NOT NULL,
      type VARCHAR(30) NOT NULL,
      quantity INT NOT NULL,
      stock_after INT NOT NULL,
      member_id INT NULL,
      member_name VARCHAR(100) NULL,
      recorded_by_id INT NULL,
      recorded_by VARCHAR(100) NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
      FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (recorded_by_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await seedAdmin();
}

async function seedAdmin() {
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (admins.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query(
      "INSERT INTO users (name, membership_id, password_hash, role) VALUES (?, ?, ?, 'admin')",
      ["Administrator", "ADMIN001", hash],
    );
    console.log("Default admin created: ADMIN001 / admin123");
  }
}

async function writeLedger(conn, book, type, quantity, stockAfter, member, actor, when) {
  let memberId = null;
  let memberName = null;
  if (member) {
    memberId = member.id;
    memberName = member.name;
  }
  await conn.query(
    `INSERT INTO transactions
      (book_id, book_title, type, quantity, stock_after, member_id, member_name, recorded_by_id, recorded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [book.id, book.title, type, quantity, stockAfter, memberId, memberName, actor.id, actor.name, when],
  );
}

async function resolveActor(conn, actorId) {
  const id = toRowId(actorId);
  if (id !== null) {
    const [rows] = await conn.query("SELECT id, name FROM users WHERE id = ?", [id]);
    if (rows.length > 0) {
      return {
        id: rows[0].id,
        name: rows[0].name,
      };
    }
  }

  return {
    id: null,
    name: "System",
  };
}

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", function (req, res) {
  res.json({
    message: "Ha Molibetsane Community Library API is running.",
  });
});

app.post(
  "/login",
  catchAsync(async function (req, res) {
    const membershipId = String(req.body.membershipId || "").trim();
    const password = String(req.body.password || "");
    if (membershipId === "" || password === "") {
      throw new ApiError(400, "Please enter your membership ID and password.");
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE membership_id = ?", [membershipId]);
    if (rows.length === 0) {
      throw new ApiError(401, "The membership ID or password is not correct.");
    }
    const passwordMatches = await bcrypt.compare(password, rows[0].password_hash);
    if (passwordMatches === false) {
      throw new ApiError(401, "The membership ID or password is not correct.");
    }
    res.json(shapeAccount(rows[0]));
  }),
);

const ACCOUNT_QUERY = `
  SELECT u.*,
    (SELECT COUNT(*) FROM borrow_records r WHERE r.user_id = u.id AND r.returned_at IS NULL) AS active_loans
  FROM users u
`;
function parseAccountInput(body, creating) {
  const name = String(body.name || "").trim();
  const membershipId = String(body.membershipId || "").trim();
  const password = String(body.password || "");
  const role = body.role;
  if (name.length < 2) {
    throw new ApiError(400, "Please enter a name with at least 2 letters.");
  }
  if (membershipId === "") {
    throw new ApiError(400, "Please enter a membership ID.");
  }
  if (role !== "admin" && role !== "member") {
    throw new ApiError(400, "The role must be admin or member.");
  }
  if (creating === true && password === "") {
    throw new ApiError(400, "Please enter a password.");
  }
  if (password !== "" && password.length < 6) {
    throw new ApiError(400, "The password must be at least 6 characters long.");
  }

  return {
    name: name,
    membershipId: membershipId,
    password: password,
    role: role,
  };
}

async function adminTotal(conn) {
  const [rows] = await conn.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
  return rows[0].total;
}

app.get(
  "/users",
  catchAsync(async function (req, res) {
    const [rows] = await pool.query(ACCOUNT_QUERY + " ORDER BY u.id");
    res.json(rows.map(shapeAccount));
  }),
);

app.get(
  "/users/:id",
  catchAsync(async function (req, res) {
    const id = toRowId(req.params.id);
    const [rows] = await pool.query(ACCOUNT_QUERY + " WHERE u.id = ?", [id]);
    if (id === null || rows.length === 0) {
      throw new ApiError(404, "That user could not be found.");
    }
    res.json(shapeAccount(rows[0]));
  }),
);

app.post(
  "/users",
  catchAsync(async function (req, res) {
    const data = parseAccountInput(req.body, true);
    const [existing] = await pool.query("SELECT id FROM users WHERE membership_id = ?", [data.membershipId]);
    if (existing.length > 0) {
      throw new ApiError(409, "That membership ID is already taken.");
    }
    const hash = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, membership_id, password_hash, role) VALUES (?, ?, ?, ?)",
      [data.name, data.membershipId, hash, data.role],
    );
    const [rows] = await pool.query(ACCOUNT_QUERY + " WHERE u.id = ?", [result.insertId]);
    res.status(201).json(shapeAccount(rows[0]));
  }),
);

app.put(
  "/users/:id",
  catchAsync(async function (req, res) {
    const id = toRowId(req.params.id);
    const data = parseAccountInput(req.body, false);
    const [found] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (id === null || found.length === 0) {
      throw new ApiError(404, "That user could not be found.");
    }
    const [clash] = await pool.query("SELECT id FROM users WHERE membership_id = ? AND id <> ?", [
      data.membershipId,
      id,
    ]);
    if (clash.length > 0) {
      throw new ApiError(409, "That membership ID is already taken.");
    }
    if (found[0].role === "admin" && data.role !== "admin" && (await adminTotal(pool)) <= 1) {
      throw new ApiError(409, "There must always be at least one admin, so this role cannot be changed.");
    }
    if (data.password !== "") {
      const hash = await bcrypt.hash(data.password, 10);
      await pool.query(
        "UPDATE users SET name = ?, membership_id = ?, role = ?, password_hash = ? WHERE id = ?",
        [data.name, data.membershipId, data.role, hash, id],
      );
    } else {
      await pool.query("UPDATE users SET name = ?, membership_id = ?, role = ? WHERE id = ?", [
        data.name,
        data.membershipId,
        data.role,
        id,
      ]);
    }
    await pool.query("UPDATE borrow_records SET user_name = ?, membership_id = ? WHERE user_id = ?", [
      data.name,
      data.membershipId,
      id,
    ]);
    await pool.query("UPDATE transactions SET member_name = ? WHERE member_id = ?", [data.name, id]);
    await pool.query("UPDATE transactions SET recorded_by = ? WHERE recorded_by_id = ?", [data.name, id]);
    const [rows] = await pool.query(ACCOUNT_QUERY + " WHERE u.id = ?", [id]);
    res.json(shapeAccount(rows[0]));
  }),
);

app.delete(
  "/users/:id",
  catchAsync(async function (req, res) {
    const id = toRowId(req.params.id);
    const [found] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (id === null || found.length === 0) {
      throw new ApiError(404, "That user could not be found.");
    }
    if (found[0].role === "admin" && (await adminTotal(pool)) <= 1) {
      throw new ApiError(409, "You cannot delete the last admin.");
    }
    const [loans] = await pool.query(
      "SELECT COUNT(*) AS total FROM borrow_records WHERE user_id = ? AND returned_at IS NULL",
      [id],
    );
    if (loans[0].total > 0) {
      throw new ApiError(
        409,
        found[0].name + " still has books on loan. They must be returned before the account is deleted.",
      );
    }
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({
      message: found[0].name + " was deleted.",
    });
  }),
);

function parseBookInput(body, creating) {
  const title = String(body.title || "").trim();
  const author = String(body.author || "").trim();
  const genre = String(body.genre || "").trim();
  const isbn = String(body.isbn || "").trim();
  if (title === "") {
    throw new ApiError(400, "Please enter the book title.");
  }
  if (author === "") {
    throw new ApiError(400, "Please enter the author's name.");
  }
  if (genre === "") {
    throw new ApiError(400, "Please enter the genre.");
  }
  if (isbn === "") {
    throw new ApiError(400, "Please enter the ISBN.");
  }
  if (isbnLooksValid(isbn) === false) {
    throw new ApiError(400, "An ISBN must have 10 or 13 digits (dashes are allowed).");
  }
  let quantity = 0;
  if (creating === true) {
    quantity = Number(body.quantity);
    if (body.quantity === "" || body.quantity === undefined || Number.isInteger(quantity) === false) {
      throw new ApiError(400, "The quantity must be a whole number.");
    }
    if (quantity < 0) {
      throw new ApiError(400, "The quantity cannot be below 0.");
    }
  }

  return {
    title: title,
    author: author,
    genre: genre,
    isbn: isbn,
    quantity: quantity,
  };
}

app.get(
  "/books",
  catchAsync(async function (req, res) {
    const [rows] = await pool.query("SELECT * FROM books ORDER BY id");
    res.json(rows.map(shapeBook));
  }),
);

app.get(
  "/books/:id",
  catchAsync(async function (req, res) {
    const id = toRowId(req.params.id);
    const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [id]);
    if (id === null || rows.length === 0) {
      throw new ApiError(404, "That book could not be found.");
    }
    res.json(shapeBook(rows[0]));
  }),
);

app.post(
  "/books",
  catchAsync(async function (req, res) {
    const data = parseBookInput(req.body, true);
    const [clash] = await pool.query("SELECT id FROM books WHERE isbn_clean = ?", [normalizeIsbn(data.isbn)]);
    if (clash.length > 0) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        "INSERT INTO books (title, author, genre, isbn, isbn_clean, quantity) VALUES (?, ?, ?, ?, ?, ?)",
        [data.title, data.author, data.genre, data.isbn, normalizeIsbn(data.isbn), data.quantity],
      );
      if (data.quantity > 0) {
        const actor = await resolveActor(conn, req.body.recordedById);
        const newBook = {
          id: result.insertId,
          title: data.title,
        };
        await writeLedger(
          conn,
          newBook,
          "Stock Added",
          data.quantity,
          data.quantity,
          null,
          actor,
          new Date(),
        );
      }
      await conn.commit();
      const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [result.insertId]);
      res.status(201).json(shapeBook(rows[0]));
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }),
);

app.put(
  "/books/:id",
  catchAsync(async function (req, res) {
    const id = toRowId(req.params.id);
    const data = parseBookInput(req.body, false);
    const [found] = await pool.query("SELECT id FROM books WHERE id = ?", [id]);
    if (id === null || found.length === 0) {
      throw new ApiError(404, "That book could not be found.");
    }
    const [clash] = await pool.query("SELECT id FROM books WHERE isbn_clean = ? AND id <> ?", [
      normalizeIsbn(data.isbn),
      id,
    ]);
    if (clash.length > 0) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }
    await pool.query(
      "UPDATE books SET title = ?, author = ?, genre = ?, isbn = ?, isbn_clean = ? WHERE id = ?",
      [data.title, data.author, data.genre, data.isbn, normalizeIsbn(data.isbn), id],
    );
    await pool.query("UPDATE borrow_records SET book_title = ? WHERE book_id = ?", [data.title, id]);
    await pool.query("UPDATE transactions SET book_title = ? WHERE book_id = ?", [data.title, id]);
    const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [id]);
    res.json(shapeBook(rows[0]));
  }),
);

app.delete(
  "/books/:id",
  catchAsync(async function (req, res) {
    const id = toRowId(req.params.id);
    const [found] = await pool.query("SELECT * FROM books WHERE id = ?", [id]);
    if (id === null || found.length === 0) {
      throw new ApiError(404, "That book could not be found.");
    }
    const [loans] = await pool.query(
      "SELECT COUNT(*) AS total FROM borrow_records WHERE book_id = ? AND returned_at IS NULL",
      [id],
    );
    if (loans[0].total > 0) {
      throw new ApiError(
        409,
        '"' + found[0].title + '" cannot be deleted while ' + loans[0].total + " copy/copies are on loan.",
      );
    }
    await pool.query("DELETE FROM books WHERE id = ?", [id]);
    res.json({
      message: '"' + found[0].title + '" was deleted.',
    });
  }),
);

app.get(
  "/borrow-records",
  catchAsync(async function (req, res) {
    let rows = [];
    if (req.query.userId !== undefined) {
      const userId = toRowId(req.query.userId);
      [rows] = await pool.query(
        "SELECT * FROM borrow_records WHERE user_id = ? ORDER BY borrowed_at DESC, id DESC",
        [userId],
      );
    } else {
      [rows] = await pool.query("SELECT * FROM borrow_records ORDER BY borrowed_at DESC, id DESC");
    }
    res.json(rows.map(shapeLoan));
  }),
);

app.get(
  "/transactions",
  catchAsync(async function (req, res) {
    const [rows] = await pool.query("SELECT * FROM transactions ORDER BY created_at DESC, id DESC");
    res.json(rows.map(shapeLedgerRow));
  }),
);

async function adjustStock(conn, type, bookId, quantity, actor) {
  const [rows] = await conn.query("SELECT * FROM books WHERE id = ? FOR UPDATE", [bookId]);
  if (rows.length === 0) {
    throw new ApiError(404, "That book could not be found.");
  }
  const book = rows[0];
  let newQuantity = 0;
  let typeLabel = "";
  if (type === "add") {
    newQuantity = book.quantity + quantity;
    typeLabel = "Stock Added";
  } else {
    if (quantity > book.quantity) {
      throw new ApiError(
        409,
        "Only " + book.quantity + " copies are in stock, so you cannot deduct " + quantity + ".",
      );
    }
    newQuantity = book.quantity - quantity;
    typeLabel = "Stock Deducted";
  }
  await conn.query("UPDATE books SET quantity = ? WHERE id = ?", [newQuantity, book.id]);
  await writeLedger(conn, book, typeLabel, quantity, newQuantity, null, actor, new Date());
  return {
    ok: true,
    message:
      typeLabel + ": " + quantity + ' x "' + book.title + '". Copies now in stock: ' + newQuantity + ".",
  };
}

async function lendBook(conn, bookId, memberId, quantity, actor) {
  const [bookRows] = await conn.query("SELECT * FROM books WHERE id = ? FOR UPDATE", [bookId]);
  if (bookRows.length === 0) {
    throw new ApiError(404, "That book could not be found.");
  }
  const book = bookRows[0];
  const [userRows] = await conn.query("SELECT * FROM users WHERE id = ?", [memberId]);
  if (userRows.length === 0) {
    throw new ApiError(404, "That member could not be found.");
  }
  const user = userRows[0];
  const [openLoans] = await conn.query(
    "SELECT * FROM borrow_records WHERE user_id = ? AND returned_at IS NULL",
    [user.id],
  );
  const rightNow = Date.now();
  for (let i = 0; i < openLoans.length; i = i + 1) {
    if (new Date(openLoans[i].due_at).getTime() < rightNow) {
      throw new ApiError(
        409,
        "Borrowing is blocked because this account has an overdue book. Return it first.",
      );
    }
  }
  if (quantity > 1) {
    throw new ApiError(409, "Only one copy of the same title can be borrowed at a time.");
  }
  for (let j = 0; j < openLoans.length; j = j + 1) {
    if (openLoans[j].book_id === book.id) {
      throw new ApiError(409, 'This account already has a copy of "' + book.title + '" on loan.');
    }
  }
  if (openLoans.length + quantity > LOAN_LIMIT) {
    throw new ApiError(
      409,
      "Borrowing limit reached. A member can hold at most " + LOAN_LIMIT + " books at a time.",
    );
  }
  if (book.quantity < quantity) {
    throw new ApiError(409, 'Sorry, no copies of "' + book.title + '" are available right now.');
  }
  const borrowedAt = new Date(rightNow);
  const dueAt = new Date(rightNow + LOAN_PERIOD_DAYS * MS_PER_DAY);
  await conn.query(
    `INSERT INTO borrow_records
      (book_id, user_id, book_title, user_name, membership_id, borrowed_at, due_at, returned_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [book.id, user.id, book.title, user.name, user.membership_id, borrowedAt, dueAt],
  );
  const newQuantity = book.quantity - quantity;
  await conn.query("UPDATE books SET quantity = ? WHERE id = ?", [newQuantity, book.id]);
  await writeLedger(conn, book, "Book Borrowed", quantity, newQuantity, user, actor, borrowedAt);
  return {
    ok: true,
    message:
      '"' + book.title + '" was borrowed by ' + user.name + ". It is due back on " + prettyDate(dueAt) + ".",
  };
}

async function acceptReturn(conn, recordId, actor) {
  const [recordRows] = await conn.query("SELECT * FROM borrow_records WHERE id = ? FOR UPDATE", [recordId]);
  if (recordRows.length === 0 || recordRows[0].returned_at !== null) {
    throw new ApiError(409, "That loan could not be found or was already returned.");
  }
  const record = recordRows[0];
  const returnedAt = new Date();
  await conn.query("UPDATE borrow_records SET returned_at = ? WHERE id = ?", [returnedAt, record.id]);
  const member = {
    id: record.user_id,
    name: record.user_name,
  };
  if (record.book_id !== null) {
    const [bookRows] = await conn.query("SELECT * FROM books WHERE id = ? FOR UPDATE", [record.book_id]);
    if (bookRows.length > 0) {
      const book = bookRows[0];
      const newQuantity = book.quantity + 1;
      await conn.query("UPDATE books SET quantity = ? WHERE id = ?", [newQuantity, book.id]);
      await writeLedger(conn, book, "Book Returned", 1, newQuantity, member, actor, returnedAt);
    }
  }
  let message = '"' + record.book_title + '" was returned. Thank you!';
  if (returnedAt.getTime() > new Date(record.due_at).getTime()) {
    message = '"' + record.book_title + '" was returned, but it was past its due date.';
  }

  return {
    ok: true,
    message: message,
  };
}

app.post(
  "/transactions",
  catchAsync(async function (req, res) {
    const type = req.body.type;
    const quantity = Number(req.body.quantity);
    if (type !== "add" && type !== "deduct" && type !== "borrow" && type !== "return") {
      throw new ApiError(400, "The transaction type must be add, deduct, borrow or return.");
    }
    if (type !== "return") {
      if (Number.isInteger(quantity) === false || quantity < 1) {
        throw new ApiError(400, "The quantity must be a whole number of at least 1.");
      }
      if (toRowId(req.body.bookId) === null) {
        throw new ApiError(400, "Please choose a book.");
      }
    }
    if (type === "borrow" && toRowId(req.body.memberId) === null) {
      throw new ApiError(400, "Please choose a member.");
    }
    if (type === "return" && toRowId(req.body.recordId) === null) {
      throw new ApiError(400, "That loan could not be found or was already returned.");
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const actor = await resolveActor(conn, req.body.recordedById);
      let result = null;
      if (type === "add" || type === "deduct") {
        result = await adjustStock(conn, type, toRowId(req.body.bookId), quantity, actor);
      } else if (type === "borrow") {
        result = await lendBook(conn, toRowId(req.body.bookId), toRowId(req.body.memberId), quantity, actor);
      } else {
        result = await acceptReturn(conn, toRowId(req.body.recordId), actor);
      }
      await conn.commit();
      res.status(201).json(result);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }),
);

app.use(function (req, res) {
  res.status(404).json({
    message: "That address does not exist on this server.",
  });
});

app.use(function (error, req, res, next) {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      message: error.message,
    });
    return;
  }
  if (error && error.type === "entity.parse.failed") {
    res.status(400).json({
      message: "The request body is not valid JSON.",
    });
    return;
  }
  if (error && error.code === "ER_DUP_ENTRY") {
    res.status(409).json({
      message: "That value is already used by another record.",
    });
    return;
  }
  console.error(error);
  res.status(500).json({
    message: "Something went wrong on the server.",
  });
});

prepareDatabase()
  .then(function () {
    app.listen(PORT, function () {
      console.log("Library API running on http://localhost:" + PORT);
    });
  })
  .catch(function (error) {
    console.error("Could not start the server. Is MySQL running and is the .env login correct?");
    console.error(error.message);
    process.exit(1);
  });
