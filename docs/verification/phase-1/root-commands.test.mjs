import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// Run separately from pnpm test: these tests deliberately invoke failing root commands.
// Only synthetic probe files are created; existing source is never overwritten.
const root = process.cwd();
const logs = path.join(root, '.verification', 'command-probes');
mkdirSync(logs, { recursive: true });

function run(command) {
  return spawnSync(`pnpm ${command}`, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    timeout: 180_000,
  });
}

for (const workspace of ['frontend', 'backend']) {
  for (const command of ['lint', 'typecheck', 'format:check', 'build', 'test']) {
    test(`${command} rejects a ${workspace} failure at the root`, () => {
      const filename = command === 'test' ? '__setup_gate_probe__.spec.ts' : '__setup_gate_probe__.ts';
      const directory = command === 'test' ? (workspace === 'backend' ? 'tests/unit' : 'tests') : 'src';
      const probe = path.join(root, workspace, directory, filename);
      assert.equal(existsSync(probe), false, 'Refuse to overwrite an existing probe');
      const contents = {
        lint: 'const unusedSetupProbe = 1;\nexport {};\n',
        typecheck: "export const setupProbe: number = 'invalid';\n",
        'format:check': 'export const setupProbe={value:1}\n',
        build: 'export const setupProbe = ;\n',
        test:
          workspace === 'frontend'
            ? "import { test, expect } from 'vitest';\ntest('synthetic gate failure', () => expect(true).toBe(false));\n"
            : "test('synthetic gate failure', () => expect(true).toBe(false));\n",
      };
      writeFileSync(probe, contents[command]);
      try {
        const result = run(command);
        const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
        writeFileSync(
          path.join(logs, `${workspace}-${command.replace(':', '-')}.log`),
          output,
        );
        assert.equal(result.error, undefined, 'The command must finish, not time out');
        assert.notEqual(result.status, null, 'The command must return an exit code');
        assert.notEqual(result.status, 0, 'Root command must propagate workspace failure');
        assert.ok(output.includes(filename), 'Command output must identify the injected probe');
      } finally {
        unlinkSync(probe);
      }
    });
  }
}
