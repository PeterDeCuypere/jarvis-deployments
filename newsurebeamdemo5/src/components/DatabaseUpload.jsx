import { useState, useCallback, useEffect } from 'react';
import { Upload, Database, AlertCircle, Info, Shield, Target, Gauge, Users, Wrench, Settings, DollarSign } from 'lucide-react';
import databaseService from '../services/databaseService';

// Import logos from src/assets - Vite bundles these with proper hashed filenames
import facilisLogo from '../assets/WhiteTextIconBlackBackground.png';
import surebeamLogo from '../assets/surebeam-logo.jpg';

// Default database path in public/data folder
const DEFAULT_DATABASE_URL = './data/SureTrack.db';
const DEFAULT_DATABASE_NAME = 'SureTrack.db';

function DatabaseUpload({ onDatabaseLoaded }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true for auto-load
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing e-beam processing data...');
  const [autoLoadFailed, setAutoLoadFailed] = useState(false);

  // Auto-load default database on component mount
  useEffect(() => {
    let cancelled = false;

    async function loadDefaultDatabase() {
      try {
        setLoadingMessage('Initializing SQL engine...');
        await databaseService.init();

        if (cancelled) return;

        setLoadingMessage('Analyzing e-beam processing data...');
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
      <header className="h-20 bg-black border-b border-hmi-border flex items-center justify-between px-6">
        <img
          src={facilisLogo}
          alt="Facilis"
          className="h-12 w-auto"
        />
        <div className="bg-black rounded p-1">
          <img
            src={surebeamLogo}
            alt="SureBeam"
            className="h-12 w-auto"
            style={{ filter: 'invert(1) hue-rotate(180deg)' }}
          />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-hmi-text mb-2">SureBeam Analytics</h1>
            <p className="text-hmi-muted">
              E-Beam Processing Intelligence - {loading ? 'Analyzing SureTrack.db' : 'Upload SureTrack.db to analyze'}
            </p>
          </div>

          {/* Main Loading/Upload Section */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border p-8 mb-6">
            {loading ? (
              <div className="flex flex-col items-center gap-5">
                {/* Loading Icon with Spinner */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-hmi-bg flex items-center justify-center">
                    <Database className="w-8 h-8 text-hmi-normal" />
                  </div>
                  <div className="absolute inset-[-4px] border-2 border-transparent border-t-hmi-normal rounded-full animate-spin"></div>
                </div>

                {/* Loading Text */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-hmi-text">Loading SureTrack.db</p>
                  <p className="text-sm text-hmi-muted mt-1">{loadingMessage}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm">
                  <div className="h-1.5 bg-hmi-bg rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full animate-pulse"
                      style={{
                        width: '65%',
                        background: 'linear-gradient(to right, #5eadb4, #6b9ac4)'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-2 text-hmi-good">
                      <span className="w-2 h-2 rounded-full bg-hmi-good"></span>
                      <span>Database</span>
                    </div>
                    <div className="flex items-center gap-2 text-hmi-normal">
                      <span className="w-2 h-2 rounded-full bg-hmi-normal animate-pulse"></span>
                      <span>Optimization Engines</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                {/* Upload Icon */}
                <div className="w-16 h-16 rounded-2xl bg-hmi-bg flex items-center justify-center">
                  <Upload className={`w-8 h-8 ${isDragOver ? 'text-hmi-normal' : 'text-hmi-muted'}`} />
                </div>

                {/* Upload Text */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-hmi-text">Upload Database</p>
                  <p className="text-sm text-hmi-muted mt-1">Drop your database file here or click to browse</p>
                </div>
              </div>
            )}

            {/* Fallback Upload Zone */}
            <div className="mt-6 pt-6 border-t border-hmi-border">
              <p className="text-xs text-hmi-muted text-center mb-3">
                {loading ? 'Having trouble loading? You can manually upload the database file:' : 'Select your SureTrack database file:'}
              </p>
              <div
                className={`
                  border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all
                  ${isDragOver
                    ? 'border-hmi-normal bg-hmi-normal/10'
                    : 'border-hmi-border hover:border-hmi-normal hover:bg-hmi-normal/5'
                  }
                  ${loading ? '' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('db-file-input')?.click()}
              >
                <input
                  id="db-file-input"
                  type="file"
                  accept=".db,.sqlite,.sqlite3,.db3"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3 text-hmi-muted text-sm">
                  <Upload className="w-5 h-5" />
                  <span>Drop SureTrack.db here or click to browse</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-hmi-alarm/10 border border-hmi-alarm/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-hmi-alarm flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-hmi-alarm">Failed to load database</p>
                <p className="text-sm text-hmi-alarm/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Auto-load failed notice */}
          {autoLoadFailed && (
            <div className="mb-6 bg-hmi-warning/10 border border-hmi-warning/30 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-hmi-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-hmi-warning">Default database not found</p>
                <p className="text-sm text-hmi-warning/80 mt-1">
                  Please upload SureTrack.db manually using the upload zone above.
                </p>
              </div>
            </div>
          )}

          {/* Optimization Modules Section - Only show during loading */}
          {loading && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-hmi-muted uppercase tracking-wider text-center mb-4">
                Initializing Optimization Modules
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Dose Uniformity */}
                <div
                  className="bg-hmi-surface rounded-lg border border-hmi-border p-4 flex items-center gap-3"
                  style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: '0.1s', opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-hmi-good/15 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-hmi-good" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hmi-text truncate">Dose Uniformity</p>
                    <p className="text-xs text-hmi-muted">Initializing...</p>
                  </div>
                </div>

                {/* Throughput */}
                <div
                  className="bg-hmi-surface rounded-lg border border-hmi-border p-4 flex items-center gap-3"
                  style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: '0.2s', opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-hmi-normal/15 flex items-center justify-center flex-shrink-0">
                    <Gauge className="w-5 h-5 text-hmi-normal" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hmi-text truncate">Throughput</p>
                    <p className="text-xs text-hmi-muted">Initializing...</p>
                  </div>
                </div>

                {/* Customer Profiles */}
                <div
                  className="bg-hmi-surface rounded-lg border border-hmi-border p-4 flex items-center gap-3"
                  style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: '0.3s', opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-hmi-info/15 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-hmi-info" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hmi-text truncate">Customer Profiles</p>
                    <p className="text-xs text-hmi-muted">Initializing...</p>
                  </div>
                </div>

                {/* Maintenance */}
                <div
                  className="bg-hmi-surface rounded-lg border border-hmi-border p-4 flex items-center gap-3"
                  style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: '0.4s', opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-hmi-warning/15 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-hmi-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hmi-text truncate">Maintenance</p>
                    <p className="text-xs text-hmi-muted">Initializing...</p>
                  </div>
                </div>

                {/* Parameters */}
                <div
                  className="bg-hmi-surface rounded-lg border border-hmi-border p-4 flex items-center gap-3"
                  style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: '0.5s', opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-hmi-accent/15 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-hmi-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hmi-text truncate">Parameters</p>
                    <p className="text-xs text-hmi-muted">Initializing...</p>
                  </div>
                </div>

                {/* Energy Costs */}
                <div
                  className="bg-hmi-surface rounded-lg border border-hmi-border p-4 flex items-center gap-3"
                  style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: '0.6s', opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-hmi-highlight/15 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-hmi-highlight" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hmi-text truncate">Energy Costs</p>
                    <p className="text-xs text-hmi-muted">Initializing...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-hmi-bg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-hmi-muted" />
                </div>
                <div className="text-xs text-hmi-muted">
                  <span className="text-hmi-text font-medium">Automatic Loading</span><br />
                  SureTrack.db loads automatically from the system
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-hmi-bg flex items-center justify-center flex-shrink-0">
                  <Upload className="w-4 h-4 text-hmi-muted" />
                </div>
                <div className="text-xs text-hmi-muted">
                  <span className="text-hmi-text font-medium">Manual Upload</span><br />
                  Upload manually if automatic loading fails
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-hmi-bg flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-hmi-muted" />
                </div>
                <div className="text-xs text-hmi-muted">
                  <span className="text-hmi-text font-medium">AI-Powered Analysis</span><br />
                  Intelligent optimization recommendations
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-hmi-bg flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-hmi-muted" />
                </div>
                <div className="text-xs text-hmi-muted">
                  <span className="text-hmi-text font-medium">Privacy First</span><br />
                  All processing happens locally in your browser
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default DatabaseUpload;
