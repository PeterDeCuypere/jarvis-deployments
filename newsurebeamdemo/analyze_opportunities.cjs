const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const storageDir = '/home/facilis/workspace/storage/UeacMrfqp4VwdspSgVDjsIs4uPm1';
let dbPath = null;

function findDb(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'projects') {
      const result = findDb(fullPath);
      if (result) return result;
    } else if (file.endsWith('.db') || file.endsWith('.sqlite')) {
      return fullPath;
    }
  }
  return null;
}

dbPath = findDb(storageDir);
if (!dbPath) {
  console.log('No database found');
  process.exit(1);
}

console.log('Database:', dbPath);
const db = new Database(dbPath, { readonly: true });

// Get all tables
console.log('\n=== ALL TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log('-', t.name));

// PCN_Lot_Processing detailed analysis
console.log('\n=== PCN_Lot_Processing COLUMN ANALYSIS ===');
const pcnCols = db.prepare('PRAGMA table_info(PCN_Lot_Processing)').all();
console.log('Total columns: ' + pcnCols.length);
console.log('Columns: ' + pcnCols.map(c => c.name).join(', '));

// Check data availability for key columns
console.log('\n=== DATA AVAILABILITY IN PCN_Lot_Processing ===');
const total = db.prepare('SELECT COUNT(*) as cnt FROM PCN_Lot_Processing').get().cnt;
console.log('Total records: ' + total);

const keyColumns = [
  'PCN_ID', 'Customer_ID', 'Product_ID', 'SPSA_ID', 'Beam_Device_ID',
  'Processing_Start_Date', 'Processing_End_Date',
  'Calculated_Dose_First', 'Calculated_Dose_Last',
  'Conveyor_Speed', 'Beam_Current', 'Beam_Energy',
  'Number_Passes', 'Process_Table_ID'
];

for (const col of keyColumns) {
  try {
    const notNull = db.prepare('SELECT COUNT(*) as cnt FROM PCN_Lot_Processing WHERE "' + col + '" IS NOT NULL').get();
    const pct = ((notNull.cnt / total) * 100).toFixed(1);
    console.log('  ' + col + ': ' + notNull.cnt + '/' + total + ' (' + pct + '%)');
  } catch (e) {
    console.log('  ' + col + ': column not found');
  }
}

// SPSA Analysis
console.log('\n=== SPSA DOSE ANALYSIS ===');
const spsaCols = db.prepare('PRAGMA table_info(SPSA)').all();
console.log('SPSA columns: ' + spsaCols.map(c => c.name).join(', '));

const spsaTotal = db.prepare('SELECT COUNT(*) as cnt FROM SPSA').get().cnt;
const spsaWithDose = db.prepare('SELECT COUNT(*) as cnt FROM SPSA WHERE Dosimeter_Minimum_Dose IS NOT NULL').get().cnt;
console.log('Total SPSAs: ' + spsaTotal);
console.log('SPSAs with dose limits: ' + spsaWithDose);

const doseStats = db.prepare(`
  SELECT
    MIN(Dosimeter_Minimum_Dose) as min_dose,
    MAX(Dosimeter_Maximum_Dose) as max_dose,
    AVG(Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) as avg_margin,
    MIN(Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) as min_margin,
    MAX(Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) as max_margin
  FROM SPSA WHERE Dosimeter_Minimum_Dose IS NOT NULL
`).get();
console.log('Dose statistics:', JSON.stringify(doseStats, null, 2));

// Margin distribution
console.log('\n=== DOSE MARGIN DISTRIBUTION ===');
const marginDist = db.prepare(`
  SELECT
    CASE
      WHEN (Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) < 5 THEN 'Tight (<5 kGy)'
      WHEN (Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) < 10 THEN 'Medium (5-10 kGy)'
      WHEN (Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) < 20 THEN 'Wide (10-20 kGy)'
      ELSE 'Very Wide (>20 kGy)'
    END as margin_category,
    COUNT(*) as count,
    ROUND(AVG(Dosimeter_Minimum_Dose), 1) as avg_min,
    ROUND(AVG(Dosimeter_Maximum_Dose), 1) as avg_max
  FROM SPSA
  WHERE Dosimeter_Minimum_Dose IS NOT NULL
  GROUP BY margin_category
  ORDER BY avg_min
`).all();
console.log('Margin categories:');
marginDist.forEach(m => console.log('  ' + m.margin_category + ': ' + m.count + ' SPSAs (avg ' + m.avg_min + '-' + m.avg_max + ' kGy)'));

// Sample SPSAs with tightest margins (optimization opportunity)
console.log('\n=== SPSAs WITH TIGHTEST MARGINS (Top Optimization Candidates) ===');
const tightMargins = db.prepare(`
  SELECT SPSA_ID, SPSA_Name, SPSA_Desc, Dosimeter_Minimum_Dose as min_dose,
         Dosimeter_Maximum_Dose as max_dose,
         (Dosimeter_Maximum_Dose - Dosimeter_Minimum_Dose) as margin
  FROM SPSA
  WHERE Dosimeter_Minimum_Dose IS NOT NULL
  ORDER BY margin ASC
  LIMIT 15
`).all();
tightMargins.forEach(s => console.log('  SPSA ' + s.SPSA_ID + ': ' + s.min_dose + '-' + s.max_dose + ' kGy (margin: ' + s.margin.toFixed(1) + ') - ' + (s.SPSA_Name || s.SPSA_Desc || 'N/A').substring(0, 40)));

// Beam Device
console.log('\n=== BEAM DEVICES ===');
const beamCols = db.prepare('PRAGMA table_info(Beam_Device)').all();
console.log('Beam_Device columns: ' + beamCols.map(c => c.name).join(', '));
const beams = db.prepare('SELECT * FROM Beam_Device').all();
beams.forEach(b => console.log('  ' + JSON.stringify(b)));

// Process Table
console.log('\n=== PROCESS TABLES ===');
const ptCols = db.prepare('PRAGMA table_info(Process_Table)').all();
console.log('Process_Table columns: ' + ptCols.map(c => c.name).join(', '));
const pts = db.prepare('SELECT * FROM Process_Table').all();
pts.forEach(p => console.log('  ' + JSON.stringify(p)));

// Customer volume analysis - need to trace through PCN table
console.log('\n=== TOP CUSTOMERS BY VOLUME ===');
const topCustomers = db.prepare(`
  SELECT c.Customer_Name, COUNT(DISTINCT pcn.PCN_ID) as pcn_count, COUNT(DISTINCT s.SPSA_ID) as unique_spsas
  FROM PCN pcn
  JOIN SPSA s ON pcn.SPSA_ID = s.SPSA_ID
  JOIN Customer c ON s.Customer_ID = c.Customer_ID
  GROUP BY c.Customer_ID
  ORDER BY pcn_count DESC
  LIMIT 15
`).all();
topCustomers.forEach(c => console.log('  ' + (c.Customer_Name || 'Unknown') + ': ' + c.pcn_count + ' PCNs, ' + c.unique_spsas + ' unique SPSAs'));

// Search ALL tables for dose measurement data
console.log('\n=== SEARCHING ALL TABLES FOR ACTUAL DOSE MEASUREMENTS ===');
for (const table of tables) {
  const cols = db.prepare('PRAGMA table_info("' + table.name + '")').all();
  const doseCols = cols.filter(c =>
    c.name.toLowerCase().includes('dose') ||
    c.name.toLowerCase().includes('kgy') ||
    c.name.toLowerCase().includes('delivered') ||
    c.name.toLowerCase().includes('measured') ||
    c.name.toLowerCase().includes('actual') ||
    c.name.toLowerCase().includes('reading')
  );
  if (doseCols.length > 0) {
    console.log('\n' + table.name + ':');
    for (const col of doseCols) {
      const hasData = db.prepare('SELECT COUNT(*) as cnt FROM "' + table.name + '" WHERE "' + col.name + '" IS NOT NULL').get();
      console.log('  ' + col.name + ': ' + hasData.cnt + ' non-null values');
      if (hasData.cnt > 0 && hasData.cnt < 20) {
        const samples = db.prepare('SELECT "' + col.name + '" FROM "' + table.name + '" WHERE "' + col.name + '" IS NOT NULL LIMIT 5').all();
        console.log('    samples: ' + samples.map(s => s[col.name]).join(', '));
      }
    }
  }
}

// Check Data_Log for operational data
console.log('\n=== DATA_LOG ANALYSIS (Operational Data) ===');
const dlCols = db.prepare('PRAGMA table_info(Data_Log)').all();
console.log('Data_Log columns: ' + dlCols.map(c => c.name).join(', '));
const dlCount = db.prepare('SELECT COUNT(*) as cnt FROM Data_Log').get();
console.log('Total records: ' + dlCount.cnt);

// Sample Data_Log records
const dlSample = db.prepare('SELECT * FROM Data_Log LIMIT 3').all();
console.log('Sample records:');
dlSample.forEach(d => console.log('  ' + JSON.stringify(d)));

// Check Device_Log for equipment data
console.log('\n=== DEVICE_LOG ANALYSIS (Equipment Data) ===');
const devCols = db.prepare('PRAGMA table_info(Device_Log)').all();
console.log('Device_Log columns: ' + devCols.map(c => c.name).join(', '));
const devCount = db.prepare('SELECT COUNT(*) as cnt FROM Device_Log').get();
console.log('Total records: ' + devCount.cnt);

// Sample Device_Log
const devSample = db.prepare('SELECT * FROM Device_Log LIMIT 3').all();
console.log('Sample records:');
devSample.forEach(d => console.log('  ' + JSON.stringify(d)));

// Check Fault table for downtime/issues
console.log('\n=== FAULT ANALYSIS ===');
const faultCols = db.prepare('PRAGMA table_info(Fault)').all();
console.log('Fault columns: ' + faultCols.map(c => c.name).join(', '));
const faultCount = db.prepare('SELECT COUNT(*) as cnt FROM Fault').get();
console.log('Total fault types: ' + faultCount.cnt);

// Sample faults
const faultSample = db.prepare('SELECT * FROM Fault LIMIT 5').all();
console.log('Sample faults:');
faultSample.forEach(f => console.log('  ' + JSON.stringify(f)));

// Check Validation table
console.log('\n=== VALIDATION TABLE ===');
const valCols = db.prepare('PRAGMA table_info(Validation)').all();
console.log('Validation columns: ' + valCols.map(c => c.name).join(', '));

const valSample = db.prepare('SELECT * FROM Validation LIMIT 5').all();
console.log('Sample records:');
valSample.forEach(v => console.log('  ' + JSON.stringify(v)));

// Check PCN_Log for process history
console.log('\n=== PCN_LOG (Process History) ===');
const pcnLogCols = db.prepare('PRAGMA table_info(PCN_Log)').all();
console.log('PCN_Log columns: ' + pcnLogCols.map(c => c.name).join(', '));

const pcnLogSample = db.prepare('SELECT * FROM PCN_Log LIMIT 5').all();
console.log('Sample records:');
pcnLogSample.forEach(p => console.log('  ' + JSON.stringify(p)));

// Processing time analysis
console.log('\n=== PROCESSING TIME ANALYSIS ===');
const timeAnalysis = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN Processing_Start_Date IS NOT NULL THEN 1 ELSE 0 END) as has_start,
    SUM(CASE WHEN Processing_End_Date IS NOT NULL THEN 1 ELSE 0 END) as has_end,
    SUM(CASE WHEN Processing_Start_Date IS NOT NULL AND Processing_End_Date IS NOT NULL THEN 1 ELSE 0 END) as has_both
  FROM PCN_Lot_Processing
