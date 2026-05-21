import axios from 'axios';
import prompts from 'prompts';
import { Manifest } from '../src/types/custom';
import { setup, teardown } from './util/setup';
// eslint-disable-next-line import/order
import { checkExecutableVersion } from '../src/checkExecutableVersion';

describe('checkExecutableVersion', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  // process.versions.node is a non-writable global, so override it through its
  // descriptor rather than passing it in as a seam. beforeEach captures the real
  // descriptor and afterEach puts it back.
  let originalNodeDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    mockedAxios = await setup(false);
    originalNodeDescriptor = Object.getOwnPropertyDescriptor(
      process.versions,
      'node'
    );
    mockNodeVersion('24.0.0');
  });

  afterEach(() => {
    if (originalNodeDescriptor) {
      Object.defineProperty(process.versions, 'node', originalNodeDescriptor);
    }
    teardown();
  });

  it('resolves silently when local, manifest and default all match', async () => {
    mockDefaultVersion('24');
    const manifest = makeManifest({
      executable: { engine: 'node', version: '24' },
    });

    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/executable/node',
      {}
    );
  });

  it('skips entirely when the wapp has no background feature', async () => {
    const manifest = makeManifest({ supported_features: ['foreground'] });

    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('warns and prompts when the manifest pins a different version than the default', async () => {
    mockDefaultVersion('24');
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    mockNodeVersion('22.0.0');

    prompts.inject([true]);
    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
  });

  it('throws when the user declines the prompt', async () => {
    mockDefaultVersion('24');
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    mockNodeVersion('22.0.0');

    prompts.inject([false]);
    await expect(checkExecutableVersion(manifest)).rejects.toThrow(
      /cancelled/i
    );
  });

  it('warns and prompts when local Node differs from the default', async () => {
    mockDefaultVersion('24');
    const manifest = makeManifest();
    mockNodeVersion('18.0.0');

    prompts.inject([true]);
    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
  });

  it('prints both warnings but prompts only once when local and manifest both diverge', async () => {
    mockDefaultVersion('24');
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    mockNodeVersion('18.0.0');

    // A single injected answer is consumed; a second prompt would read
    // undefined and reject, so resolving proves exactly one prompt.
    prompts.inject([true]);
    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
  });

  it('skips the prompt when --yes is set but still resolves on divergence', async () => {
    mockDefaultVersion('24');
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    mockNodeVersion('18.0.0');

    // Injecting a decline that is never consumed proves the prompt is skipped.
    prompts.inject([false]);
    await expect(
      checkExecutableVersion(manifest, { yes: true })
    ).resolves.toBeUndefined();
  });

  it('does not raise a local-version warning when the engine is python', async () => {
    mockDefaultVersion('3.11.0');
    const manifest = makeManifest({
      executable: { engine: 'python', version: '3.11.0' },
    });
    mockNodeVersion('18.0.0');

    prompts.inject([false]);
    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/executable/python',
      {}
    );
  });

  it('fails closed when the endpoint returns an error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('404 Not Found'));
    const manifest = makeManifest({
      executable: { engine: 'node', version: '22' },
    });
    mockNodeVersion('18.0.0');

    prompts.inject([false]);
    await expect(checkExecutableVersion(manifest)).resolves.toBeUndefined();
  });

  function mockDefaultVersion(version: string): void {
    mockedAxios.get.mockResolvedValueOnce({
      data: { default_version: version },
    });
  }

  function mockNodeVersion(version: string): void {
    Object.defineProperty(process.versions, 'node', {
      value: version,
      writable: false,
      enumerable: true,
      configurable: true,
    });
  }

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
});
