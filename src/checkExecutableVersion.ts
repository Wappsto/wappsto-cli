import prompts from 'prompts';
import { Manifest } from './types/custom.d';
import HTTP from './util/http';
import tui from './util/tui';

// Wrapped so tests can stub the local Node version without monkey-patching
// process.versions globally.
export const _internals = {
  getLocalNodeMajor: (): string => process.versions.node.split('.')[0] ?? '',
  confirm: async (message: string): Promise<boolean> => {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message,
      initial: false,
    });
    return response.value === true;
  },
};

type Options = {
  yes?: boolean;
};

type EngineDefault = { default_version?: string };

function major(version: string | undefined): string | undefined {
  if (!version) return undefined;
  return version.split('.')[0];
}

function titleCase(engine: string): string {
  return engine.charAt(0).toUpperCase() + engine.slice(1);
}

// Verifies the Node version the developer is running against, and the
// version (if any) pinned in manifest.json, line up with the platform's
// default executable version. Warns on divergence and prompts for
// confirmation. Resolves silently if everything matches.
//
// Throws (without making any further HTTP calls) if the user declines
// the prompt. Resolves with a single info message if the backend
// endpoint is unreachable — we don't want to block publishing on our
// own outage.
export async function checkExecutableVersion(
  manifest: Manifest,
  http: typeof HTTP = HTTP,
  options: Options = {}
): Promise<void> {
  const supportsBackground = manifest.supported_features?.includes('background');
  if (!supportsBackground) return;

  const engine = manifest.executable?.engine ?? 'node';
  const overrideVersion = manifest.executable?.version;

  let defaultVersion: string | undefined;
  try {
    const response = await http.get(`/services/2.1/executable/${engine}`);
    defaultVersion = (response.data as EngineDefault | undefined)?.default_version;
  } catch (err) {
    tui.showMessage(
      `Skipping platform ${titleCase(engine)} version check — could not reach /services/2.1/executable/${engine}.`
    );
    return;
  }

  if (!defaultVersion) {
    tui.showMessage(
      `Skipping platform ${titleCase(engine)} version check — endpoint returned no default_version.`
    );
    return;
  }

  const defaultMajor = major(defaultVersion);
  const overrideMajor = major(overrideVersion);
  const warnings: string[] = [];

  if (overrideMajor && defaultMajor && overrideMajor !== defaultMajor) {
    warnings.push(
      `Your manifest pins ${titleCase(engine)} ${overrideMajor} but the platform default is ${titleCase(engine)} ${defaultMajor}. Your wapp will run on ${titleCase(engine)} ${overrideMajor} in production.`
    );
  }

  if (engine === 'node') {
    const localMajor = _internals.getLocalNodeMajor();
    if (defaultMajor && localMajor && localMajor !== defaultMajor) {
      const productionMajor = overrideMajor ?? defaultMajor;
      warnings.push(
        `You're developing on Node ${localMajor} locally but the platform default is Node ${defaultMajor}. Your wapp will run on Node ${productionMajor} in production. Behavior may differ.`
      );
    }
  }

  if (warnings.length === 0) return;

  warnings.forEach((w) => tui.showWarning(w));

  if (options.yes) return;

  const confirmed = await _internals.confirm('Continue with update?');
  if (!confirmed) {
    throw new Error('Update cancelled by user');
  }
}

export default checkExecutableVersion;