`).get();
console.log('Processing timestamps:', JSON.stringify(timeAnalysis));

// Check Element table for tracked parameters
console.log('\n=== ELEMENT TABLE (Tracked Parameters) ===');
const elemCols = db.prepare('PRAGMA table_info(Element)').all();
console.log('Element columns: ' + elemCols.map(c => c.name).join(', '));

const elemSample = db.prepare('SELECT * FROM Element LIMIT 10').all();
console.log('Sample elements:');
elemSample.forEach(e => console.log('  ' + JSON.stringify(e)));

// Check for energy/current data in Data_Log
console.log('\n=== ENERGY DATA IN DATA_LOG ===');
const energyElements = db.prepare(`
  SELECT DISTINCT e.Element_Name, e.Element_ID
  FROM Element e
  WHERE e.Element_Name LIKE '%Current%' OR e.Element_Name LIKE '%Energy%'
     OR e.Element_Name LIKE '%Speed%' OR e.Element_Name LIKE '%Power%'
`).all();
console.log('Energy-related elements:', energyElements);

// Check Data_Point table
console.log('\n=== DATA_POINT TABLE ===');
const dpCols = db.prepare('PRAGMA table_info(Data_Point)').all();
console.log('Data_Point columns: ' + dpCols.map(c => c.name).join(', '));
const dpSample = db.prepare('SELECT * FROM Data_Point LIMIT 5').all();
console.log('Sample records:');
dpSample.forEach(d => console.log('  ' + JSON.stringify(d)));

// Analyze processing volume by joining through PCN table
console.log('\n=== PROCESSING VOLUME BY SPSA ===');
// First check how PCN relates to SPSA
const pcnCols2 = db.prepare('PRAGMA table_info(PCN)').all();
console.log('PCN columns: ' + pcnCols2.map(c => c.name).join(', '));

const pcnSample = db.prepare('SELECT * FROM PCN LIMIT 3').all();
console.log('Sample PCN records:');
pcnSample.forEach(p => console.log('  ' + JSON.stringify(p)));

// Check PCN_Lot table
console.log('\n=== PCN_Lot TABLE ===');
const lotCols = db.prepare('PRAGMA table_info(PCN_Lot)').all();
console.log('PCN_Lot columns: ' + lotCols.map(c => c.name).join(', '));

const lotSample = db.prepare('SELECT * FROM PCN_Lot LIMIT 3').all();
console.log('Sample PCN_Lot records:');
lotSample.forEach(l => console.log('  ' + JSON.stringify(l)));

// Analyze processing data availability
console.log('\n=== CALCULATED DOSE DATA ===');
const doseData = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN Calculated_Dose_First IS NOT NULL THEN 1 ELSE 0 END) as has_dose_first,
    SUM(CASE WHEN Calculated_Dose_Last IS NOT NULL THEN 1 ELSE 0 END) as has_dose_last,
    SUM(CASE WHEN Calculated_Dose_High IS NOT NULL THEN 1 ELSE 0 END) as has_dose_high,
    SUM(CASE WHEN Calculated_Dose_Low IS NOT NULL THEN 1 ELSE 0 END) as has_dose_low
  FROM PCN_Lot_Processing
`).get();
console.log('Calculated dose availability:', JSON.stringify(doseData));

