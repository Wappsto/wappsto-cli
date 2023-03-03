import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import tui from '../util/tui';
import { VERSION } from './version';

export default function setupCLI(
  name: string,
  argv: string[],
  optionDefinitions: commandLineArgs.OptionDefinition[],
  optionSections: commandLineUsage.Section[]
): Record<string, any> | false {
  let options;
  let definitions: any[] = [
    {
      name: 'help',
      description: 'Display this usage guide.',
      alias: 'h',
      type: Boolean,
    },
    {
      name: 'version',
      description: 'Display this current verison.',
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

  let sections = optionSections.concat([
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
  } catch (err: any) {
    tui.showError(err.message);
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
