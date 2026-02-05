import { assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';
import {
  checkGitRepositoryWithPrompt,
  isGitRepository,
} from '../../src/utils/git.ts';
import { stubPrompt } from '../_test_helpers.ts';

Deno.test('isGitRepository returns true when git command succeeds', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: true }),
      }) as unknown as Deno.Command,
  );

  try {
    const result = await isGitRepository();
    assertEquals(result, true);
  } finally {
    commandStub.restore();
  }
});

Deno.test('isGitRepository returns false when git command fails', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: false }),
      }) as unknown as Deno.Command,
  );

  try {
    const result = await isGitRepository();
    assertEquals(result, false);
  } finally {
    commandStub.restore();
  }
});

Deno.test('isGitRepository returns false when Command throws', async () => {
  const commandStub = stub(Deno, 'Command', () => {
    throw new Error('Command failed');
  });

  try {
    const result = await isGitRepository();
    assertEquals(result, false);
  } finally {
    commandStub.restore();
  }
});

Deno.test('checkGitRepositoryWithPrompt returns true when in git repo', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: true }),
      }) as unknown as Deno.Command,
  );

  try {
    const result = await checkGitRepositoryWithPrompt();
    assertEquals(result, true);
  } finally {
    commandStub.restore();
  }
});

Deno.test('checkGitRepositoryWithPrompt returns true when user confirms', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: false }),
      }) as unknown as Deno.Command,
  );
  const promptStubbed = stubPrompt('y');

  try {
    const result = await checkGitRepositoryWithPrompt();
    assertEquals(result, true);
  } finally {
    commandStub.restore();
    promptStubbed.restore();
  }
});

Deno.test('checkGitRepositoryWithPrompt returns false when user enters "n"', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: false }),
      }) as unknown as Deno.Command,
  );
  const promptStubbed = stubPrompt('n');

  try {
    const result = await checkGitRepositoryWithPrompt();
    assertEquals(result, false);
  } finally {
    commandStub.restore();
    promptStubbed.restore();
  }
});

Deno.test('checkGitRepositoryWithPrompt returns false when prompt returns null', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: false }),
      }) as unknown as Deno.Command,
  );
  const promptStubbed = stubPrompt(null);

  try {
    const result = await checkGitRepositoryWithPrompt();
    assertEquals(result, false);
  } finally {
    commandStub.restore();
    promptStubbed.restore();
  }
});

Deno.test('checkGitRepositoryWithPrompt returns false on empty response', async () => {
  const commandStub = stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: false }),
      }) as unknown as Deno.Command,
  );
  const promptStubbed = stubPrompt('');

  try {
    const result = await checkGitRepositoryWithPrompt();
    assertEquals(result, false);
  } finally {
    commandStub.restore();
    promptStubbed.restore();
  }
});