// Check process speed data (can be used for throughput optimization)
console.log('\n=== PROCESS SPEED DATA ===');
const speedData = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN Process_Speed_First IS NOT NULL THEN 1 ELSE 0 END) as has_speed,
    MIN(Process_Speed_First) as min_speed,
    MAX(Process_Speed_First) as max_speed,
    AVG(Process_Speed_First) as avg_speed
  FROM PCN_Lot_Processing
  WHERE Process_Speed_First IS NOT NULL
`).get();
console.log('Process speed data:', JSON.stringify(speedData));

// Beam current data (energy consumption)
console.log('\n=== BEAM CURRENT DATA ===');
const currentData = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN Avg_Beam_Current_First IS NOT NULL THEN 1 ELSE 0 END) as has_current,
    MIN(Avg_Beam_Current_First) as min_current,
    MAX(Avg_Beam_Current_First) as max_current,
    AVG(Avg_Beam_Current_First) as avg_current
  FROM PCN_Lot_Processing
  WHERE Avg_Beam_Current_First IS NOT NULL
`).get();
console.log('Beam current data:', JSON.stringify(currentData));

// RF Power data
console.log('\n=== RF POWER DATA ===');
const rfData = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN Avg_RF_Forward_Power_First IS NOT NULL THEN 1 ELSE 0 END) as has_rf,
    MIN(Avg_RF_Forward_Power_First) as min_rf,
    MAX(Avg_RF_Forward_Power_First) as max_rf,
    AVG(Avg_RF_Forward_Power_First) as avg_rf
  FROM PCN_Lot_Processing
  WHERE Avg_RF_Forward_Power_First IS NOT NULL
