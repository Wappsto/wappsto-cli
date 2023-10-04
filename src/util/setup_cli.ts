import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { JsonObjType } from '../types/custom';
import tui from '../util/tui';
import { VERSION } from './version';

export default function setupCLI(
  name: string,
  argv: string[],
  optionDefinitions: commandLineArgs.OptionDefinition[],
  optionSections: commandLineUsage.Section[]
): JsonObjType | false {
  let options;
  let definitions: commandLineUsage.OptionDefinition[] = [
    {
      name: 'help',
      description: 'Display this usage guide.',
      alias: 'h',
      type: Boolean,
    },
    {
      name: 'version',
      description: 'Display this current version.',
      alias: 'V',
      type: Boolean,
    },
    {
      name: 'verbose',
      description: 'Enable verbose output.',
      alias: 'v',
      type: Boolean,
    },
    {
      name: 'debug',
      description: 'Enable debug output.',
      alias: 'd',
      type: Boolean,
    },
    {
      name: 'quiet',
      description: 'Do not print the header.',
      alias: 'q',
      type: Boolean,
    },
  ];
  definitions = definitions.concat(optionDefinitions);

  const sections = optionSections.concat([
    {
      header: 'Options',
      optionList: definitions,
    },
    {
      header: 'Information',
      content: [
        {
          name: 'Project',
          summary: `{underline https://github.com/wappsto/wappsto-cli}`,
        },
        { name: 'Version', summary: VERSION },
      ],
    },
  ]);

  try {
    options = commandLineArgs(definitions, { argv });
  } catch (err: unknown) {
    tui.showError((err as Error).message);
    console.log(commandLineUsage(sections));
    return false;
  }

  if (options.help) {
    console.log(commandLineUsage(sections));
    return false;
  }

  if (options.version) {
    console.log(`Wappsto CLI by Seluxit A/S - Version: ${VERSION}`);
    return false;
  }

  tui.debug = options.debug;
  tui.verbose = options.verbose;

  if (!options.quiet) {
    tui.header(name);
  }

  return options;
}
