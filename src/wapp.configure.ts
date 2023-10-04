import questions from './util/questions';
import { section } from './util/trace';
import tui from './util/tui';
import Wapp from './wapp';

export default class ConfigureWapp extends Wapp {
  async configure(): Promise<void> {
    if (!this.present()) {
      tui.showError('No Wapp found in current folder');
      return;
    }

    if (
      !(await section('Load application', () => {
        return this.application.fetch();
      }))
    ) {
      tui.showError("Can't configure wapp, without valid application");
      return;
    }

    const answers = await section('Wait for user input', () => {
      return questions.configureWapp(
        this.manifest,
        this.application.getOAuthExternal(),
        this.application.getOAuthClient()
      );
    });

    if (answers === false) {
      return;
    }

    const version = this.application.getVersion();

    switch (answers.type) {
      case 'external_oauth':
        await section('Creating OAuth External', () => {
          return this.application.createOauthExternal(answers);
        });
        break;
      case 'oauth_client':
        await section('Creating OAuth Client', async () => {
          return this.application.createOauthClient(answers);
        });
        break;
      case 'permissions':
        await section('Changing Permission', async () => {
          delete answers.type;
          version.permission = answers;
          await version.update();
          this.saveApplication();
        });
        break;
      case 'multi_installations':
        await section('Changing Installation count', async () => {
          version.max_number_installation = answers.allow ? 99 : 1;
          await version.update();
          this.saveApplication();
        });
        break;
      case 'description':
      default:
        await section('Changing Description', async () => {
          this.manifest.name = answers.name;
          this.manifest.author = answers.author;
          this.manifest.description.general = answers.general;
          this.manifest.description.foreground = answers.foreground;
          this.manifest.description.background = answers.background;
          this.saveManifest();
          this.application.getVersion().parse(this.manifest);
          await this.application.getVersion().update();
          this.saveApplication();
        });
        break;
    }
  }
}