`).get();
console.log('RF Power data:', JSON.stringify(rfData));

// Processing by beam device
console.log('\n=== PROCESSING BY BEAM DEVICE ===');
const byDevice = db.prepare(`
  SELECT Beam_Device_Name, COUNT(*) as lots,
         AVG(Process_Speed_First) as avg_speed,
         AVG(Avg_Beam_Current_First) as avg_current
  FROM PCN_Lot_Processing
  WHERE Beam_Device_Name IS NOT NULL
  GROUP BY Beam_Device_Name
`).all();
byDevice.forEach(d => console.log('  ' + d.Beam_Device_Name + ': ' + d.lots + ' lots, avg speed: ' + (d.avg_speed ? d.avg_speed.toFixed(2) : 'N/A') + ', avg current: ' + (d.avg_current ? d.avg_current.toFixed(2) : 'N/A')));

// Check Process_Table for process parameters
console.log('\n=== PROCESS_TABLE DETAILS ===');
const ptData = db.prepare('SELECT * FROM Process_Table').all();
ptData.forEach(p => console.log('  ' + JSON.stringify(p)));

// Check Beam_Device_Process_Table for device-specific parameters
console.log('\n=== BEAM_DEVICE_PROCESS_TABLE ===');
const bdptCols = db.prepare('PRAGMA table_info(Beam_Device_Process_Table)').all();
console.log('Columns: ' + bdptCols.map(c => c.name).join(', '));
const bdptData = db.prepare('SELECT * FROM Beam_Device_Process_Table').all();
bdptData.forEach(p => console.log('  ' + JSON.stringify(p)));

// Analyze timestamp data for throughput analysis
console.log('\n=== TIMESTAMP ANALYSIS ===');
const tsData = db.prepare(`
  SELECT
    MIN(Time_Stamp) as earliest,
    MAX(Time_Stamp) as latest,
    COUNT(DISTINCT DATE(Time_Stamp)) as unique_days
  FROM PCN_Lot_Processing
  WHERE Time_Stamp IS NOT NULL
`).get();
console.log('Timestamp range:', JSON.stringify(tsData));

// Sample timestamps
const tsSamples = db.prepare(`
  SELECT Time_Stamp, Beam_Device_Name, Process_Speed_First
  FROM PCN_Lot_Processing
  WHERE Time_Stamp IS NOT NULL
  ORDER BY Time_Stamp DESC
  LIMIT 5
`).all();
console.log('Recent processing records:');
tsSamples.forEach(t => console.log('  ' + JSON.stringify(t)));

db.close();
console.log('\n=== ANALYSIS COMPLETE ===');
