import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: { rejectUnauthorized: false }
});

export const query = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

export const getConnection = () => pool.connect();

export const pingDatabase = async () => {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    return false;
  }
};

export default pool;
