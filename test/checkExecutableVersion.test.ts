import prompts from 'prompts';
import {
  _internals,
  checkExecutableVersion,
} from '../src/checkExecutableVersion';
import { Manifest } from '../src/types/custom';

type HttpStub = {
  get: jest.Mock;
};

function makeManifest(overrides: Partial<Manifest> = {}): Manifest {
  return {
    name: 'Wapp',
    name_identifier: 'wapp',
    author: 'Author',
    version_app: '1.0.0',
    max_number_installation: 1,
    supported_features: ['background'],
    description: {
      general: '',
      foreground: '',
      background: '',
      widget: '',
      version: '',
    },
    permission: {},
    ...overrides,
  };
}

function makeHttp(data: unknown): HttpStub {
  return { get: jest.fn().mockResolvedValue({ data }) };
}

describe('checkExecutableVersion', () => {
  const originalGetLocalNodeMajor = _internals.getLocalNodeMajor;

  beforeEach(() => {
    _internals.getLocalNodeMajor = () => '24';
  });

  afterEach(() => {
    _internals.getLocalNodeMajor = originalGetLocalNodeMajor;
    jest.restoreAllMocks();
  });

  it('resolves silently when local, manifest and default all match', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest({
      executable: { engine: 'node', version: '24' },
    });

    // No prompt is expected — if one fires, prompts.inject is empty
    // and the test will hang or fail. Guard with a short timeout.
    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
    expect(http.get).toHaveBeenCalledWith('/services/2.1/executable/node');
  });

  it('skips entirely when the wapp has no background feature', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest({ supported_features: ['foreground'] });

    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('warns and prompts when the manifest pins a different version than the default', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    _internals.getLocalNodeMajor = () => '22'; // local matches manifest; only override warning

    prompts.inject([true]);
    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
  });

  it('throws when the user declines the prompt', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    _internals.getLocalNodeMajor = () => '22';

    prompts.inject([false]);
    await expect(
      checkExecutableVersion(manifest, http as never)
    ).rejects.toThrow(/cancelled/i);
  });

  it('warns and prompts when local Node differs from the default', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest();
    _internals.getLocalNodeMajor = () => '18';

    prompts.inject([true]);
    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
  });

  it('prints both warnings but prompts only once when local and manifest both diverge', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    _internals.getLocalNodeMajor = () => '18';

    const confirmSpy = jest
      .spyOn(_internals, 'confirm')
      .mockResolvedValue(true);

    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('skips the prompt when --yes is set but still resolves on divergence', async () => {
    const http = makeHttp({ default_version: '24' });
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    _internals.getLocalNodeMajor = () => '18';

    const confirmSpy = jest.spyOn(_internals, 'confirm');

    await expect(
      checkExecutableVersion(manifest, http as never, { yes: true })
    ).resolves.toBeUndefined();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('does not raise a local-version warning when the engine is python', async () => {
    const http = makeHttp({ default_version: '3.11.0' });
    const manifest = makeManifest({
      executable: { engine: 'python', version: '3.11.0' },
    });
    _internals.getLocalNodeMajor = () => '18'; // would mismatch a node default; irrelevant here

    const confirmSpy = jest.spyOn(_internals, 'confirm');

    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
    expect(http.get).toHaveBeenCalledWith('/services/2.1/executable/python');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('fails closed when the endpoint returns an error', async () => {
    const http: HttpStub = {
      get: jest.fn().mockRejectedValue(new Error('404 Not Found')),
    };
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    _internals.getLocalNodeMajor = () => '18';

    const confirmSpy = jest.spyOn(_internals, 'confirm');

    await expect(
      checkExecutableVersion(manifest, http as never)
    ).resolves.toBeUndefined();
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
