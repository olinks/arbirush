const mysql = require("mysql2");
const { env } = require("../helpers");

const logger = require("../utils/logger");

const db = mysql.createPool({
  host: env.get("DB_HOST"),
  user: env.get("DB_USER"),
  password: env.get("DB_PASSWORD"),
  database: env.get("DB_NAME"),
});

db.getConnection((err, connection) => {
  if (err) throw err;
  logger.info("Connected to database");
});

// Create the initial database
const createDatabase = () => {
  const sql = "CREATE DATABASE IF NOT EXISTS ??";
  db.query(sql, [process.env.DB_NAME], function (err) {
    if (err) throw err;
    console.log(process.env.DB_NAME + " database created");
    // end process
    process.exit();
  });
};

/**
 Create the initial table
 */
const createTable = () => {
  const sql = `CREATE TABLE IF NOT EXISTS transactions (
      id INT NOT NULL AUTO_INCREMENT,
      buyer_address VARCHAR(255),
      eth_value FLOAT,
      token_value FLOAT,
      lottery_percentage INT,
      winner BOOLEAN,
      transaction_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )`;
  db.query(sql, function (err) {
    if (err) throw err;
    console.log("transactions table created");
    // end process
    process.exit();
  });
};

/**
 *
 * @param {{buyer_address: string, eth: number, no_rush: number, lottery_percentage: number, winner: boolean, transaction_hash: string}} data
 */

const addTransaction = async (data) => {
  const transaction = {
    buyer_address: data.buyer_address,
    eth_value: data.eth,
    token_value: data.no_rush,
    lottery_percentage: data.lottery_percentage,
    winner: data.winner,
    transaction_hash: data.transaction_hash,
  };
  let sql = "INSERT INTO transactions SET ?";
  const [rows, fields] = await db.promise().query(sql, transaction);
  return rows;
};

/**
 * Get all transactions with filters/limits
 * @param {{buyer_address: string, eth: number, no_rush: number, lottery_percentage: number, winner: boolean, transaction_hash: string}} filters
 * @param {number} limit
 * @returns {Promise<Array>}
 */

const getTransactions = async (filters, limit) => {
  let sql = "SELECT * FROM transactions";
  const values = [];
  if (filters) {
    sql += " WHERE ";
    const filterKeys = Object.keys(filters);
    filterKeys.forEach((key, index) => {
      sql += `${key} = ?`;
      values.push(filters[key]);
      if (index !== filterKeys.length - 1) sql += " AND ";
    });
  }
  if (limit) {
    sql += ` LIMIT ?`;
    values.push(limit);
  }
  const [rows, fields] = await db.promise().query(sql, values);
  return rows;
};

const getTransactionByHash = async (hash) => {
  let sql = "SELECT * FROM transactions WHERE transaction_hash = ?";
  const [rows, fields] = await db.promise().query(sql, [hash]);
  return rows;
};

const getTransactionsByAddress = async (address) => {
  let sql = "SELECT * FROM transactions WHERE buyer_address = ?";
  const [rows, fields] = await db.promise().query(sql, [address]);
  return rows;
};

module.exports = {
  addTransaction,
  getTransactions,
  getTransactionByHash,
  getTransactionsByAddress,
  createDatabase,
  createTable,
};
