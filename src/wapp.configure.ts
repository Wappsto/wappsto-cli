import Wapp from './wapp';
import questions from './util/questions';
import tui from './util/tui';

export default class ConfigureWapp extends Wapp {
  async configure(): Promise<void> {
    if (!this.present()) {
      tui.showError('No Wapp found in current folder');
      return;
    }

    let t = this.measure('Load application');
    await this.application.fetch();
    t.done();

    t = this.measure('Ask the human');
    const answer = await questions.configureWapp(
      this.manifest,
      this.application.getOAuthExternal(),
      this.application.getOAuthClient()
    );
    t.done();

    if (answer === false) {
      return;
    }

    const version = this.application.getVersion();

    switch (answer.type) {
      case 'external_oauth':
        t = this.measure('createOauthExternal');
        this.application.createOauthExternal(answer);
        break;
      case 'oauth_client':
        t = this.measure('createOauthClient');
        this.application.createOauthClient(answer);
        break;
      case 'permissions':
        t = this.measure('changePermission');
        delete answer.type;
        version.permission = answer;
        await version.update();
        this.saveApplication();
        t.done();
        break;
      case 'multi_installations':
        version.max_number_installation = answer.allow ? 99 : 1;
        await version.update();
        this.saveApplication();
        break;
      case 'description':
      default:
        t = this.measure('changeDescription');
        this.manifest.name = answer.name;
        this.manifest.author = answer.author;
        this.manifest.description.general = answer.general;
        this.manifest.description.foreground = answer.foreground;
        this.manifest.description.background = answer.background;
        this.saveManifest();
        this.application.getVersion().parse(this.manifest);
        await this.application.getVersion().update();
        this.saveApplication();
        break;
    }
    t.done();
  }
}
