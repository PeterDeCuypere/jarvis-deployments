import { useState, useCallback, useEffect } from 'react';
import { Upload, Database, AlertCircle, Loader2, HardDrive, Info } from 'lucide-react';
import databaseService from '../services/databaseService';

// Default database path in public/data folder
const DEFAULT_DATABASE_URL = './data/SureTrack.db';
const DEFAULT_DATABASE_NAME = 'SureTrack.db';

function DatabaseUpload({ onDatabaseLoaded }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true for auto-load
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading SureTrack database...');
  const [autoLoadFailed, setAutoLoadFailed] = useState(false);

  // Auto-load default database on component mount
  useEffect(() => {
    let cancelled = false;

    async function loadDefaultDatabase() {
      try {
        setLoadingMessage('Initializing SQL engine...');
        await databaseService.init();

        if (cancelled) return;

        setLoadingMessage('Loading SureTrack database...');
        await databaseService.loadDatabaseFromUrl(DEFAULT_DATABASE_URL, DEFAULT_DATABASE_NAME);

        if (cancelled) return;

        setLoadingMessage('Reading tables...');
        const tables = databaseService.getTables();

        if (tables.length === 0) {
          throw new Error('No tables found in the database.');
        }

        // Success - notify parent
        onDatabaseLoaded({
          fileName: DEFAULT_DATABASE_NAME,
          tables,
          fileSize: null // Size unknown when loading from URL
        });
      } catch (err) {
        if (cancelled) return;
        console.log('Auto-load failed, showing upload UI:', err.message);
        setAutoLoadFailed(true);
        setLoading(false);
        setLoadingMessage('');
        // Don't show error for auto-load failure - just show the upload UI
      }
    }

    loadDefaultDatabase();

    return () => {
      cancelled = true;
    };
  }, [onDatabaseLoaded]);

  const processFile = useCallback(async (file) => {
    // Validate file extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['db', 'sqlite', 'sqlite3', 'db3'].includes(ext)) {
      setError('Please upload a SQLite database file (.db, .sqlite, .sqlite3, .db3)');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage('Initializing SQL engine...');

    try {
      // Initialize sql.js
      await databaseService.init();

      setLoadingMessage('Loading database file...');
      await databaseService.loadDatabase(file);

      setLoadingMessage('Reading tables...');
      const tables = databaseService.getTables();

      if (tables.length === 0) {
        throw new Error('No tables found in the database. Make sure this is a valid SQLite database file.');
      }

      // Notify parent that database is ready
      onDatabaseLoaded({
        fileName: file.name,
        tables,
        fileSize: file.size
      });
    } catch (err) {
      console.error('Database load error:', err);
      // Provide clearer error messages
      let errorMessage = err.message || 'Failed to load database';
      if (errorMessage.includes('not a database') || errorMessage.includes('file is not a database')) {
        errorMessage = 'This file is not a valid SQLite database. Please select a .db or .sqlite file.';
      } else if (errorMessage.includes('initSqlJs')) {
        errorMessage = 'Failed to initialize SQL engine. Please refresh the page and try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [onDatabaseLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  return (
    <div className="min-h-screen bg-hmi-bg flex flex-col">
      {/* Top Bar: Facilis (left) - SureBeam (right) */}
      <header className="h-20 bg-hmi-surface border-b border-hmi-border flex items-center justify-between px-6">
        <img
          src="./WhiteTextIconBlackBackground.png"
          alt="Facilis"
          className="h-12 w-auto"
        />
        <img
          src="./surebeam-logo.jpg"
          alt="SureBeam"
          className="h-12 w-auto rounded"
        />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-hmi-text mb-2">SureBeam Analytics</h1>
          <p className="text-hmi-muted">
            E-Beam Processing Database Explorer - Upload SureTrack.db to analyze
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${isDragOver
              ? 'border-hmi-normal bg-hmi-normal/10'
              : 'border-hmi-border hover:border-hmi-normal/50 hover:bg-hmi-surface'
            }
            ${loading ? 'pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !loading && document.getElementById('db-file-input')?.click()}
        >
          <input
            id="db-file-input"
            type="file"
            accept=".db,.sqlite,.sqlite3,.db3"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading}
          />

          {loading ? (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-hmi-normal animate-spin" />
              <div>
                <p className="text-lg font-medium text-hmi-text">Loading Database</p>
                <p className="text-sm text-hmi-muted mt-1">{loadingMessage}</p>
              </div>
              <div className="w-48 mx-auto h-2 bg-hmi-border rounded-full overflow-hidden">
                <div className="h-full bg-hmi-normal animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          ) : (
            <>
              <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragOver ? 'text-hmi-normal' : 'text-hmi-muted'}`} />
              <p className="text-lg font-medium text-hmi-text mb-2">
                Drop your database file here
              </p>
              <p className="text-sm text-hmi-muted mb-4">
                or click to browse
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-hmi-muted">
                <HardDrive className="w-4 h-4" />
                <span>Supported: .db, .sqlite, .sqlite3, .db3</span>
              </div>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-hmi-alarm/10 border border-hmi-alarm/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-hmi-alarm flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-hmi-alarm">Failed to load database</p>
              <p className="text-sm text-hmi-alarm/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Auto-load failed notice */}
        {autoLoadFailed && (
          <div className="mt-4 bg-hmi-warning/10 border border-hmi-warning/30 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-hmi-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-hmi-warning">Default database not found</p>
              <p className="text-sm text-hmi-warning/80 mt-1">
                Please upload SureTrack.db manually using the upload zone above.
              </p>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-8 bg-hmi-surface rounded-xl border border-hmi-border p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-hmi-normal flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-hmi-text">How it works</p>
              <ul className="text-hmi-muted space-y-1 list-disc list-inside">
                <li>Your database file is processed entirely in your browser</li>
                <li>No data is uploaded to any server</li>
                <li>Browse tables, view data, and run SQL queries</li>
                <li>Works offline once the page is loaded</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-hmi-surface rounded-lg border border-hmi-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-hmi-good/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-hmi-good" />
            </div>
            <p className="text-sm font-medium text-hmi-text">Table Browser</p>
            <p className="text-xs text-hmi-muted mt-1">View all tables and schemas</p>
          </div>
          <div className="bg-hmi-surface rounded-lg border border-hmi-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-hmi-warning/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-hmi-warning" />
            </div>
            <p className="text-sm font-medium text-hmi-text">Data Grid</p>
            <p className="text-xs text-hmi-muted mt-1">Browse data with pagination</p>
          </div>
          <div className="bg-hmi-surface rounded-lg border border-hmi-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-hmi-normal/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-hmi-normal" />
            </div>
            <p className="text-sm font-medium text-hmi-text">SQL Queries</p>
            <p className="text-xs text-hmi-muted mt-1">Run custom SELECT queries</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default DatabaseUpload;
