
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
});

pool.connect()
    .then(client => {
        console.log("Sam Enterprise database connected successfully.");
        client.release();
    })
    .catch(error => {
        console.error("Database connection failed:", error.message);
    });

module.exports = pool;
