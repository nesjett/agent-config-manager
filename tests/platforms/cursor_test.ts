import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { CursorHandler } from '../../src/platforms/cursor.ts';
import {
  createSampleConfig,
  fixtureExists,
  readFixture,
  withTempDir,
  writeFixture,
} from '../_test_helpers.ts';

Deno.test('CursorHandler - detect returns true when .cursor dir exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await Deno.mkdir(`${dir}/.cursor`);

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('CursorHandler - detect returns false when .cursor missing', async () => {
  await withTempDir(async () => {
    const handler = new CursorHandler();
    const result = await handler.detect();
    assertEquals(result, false);
  });
});

Deno.test('CursorHandler - export reads rules from .cursor/rules/*.mdc', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule content');

    const config = await handler.export();
    assertEquals(config.config.rules?.length, 1);
    assertEquals(config.config.rules?.[0].name, 'test');
    assertEquals(config.config.rules?.[0].content, 'Test rule content');
    assertEquals(config.config.rules?.[0].enabled, true);
  });
});

Deno.test('CursorHandler - export skips non-.mdc files in rules dir', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await writeFixture(dir, '.cursor/rules/readme.txt', 'Not a rule');
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Rule content');

    const config = await handler.export();
    assertEquals(config.config.rules?.length, 1);
    assertEquals(config.config.rules?.[0].name, 'test');
  });
});

Deno.test('CursorHandler - export handles rules dir read error', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    // Create .cursor/rules as a file instead of directory
    await writeFixture(dir, '.cursor/rules', 'not a directory');

    const config = await handler.export();
    assertEquals(config.config.rules?.length, 0);
  });
});

Deno.test('CursorHandler - export reads .cursorrules as instructions', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await writeFixture(dir, '.cursorrules', 'Legacy rules content');

    const config = await handler.export();
    assertEquals(config.config.instructions?.length, 1);
    assertEquals(config.config.instructions?.[0], 'Legacy rules content');
  });
});

Deno.test('CursorHandler - export reads MCP servers from mcp.json', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const mcpConfig = {
      mcpServers: {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { TEST: 'value' },
        },
      },
    };
    await writeFixture(dir, '.cursor/mcp.json', JSON.stringify(mcpConfig));

    const config = await handler.export();
    assertEquals(config.config.mcpServers?.length, 1);
    assertEquals(config.config.mcpServers?.[0].name, 'filesystem');
    assertEquals(config.config.mcpServers?.[0].command, 'npx');
    assertEquals(config.config.mcpServers?.[0].env, { TEST: 'value' });
  });
});

Deno.test('CursorHandler - export handles mcp.json without mcpServers key', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await writeFixture(dir, '.cursor/mcp.json', JSON.stringify({}));

    const config = await handler.export();
    assertEquals(config.config.mcpServers, undefined);
  });
});

Deno.test('CursorHandler - export returns empty config when nothing present', async () => {
  await withTempDir(async () => {
    const handler = new CursorHandler();
    const config = await handler.export();

    assertEquals(config.config.rules?.length, 0);
    assertEquals(config.config.instructions?.length, 0);
  });
});

Deno.test('CursorHandler - export handles missing rules dir', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await Deno.mkdir(`${dir}/.cursor`);

    const config = await handler.export();
    assertEquals(config.config.rules?.length, 0);
  });
});

Deno.test('CursorHandler - import creates rules as .mdc files', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: {
        rules: [
          { name: 'rule1', content: 'Rule 1 content', enabled: true },
          { name: 'rule2', content: 'Rule 2 content', enabled: true },
        ],
      },
    });

    await handler.import(config);

    const rule1 = await readFixture(dir, '.cursor/rules/rule1.mdc');
    const rule2 = await readFixture(dir, '.cursor/rules/rule2.mdc');
    assertEquals(rule1, 'Rule 1 content');
    assertEquals(rule2, 'Rule 2 content');
  });
});

Deno.test('CursorHandler - import skips rules when empty', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: { rules: [] },
    });

    await handler.import(config);

    const exists = await fixtureExists(dir, '.cursor/rules/rule1.mdc');
    assertEquals(exists, false);
  });
});

Deno.test('CursorHandler - import writes instructions to .cursorrules (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: { instructions: ['Instruction 1', 'Instruction 2'] },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, '.cursorrules');
    assertEquals(content, 'Instruction 1\n\nInstruction 2');
  });
});

Deno.test('CursorHandler - import writes instructions to .cursorrules (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await writeFixture(dir, '.cursorrules', 'Existing content');

    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.cursorrules');
    assertEquals(content, 'Existing content\n\nNew instruction');
  });
});

Deno.test('CursorHandler - import merge with no existing .cursorrules', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.cursorrules');
    assertEquals(content, 'New instruction');
  });
});

Deno.test('CursorHandler - import writes MCP servers (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, '.cursor/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.server1);
    assertEquals(parsed.mcpServers.server1.command, 'npx');
  });
});

Deno.test('CursorHandler - import writes MCP servers (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const existing = {
      mcpServers: {
        existing: { command: 'old', args: [] },
      },
    };
    await writeFixture(dir, '.cursor/mcp.json', JSON.stringify(existing));

    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.cursor/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.existing);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('CursorHandler - import merge MCP when readJsonFile returns null', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    await writeFixture(dir, '.cursor/mcp.json', 'invalid json');

    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.cursor/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('CursorHandler - import creates skills as _skills.mdc', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Skill 1 content', description: 'Desc 1' },
        ],
      },
    });

    await handler.import(config);

    const exists = await fixtureExists(dir, '.cursor/rules/_skills.mdc');
    assertEquals(exists, true);

    const content = await readFixture(dir, '.cursor/rules/_skills.mdc');
    assertStringIncludes(content, '## skill1');
    assertStringIncludes(content, 'Desc 1');
    assertStringIncludes(content, 'Skill 1 content');
  });
});

Deno.test('CursorHandler - import skips skills when empty', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: { skills: [] },
    });

    await handler.import(config);

    const exists = await fixtureExists(dir, '.cursor/rules/_skills.mdc');
    assertEquals(exists, false);
  });
});

Deno.test('CursorHandler - formatSkillsAsRules includes description when present', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content', description: 'Description' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.cursor/rules/_skills.mdc');
    assertStringIncludes(content, 'Description');
  });
});

Deno.test('CursorHandler - formatSkillsAsRules omits description when missing', async () => {
  await withTempDir(async (dir) => {
    const handler = new CursorHandler();
    const config = createSampleConfig({
      config: {
        skills: [{ name: 'skill1', content: 'Content' }],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.cursor/rules/_skills.mdc');
    assertStringIncludes(content, '## skill1');
    assertStringIncludes(content, 'Content');
    // Check that content structure is correct (no extra blank description line)
    assert(!content.includes('## skill1\nundefined'));
  });
});
