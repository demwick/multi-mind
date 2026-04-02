import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';

export interface ProjectContext {
  path: string;
  techStack: string[];
  fileCount: number;
  directoryStructure: string;
  packageName?: string;
  packageDescription?: string;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', '__pycache__']);

function countFiles(dir: string): number {
  let count = 0;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return count;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        count += countFiles(fullPath);
      } else {
        count += 1;
      }
    } catch {
      // skip unreadable
    }
  }
  return count;
}

function buildDirectoryStructure(dir: string, depth: number = 0, maxDepth: number = 2): string {
  if (depth > maxDepth) return '';
  const lines: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return '';
  }

  const filtered = entries.filter((e) => !SKIP_DIRS.has(e)).sort();
  for (const entry of filtered) {
    const fullPath = join(dir, entry);
    const indent = '  '.repeat(depth);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        lines.push(`${indent}${entry}/`);
        if (depth < maxDepth) {
          lines.push(buildDirectoryStructure(fullPath, depth + 1, maxDepth));
        }
      } else {
        lines.push(`${indent}${entry}`);
      }
    } catch {
      // skip
    }
  }
  return lines.filter(Boolean).join('\n');
}

function detectTechStack(projectPath: string): string[] {
  const stack: string[] = [];

  // package.json — Node/JS/TS project
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    stack.push('Node.js');
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
      const deps = {
        ...(pkg.dependencies as Record<string, string> | undefined),
        ...(pkg.devDependencies as Record<string, string> | undefined),
      };
      const depNames = Object.keys(deps);

      if (depNames.includes('typescript') || existsSync(join(projectPath, 'tsconfig.json'))) {
        stack.push('TypeScript');
      }
      if (depNames.includes('react') || depNames.includes('react-dom')) stack.push('React');
      if (depNames.includes('next')) stack.push('Next.js');
      if (depNames.includes('vue')) stack.push('Vue.js');
      if (depNames.includes('svelte')) stack.push('Svelte');
      if (depNames.includes('express')) stack.push('Express');
      if (depNames.includes('fastify')) stack.push('Fastify');
      if (depNames.includes('prisma') || depNames.includes('@prisma/client')) stack.push('Prisma');
      if (depNames.includes('graphql')) stack.push('GraphQL');
      if (depNames.includes('vitest') || depNames.includes('jest')) stack.push('Testing (vitest/jest)');
    } catch {
      // unparseable package.json
    }
  }

  // tsconfig.json without package.json
  if (!stack.includes('TypeScript') && existsSync(join(projectPath, 'tsconfig.json'))) {
    stack.push('TypeScript');
  }

  // Python
  if (
    existsSync(join(projectPath, 'requirements.txt')) ||
    existsSync(join(projectPath, 'pyproject.toml')) ||
    existsSync(join(projectPath, 'setup.py'))
  ) {
    stack.push('Python');
  }

  // Go
  if (existsSync(join(projectPath, 'go.mod'))) {
    stack.push('Go');
  }

  // Rust
  if (existsSync(join(projectPath, 'Cargo.toml'))) {
    stack.push('Rust');
  }

  // Java / Maven / Gradle
  if (existsSync(join(projectPath, 'pom.xml'))) stack.push('Java (Maven)');
  if (existsSync(join(projectPath, 'build.gradle')) || existsSync(join(projectPath, 'build.gradle.kts'))) {
    stack.push('Java/Kotlin (Gradle)');
  }

  // Docker
  if (existsSync(join(projectPath, 'Dockerfile')) || existsSync(join(projectPath, 'docker-compose.yml'))) {
    stack.push('Docker');
  }

  // Terraform
  const tfFiles = (() => {
    try {
      return readdirSync(projectPath).some((f) => f.endsWith('.tf'));
    } catch {
      return false;
    }
  })();
  if (tfFiles) stack.push('Terraform');

  return stack.length > 0 ? stack : ['Unknown'];
}

export function loadProjectContext(projectPath: string): ProjectContext {
  const techStack = detectTechStack(projectPath);
  const fileCount = countFiles(projectPath);
  const directoryStructure = buildDirectoryStructure(projectPath, 0, 2);

  let packageName: string | undefined;
  let packageDescription: string | undefined;

  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
      packageName = typeof pkg.name === 'string' ? pkg.name : undefined;
      packageDescription = typeof pkg.description === 'string' ? pkg.description : undefined;
    } catch {
      // ignore
    }
  }

  return {
    path: projectPath,
    techStack,
    fileCount,
    directoryStructure,
    packageName,
    packageDescription,
  };
}

export function projectContextToBrief(ctx: ProjectContext): string {
  const parts: string[] = [];

  parts.push(`Project Analysis Request`);

  if (ctx.packageName) {
    parts.push(`Project: ${ctx.packageName}`);
  } else {
    parts.push(`Project path: ${basename(ctx.path)}`);
  }

  if (ctx.packageDescription) {
    parts.push(`Description: ${ctx.packageDescription}`);
  }

  parts.push(`Tech stack: ${ctx.techStack.join(', ')}`);
  parts.push(`Total files: ${ctx.fileCount}`);
  parts.push(`\nDirectory structure:\n${ctx.directoryStructure}`);

  return parts.join('\n');
}
