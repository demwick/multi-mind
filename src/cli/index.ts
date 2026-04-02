#!/usr/bin/env node
import { Command } from 'commander';
import { makeNewCommand } from './commands/new.js';
import { makeAgentsCommand } from './commands/agents.js';
import { makeRerunCommand } from './commands/rerun.js';
import { makeDebateCommand } from './commands/debate.js';
import { makeDecideCommand } from './commands/decide.js';
import { makeAnalyzeCommand } from './commands/analyze.js';

const program = new Command();

program
  .name('multi-mind')
  .description('Multi-agent decision system powered by Claude')
  .version('0.1.0');

program.addCommand(makeNewCommand());
program.addCommand(makeAgentsCommand());
program.addCommand(makeRerunCommand());
program.addCommand(makeDebateCommand());
program.addCommand(makeDecideCommand());
program.addCommand(makeAnalyzeCommand());

program.parse();
