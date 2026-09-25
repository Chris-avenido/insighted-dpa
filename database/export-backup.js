const fs = require('fs');
const path = require('path');

// Base directory is the insighted-dpa root
const rootDir = path.resolve(__dirname, '..');

// Resilient module loader supporting monorepo and hoisted dependencies
function loadModule(name) {
  try {
    return require(name);
  } catch (e) {
    const candidatePaths = [
      path.join(rootDir, 'node_modules', name),
      path.join(rootDir, 'apps', 'backend', 'node_modules', name),
      path.join(rootDir, 'apps', 'frontend', 'node_modules', name),
    ];
    for (const p of candidatePaths) {
      try {
        return require(p);
      } catch (err) {}
    }
    throw e;
  }
}

// Load environment variables from root .env with native fallback
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  try {
    const dotenv = loadModule('dotenv');
    dotenv.config({ path: envPath });
  } catch (err) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const k = trimmed.slice(0, eq).trim();
          let v = trimmed.slice(eq + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) process.env[k] = v;
        }
      });
    }
  }
}

loadEnv();

const { Pool } = loadModule('pg');

const sourceUrl = process.env.DATABASE_URL || process.env.BACKUP_SOURCE_URL || process.argv[2];

if (!sourceUrl) {
  console.error('❌ Error: DATABASE_URL is not set in environment or .env file.');
  process.exit(1);
}

