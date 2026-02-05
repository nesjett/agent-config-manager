import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import { CopilotHandler } from '../../src/platforms/copilot.ts';
import {
  withTempDir,
  writeFixture,
  readFixture,
  fixtureExists,
  createSampleConfig,
} from '../_test_helpers.ts';

Deno.test('CopilotHandler - detect returns true when copilot-instructions.md exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    await writeFixture(dir, '.github/copilot-instructions.md', 'Content');

    const result = await handler.detect();
    assertEquals(result, true);
  });
});

Deno.test('CopilotHandler - detect returns false when missing', async () => {
  await withTempDir(async () => {
    const handler = new CopilotHandler();
    const result = await handler.detect();
    assertEquals(result, false);
  });
});

Deno.test('CopilotHandler - export reads copilot-instructions.md', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    await writeFixture(
      dir,
      '.github/copilot-instructions.md',
      'Copilot instructions'
    );

    const config = await handler.export();
    assertEquals(config.config.instructions?.length, 1);
    assertEquals(config.config.instructions?.[0], 'Copilot instructions');
  });
});

Deno.test('CopilotHandler - export reads vscode settings with copilot/github keys', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const settings = {
      'github.copilot.enable': true,
      'github.copilot.advanced': { feature: 'value' },
      'editor.fontSize': 14,
    };
    await writeFixture(
      dir,
      '.vscode/settings.json',
      JSON.stringify(settings)
    );

    const config = await handler.export();
    assert(config.config.context?.vscodeSettings);
    const vscodeSettings = config.config.context
      .vscodeSettings as Record<string, unknown>;
    assert(vscodeSettings['github.copilot.enable']);
    assert(vscodeSettings['github.copilot.advanced']);
    assertEquals(vscodeSettings['editor.fontSize'], undefined);
  });
});

Deno.test('CopilotHandler - export skips vscode settings when no copilot keys', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const settings = {
      'editor.fontSize': 14,
      'editor.tabSize': 2,
    };
    await writeFixture(
      dir,
      '.vscode/settings.json',
      JSON.stringify(settings)
    );

    const config = await handler.export();
    assertEquals(config.config.context, {});
  });
});

Deno.test('CopilotHandler - export handles missing vscode settings', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    await writeFixture(dir, '.github/copilot-instructions.md', 'Content');

    const config = await handler.export();
    assertEquals(config.config.context, {});
  });
});

Deno.test('CopilotHandler - export handles null readJsonFile for vscode settings', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    await writeFixture(dir, '.vscode/settings.json', 'invalid json');

    const config = await handler.export();
    assertEquals(config.config.context, {});
  });
});

Deno.test('CopilotHandler - export returns empty when nothing present', async () => {
  await withTempDir(async () => {
    const handler = new CopilotHandler();
    const config = await handler.export();

    assertEquals(config.config.instructions?.length, 0);
  });
});

Deno.test('CopilotHandler - import writes instructions (replace)', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: { instructions: ['Instruction 1', 'Instruction 2'] },
    });

    await handler.import(config, false);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertEquals(content, 'Instruction 1\n\nInstruction 2');
  });
});

Deno.test('CopilotHandler - import writes instructions (merge)', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    await writeFixture(
      dir,
      '.github/copilot-instructions.md',
      'Existing content'
    );

    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertEquals(content, 'Existing content\n\n---\n\nNew instruction');
  });
});

Deno.test('CopilotHandler - import merge with no existing file', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: { instructions: ['New instruction'] },
    });

    await handler.import(config, true);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertEquals(content, 'New instruction');
  });
});

Deno.test('CopilotHandler - import adds rules section', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        instructions: ['Instructions'],
        rules: [
          { name: 'rule1', content: 'Rule content', enabled: true },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, '## Rules');
    assertStringIncludes(content, '### rule1');
    assertStringIncludes(content, 'Rule content');
  });
});

Deno.test('CopilotHandler - import only includes enabled rules', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        rules: [
          { name: 'enabled', content: 'Enabled', enabled: true },
          { name: 'disabled', content: 'Disabled', enabled: false },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, 'enabled');
    assert(!content.includes('disabled'));
  });
});

Deno.test('CopilotHandler - import adds skills section', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        instructions: ['Instructions'],
        skills: [
          { name: 'skill1', content: 'Skill content', description: 'Desc' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, '## Skills/Commands');
    assertStringIncludes(content, '### skill1');
    assertStringIncludes(content, 'Desc');
    assertStringIncludes(content, 'Skill content');
  });
});

Deno.test('CopilotHandler - import skills with command', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          {
            name: 'skill1',
            content: 'Content',
            command: '/skill1',
          },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, '### skill1 (/skill1)');
  });
});

Deno.test('CopilotHandler - import skills without command', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, '### skill1');
    assert(!content.includes('### skill1 ('));
  });
});

Deno.test('CopilotHandler - import skills with description', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content', description: 'Description' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, 'Description');
  });
});

Deno.test('CopilotHandler - import skills without description', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        skills: [
          { name: 'skill1', content: 'Content' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, '### skill1');
    assertStringIncludes(content, 'Content');
  });
});

Deno.test('CopilotHandler - import no file written when content is empty', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        instructions: [],
        rules: [],
        skills: [],
      },
    });

    await handler.import(config);

    const exists = await fixtureExists(dir, '.github/copilot-instructions.md');
    assertEquals(exists, false);
  });
});

Deno.test('CopilotHandler - import all sections combined', async () => {
  await withTempDir(async (dir) => {
    const handler = new CopilotHandler();
    const config = createSampleConfig({
      config: {
        instructions: ['Instructions'],
        rules: [
          { name: 'rule1', content: 'Rule content', enabled: true },
        ],
        skills: [
          { name: 'skill1', content: 'Skill content', description: 'Desc' },
        ],
      },
    });

    await handler.import(config);

    const content = await readFixture(dir, '.github/copilot-instructions.md');
    assertStringIncludes(content, 'Instructions');
    assertStringIncludes(content, '## Rules');
    assertStringIncludes(content, '### rule1');
    assertStringIncludes(content, '## Skills/Commands');
    assertStringIncludes(content, '### skill1');
  });
});
