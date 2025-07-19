// Performance monitoring utilities
interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private activeTimers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();
    
    this.activeTimers.set(id, startTime);
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push({
      name,
      startTime,
      metadata,
    });
    
    return id;
  }

  /**
   * End timing an operation
   */
  endTimer(id: string): number | null {
    const startTime = this.activeTimers.get(id);
    if (!startTime) {
      console.warn(`Performance timer ${id} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.activeTimers.delete(id);
    
    // Find and update the metric
    for (const [, metricsList] of this.metrics.entries()) {
      const metric = metricsList.find(m => m.startTime === startTime);
      if (metric) {
        metric.endTime = endTime;
        metric.duration = duration;
        break;
      }
    }
    
    return duration;
  }

  /**
   * Time a function execution
   */
  async timeAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const id = this.startTimer(name, metadata);
    try {
      const result = await fn();
      this.endTimer(id);
      return result;
    } catch (error) {
      this.endTimer(id);
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  time<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const id = this.startTimer(name, metadata);
    try {
      const result = fn();
      this.endTimer(id);
      return result;
    } catch (error) {
      this.endTimer(id);
      throw error;
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    if (durations.length === 0) {
      return null;
    }

    const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    const averageTime = totalTime / durations.length;
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);

    return {
      count: durations.length,
      totalTime,
      averageTime,
      minTime,
      maxTime,
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};
    
    for (const name of this.metrics.keys()) {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    }
    
    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  /**
   * Get recent slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number = 1000): PerformanceMetrics[] {
    const slowOps: PerformanceMetrics[] = [];
    
    for (const metricsList of this.metrics.values()) {
      for (const metric of metricsList) {
        if (metric.duration && metric.duration > thresholdMs) {
          slowOps.push(metric);
        }
      }
    }
    
    return slowOps.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const stats = this.getAllStats();
    
    console.group('🚀 Performance Summary');
    for (const [name, stat] of Object.entries(stats)) {
      console.log(`${name}:`, {
        count: stat.count,
        avg: `${stat.averageTime.toFixed(2)}ms`,
        min: `${stat.minTime.toFixed(2)}ms`,
        max: `${stat.maxTime.toFixed(2)}ms`,
        total: `${stat.totalTime.toFixed(2)}ms`,
      });
    }
    console.groupEnd();
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (name: string, metadata?: Record<string, any>) => 
  perfMonitor.startTimer(name, metadata);

export const endTimer = (id: string) => perfMonitor.endTimer(id);

export const timeAsync = <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>) =>
  perfMonitor.timeAsync(name, fn, metadata);

export const time = <T>(name: string, fn: () => T, metadata?: Record<string, any>) =>
  perfMonitor.time(name, fn, metadata);

// Browser-specific performance monitoring
if (typeof window !== 'undefined') {
  // Monitor page load performance
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    console.log('📊 Page Load Performance:', {
      domContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
      loadComplete: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
      totalLoadTime: `${navigation.loadEventEnd - navigation.fetchStart}ms`,
    });
  });

  // Monitor resource loading
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) { // Log slow resources (>1s)
        console.warn('🐌 Slow Resource:', entry.name, `${entry.duration.toFixed(2)}ms`);
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
}