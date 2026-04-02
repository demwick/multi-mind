import { stderr } from 'process';

const SPINNERS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface AgentStatus {
  status: 'running' | 'done' | 'error';
  text: string;
}

export class MultiProgress {
  private lines: Map<string, AgentStatus>;
  private spinnerIndex: number;
  private intervalId: NodeJS.Timeout | null;
  private maxLines: number;

  constructor() {
    this.lines = new Map();
    this.spinnerIndex = 0;
    this.intervalId = null;
    this.maxLines = 0;
  }

  /**
   * Start tracking an agent
   */
  start(id: string, text: string): void {
    this.lines.set(id, { status: 'running', text });
    this.render();
    this.startAnimation();
  }

  /**
   * Mark as complete
   */
  succeed(id: string, text: string): void {
    this.lines.set(id, { status: 'done', text });
    this.render();
  }

  /**
   * Mark as error
   */
  fail(id: string, text: string): void {
    this.lines.set(id, { status: 'error', text });
    this.render();
  }

  /**
   * Clear and stop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.lines.clear();
    this.maxLines = 0;
    this.clearLines(this.maxLines);
  }

  /**
   * Update a line's text (for progress updates)
   */
  update(id: string, text: string): void {
    const existing = this.lines.get(id);
    if (existing) {
      existing.text = text;
      this.render();
    }
  }

  private startAnimation(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % SPINNERS.length;
      this.render();
    }, 80);
  }

  private render(): void {
    // Count active agents
    const activeCount = Array.from(this.lines.values()).filter((s) => s.status === 'running').length;

    // Only use multi-line mode if 2+ agents
    if (activeCount < 2) {
      return;
    }

    // Move cursor up to overwrite previous lines
    if (this.maxLines > 0) {
      stderr.write(`\x1b[${this.maxLines}A`);
    }

    let output = '';
    let lineCount = 0;

    for (const [, status] of this.lines) {
      const prefix = this.getPrefix(status);
      output += `  ${prefix} ${status.text}\n`;
      lineCount++;
    }

    stderr.write(output);

    // Clear any extra lines if count decreased
    for (let i = lineCount; i < this.maxLines; i++) {
      stderr.write('\x1b[2K\n');
    }

    this.maxLines = lineCount;
  }

  private getPrefix(status: AgentStatus): string {
    switch (status.status) {
      case 'running':
        return SPINNERS[this.spinnerIndex];
      case 'done':
        return '✓';
      case 'error':
        return '✗';
    }
  }

  private clearLines(count: number): void {
    if (count === 0) return;

    stderr.write(`\x1b[${count}A`);
    for (let i = 0; i < count; i++) {
      stderr.write('\x1b[2K\n');
    }
  }
}
