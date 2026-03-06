import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

console.log("DB URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("DB connected:", res.rows[0]);
  } catch (err: any) {
    console.error("DB error:", err.message);
  }
})();