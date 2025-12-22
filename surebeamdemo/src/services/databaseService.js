// Database Service - Handles SQLite in browser using sql.js

class DatabaseService {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.fileName = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.SQL) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._loadSqlJs();
    await this.initPromise;
  }

  async _loadSqlJs() {
    // Load sql.js via script tag if not already loaded
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="sql-wasm"]');
        if (existingScript) {
          // Wait for it to load
          if (window.initSqlJs) {
            resolve();
            return;
          }
          existingScript.addEventListener('load', resolve);
          existingScript.addEventListener('error', () => reject(new Error('Failed to load sql.js library')));
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load sql.js library. Please check your internet connection.'));
        document.head.appendChild(script);
      });
    }

    // Wait a tick for the script to fully initialize
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify initSqlJs is available
    if (typeof window.initSqlJs !== 'function') {
      throw new Error('SQL.js library failed to initialize properly');
    }

    // Initialize sql.js with WASM
    this.SQL = await window.initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });
    this.initialized = true;
  }

  async loadDatabase(file) {
    await this.init();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const uint8Array = new Uint8Array(buffer);

          // Close existing database if any
          if (this.db) {
            this.db.close();
          }

          // Create new database from file
          this.db = new this.SQL.Database(uint8Array);
          this.fileName = file.name;

          resolve({ success: true, fileName: file.name });
        } catch (err) {
          reject(new Error(`Failed to load database: ${err.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Load database from URL (for auto-loading default database)
  async loadDatabaseFromUrl(url, fileName = 'SureTrack.db') {
    await this.init();

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Close existing database if any
      if (this.db) {
        this.db.close();
      }

      // Create new database from buffer
      this.db = new this.SQL.Database(uint8Array);
      this.fileName = fileName;

      return { success: true, fileName };
    } catch (err) {
      throw new Error(`Failed to load database from URL: ${err.message}`);
    }
  }

  isLoaded() {
    return this.db !== null;
  }

  getFileName() {
    return this.fileName;
  }

  getTables() {
    if (!this.db) return [];

    try {
      const result = this.db.exec(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      if (result.length === 0) return [];
      return result[0].values.map(row => row[0]);
    } catch (err) {
      console.error('Error getting tables:', err);
      return [];
    }
  }

  // Get table metadata including row count and column count
  getTableMetadata(tableName) {
    if (!this.db) return null;

    try {
      // Get row count
      const countResult = this.db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
      const rowCount = countResult[0]?.values[0][0] || 0;

      // Get column info
      const schema = this.getTableSchema(tableName);
      const columnCount = schema?.columns.length || 0;

      // Get primary keys
      const primaryKeys = schema?.columns.filter(c => c.primaryKey).map(c => c.name) || [];

      return {
        tableName,
        rowCount,
        columnCount,
        primaryKeys,
        columns: schema?.columns || []
      };
    } catch (err) {
      console.error('Error getting table metadata:', err);
      return null;
    }
  }

  // Get all tables with their metadata
  getAllTablesMetadata() {
    const tables = this.getTables();
    return tables.map(name => this.getTableMetadata(name)).filter(Boolean);
  }

  // Detect foreign key relationships
  getForeignKeys(tableName) {
    if (!this.db) return [];

    try {
      const result = this.db.exec(`PRAGMA foreign_key_list("${tableName}")`);
      if (result.length === 0) return [];

      return result[0].values.map(row => ({
        id: row[0],
        seq: row[1],
        table: row[2],
        from: row[3],
        to: row[4],
        onUpdate: row[5],
        onDelete: row[6],
        match: row[7]
      }));
    } catch (err) {
      console.error('Error getting foreign keys:', err);
      return [];
    }
  }

  // Get all relationships in the database
  getAllRelationships() {
    const tables = this.getTables();
    const relationships = [];

    for (const table of tables) {
      const fks = this.getForeignKeys(table);
      for (const fk of fks) {
        relationships.push({
          fromTable: table,
          fromColumn: fk.from,
          toTable: fk.table,
          toColumn: fk.to,
          onUpdate: fk.onUpdate,
          onDelete: fk.onDelete
        });
      }
    }

    // Also detect implicit relationships based on naming conventions
    const allMetadata = this.getAllTablesMetadata();
    const tableNames = new Set(tables.map(t => t.toLowerCase()));

    for (const meta of allMetadata) {
      for (const col of meta.columns) {
        // Check for common FK patterns like user_id, userId, userID
        const colLower = col.name.toLowerCase();

        // Pattern: tablename_id or tablenameId
        if (colLower.endsWith('_id') || colLower.endsWith('id')) {
          const potentialTable = colLower.replace(/_id$/, '').replace(/id$/i, '');

          // Check if this references another table
          for (const tableName of tableNames) {
            const tableBase = tableName.replace(/s$/, ''); // Remove plural 's'
            if (potentialTable === tableBase || potentialTable === tableName) {
              // Check if relationship already exists from explicit FK
              const exists = relationships.some(r =>
                r.fromTable === meta.tableName &&
                r.fromColumn === col.name &&
                r.toTable.toLowerCase() === tableName
              );

              if (!exists && meta.tableName.toLowerCase() !== tableName) {
                relationships.push({
                  fromTable: meta.tableName,
                  fromColumn: col.name,
                  toTable: tables.find(t => t.toLowerCase() === tableName) || tableName,
                  toColumn: 'id',
                  implicit: true
                });
              }
            }
          }
        }
      }
    }

    return relationships;
  }

  // Get database summary
  getDatabaseSummary() {
    if (!this.db) return null;

    const tables = this.getAllTablesMetadata();
    const relationships = this.getAllRelationships();

    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
    const totalColumns = tables.reduce((sum, t) => sum + t.columnCount, 0);
    const provenance = this.detectProvenance(tables);

    return {
      tableCount: tables.length,
      totalRows,
      totalColumns,
      relationshipCount: relationships.length,
      tables,
      relationships,
      provenance
    };
  }

  // Detect data provenance based on table/column names and values
  detectProvenance(tablesMetadata) {
    if (!this.db) return null;

    // Collect all table names and column names for analysis
    const tableNames = tablesMetadata.map(t => t.tableName.toLowerCase());
    const allColumns = tablesMetadata.flatMap(t => t.columns.map(c => c.name.toLowerCase()));

    // Sample some values from tables for additional context
    const sampleValues = [];
    for (const table of tablesMetadata.slice(0, 5)) {
      try {
        const result = this.db.exec(`SELECT * FROM "${table.tableName}" LIMIT 10`);
        if (result.length > 0) {
          result[0].values.forEach(row => {
            row.forEach(val => {
              if (typeof val === 'string' && val.length > 2 && val.length < 100) {
                sampleValues.push(val.toLowerCase());
              }
            });
          });
        }
      } catch (e) {
        // Skip tables that can't be queried
      }
    }

    const combinedText = [...tableNames, ...allColumns, ...sampleValues].join(' ');
    const detections = [];

    // Domain-specific pattern matching with confidence scores
    const domainPatterns = [
      {
        domain: 'Radiation/Irradiation Processing',
        description: 'Food irradiation or radiation processing facility',
        patterns: [
          { regex: /\b(dose|dosage|dosimetry|absorbed_dose)\b/i, weight: 3 },
          { regex: /\b(kgy|gray|rad|mrad)\b/i, weight: 4 },
          { regex: /\b(irradiat|e.?beam|electron.?beam|gamma|x.?ray)\b/i, weight: 4 },
          { regex: /\b(conveyor|pallet|tote|carrier)\b/i, weight: 2 },
          { regex: /\b(steriliz|pasteuriz|decontamin)\b/i, weight: 3 },
          { regex: /\b(dwell.?time|scan.?speed|beam.?current|beam.?energy)\b/i, weight: 4 },
          { regex: /\b(mev|linac|accelerator)\b/i, weight: 4 },
          { regex: /\b(surebeam|sterigenics|iotron|sadex|reviss)\b/i, weight: 5 },
          { regex: /\b(alanine|dosimeter|film.?badge)\b/i, weight: 4 },
          { regex: /\b(d10|sar|sterility.?assurance)\b/i, weight: 4 }
        ],
        acronyms: {
          'kGy': 'kiloGray - unit of absorbed radiation dose',
          'MeV': 'Mega electron Volt - beam energy measurement',
          'SAL': 'Sterility Assurance Level',
          'D10': 'Decimal reduction dose',
          'SAR': 'Sterility Assurance Ratio',
          'LINAC': 'Linear Accelerator'
        }
      },
      {
        domain: 'Healthcare/Medical',
        description: 'Healthcare or medical records system',
        patterns: [
          { regex: /\b(patient|diagnosis|prescription|medication)\b/i, weight: 3 },
          { regex: /\b(icd.?10|cpt|ndc|npi)\b/i, weight: 4 },
          { regex: /\b(admission|discharge|encounter|visit)\b/i, weight: 2 },
          { regex: /\b(physician|nurse|provider|clinician)\b/i, weight: 2 },
          { regex: /\b(hipaa|phi|ehr|emr)\b/i, weight: 4 },
          { regex: /\b(lab.?result|vital|blood.?pressure|heart.?rate)\b/i, weight: 3 }
        ],
        acronyms: {
          'ICD-10': 'International Classification of Diseases',
          'CPT': 'Current Procedural Terminology',
          'NDC': 'National Drug Code',
          'NPI': 'National Provider Identifier',
          'PHI': 'Protected Health Information',
          'EHR': 'Electronic Health Record'
        }
      },
      {
        domain: 'E-Commerce/Retail',
        description: 'E-commerce or retail management system',
        patterns: [
          { regex: /\b(product|sku|inventory|catalog)\b/i, weight: 2 },
          { regex: /\b(cart|checkout|order|shipping)\b/i, weight: 3 },
          { regex: /\b(customer|buyer|shopper)\b/i, weight: 2 },
          { regex: /\b(price|discount|coupon|promotion)\b/i, weight: 2 },
          { regex: /\b(payment|transaction|refund)\b/i, weight: 2 },
          { regex: /\b(shopify|woocommerce|magento)\b/i, weight: 5 }
        ],
        acronyms: {
          'SKU': 'Stock Keeping Unit',
          'POS': 'Point of Sale',
          'AOV': 'Average Order Value'
        }
      },
      {
        domain: 'Manufacturing/Industrial',
        description: 'Manufacturing or industrial control system',
        patterns: [
          { regex: /\b(batch|lot|work.?order|production)\b/i, weight: 2 },
          { regex: /\b(machine|equipment|station|line)\b/i, weight: 2 },
          { regex: /\b(scada|plc|opc|mes)\b/i, weight: 4 },
          { regex: /\b(downtime|oee|cycle.?time|takt)\b/i, weight: 3 },
          { regex: /\b(quality|defect|inspection|ncr)\b/i, weight: 2 },
          { regex: /\b(bom|routing|work.?center)\b/i, weight: 3 }
        ],
        acronyms: {
          'SCADA': 'Supervisory Control and Data Acquisition',
          'PLC': 'Programmable Logic Controller',
          'OPC': 'Open Platform Communications',
          'MES': 'Manufacturing Execution System',
          'OEE': 'Overall Equipment Effectiveness',
          'BOM': 'Bill of Materials',
          'NCR': 'Non-Conformance Report'
        }
      },
      {
        domain: 'Financial Services',
        description: 'Financial or banking system',
        patterns: [
          { regex: /\b(account|ledger|journal|transaction)\b/i, weight: 2 },
          { regex: /\b(debit|credit|balance|reconcil)\b/i, weight: 3 },
          { regex: /\b(loan|mortgage|interest.?rate|apr)\b/i, weight: 3 },
          { regex: /\b(swift|iban|routing.?number|ach)\b/i, weight: 4 },
          { regex: /\b(kyc|aml|compliance)\b/i, weight: 4 }
        ],
        acronyms: {
          'SWIFT': 'Society for Worldwide Interbank Financial Telecommunication',
          'IBAN': 'International Bank Account Number',
          'ACH': 'Automated Clearing House',
          'KYC': 'Know Your Customer',
          'AML': 'Anti-Money Laundering',
          'APR': 'Annual Percentage Rate'
        }
      },
      {
        domain: 'Human Resources',
        description: 'HR or workforce management system',
        patterns: [
          { regex: /\b(employee|staff|worker|personnel)\b/i, weight: 2 },
          { regex: /\b(salary|payroll|compensation|benefit)\b/i, weight: 3 },
          { regex: /\b(hire.?date|termination|onboard)\b/i, weight: 3 },
          { regex: /\b(department|manager|supervisor|report)\b/i, weight: 2 },
          { regex: /\b(pto|leave|vacation|sick.?day)\b/i, weight: 3 },
          { regex: /\b(performance|review|appraisal)\b/i, weight: 2 }
        ],
        acronyms: {
          'PTO': 'Paid Time Off',
          'HRIS': 'Human Resource Information System',
          'FTE': 'Full-Time Equivalent'
        }
      },
      {
        domain: 'Logistics/Supply Chain',
        description: 'Logistics or supply chain management',
        patterns: [
          { regex: /\b(shipment|freight|carrier|tracking)\b/i, weight: 3 },
          { regex: /\b(warehouse|dock|bay|rack)\b/i, weight: 2 },
          { regex: /\b(pick|pack|ship|receive)\b/i, weight: 2 },
          { regex: /\b(po|purchase.?order|vendor|supplier)\b/i, weight: 3 },
          { regex: /\b(bol|asn|edi)\b/i, weight: 4 },
          { regex: /\b(3pl|ltl|ftl)\b/i, weight: 4 }
        ],
        acronyms: {
          'BOL': 'Bill of Lading',
          'ASN': 'Advanced Shipping Notice',
          'EDI': 'Electronic Data Interchange',
          '3PL': 'Third-Party Logistics',
          'LTL': 'Less Than Truckload',
          'FTL': 'Full Truckload'
        }
      }
    ];

    // Score each domain
    for (const domain of domainPatterns) {
      let score = 0;
      const matchedTerms = [];
      const relevantAcronyms = {};

      for (const pattern of domain.patterns) {
        const matches = combinedText.match(pattern.regex);
        if (matches) {
          score += pattern.weight;
          matchedTerms.push(matches[0]);
        }
      }

      // Check for acronyms and add explanations
      for (const [acronym, explanation] of Object.entries(domain.acronyms)) {
        if (combinedText.toLowerCase().includes(acronym.toLowerCase())) {
          relevantAcronyms[acronym] = explanation;
        }
      }

      if (score >= 5) {
        detections.push({
          domain: domain.domain,
          description: domain.description,
          confidence: Math.min(score / 15, 1), // Normalize to 0-1
          matchedTerms: [...new Set(matchedTerms)].slice(0, 8),
          acronyms: relevantAcronyms
        });
      }
    }

    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    // Only return if we have strong indication (confidence >= 0.3)
    const strongMatches = detections.filter(d => d.confidence >= 0.3);

    if (strongMatches.length === 0) {
      return null;
    }

    return {
      primary: strongMatches[0],
      alternatives: strongMatches.slice(1, 3)
    };
  }

  getTableSchema(tableName) {
    if (!this.db) return null;

    try {
      const result = this.db.exec(`PRAGMA table_info("${tableName}")`);
      if (result.length === 0) return null;

      const columns = result[0].values.map(row => ({
        cid: row[0],
        name: row[1],
        type: row[2] || 'TEXT',
        notnull: row[3] === 1,
        defaultValue: row[4],
        primaryKey: row[5] === 1
      }));

      return { tableName, columns };
    } catch (err) {
      console.error('Error getting schema:', err);
      return null;
    }
  }

  getTableData(tableName, options = {}) {
    if (!this.db) return { data: [], columns: [], pagination: {} };

    const { page = 1, limit = 100, sortBy, sortDir = 'asc' } = options;
    const offset = (page - 1) * limit;

    try {
      // Get total count
      const countResult = this.db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
      const total = countResult[0]?.values[0][0] || 0;

      // Build query
      let query = `SELECT * FROM "${tableName}"`;
      if (sortBy) {
        query += ` ORDER BY "${sortBy}" ${sortDir.toUpperCase()}`;
      }
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const result = this.db.exec(query);

      if (result.length === 0) {
        // Table exists but is empty - get column names from schema
        const schema = this.getTableSchema(tableName);
        return {
          data: [],
          columns: schema?.columns.map(c => c.name) || [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }

      const columns = result[0].columns;
      const data = result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });

      return {
        data,
        columns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.error('Error getting data:', err);
      return { data: [], columns: [], pagination: {} };
    }
  }

  getTableStats(tableName) {
    if (!this.db) return null;

    try {
      const schema = this.getTableSchema(tableName);
      if (!schema) return null;

      const stats = {};

      for (const col of schema.columns) {
        const colName = col.name;
        const isNumeric = ['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'].some(
          t => col.type.toUpperCase().includes(t)
        );

        if (isNumeric) {
          try {
            const result = this.db.exec(`
              SELECT
                MIN("${colName}") as min,
                MAX("${colName}") as max,
                AVG("${colName}") as avg,
                COUNT(*) as count,
                SUM(CASE WHEN "${colName}" IS NULL THEN 1 ELSE 0 END) as nulls
              FROM "${tableName}"
            `);

            if (result.length > 0) {
              const row = result[0].values[0];
              stats[colName] = {
                type: 'numeric',
                min: row[0],
                max: row[1],
                avg: row[2],
                count: row[3],
                nullCount: row[4]
              };
            }
          } catch (e) {
            // Skip if aggregation fails
          }
        } else {
          try {
            const result = this.db.exec(`
              SELECT
                COUNT(DISTINCT "${colName}") as distinct_count,
                COUNT(*) as count,
                SUM(CASE WHEN "${colName}" IS NULL THEN 1 ELSE 0 END) as nulls
              FROM "${tableName}"
            `);

            if (result.length > 0) {
              const row = result[0].values[0];
              stats[colName] = {
                type: 'text',
                distinctValues: row[0],
                count: row[1],
                nullCount: row[2]
              };
            }
          } catch (e) {
            // Skip if aggregation fails
          }
        }
      }

      return stats;
    } catch (err) {
      console.error('Error getting stats:', err);
      return null;
    }
  }

  executeQuery(sql) {
    if (!this.db) throw new Error('No database loaded');

    // Only allow SELECT queries for safety
    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA')) {
      throw new Error('Only SELECT queries are allowed');
    }

    const startTime = performance.now();

    try {
      const result = this.db.exec(sql);
      const duration = Math.round(performance.now() - startTime);

      if (result.length === 0) {
        return { data: [], columns: [], rowCount: 0, duration };
      }

      const columns = result[0].columns;
      const data = result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });

      return {
        data,
        columns,
        rowCount: data.length,
        duration
      };
    } catch (err) {
      throw new Error(`Query error: ${err.message}`);
    }
  }

  // Get SureBeam-specific statistics
  getSureBeamStats() {
    if (!this.db) return null;

    const stats = {
      customerCount: 0,
      spsaCount: 0,
      pcnCount: 0,
      lotCount: 0,
      processingCount: 0,
      deviceLogCount: 0,
      yearRange: null,
      pcnByYear: [],
      topCustomers: []
    };

    try {
      // Get counts from key tables
      const tables = this.getTables();
      const tableNames = tables.map(t => t.toLowerCase());

      // Customer count
      if (tableNames.includes('customer')) {
        const result = this.db.exec(`SELECT COUNT(*) FROM Customer`);
        stats.customerCount = result[0]?.values[0][0] || 0;
      }

      // SPSA count
      if (tableNames.includes('spsa')) {
        const result = this.db.exec(`SELECT COUNT(*) FROM SPSA`);
        stats.spsaCount = result[0]?.values[0][0] || 0;
      }

      // PCN count
      if (tableNames.includes('pcn')) {
        const result = this.db.exec(`SELECT COUNT(*) FROM PCN`);
        stats.pcnCount = result[0]?.values[0][0] || 0;
      }

      // PCN_Lot count
      if (tableNames.includes('pcn_lot')) {
        const result = this.db.exec(`SELECT COUNT(*) FROM PCN_Lot`);
        stats.lotCount = result[0]?.values[0][0] || 0;
      }

      // PCN_Lot_Processing count
      if (tableNames.includes('pcn_lot_processing')) {
        const result = this.db.exec(`SELECT COUNT(*) FROM PCN_Lot_Processing`);
        stats.processingCount = result[0]?.values[0][0] || 0;
      }

      // Device_Log count
      if (tableNames.includes('device_log')) {
        const result = this.db.exec(`SELECT COUNT(*) FROM Device_Log`);
        stats.deviceLogCount = result[0]?.values[0][0] || 0;
      }

      // First, get the actual column names from PCN table
      let pcnColumns = [];
      try {
        const schemaResult = this.db.exec(`PRAGMA table_info(PCN)`);
        if (schemaResult.length > 0) {
          pcnColumns = schemaResult[0].values.map(row => row[1]);
        }
      } catch (e) {
        console.log('Could not get PCN schema');
      }

      // Find date column - prioritize Processing_Start_Date, then look for others
      const dateColumn = pcnColumns.find(col =>
        col.toLowerCase() === 'processing_start_date'
      ) || pcnColumns.find(col =>
        col.toLowerCase().includes('processing') && col.toLowerCase().includes('date')
      ) || pcnColumns.find(col =>
        col.toLowerCase().includes('pdate') ||
        col.toLowerCase().includes('start_date') ||
        col.toLowerCase().includes('processdate')
      ) || pcnColumns.find(col =>
        col.toLowerCase().includes('date')
      );

      // Get year range from PCN table (filter out future dates)
      if (tableNames.includes('pcn') && dateColumn) {
        try {
          const currentYear = new Date().getFullYear();
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const result = this.db.exec(`
            SELECT MIN(strftime('%Y', "${dateColumn}")) as min_year, MAX(strftime('%Y', "${dateColumn}")) as max_year
            FROM PCN
            WHERE "${dateColumn}" IS NOT NULL AND "${dateColumn}" != ''
              AND DATE("${dateColumn}") <= DATE('${today}')
              AND CAST(strftime('%Y', "${dateColumn}") AS INTEGER) >= 2000
          `);
          if (result.length > 0 && result[0].values[0][0]) {
            stats.yearRange = {
              min: parseInt(result[0].values[0][0]),
              max: Math.min(parseInt(result[0].values[0][1]), currentYear)
            };
          }
        } catch (e) {
          console.log('Could not get year range:', e.message);
        }
      }

      // Get PCN count by year - fetch ALL years (no LIMIT), filter out future dates
      if (tableNames.includes('pcn') && dateColumn) {
        try {
          const currentYear = new Date().getFullYear();
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const result = this.db.exec(`
            SELECT strftime('%Y', "${dateColumn}") as year, COUNT(*) as count
            FROM PCN
            WHERE "${dateColumn}" IS NOT NULL AND "${dateColumn}" != ''
              AND DATE("${dateColumn}") <= DATE('${today}')
            GROUP BY strftime('%Y', "${dateColumn}")
            ORDER BY year ASC
          `);
          if (result.length > 0 && result[0].values.length > 0) {
            stats.pcnByYear = result[0].values
              .filter(row => row[0] && parseInt(row[0]) >= 2000 && parseInt(row[0]) <= currentYear)  // Filter out invalid and future years
              .map(row => ({
                year: row[0],
                count: row[1]
              }));
          }
        } catch (e) {
          console.log('Could not get PCN by year:', e.message);
        }
      }

      // Find customer name column
      const customerColumn = pcnColumns.find(col =>
        col.toLowerCase().includes('customer') ||
        col.toLowerCase().includes('cust_name') ||
        col.toLowerCase() === 'customer'
      );

      // Get top customers by PCN count
      if (tableNames.includes('pcn') && customerColumn) {
        try {
          const result = this.db.exec(`
            SELECT "${customerColumn}" as name, COUNT(*) as count
            FROM PCN
            WHERE "${customerColumn}" IS NOT NULL AND "${customerColumn}" != ''
            GROUP BY "${customerColumn}"
            ORDER BY count DESC
          `);
          if (result.length > 0 && result[0].values.length > 0) {
            stats.topCustomers = result[0].values.map(row => ({
              name: row[0],
              count: row[1]
            }));
          }
        } catch (e) {
          console.log('Could not get top customers:', e.message);
        }
      }

      // If no customer column in PCN, try joining with SPSA and Customer tables
      if (!customerColumn && tableNames.includes('spsa') && tableNames.includes('customer')) {
        try {
          const result = this.db.exec(`
            SELECT c.Customer_Name as name, COUNT(p.PCN_ID) as count
            FROM PCN p
            JOIN SPSA s ON p.SPSA_ID = s.SPSA_ID
            JOIN Customer c ON s.Customer_ID = c.Customer_ID
            GROUP BY c.Customer_Name
            ORDER BY count DESC
          `);
          if (result.length > 0 && result[0].values.length > 0) {
            stats.topCustomers = result[0].values.map(row => ({
              name: row[0],
              count: row[1]
            }));
          }
        } catch (e) {
          console.log('Could not get top customers via join:', e.message);
        }
      }

      return stats;
    } catch (err) {
      console.error('Error getting SureBeam stats:', err);
      return stats;
    }
  }

  // Get dose optimization data for detailed analysis
  getDoseOptimizationData(filters = {}) {
    if (!this.db) return null;

    const result = {
      doseDistribution: [],
      overUnderDose: { over: 0, under: 0, optimal: 0, total: 0 },
      customerHeatmap: [],
      yearlyTrends: [],
      packingAnalysis: [],
      spsaDetails: [],
      acceleratorComparison: [],
      savingsEstimate: null
    };

    try {
      const tables = this.getTables();
      const tableNames = tables.map(t => t.toLowerCase());

      // Get SPSA columns
      let spsaColumns = [];
      if (tableNames.includes('spsa')) {
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(SPSA)`);
          if (schemaResult.length > 0) {
            spsaColumns = schemaResult[0].values.map(row => row[1]);
          }
        } catch (e) {
          console.log('Could not get SPSA schema');
        }
      }

      // Get PCN_Lot_Processing columns
      let processingColumns = [];
      if (tableNames.includes('pcn_lot_processing')) {
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(PCN_Lot_Processing)`);
          if (schemaResult.length > 0) {
            processingColumns = schemaResult[0].values.map(row => row[1]);
          }
        } catch (e) {
          console.log('Could not get PCN_Lot_Processing schema');
        }
      }

      // Get PCN columns
      let pcnColumns = [];
      if (tableNames.includes('pcn')) {
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(PCN)`);
          if (schemaResult.length > 0) {
            pcnColumns = schemaResult[0].values.map(row => row[1]);
          }
        } catch (e) {
          console.log('Could not get PCN schema');
        }
      }

      // Find dose-related columns in SPSA - try multiple naming patterns
      // The SureTrack database uses: Dosimeter_Minimum_Dose, Dosimeter_Maximum_Dose
      const doseMinCol = spsaColumns.find(c =>
        c.toLowerCase() === 'dosimeter_minimum_dose' ||
        c.toLowerCase() === 'dosimeterminimumdose' ||
        c.toLowerCase().includes('minimum_dose') ||
        c.toLowerCase().includes('minimumdose') ||
        c.toLowerCase().includes('dosemin') ||
        c.toLowerCase().includes('dose_min') ||
        c.toLowerCase().includes('mindose') ||
        c.toLowerCase().includes('min_dose') ||
        c.toLowerCase() === 'dmin' ||
        c.toLowerCase() === 'mingy' ||
        c.toLowerCase() === 'min_kgy'
      );
      const doseMaxCol = spsaColumns.find(c =>
        c.toLowerCase() === 'dosimeter_maximum_dose' ||
        c.toLowerCase() === 'dosimetermaximumdose' ||
        c.toLowerCase().includes('maximum_dose') ||
        c.toLowerCase().includes('maximumdose') ||
        c.toLowerCase().includes('dosemax') ||
        c.toLowerCase().includes('dose_max') ||
        c.toLowerCase().includes('maxdose') ||
        c.toLowerCase().includes('max_dose') ||
        c.toLowerCase() === 'dmax' ||
        c.toLowerCase() === 'maxgy' ||
        c.toLowerCase() === 'max_kgy'
      );
      const customerIdCol = spsaColumns.find(c =>
        c.toLowerCase().includes('customer_id') ||
        c.toLowerCase() === 'customerid' ||
        c.toLowerCase() === 'cust_id' ||
        c.toLowerCase() === 'custid'
      );
      const spsaIdCol = spsaColumns.find(c =>
        c.toLowerCase() === 'spsa_id' ||
        c.toLowerCase() === 'spsaid' ||
        c.toLowerCase() === 'id' ||
        c.toLowerCase() === 'spsa'
      );

      console.log('SPSA columns found:', spsaColumns);
      console.log('Dose columns detected:', { doseMinCol, doseMaxCol, customerIdCol, spsaIdCol });

      // Find packing-related columns in SPSA
      const depthCol = spsaColumns.find(c => c.toLowerCase().includes('depth') || c.toLowerCase().includes('height') || c.toLowerCase().includes('load'));
      const densityCol = spsaColumns.find(c => c.toLowerCase().includes('density') || c.toLowerCase().includes('dens'));
      const cartonsCol = spsaColumns.find(c => c.toLowerCase().includes('carton') || c.toLowerCase().includes('box'));

      // Find actual dose columns in PCN_Lot_Processing
      const actualDoseCol = processingColumns.find(c =>
        c.toLowerCase().includes('dose') && !c.toLowerCase().includes('min') && !c.toLowerCase().includes('max')
      ) || processingColumns.find(c => c.toLowerCase().includes('kgy'));

      // Find accelerator/device column
      const acceleratorCol = processingColumns.find(c =>
        c.toLowerCase().includes('device') || c.toLowerCase().includes('accelerator') || c.toLowerCase().includes('beam')
      ) || pcnColumns.find(c =>
        c.toLowerCase().includes('device') || c.toLowerCase().includes('accelerator') || c.toLowerCase().includes('beam')
      );

      // Find date column in PCN
      const dateColumn = pcnColumns.find(col =>
        col.toLowerCase().includes('pdate') ||
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('processdate')
      );

      // Find customer name column
      const customerNameCol = pcnColumns.find(c => c.toLowerCase().includes('customer') && c.toLowerCase().includes('name'));

      console.log('Dose columns found:', { doseMinCol, doseMaxCol, actualDoseCol, depthCol, densityCol, cartonsCol, acceleratorCol });

      // Build filter conditions
      let yearFilter = '';
      let customerFilter = '';
      let acceleratorFilter = '';

      if (filters.yearStart && filters.yearEnd && dateColumn) {
        yearFilter = ` AND strftime('%Y', "${dateColumn}") BETWEEN '${filters.yearStart}' AND '${filters.yearEnd}'`;
      }
      if (filters.customer && customerNameCol) {
        customerFilter = ` AND "${customerNameCol}" LIKE '%${filters.customer}%'`;
      }
      if (filters.accelerator && acceleratorCol) {
        acceleratorFilter = ` AND "${acceleratorCol}" LIKE '%${filters.accelerator}%'`;
      }

      // 1. Get SPSA dose configurations with customer info
      if (tableNames.includes('spsa') && doseMinCol && doseMaxCol) {
        try {
          let spsaQuery = '';
          if (tableNames.includes('customer') && customerIdCol) {
            spsaQuery = `
              SELECT
                s.${spsaIdCol || 'SPSA_ID'} as spsa_id,
                s.${doseMinCol} as dose_min,
                s.${doseMaxCol} as dose_max,
                (s.${doseMaxCol} - s.${doseMinCol}) as dose_range,
                ${depthCol ? `s.${depthCol} as depth,` : ''}
                ${densityCol ? `s.${densityCol} as density,` : ''}
                ${cartonsCol ? `s.${cartonsCol} as cartons_per_carrier,` : ''}
                c.Customer_Name as customer_name
              FROM SPSA s
              LEFT JOIN Customer c ON s.${customerIdCol} = c.Customer_ID
              WHERE s.${doseMinCol} IS NOT NULL AND s.${doseMaxCol} IS NOT NULL
              LIMIT 500
            `;
          } else {
            spsaQuery = `
              SELECT
                ${spsaIdCol || 'SPSA_ID'} as spsa_id,
                ${doseMinCol} as dose_min,
                ${doseMaxCol} as dose_max,
                (${doseMaxCol} - ${doseMinCol}) as dose_range
                ${depthCol ? `, ${depthCol} as depth` : ''}
                ${densityCol ? `, ${densityCol} as density` : ''}
                ${cartonsCol ? `, ${cartonsCol} as cartons_per_carrier` : ''}
              FROM SPSA
              WHERE ${doseMinCol} IS NOT NULL AND ${doseMaxCol} IS NOT NULL
              LIMIT 500
            `;
          }

          const spsaResult = this.db.exec(spsaQuery);
          if (spsaResult.length > 0) {
            const cols = spsaResult[0].columns;
            result.spsaDetails = spsaResult[0].values.map(row => {
              const obj = {};
              cols.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
          }
        } catch (e) {
          console.log('Error getting SPSA details:', e.message);
        }
      }

      // 2. Calculate dose distribution histogram
      if (result.spsaDetails.length > 0) {
        // Group by dose range buckets
        const buckets = {};
        result.spsaDetails.forEach(spsa => {
          const targetDose = ((spsa.dose_min || 0) + (spsa.dose_max || 0)) / 2;
          const bucket = Math.floor(targetDose / 5) * 5; // 5 kGy buckets
          const key = `${bucket}-${bucket + 5}`;
          if (!buckets[key]) {
            buckets[key] = { range: key, count: 0, minDose: bucket, avgRange: 0, totalRange: 0 };
          }
          buckets[key].count++;
          buckets[key].totalRange += (spsa.dose_range || 0);
          buckets[key].avgRange = buckets[key].totalRange / buckets[key].count;
        });

        result.doseDistribution = Object.values(buckets)
          .sort((a, b) => a.minDose - b.minDose)
          .filter(b => b.minDose >= 0 && b.minDose <= 100);
      }

      // 3. Calculate over/under dose statistics based on dose range margins
      if (result.spsaDetails.length > 0) {
        let overCount = 0, underCount = 0, optimalCount = 0;

        result.spsaDetails.forEach(spsa => {
          const range = spsa.dose_range || 0;
          const minDose = spsa.dose_min || 0;
          // Calculate range as percentage of min dose
          const rangePercent = minDose > 0 ? (range / minDose) * 100 : 0;

          // Categorize based on dose margin
          // Wide margin (>30%) indicates potential over-dosing
          // Narrow margin (<10%) indicates tight control
          if (rangePercent > 30) {
            overCount++;  // Wide margin - likely over-dosing for safety
          } else if (rangePercent < 10) {
            underCount++; // Very tight - risk of under-dosing
          } else {
            optimalCount++; // Good range
          }
        });

        result.overUnderDose = {
          over: overCount,
          under: underCount,
          optimal: optimalCount,
          total: result.spsaDetails.length
        };
      }

      // 4. Customer heatmap - dose margins by customer
      if (result.spsaDetails.length > 0 && result.spsaDetails[0].customer_name) {
        const customerGroups = {};
        result.spsaDetails.forEach(spsa => {
          const customer = spsa.customer_name || 'Unknown';
          if (!customerGroups[customer]) {
            customerGroups[customer] = {
              customer,
              count: 0,
              totalRange: 0,
              avgRange: 0,
              minDoseAvg: 0,
              maxDoseAvg: 0,
              totalMin: 0,
              totalMax: 0,
              marginPercent: 0
            };
          }
          customerGroups[customer].count++;
          customerGroups[customer].totalRange += (spsa.dose_range || 0);
          customerGroups[customer].totalMin += (spsa.dose_min || 0);
          customerGroups[customer].totalMax += (spsa.dose_max || 0);
        });

        result.customerHeatmap = Object.values(customerGroups)
          .map(c => ({
            ...c,
            avgRange: c.totalRange / c.count,
            minDoseAvg: c.totalMin / c.count,
            maxDoseAvg: c.totalMax / c.count,
            marginPercent: c.totalMin > 0 ? ((c.totalRange / c.count) / (c.totalMin / c.count)) * 100 : 0
          }))
          .sort((a, b) => b.marginPercent - a.marginPercent)
          .slice(0, 20);
      }

      // 5. Yearly trends - PCN count by year with dose info (filter out future dates)
      if (tableNames.includes('pcn') && dateColumn) {
        try {
          const currentYear = new Date().getFullYear();
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const yearQuery = `
            SELECT
              strftime('%Y', "${dateColumn}") as year,
              COUNT(*) as pcn_count
            FROM PCN
            WHERE "${dateColumn}" IS NOT NULL AND "${dateColumn}" != ''
              AND DATE("${dateColumn}") <= DATE('${today}')
            GROUP BY strftime('%Y', "${dateColumn}")
            HAVING year >= '2000' AND CAST(year AS INTEGER) <= ${currentYear}
            ORDER BY year ASC
          `;
          const yearResult = this.db.exec(yearQuery);
          if (yearResult.length > 0) {
            result.yearlyTrends = yearResult[0].values.map(row => ({
              year: row[0],
              pcn_count: row[1]
            }));
          }
        } catch (e) {
          console.log('Error getting yearly trends:', e.message);
        }
      }

      // 6. Packing analysis - dose by depth/density if available
      if (result.spsaDetails.length > 0 && (result.spsaDetails[0].depth || result.spsaDetails[0].density)) {
        const packingGroups = {};
        result.spsaDetails.forEach(spsa => {
          let packingKey = 'Unknown';
          if (spsa.depth) {
            // Group by depth ranges
            const depthBucket = Math.floor(parseFloat(spsa.depth) / 10) * 10;
            packingKey = `Depth ${depthBucket}-${depthBucket + 10}`;
          } else if (spsa.density) {
            const densityBucket = Math.floor(parseFloat(spsa.density) * 10) / 10;
            packingKey = `Density ${densityBucket}`;
          }

          if (!packingGroups[packingKey]) {
            packingGroups[packingKey] = {
              packing: packingKey,
              count: 0,
              avgDoseMin: 0,
              avgDoseMax: 0,
              avgRange: 0,
              totalMin: 0,
              totalMax: 0,
              totalRange: 0
            };
          }
          packingGroups[packingKey].count++;
          packingGroups[packingKey].totalMin += (spsa.dose_min || 0);
          packingGroups[packingKey].totalMax += (spsa.dose_max || 0);
          packingGroups[packingKey].totalRange += (spsa.dose_range || 0);
        });

        result.packingAnalysis = Object.values(packingGroups)
          .map(p => ({
            ...p,
            avgDoseMin: p.totalMin / p.count,
            avgDoseMax: p.totalMax / p.count,
            avgRange: p.totalRange / p.count
          }))
          .filter(p => p.packing !== 'Unknown')
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);
      }

      // 7. Accelerator comparison if data available
      if (tableNames.includes('pcn') && acceleratorCol) {
        try {
          const accelQuery = `
            SELECT
              "${acceleratorCol}" as accelerator,
              COUNT(*) as count
            FROM PCN
            WHERE "${acceleratorCol}" IS NOT NULL AND "${acceleratorCol}" != ''
            GROUP BY "${acceleratorCol}"
            ORDER BY count DESC
          `;
          const accelResult = this.db.exec(accelQuery);
          if (accelResult.length > 0) {
            result.acceleratorComparison = accelResult[0].values.map(row => ({
              accelerator: row[0],
              count: row[1]
            }));
          }
        } catch (e) {
          console.log('Error getting accelerator comparison:', e.message);
        }
      }

      // 8. Calculate savings estimate - ONLY if we have actual dose data
      // NO FALLBACK DATA - if data is missing, savings estimate is null
      if (result.spsaDetails.length > 0) {
        // Calculate average margin directly from spsaDetails
        // Margin = (dose_max - dose_min) / dose_min * 100, capped at realistic industry values
        const marginsFromDetails = result.spsaDetails
          .filter(s => s.dose_min > 0 && s.dose_range !== null && s.dose_range !== undefined)
          .map(s => {
            const rawMargin = ((s.dose_range || 0) / s.dose_min) * 100;
            // Cap at realistic industry maximum (50% margin is very wide, 100%+ is likely data error)
            return Math.min(rawMargin, 50);
          });

        if (marginsFromDetails.length > 0) {
          const avgMarginPercent = marginsFromDetails.reduce((sum, m) => sum + m, 0) / marginsFromDetails.length;

          // Estimate: If we can tighten margins by a third (conservative), energy savings potential
          const potentialReduction = Math.min(avgMarginPercent * 0.33, 15); // Cap at 15%
          // Energy savings correlates with dose reduction - roughly 0.5-0.8x
          const estimatedEnergySavings = Math.min(potentialReduction * 0.6, 10); // Cap at 10%

          const total = result.overUnderDose.total || result.spsaDetails.length;
          const overDose = result.overUnderDose.over || 0;

          result.savingsEstimate = {
            currentAvgMargin: Math.round(avgMarginPercent * 10) / 10,
            potentialMarginReduction: Math.round(potentialReduction * 10) / 10,
            estimatedEnergySavingsPercent: Math.round(estimatedEnergySavings * 10) / 10,
            spsasWithWideMargin: overDose,
            optimizationPotential: Math.round((total > 0 ? (overDose / total) * 100 : 0) * 10) / 10,
            dataSource: 'SPSA dose limits (Dosimeter_Minimum_Dose / Dosimeter_Maximum_Dose)',
            note: 'Based on dose SPECIFICATIONS only. No actual delivered dose measurements found in database.'
          };

          console.log('Savings estimate calculated from SPSA dose limits:', result.savingsEstimate);
        } else {
          console.log('SPSA records found but no valid dose_min/dose_range values');
          result.savingsEstimate = null;
        }
      } else {
        // NO FALLBACK - clearly indicate data is missing
        console.log('No SPSA dose details found - savings estimate not possible');
        result.savingsEstimate = null;
      }

      return result;
    } catch (err) {
      console.error('Error getting dose optimization data:', err);
      return result;
    }
  }

  // Get available filter options for dose optimization
  getDoseFilterOptions() {
    if (!this.db) return null;

    const options = {
      years: [],
      customers: [],
      accelerators: []
    };

    try {
      const tables = this.getTables();
      const tableNames = tables.map(t => t.toLowerCase());

      // Get years from PCN
      if (tableNames.includes('pcn')) {
        let pcnColumns = [];
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(PCN)`);
          if (schemaResult.length > 0) {
            pcnColumns = schemaResult[0].values.map(row => row[1]);
          }
          console.log('PCN columns found:', pcnColumns);
        } catch (e) {
          console.log('Error getting PCN columns:', e.message);
        }

        const dateColumn = pcnColumns.find(col =>
          col.toLowerCase().includes('pdate') ||
          col.toLowerCase().includes('date')
        );

        if (dateColumn) {
          try {
            const currentYear = new Date().getFullYear();
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const yearResult = this.db.exec(`
              SELECT DISTINCT year FROM (
                SELECT strftime('%Y', "${dateColumn}") as year
                FROM PCN
                WHERE "${dateColumn}" IS NOT NULL AND "${dateColumn}" != ''
                  AND DATE("${dateColumn}") <= DATE('${today}')
              )
              WHERE year IS NOT NULL AND year >= '2000' AND CAST(year AS INTEGER) <= ${currentYear}
              ORDER BY year ASC
            `);
            if (yearResult.length > 0) {
              options.years = yearResult[0].values.map(r => r[0]).filter(Boolean);
              console.log('Years found:', options.years);
            }
          } catch (e) {
            console.log('Error getting years:', e.message);
            try {
              const currentYear = new Date().getFullYear();
              const today = new Date().toISOString().split('T')[0];
              const simpleYearResult = this.db.exec(`
                SELECT DISTINCT strftime('%Y', "${dateColumn}") as year
                FROM PCN
                WHERE "${dateColumn}" IS NOT NULL
                  AND DATE("${dateColumn}") <= DATE('${today}')
                ORDER BY year ASC
              `);
              if (simpleYearResult.length > 0) {
                options.years = simpleYearResult[0].values
                  .map(r => r[0])
                  .filter(y => y && parseInt(y) >= 2000 && parseInt(y) <= currentYear);
              }
            } catch (e2) {
              console.log('Fallback year query also failed:', e2.message);
            }
          }
        }

        // Get customers from PCN table
        const customerCol = pcnColumns.find(c =>
          c.toLowerCase().includes('customername') ||
          c.toLowerCase().includes('customer_name') ||
          c.toLowerCase() === 'customer' ||
          c.toLowerCase() === 'cust_name' ||
          c.toLowerCase() === 'custname'
        );

        if (customerCol) {
          try {
            const custResult = this.db.exec(`
              SELECT DISTINCT "${customerCol}"
              FROM PCN
              WHERE "${customerCol}" IS NOT NULL AND "${customerCol}" != ''
              ORDER BY "${customerCol}"
            `);
            if (custResult.length > 0) {
              options.customers = custResult[0].values.map(r => r[0]).filter(Boolean);
              console.log('Customers found:', options.customers.length);
            }
          } catch (e) {
            console.log('Error getting customers:', e.message);
          }
        }

        // Fallback: get customers from Customer table
        if (options.customers.length === 0 && tableNames.includes('customer')) {
          try {
            const custJoinResult = this.db.exec(`
              SELECT DISTINCT Customer_Name
              FROM Customer
              WHERE Customer_Name IS NOT NULL AND Customer_Name != ''
              ORDER BY Customer_Name
            `);
            if (custJoinResult.length > 0) {
              options.customers = custJoinResult[0].values.map(r => r[0]).filter(Boolean);
              console.log('Customers found via Customer table:', options.customers.length);
            }
          } catch (e) {
            console.log('Error getting customers from Customer table:', e.message);
          }
        }
      }

      // Get accelerators from Beam_Device table (this is where they're stored)
      if (tableNames.includes('beam_device')) {
        try {
          const accelResult = this.db.exec(`
            SELECT DISTINCT Dev_Name
            FROM Beam_Device
            WHERE Dev_Name IS NOT NULL AND Dev_Name != '' AND Enabled_Ind = 1
            ORDER BY Dev_Name
          `);
          if (accelResult.length > 0) {
            options.accelerators = accelResult[0].values.map(r => r[0]).filter(Boolean);
            console.log('Accelerators found from Beam_Device table:', options.accelerators);
          }
        } catch (e) {
          console.log('Error getting accelerators from Beam_Device:', e.message);
        }
      }

      // Fallback: get accelerators from PCN_Lot_Processing if not found in Beam_Device
      if (options.accelerators.length === 0 && tableNames.includes('pcn_lot_processing')) {
        try {
          const accelResult = this.db.exec(`
            SELECT DISTINCT Beam_Device_Name
            FROM PCN_Lot_Processing
            WHERE Beam_Device_Name IS NOT NULL AND Beam_Device_Name != ''
            ORDER BY Beam_Device_Name
          `);
          if (accelResult.length > 0) {
            options.accelerators = accelResult[0].values.map(r => r[0]).filter(Boolean);
            console.log('Accelerators found from PCN_Lot_Processing:', options.accelerators);
          }
        } catch (e) {
          console.log('Error getting accelerators from PCN_Lot_Processing:', e.message);
        }
      }

      return options;
    } catch (err) {
      console.error('Error getting filter options:', err);
      return options;
    }
  }

  getThroughputOptimizationData(filters = {}) {
    if (!this.db) return null;

    const result = {
      processingTimeline: [],
      acceleratorUtilization: [],
      changeoverAnalysis: [],
      dailyThroughput: [],
      monthlyVolume: [],
      speedDistribution: [],
      peakHourAnalysis: [],
      gapAnalysis: [],
      customerThroughput: [],
      acceleratorComparison: [],
      processingStats: {
        totalPCNs: 0,
        avgProcessingTime: 0,
        avgGapTime: 0,
        utilizationPercent: 0,
        peakCapacity: 0
      }
    };

    try {
      const tables = this.getTables();
      const tableNames = tables.map(t => t.toLowerCase());

      // Get PCN columns
      let pcnColumns = [];
      if (tableNames.includes('pcn')) {
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(PCN)`);
          if (schemaResult.length > 0) {
            pcnColumns = schemaResult[0].values.map(row => row[1]);
          }
        } catch (e) {
          console.log('Could not get PCN schema');
        }
      }

      // Get PCN_Lot columns
      let lotColumns = [];
      if (tableNames.includes('pcn_lot')) {
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(PCN_Lot)`);
          if (schemaResult.length > 0) {
            lotColumns = schemaResult[0].values.map(row => row[1]);
          }
        } catch (e) {
          console.log('Could not get PCN_Lot schema');
        }
      }

      // Get PCN_Lot_Processing columns
      let processingColumns = [];
      if (tableNames.includes('pcn_lot_processing')) {
        try {
          const schemaResult = this.db.exec(`PRAGMA table_info(PCN_Lot_Processing)`);
          if (schemaResult.length > 0) {
            processingColumns = schemaResult[0].values.map(row => row[1]);
          }
        } catch (e) {
          console.log('Could not get PCN_Lot_Processing schema');
        }
      }

      console.log('Throughput - PCN columns:', pcnColumns);
      console.log('Throughput - Processing columns:', processingColumns);

      // Find relevant columns
      const startDateCol = pcnColumns.find(c => c.toLowerCase().includes('start') && c.toLowerCase().includes('date'));
      const endDateCol = pcnColumns.find(c => c.toLowerCase().includes('end') && c.toLowerCase().includes('date'));
      const cartonsCol = pcnColumns.find(c => c.toLowerCase().includes('carton') && c.toLowerCase().includes('processed'));
      const speedCol = processingColumns.find(c => c.toLowerCase().includes('speed') || c.toLowerCase() === 'process_speed');
      const beamDeviceCol = processingColumns.find(c => c.toLowerCase().includes('beam_device'));
      const beamCurrentCol = processingColumns.find(c => c.toLowerCase().includes('avg_beam_current') || c.toLowerCase().includes('beam_current'));

      // 1. Get total PCN count
      if (tableNames.includes('pcn')) {
        try {
          const countResult = this.db.exec('SELECT COUNT(*) FROM PCN');
          if (countResult.length > 0) {
            result.processingStats.totalPCNs = countResult[0].values[0][0];
          }
        } catch (e) {
          console.log('Error getting PCN count:', e.message);
        }
      }

      // 2. Get processing by accelerator
      if (tableNames.includes('pcn_lot_processing') && beamDeviceCol) {
        try {
          const accelResult = this.db.exec(`
            SELECT
              ${beamDeviceCol} as accelerator,
              COUNT(*) as job_count,
              ${speedCol ? `AVG(${speedCol}) as avg_speed,` : ''}
              ${beamCurrentCol ? `AVG(${beamCurrentCol}) as avg_current,` : ''}
              COUNT(DISTINCT PCN_Lot_ID) as unique_lots
            FROM PCN_Lot_Processing
            WHERE ${beamDeviceCol} IS NOT NULL AND ${beamDeviceCol} != ''
            GROUP BY ${beamDeviceCol}
            ORDER BY job_count DESC
          `);
          if (accelResult.length > 0) {
            const cols = accelResult[0].columns;
            result.acceleratorUtilization = accelResult[0].values.map(row => {
              const obj = {};
              cols.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
          }
        } catch (e) {
          console.log('Error getting accelerator utilization:', e.message);
        }
      }

      // 3. Get monthly volume trends (filter out future dates)
      if (tableNames.includes('pcn') && startDateCol) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const monthlyResult = this.db.exec(`
            SELECT
              strftime('%Y', ${startDateCol}) as year,
              strftime('%m', ${startDateCol}) as month,
              COUNT(*) as pcn_count
              ${cartonsCol ? `, SUM(${cartonsCol}) as total_cartons` : ''}
            FROM PCN
            WHERE ${startDateCol} IS NOT NULL
              AND DATE(${startDateCol}) <= DATE('${today}')
            GROUP BY year, month
            ORDER BY year DESC, month DESC
            LIMIT 60
          `);
          if (monthlyResult.length > 0) {
            const cols = monthlyResult[0].columns;
            result.monthlyVolume = monthlyResult[0].values.map(row => {
              const obj = {};
              cols.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
          }
        } catch (e) {
          console.log('Error getting monthly volume:', e.message);
        }
      }

      // 4. Get daily throughput patterns (by day of week) - filter out future dates
      if (tableNames.includes('pcn') && startDateCol) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const dailyResult = this.db.exec(`
            SELECT
              CASE strftime('%w', ${startDateCol})
                WHEN '0' THEN 'Sunday'
                WHEN '1' THEN 'Monday'
                WHEN '2' THEN 'Tuesday'
                WHEN '3' THEN 'Wednesday'
                WHEN '4' THEN 'Thursday'
                WHEN '5' THEN 'Friday'
                WHEN '6' THEN 'Saturday'
              END as day_of_week,
              strftime('%w', ${startDateCol}) as day_num,
              COUNT(*) as pcn_count,
              COUNT(DISTINCT DATE(${startDateCol})) as unique_days
            FROM PCN
            WHERE ${startDateCol} IS NOT NULL
              AND DATE(${startDateCol}) <= DATE('${today}')
            GROUP BY day_num
            ORDER BY day_num
          `);
          if (dailyResult.length > 0) {
            const cols = dailyResult[0].columns;
            result.dailyThroughput = dailyResult[0].values.map(row => {
              const obj = {};
              cols.forEach((col, i) => { obj[col] = row[i]; });
              obj.avg_daily = Math.round(obj.pcn_count / (obj.unique_days || 1));
              return obj;
            });
          }
        } catch (e) {
          console.log('Error getting daily throughput:', e.message);
        }
      }

      // 5. Get speed distribution
      if (tableNames.includes('pcn_lot_processing') && speedCol) {
        try {
          const speedResult = this.db.exec(`
            SELECT
              CASE
                WHEN ${speedCol} < 2 THEN '0-2'
                WHEN ${speedCol} < 4 THEN '2-4'
                WHEN ${speedCol} < 6 THEN '4-6'
                WHEN ${speedCol} < 8 THEN '6-8'
                WHEN ${speedCol} < 10 THEN '8-10'
                ELSE '10+'
              END as speed_range,
              COUNT(*) as count,
              AVG(${speedCol}) as avg_speed
            FROM PCN_Lot_Processing
            WHERE ${speedCol} IS NOT NULL AND ${speedCol} > 0
            GROUP BY speed_range
            ORDER BY MIN(${speedCol})
          `);
          if (speedResult.length > 0) {
            const cols = speedResult[0].columns;
            result.speedDistribution = speedResult[0].values.map(row => {
              const obj = {};
              cols.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
          }
        } catch (e) {
          console.log('Error getting speed distribution:', e.message);
        }
      }

      // 6. Get customer throughput (top customers by volume)
      if (tableNames.includes('pcn')) {
        try {
          const custQuery = pcnColumns.includes('Customer_Name')
            ? `SELECT Customer_Name as customer, COUNT(*) as pcn_count ${cartonsCol ? `, SUM(${cartonsCol}) as total_cartons` : ''} FROM PCN WHERE Customer_Name IS NOT NULL GROUP BY Customer_Name ORDER BY pcn_count DESC LIMIT 20`
            : tableNames.includes('customer')
              ? `SELECT c.Customer_Name as customer, COUNT(*) as pcn_count ${cartonsCol ? `, SUM(p.${cartonsCol}) as total_cartons` : ''} FROM PCN p JOIN SPSA s ON p.SPSA_ID = s.SPSA_ID JOIN Customer c ON s.Customer_ID = c.Customer_ID GROUP BY c.Customer_Name ORDER BY pcn_count DESC LIMIT 20`
              : null;

          if (custQuery) {
            const custResult = this.db.exec(custQuery);
            if (custResult.length > 0) {
              const cols = custResult[0].columns;
              result.customerThroughput = custResult[0].values.map(row => {
                const obj = {};
                cols.forEach((col, i) => { obj[col] = row[i]; });
                return obj;
              });
            }
          }
        } catch (e) {
          console.log('Error getting customer throughput:', e.message);
        }
      }

      // 7. Calculate peak capacity estimate (max jobs per day) - filter out future dates
      if (tableNames.includes('pcn') && startDateCol) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const peakResult = this.db.exec(`
            SELECT MAX(daily_count) as peak_jobs
            FROM (
              SELECT DATE(${startDateCol}) as proc_date, COUNT(*) as daily_count
              FROM PCN
              WHERE ${startDateCol} IS NOT NULL
                AND DATE(${startDateCol}) <= DATE('${today}')
              GROUP BY proc_date
            )
          `);
          if (peakResult.length > 0) {
            result.processingStats.peakCapacity = peakResult[0].values[0][0] || 0;
          }
        } catch (e) {
          console.log('Error getting peak capacity:', e.message);
        }
      }

      // Calculate average utilization estimate
      if (result.processingStats.peakCapacity > 0 && result.monthlyVolume.length > 0) {
        const recentMonths = result.monthlyVolume.slice(0, 12);
        const avgMonthlyJobs = recentMonths.reduce((sum, m) => sum + m.pcn_count, 0) / recentMonths.length;
        const avgDailyJobs = avgMonthlyJobs / 22; // ~22 working days per month
        result.processingStats.utilizationPercent = Math.round((avgDailyJobs / result.processingStats.peakCapacity) * 100);
      }

      return result;
    } catch (err) {
      console.error('Error in getThroughputOptimizationData:', err);
      return result;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.fileName = null;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
