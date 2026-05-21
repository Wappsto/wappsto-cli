import prompts from 'prompts';
import Config from './config';
import { Manifest } from './types/custom';
import HTTP from './util/http';
import tui from './util/tui';

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

async function confirm(message: string): Promise<boolean> {
  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: false,
  });
  return response.value === true;
}

export async function checkExecutableVersion(
  manifest: Manifest,
  options: Options = {}
): Promise<void> {
  const supportsBackground =
    manifest.supported_features?.includes('background');
  if (!supportsBackground) return;

  const engine = manifest.executable?.engine ?? 'node';
  const overrideVersion = manifest.executable?.version;

  const url = `${Config.host()}/services/2.1/executable/${engine}`;
  let defaultVersion: string | undefined;
  try {
    const response = await HTTP.get(url);
    defaultVersion = (response.data as EngineDefault | undefined)
      ?.default_version;
  } catch (err) {
    tui.showMessage(
      `Skipping platform ${titleCase(engine)} version check — could not reach ${url}.`
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
    const localMajor = major(process.versions.node);
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

  if (!(await confirm('Continue with update?'))) {
    throw new Error('Update cancelled by user');
  }
}
