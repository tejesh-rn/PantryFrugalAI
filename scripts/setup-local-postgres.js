const { execFileSync } = require("node:child_process");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const username = decodeURIComponent(databaseUrl.username);
const password = decodeURIComponent(databaseUrl.password);
const database = decodeURIComponent(databaseUrl.pathname.slice(1));

if (!username || !database) {
  throw new Error("DATABASE_URL must include a username and database name");
}

const psql = "/opt/homebrew/opt/postgresql@16/bin/psql";
const quoteLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;
const quoteIdent = (value) => `"${String(value).replaceAll('"', '""')}"`;

const roleSql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = ${quoteLiteral(username)}) THEN
    CREATE ROLE ${quoteIdent(username)} LOGIN PASSWORD ${quoteLiteral(password)} CREATEDB;
  ELSE
    ALTER ROLE ${quoteIdent(username)} WITH LOGIN PASSWORD ${quoteLiteral(password)} CREATEDB;
  END IF;
END
$$;
`;

execFileSync(psql, ["-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", roleSql], { stdio: "inherit" });

const exists = execFileSync(
  psql,
  ["-d", "postgres", "-tAc", `SELECT 1 FROM pg_database WHERE datname = ${quoteLiteral(database)}`],
  { encoding: "utf8" }
).trim();

if (!exists) {
  execFileSync("/opt/homebrew/opt/postgresql@16/bin/createdb", ["--owner", username, database], { stdio: "inherit" });
}

console.log(`PostgreSQL role '${username}' and database '${database}' are ready.`);
