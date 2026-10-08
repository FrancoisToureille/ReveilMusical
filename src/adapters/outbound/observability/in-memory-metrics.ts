import { Metrics } from '../../../domain/ports';

export class InMemoryMetrics implements Metrics {
  private readonly counters = new Map<string, number>();

  increment(name: string): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + 1);
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}