// Determine backup folder based on current date (YYYYMMDD)
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const dateStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
const backupDir = path.join(__dirname, 'backups', `server_backup_${dateStamp}`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// SSL Configuration: rejectUnauthorized: false is used to connect to Azure PostgreSQL
// Flexible Server via TLS/SSL without requiring a locally pinned DigiCert root CA bundle.
const pool = new Pool({
  connectionString: sourceUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

// Initialize SQLite database connection with resilient driver fallback
function initSqliteDatabase(dbPath) {
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }
  // Try Node.js built-in node:sqlite (Node 22.5+)
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
    db.exec('PRAGMA temp_store = MEMORY;');
    return {
      type: 'DatabaseSync (Node Built-in)',
      exec: (sql) => db.exec(sql),
      prepare: (sql) => db.prepare(sql),
      close: () => {
        try { db.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (e) {}
        try { db.exec('PRAGMA optimize;'); } catch (e) {}
        db.close();
      }
    };
  } catch (e) {
    // Try better-sqlite3 fallback
    try {
      const Database = loadModule('better-sqlite3');
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      return {
        type: 'better-sqlite3',
        exec: (sql) => db.exec(sql),
        prepare: (sql) => {
          const stmt = db.prepare(sql);
          return { run: (...args) => stmt.run(...args) };
        },
        close: () => {
          try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (err) {}
          db.close();
        }
      };
    } catch (err) {
      throw new Error(`No SQLite driver found. Please use Node.js 22.5+ or install better-sqlite3. (${e.message})`);
    }
  }
}

// Map PostgreSQL column data type to SQLite column affinity
function mapPgTypeToSqlite(dataType) {
  const dt = (dataType || '').toLowerCase();
  if (dt.includes('int') || dt === 'serial' || dt === 'bigserial') return 'INTEGER';
  if (dt.includes('bool')) return 'INTEGER';
  if (dt.includes('numeric') || dt.includes('decimal') || dt.includes('real') || dt.includes('double') || dt.includes('float')) return 'REAL';
  if (dt === 'bytea') return 'BLOB';
  return 'TEXT';
}

// Format JavaScript / Postgres value for SQLite insertion
function formatSqliteValue(val, colType) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (val instanceof Date) {
    if (colType === 'date') {
      const yyyy = val.getFullYear();
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const dd = String(val.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return val.toISOString();
  }
  if (Buffer.isBuffer(val)) {
    return val;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

// Escape value safely for PostgreSQL INSERT statements
function escapeSqlValue(val, colType) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (val instanceof Date) {
    if (colType === 'date') {
      const yyyy = val.getFullYear();
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const dd = String(val.getDate()).padStart(2, '0');
      return `'${yyyy}-${mm}-${dd}'`;
    }
    return `'${val.toISOString()}'`;
  }
  
  if (colType === 'ARRAY' || (Array.isArray(val) && colType !== 'jsonb')) {
    if (!val || (Array.isArray(val) && val.length === 0)) return "'{}'::text[]";
    const arr = Array.isArray(val) ? val : [val];
    const items = arr.map(x => `'${String(x).replace(/'/g, "''").replace(/\0/g, '')}'`).join(', ');
    return `ARRAY[${items}]::text[]`;
  }

  if (typeof val === 'object') {
    if (Buffer.isBuffer(val)) {
      return `'\\x${val.toString('hex')}'`;
    }
    const jsonStr = JSON.stringify(val).replace(/'/g, "''").replace(/\0/g, '');
    return `'${jsonStr}'::jsonb`;
  }
  
  const str = String(val).replace(/'/g, "''").replace(/\0/g, '');
  return `'${str}'`;
}

// Write to stream with backpressure handling
function writeAsync(stream, text) {
  return new Promise(resolve => {
    if (!stream.write(text)) {
      stream.once('drain', resolve);
    } else {
      resolve();
    }
  });
}

async function runBackup() {
  const startTime = Date.now();
  console.log('================================================================');
  console.log(`🚀 Starting InsightEd DPA Database Tables & Data Backup`);
  console.log(`   Output Directory: ${backupDir}`);
  console.log(`   Outputs:`);
  console.log(`     1. SQLite Database:  dpa_tables_data_backup.db`);
  console.log(`     2. SQL Script Dump:  dpa_tables_data_backup.sql`);
  console.log(`     3. Manifest Record:  manifest.json`);
  console.log(`   Mode: READ-ONLY SAFE CURSOR STREAM (Zero writes to server)`);
  console.log('----------------------------------------------------------------');
  console.log(`⚠️  NOTICE: This is a complete TABLES + DATA export.`);
  console.log(`   Includes all table schemas, primary keys, and row records.`);
  console.log('================================================================');

  const dbOutPath = path.join(backupDir, 'dpa_tables_data_backup.db');
  const sqlOutPath = path.join(backupDir, 'dpa_tables_data_backup.sql');

  const sqliteDb = initSqliteDatabase(dbOutPath);
  console.log(`[Backup] Initialized SQLite engine: ${sqliteDb.type}`);

  const client = await pool.connect();
  const manifest = {
    backupDate: new Date().toISOString(),
    databaseName: 'dpa_database_v2',
    backupType: 'tables_and_data_export',
    sqliteFile: 'dpa_tables_data_backup.db',
    sqlFile: 'dpa_tables_data_backup.sql',
    isFullDisasterRecoveryBackup: false,
    omittedObjects: [
      'foreign_key_constraints',
      'secondary_indexes',
      'unique_constraints_non_pk',
      'check_constraints',
      'sequences_and_identity_states',
      'triggers',
      'functions_and_procedures',
      'views_and_materialized_views',
      'extensions',
      'roles_and_permissions',
      'custom_enum_types'
    ],
    tables: {},
    totalRows: 0,
  };

  const sqlStream = fs.createWriteStream(sqlOutPath, { encoding: 'utf8' });

  await writeAsync(sqlStream, `-- ====================================================================\n`);
  await writeAsync(sqlStream, `-- InsightEd Division Personnel Audit (DPA) Tables & Data Backup\n`);
  await writeAsync(sqlStream, `-- Timestamp: ${manifest.backupDate}\n`);
  await writeAsync(sqlStream, `-- Scope: Table Schemas, Column Definitions, Primary Keys, and Row Data\n`);
  await writeAsync(sqlStream, `-- Mode: READ-ONLY SAFE EXTRACTION (Zero writes performed on server)\n`);
  await writeAsync(sqlStream, `-- ====================================================================\n\n`);
  await writeAsync(sqlStream, `BEGIN;\n\n`);

  try {
    // Explicit read-only transaction on PostgreSQL server
    await client.query('BEGIN READ ONLY;');
    console.log('[Backup] Safe read-only transaction started on server.');

    // Dynamic discovery of public schema base tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const priorityOrder = ['regions', 'division_offices', 'users', 'collaborators', 'personnel_audits', 'other_interventions', 'gmis_beis', 'sdo_correction'];
    const discoveredTables = tableRes.rows.map(r => r.table_name);
    const targetTables = [
      ...priorityOrder.filter(t => discoveredTables.includes(t)),
      ...discoveredTables.filter(t => !priorityOrder.includes(t))
    ];

    for (const table of targetTables) {
      const colRes = await client.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [table]);

      if (colRes.rows.length === 0) continue;

      console.log(`[Backup] Processing table: ${table}...`);

      const colTypeMap = {};
      colRes.rows.forEach(c => { colTypeMap[c.column_name] = c.data_type; });

      const pkRes = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY';
      `, [table]);
      const pkCols = pkRes.rows.map(r => `"${r.column_name}"`);

      // 1. Generate SQL Create Table
      await writeAsync(sqlStream, `-- ------------------------------------------------------------\n`);
      await writeAsync(sqlStream, `-- Table: ${table}\n`);
      await writeAsync(sqlStream, `-- ------------------------------------------------------------\n`);
      await writeAsync(sqlStream, `CREATE TABLE IF NOT EXISTS "${table}" (\n`);
      
      const colDefs = colRes.rows.map(c => {
        let typeStr = c.udt_name;
        if (c.data_type === 'character varying') typeStr = 'VARCHAR';
        else if (c.data_type === 'timestamp with time zone') typeStr = 'TIMESTAMPTZ';
        else if (c.data_type === 'timestamp without time zone') typeStr = 'TIMESTAMP';
        else if (c.data_type === 'boolean') typeStr = 'BOOLEAN';
        else if (c.data_type === 'text') typeStr = 'TEXT';
        else if (c.data_type === 'smallint') typeStr = 'SMALLINT';
        else if (c.data_type === 'integer') typeStr = 'INTEGER';
        else if (c.data_type === 'bigint') typeStr = 'BIGINT';
        else if (c.data_type === 'numeric') typeStr = 'NUMERIC';
        else if (c.data_type === 'double precision') typeStr = 'DOUBLE PRECISION';
        else if (c.data_type === 'date') typeStr = 'DATE';
        else if (c.data_type === 'jsonb') typeStr = 'JSONB';
        else if (c.data_type === 'uuid') typeStr = 'UUID';
        else if (c.data_type === 'ARRAY' && c.udt_name === '_text') typeStr = 'TEXT[]';

        let line = `  "${c.column_name}" ${typeStr}`;
        if (c.is_nullable === 'NO') line += ' NOT NULL';
        if (c.column_default && !c.column_default.startsWith('nextval')) {
          line += ` DEFAULT ${c.column_default}`;
        }
        return line;
      });

      if (pkCols.length > 0) {
        colDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
      }
      await writeAsync(sqlStream, colDefs.join(',\n') + '\n);\n\n');

      // 2. Generate SQLite Create Table in .db
      const sqliteColDefs = colRes.rows.map(c => {
        const sqliteType = mapPgTypeToSqlite(c.data_type);
        let line = `  "${c.column_name}" ${sqliteType}`;
        if (c.is_nullable === 'NO' && pkCols.includes(`"${c.column_name}"`)) {
          line += ' NOT NULL';
        }
        return line;
      });
      if (pkCols.length > 0) {
        sqliteColDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
      }
      const createSqliteSql = `CREATE TABLE IF NOT EXISTS "${table}" (\n${sqliteColDefs.join(',\n')}\n);`;
      sqliteDb.exec(createSqliteSql);

      const columns = colRes.rows.map(c => c.column_name);
      const colListStr = columns.map(c => `"${c}"`).join(', ');
      const sqlitePlaceholders = columns.map(() => '?').join(', ');
      const sqliteInsertStmt = sqliteDb.prepare(`INSERT INTO "${table}" (${colListStr}) VALUES (${sqlitePlaceholders});`);

      // Memory-safe cursor stream: Fetch 500 rows per batch
      const cursorName = `cur_${table.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      await client.query(`DECLARE ${cursorName} NO SCROLL CURSOR FOR SELECT * FROM "${table}";`);

      let tableRowCount = 0;
      const batchSize = 500;

      sqliteDb.exec('BEGIN TRANSACTION;');

      while (true) {
        const fetchRes = await client.query(`FETCH ${batchSize} FROM ${cursorName};`);
        if (fetchRes.rows.length === 0) break;

        tableRowCount += fetchRes.rows.length;

        // SQL file stream insert
        await writeAsync(sqlStream, `INSERT INTO "${table}" (${colListStr}) VALUES\n`);
        const valueRows = fetchRes.rows.map(row => {
          const valList = columns.map(col => escapeSqlValue(row[col], colTypeMap[col]));
          return `  (${valList.join(', ')})`;
        });
        await writeAsync(sqlStream, valueRows.join(',\n') + ';\n');

        // SQLite binary .db insert
        for (const row of fetchRes.rows) {
          const params = columns.map(col => formatSqliteValue(row[col], colTypeMap[col]));
          sqliteInsertStmt.run(...params);
        }
      }

      sqliteDb.exec('COMMIT;');
      await client.query(`CLOSE ${cursorName};`);

      if (tableRowCount > 0) {
        await writeAsync(sqlStream, '\n');
      }

      manifest.tables[table] = tableRowCount;
      manifest.totalRows += tableRowCount;
      console.log(`         -> Exported ${tableRowCount.toLocaleString()} rows into .db and .sql`);
    }

    await writeAsync(sqlStream, `COMMIT;\n`);
    sqlStream.end();

    // Close SQLite cleanly and checkpoint WAL
    sqliteDb.close();

    // Cleanly finish read-only transaction (0 locks, 0 writes)
    await client.query('ROLLBACK;');
    console.log('[Backup] Safe read-only transaction closed. ZERO changes made to server database.');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const dbStats = fs.statSync(dbOutPath);
    const sqlStats = fs.statSync(sqlOutPath);
    const dbSizeMb = (dbStats.size / (1024 * 1024)).toFixed(2);
    const sqlSizeMb = (sqlStats.size / (1024 * 1024)).toFixed(2);

    manifest.fileSizes = {
      sqliteDb: `${dbSizeMb} MB (${dbStats.size.toLocaleString()} bytes)`,
      sqlDump: `${sqlSizeMb} MB (${sqlStats.size.toLocaleString()} bytes)`,
    };

    console.log('================================================================');
    console.log(`✅ Backup successfully created!`);
    console.log(`   📦 SQLite Database (.db): ${dbOutPath} [${dbSizeMb} MB]`);
    console.log(`   📄 SQL Script Dump (.sql): ${sqlOutPath} [${sqlSizeMb} MB]`);
    console.log(`   Total Tables Exported:    ${Object.keys(manifest.tables).length}`);
    console.log(`   Total Rows Exported:      ${manifest.totalRows.toLocaleString()}`);
    console.log(`   Duration:                 ${elapsed}s`);
    console.log('================================================================');

    const manifestPath = path.join(backupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  } catch (err) {
    try { sqliteDb.close(); } catch (e) {}
    try { await client.query('ROLLBACK;'); } catch (e) {}
    console.error('❌ [Backup] Error during backup:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runBackup();
