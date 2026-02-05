import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import { WindsurfHandler } from '../../src/platforms/windsurf.ts';
import {
  withTempDir,
  writeFixture,
  readFixture,
  fixtureExists,
  createSampleConfig,
} from '../_test_helpers.ts';

Deno.test('WindsurfHandler - detect returns true when .windsurfrules exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurfrules', 'Content');

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('WindsurfHandler - detect returns true when .windsurf dir exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await Deno.mkdir(`${dir}/.windsurf`);

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('WindsurfHandler - detect returns true when both exist', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurfrules', 'Content');
    await Deno.mkdir(`${dir}/.windsurf`);

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('WindsurfHandler - detect returns false when neither exists', async () => {
  await withTempDir(async () => {
    const handler = new WindsurfHandler();
    const result = await handler.detect();
    assertEquals(result, false);
  });
});

Deno.test('WindsurfHandler - export reads .windsurfrules as instructions', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurfrules', 'Windsurf instructions');

    const config = await handler.export();
    assertEquals(config.config.instructions?.length, 1);
    assertEquals(config.config.instructions?.[0], 'Windsurf instructions');
  });
});

Deno.test('WindsurfHandler - export reads cascade.json as context', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const cascade = { config1: 'value1', config2: 123 };
    await writeFixture(
      dir,
      '.windsurf/cascade.json',
      JSON.stringify(cascade)
    );

    const config = await handler.export();
    assert(config.config.context?.cascade);
    assertEquals(config.config.context.cascade, cascade);
  });
});

Deno.test('WindsurfHandler - export handles null cascade.json', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurf/cascade.json', 'invalid json');

    const config = await handler.export();
    assertEquals(config.config.context, {});
  });
});

Deno.test('WindsurfHandler - export reads mcp.json', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const mcpConfig = {
      mcpServers: {
        server1: {
          command: 'npx',
          args: ['-y', 'server1'],
          env: { KEY: 'value' },
        },
      },
    };
    await writeFixture(dir, '.windsurf/mcp.json', JSON.stringify(mcpConfig));

    const config = await handler.export();
    assertEquals(config.config.mcpServers?.length, 1);
    assertEquals(config.config.mcpServers?.[0].name, 'server1');
  });
});

Deno.test('WindsurfHandler - export handles mcp.json without mcpServers', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurf/mcp.json', JSON.stringify({}));

    const config = await handler.export();
    assertEquals(config.config.mcpServers, undefined);
  });
});

Deno.test('WindsurfHandler - export returns empty when nothing present', async () => {
  await withTempDir(async () => {
    const handler = new WindsurfHandler();
    const config = await handler.export();

    assertEquals(config.config.instructions?.length, 0);
  });
});

Deno.test('WindsurfHandler - import writes instructions to .windsurfrules (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: { instructions: ['Instruction 1', 'Instruction 2'] },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, '.windsurfrules');
    assertEquals(content, 'Instruction 1\n\nInstruction 2');
  });
});

Deno.test('WindsurfHandler - import writes instructions (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurfrules', 'Existing content');

    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.windsurfrules');
    assertEquals(content, 'Existing content\n\n---\n\nNew instruction');
  });
});

Deno.test('WindsurfHandler - import adds rules section', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        instructions: ['Instructions'],
        rules: [
          { name: 'rule1', content: 'Rule content', enabled: true },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.windsurfrules');
    assertStringIncludes(content, '## Rules');
    assertStringIncludes(content, '### rule1');
    assertStringIncludes(content, 'Rule content');
  });
});

Deno.test('WindsurfHandler - import enabled rules only', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        rules: [
          { name: 'enabled', content: 'Enabled', enabled: true },
          { name: 'disabled', content: 'Disabled', enabled: false },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.windsurfrules');
    assertStringIncludes(content, 'enabled');
    assert(!content.includes('disabled'));
  });
});

Deno.test('WindsurfHandler - import adds skills section', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        instructions: ['Instructions'],
        skills: [
          { name: 'skill1', content: 'Skill content', description: 'Desc' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.windsurfrules');
    assertStringIncludes(content, '## Skills');
    assertStringIncludes(content, '### skill1');
    assertStringIncludes(content, 'Desc');
    assertStringIncludes(content, 'Skill content');
  });
});

Deno.test('WindsurfHandler - import skills with description', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content', description: 'Description' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.windsurfrules');
    assertStringIncludes(content, 'Description');
  });
});

Deno.test('WindsurfHandler - import skills without description', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.windsurfrules');
    assertStringIncludes(content, '### skill1');
    assertStringIncludes(content, 'Content');
    assert(!content.includes('### skill1\n\nundefined'));
  });
});

Deno.test('WindsurfHandler - import no file written when content empty', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        instructions: [],
        rules: [],
        skills: [],
      },
    });

    await handler.import(config);

    const exists = await fixtureExists(dir, '.windsurfrules');
    assertEquals(exists, false);
  });
});

Deno.test('WindsurfHandler - import writes MCP servers (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, '.windsurf/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('WindsurfHandler - import writes MCP servers (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const existing = {
      mcpServers: {
        existing: { command: 'old', args: [] },
      },
    };
    await writeFixture(dir, '.windsurf/mcp.json', JSON.stringify(existing));

    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.windsurf/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.existing);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('WindsurfHandler - import merge MCP with null readJsonFile', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    await writeFixture(dir, '.windsurf/mcp.json', 'invalid json');

    const config = createSampleConfig({
      config: {
        mcpServers: [
          { name: 'server1', command: 'npx', args: ['-y', 'server1'] },
        ],
      },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.windsurf/mcp.json');
    const parsed = JSON.parse(content);
    assert(parsed.mcpServers.server1);
  });
});

Deno.test('WindsurfHandler - import merge instructions with no existing file', async () => {
  await withTempDir(async (dir) => {
    const handler = new WindsurfHandler();
    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.windsurfrules');
    assertEquals(content, 'New instruction');
  });
});
