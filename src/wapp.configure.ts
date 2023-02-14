import Wapp from './wapp';
import questions from './util/questions';

export default class ConfigureWapp extends Wapp {
  async configure(): Promise<void> {
    if (!this.present()) {
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
        this.manifest.permission = answer;
        this.saveManifest();
        this.application.getVersion().permission = answer;
        await this.application.getVersion().update();
        break;
      case 'multi_installations':
        this.manifest.max_number_installation = answer.allow ? 99 : 1;
        this.saveManifest();
        this.application.getVersion().max_number_installation =
          this.manifest.max_number_installation;
        await this.application.getVersion().update();
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
        break;
    }
    t.done();
  }
}
