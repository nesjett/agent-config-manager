import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import { ClaudeHandler } from '../../src/platforms/claude.ts';
import {
  withTempDir,
  writeFixture,
  readFixture,
  fixtureExists,
  createSampleConfig,
} from '../_test_helpers.ts';

Deno.test('ClaudeHandler - detect returns true when .claude dir exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await Deno.mkdir(`${dir}/.claude`);

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('ClaudeHandler - detect returns true when CLAUDE.md exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, 'CLAUDE.md', 'Content');

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('ClaudeHandler - detect returns true when both exist', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await Deno.mkdir(`${dir}/.claude`);
    await writeFixture(dir, 'CLAUDE.md', 'Content');

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('ClaudeHandler - detect returns false when neither exists', async () => {
  await withTempDir(async () => {
    const handler = new ClaudeHandler();
    const result = await handler.detect();
    assertEquals(result, false);
  });
});

Deno.test('ClaudeHandler - export reads CLAUDE.md as instructions', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, 'CLAUDE.md', 'Claude instructions');

    const config = await handler.export();
    assertEquals(config.config.instructions?.length, 1);
    assertEquals(config.config.instructions?.[0], 'Claude instructions');
  });
});

Deno.test('ClaudeHandler - export reads settings.json as context', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const settings = { setting1: 'value1', setting2: 123 };
    await writeFixture(
      dir,
      '.claude/settings.json',
      JSON.stringify(settings)
    );

    const config = await handler.export();
    assert(config.config.context?.settings);
    assertEquals(config.config.context.settings, settings);
  });
});

Deno.test('ClaudeHandler - export handles null from readJsonFile for settings', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, '.claude/settings.json', 'invalid json');

    const config = await handler.export();
    assertEquals(config.config.context, {});
  });
});

Deno.test('ClaudeHandler - export reads mcp.json servers', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const mcpConfig = {
      mcpServers: {
        server1: {
          command: 'npx',
          args: ['-y', 'server1'],
          env: { KEY: 'value' },
        },
      },
    };
    await writeFixture(dir, '.claude/mcp.json', JSON.stringify(mcpConfig));

    const config = await handler.export();
    assertEquals(config.config.mcpServers?.length, 1);
    assertEquals(config.config.mcpServers?.[0].name, 'server1');
  });
});

Deno.test('ClaudeHandler - export handles mcp.json without mcpServers', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, '.claude/mcp.json', JSON.stringify({}));

    const config = await handler.export();
    assertEquals(config.config.mcpServers, undefined);
  });
});

Deno.test('ClaudeHandler - export reads commands/*.md as skills', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, '.claude/commands/test.md', 'Test command');

    const config = await handler.export();
    assertEquals(config.config.skills?.length, 1);
    assertEquals(config.config.skills?.[0].name, 'test');
    assertEquals(config.config.skills?.[0].command, '/test');
    assertEquals(config.config.skills?.[0].content, 'Test command');
  });
});

Deno.test('ClaudeHandler - export skips non-.md files in commands', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, '.claude/commands/readme.txt', 'Not a command');
    await writeFixture(dir, '.claude/commands/test.md', 'Command');

    const config = await handler.export();
    assertEquals(config.config.skills?.length, 1);
    assertEquals(config.config.skills?.[0].name, 'test');
  });
});

Deno.test('ClaudeHandler - export handles commands dir read error', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, '.claude/commands', 'not a directory');

    const config = await handler.export();
    assertEquals(config.config.skills?.length, 0);
  });
});

Deno.test('ClaudeHandler - export returns empty when nothing present', async () => {
  await withTempDir(async () => {
    const handler = new ClaudeHandler();
    const config = await handler.export();

    assertEquals(config.config.instructions?.length, 0);
    assertEquals(config.config.skills?.length, 0);
  });
});

Deno.test('ClaudeHandler - import writes instructions to CLAUDE.md (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: { instructions: ['Instruction 1', 'Instruction 2'] },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, 'CLAUDE.md');
    assertEquals(content, 'Instruction 1\n\nInstruction 2');
  });
});

Deno.test('ClaudeHandler - import writes instructions to CLAUDE.md (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, 'CLAUDE.md', 'Existing content');

    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, 'CLAUDE.md');
    assertEquals(content, 'Existing content\n\n---\n\nNew instruction');
  });
});

Deno.test('ClaudeHandler - import merge instructions with no existing file', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, 'CLAUDE.md');
    assertEquals(content, 'New instruction');
  });
});

Deno.test('ClaudeHandler - import writes MCP servers (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, '.claude/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('ClaudeHandler - import writes MCP servers (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const existing = {
      mcpServers: {
        existing: { command: 'old', args: [] },
      },
    };
    await writeFixture(dir, '.claude/mcp.json', JSON.stringify(existing));

    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.claude/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.existing);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('ClaudeHandler - import merge MCP with null readJsonFile', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, '.claude/mcp.json', 'invalid json');

    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.claude/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('ClaudeHandler - import creates skills as commands/*.md', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Skill content', description: 'Desc' },
        ],
      },
    });

    await handler.import(config);

    const exists = await fixtureExists(dir, '.claude/commands/skill1.md');
    assertEquals(exists, true);

    const content = await readFixture(dir, '.claude/commands/skill1.md');
    assertStringIncludes(content, '# skill1');
    assertStringIncludes(content, 'Desc');
    assertStringIncludes(content, 'Skill content');
  });
});

Deno.test('ClaudeHandler - import skills with description', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content', description: 'Description' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.claude/commands/skill1.md');
    assertStringIncludes(content, '# skill1');
    assertStringIncludes(content, 'Description');
  });
});

Deno.test('ClaudeHandler - import skills without description', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        skills: [{ name: 'skill1', content: 'Content' }],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.claude/commands/skill1.md');
    assertEquals(content, 'Content');
  });
});

Deno.test('ClaudeHandler - import writes rules to CLAUDE.md', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        rules: [
          { name: 'rule1', content: 'Rule 1 content', enabled: true },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, 'CLAUDE.md');
    // When no existing file, rules are written without ## Rules header
    assertStringIncludes(content, '### rule1');
    assertStringIncludes(content, 'Rule 1 content');
  });
});

Deno.test('ClaudeHandler - import imports enabled rules only', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        rules: [
          { name: 'enabled', content: 'Enabled', enabled: true },
          { name: 'disabled', content: 'Disabled', enabled: false },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, 'CLAUDE.md');
    assertStringIncludes(content, 'enabled');
    assert(!content.includes('disabled'));
  });
});

Deno.test('ClaudeHandler - import rules appended to existing CLAUDE.md', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    await writeFixture(dir, 'CLAUDE.md', 'Existing content');

    const config = createSampleConfig({
      config: {
        rules: [
          { name: 'rule1', content: 'Rule content', enabled: true },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, 'CLAUDE.md');
    assertStringIncludes(content, 'Existing content');
    assertStringIncludes(content, '## Rules');
    assertStringIncludes(content, '### rule1');
  });
});

Deno.test('ClaudeHandler - import rules with no existing CLAUDE.md', async () => {
  await withTempDir(async (dir) => {
    const handler = new ClaudeHandler();
    const config = createSampleConfig({
      config: {
        instructions: [],
        rules: [
          { name: 'rule1', content: 'Rule content', enabled: true },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, 'CLAUDE.md');
    assertStringIncludes(content, '### rule1');
    assertStringIncludes(content, 'Rule content');
  });
});
