// Cache Service - Stores computed data in localStorage for instant loading
// Also tracks changes between old and new data for dev mode highlighting

const CACHE_KEY = 'surebeam_data_cache';
const CACHE_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class CacheService {
  constructor() {
    this.lastFreshData = null;
    this.changes = null;
  }

  // Save computed data to cache
  save(data) {
    try {
      const cacheEntry = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: {
          summary: data.summary,
          surebeamStats: data.surebeamStats,
          doseData: data.doseData,
          throughputData: data.throughputData
        }
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
      this.lastFreshData = cacheEntry.data;
      console.log('[Cache] Data saved to cache');
    } catch (err) {
      console.warn('[Cache] Failed to save:', err.message);
    }
  }

  // Load cached data (returns null if not available or expired)
  load() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const entry = JSON.parse(raw);

      // Check version
      if (entry.version !== CACHE_VERSION) {
        console.log('[Cache] Version mismatch, clearing cache');
        this.clear();
        return null;
      }

      // Check TTL
      const age = Date.now() - entry.timestamp;
      if (age > CACHE_TTL) {
        console.log('[Cache] Cache expired');
        return null;
      }

      console.log(`[Cache] Loaded cached data (${Math.round(age / 1000 / 60)} minutes old)`);
      return {
        ...entry.data,
        isCached: true,
        cacheAge: age,
        cacheTimestamp: entry.timestamp
      };
    } catch (err) {
      console.warn('[Cache] Failed to load:', err.message);
      return null;
    }
  }

  // Clear the cache
  clear() {
    localStorage.removeItem(CACHE_KEY);
    this.lastFreshData = null;
    this.changes = null;
  }

  // Compare old (cached) data with new (fresh) data and identify changes
  compareData(oldData, newData) {
    if (!oldData || !newData) return null;

    const changes = {
      hasChanges: false,
      summary: {},
      stats: {},
      details: []
    };

    // Compare summary values
    if (oldData.summary && newData.summary) {
      const summaryFields = ['tableCount', 'totalRows', 'totalColumns', 'relationshipCount'];
      for (const field of summaryFields) {
        const oldVal = oldData.summary[field];
        const newVal = newData.summary[field];
        if (oldVal !== newVal) {
          changes.hasChanges = true;
          changes.summary[field] = {
            old: oldVal,
            new: newVal,
            diff: typeof newVal === 'number' ? newVal - oldVal : null
          };
          changes.details.push({
            type: 'summary',
            field,
            old: oldVal,
            new: newVal,
            message: `${field}: ${oldVal} → ${newVal}`
          });
        }
      }
    }

    // Compare surebeamStats
    if (oldData.surebeamStats && newData.surebeamStats) {
      const statsFields = ['customerCount', 'spsaCount', 'pcnCount', 'lotCount', 'processingCount', 'deviceLogCount'];
      for (const field of statsFields) {
        const oldVal = oldData.surebeamStats[field];
        const newVal = newData.surebeamStats[field];
        if (oldVal !== newVal) {
          changes.hasChanges = true;
          changes.stats[field] = {
            old: oldVal,
            new: newVal,
            diff: newVal - oldVal
          };
          changes.details.push({
            type: 'stats',
            field,
            old: oldVal,
            new: newVal,
            message: `${field}: ${oldVal} → ${newVal} (${newVal > oldVal ? '+' : ''}${newVal - oldVal})`
          });
        }
      }

      // Compare top customers count
      const oldCustomerCount = oldData.surebeamStats.topCustomers?.length || 0;
      const newCustomerCount = newData.surebeamStats.topCustomers?.length || 0;
      if (oldCustomerCount !== newCustomerCount) {
        changes.hasChanges = true;
        changes.details.push({
          type: 'stats',
          field: 'topCustomers',
          old: oldCustomerCount,
          new: newCustomerCount,
          message: `Top customers: ${oldCustomerCount} → ${newCustomerCount}`
        });
      }
    }

    // Compare dose data if available
    if (oldData.doseData && newData.doseData) {
      const doseFields = ['over', 'under', 'optimal', 'total'];
      const oldDose = oldData.doseData.overUnderDose || {};
      const newDose = newData.doseData.overUnderDose || {};

      for (const field of doseFields) {
        const oldVal = oldDose[field];
        const newVal = newDose[field];
        if (oldVal !== newVal) {
          changes.hasChanges = true;
          changes.details.push({
            type: 'dose',
            field,
            old: oldVal,
            new: newVal,
            message: `Dose ${field}: ${oldVal} → ${newVal}`
          });
        }
      }
    }

    this.changes = changes;
    return changes;
  }

  // Get the last computed changes
  getChanges() {
    return this.changes;
  }

  // Check if a specific field has changed
  hasFieldChanged(type, field) {
    if (!this.changes || !this.changes.hasChanges) return false;

    if (type === 'summary') {
      return field in this.changes.summary;
    }
    if (type === 'stats') {
      return field in this.changes.stats;
    }

    return this.changes.details.some(d => d.type === type && d.field === field);
  }

  // Get change info for a specific field
  getFieldChange(type, field) {
    if (!this.changes) return null;

    if (type === 'summary' && this.changes.summary[field]) {
      return this.changes.summary[field];
    }
    if (type === 'stats' && this.changes.stats[field]) {
      return this.changes.stats[field];
    }

    return this.changes.details.find(d => d.type === type && d.field === field);
  }
}

const cacheService = new CacheService();
export default cacheService;
