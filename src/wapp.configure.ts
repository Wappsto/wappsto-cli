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

    if (answer.api_site) {
      t = this.measure('createOauthExternal');
      this.application.createOauthExternal(answer);
    } else if (answer.redirect_uri) {
      t = this.measure('createOauthClient');
      this.application.createOauthClient(answer);
    } else if (answer.create) {
      t = this.measure('changePermission');
      this.manifest.permission = answer;
      this.saveManifest();
      this.application.getVersion().permission = answer;
      await this.application.getVersion().update();
    } else if (answer.general) {
      t = this.measure('changeDescription');
      this.manifest.name = answer.name;
      this.manifest.author = answer.author;
      this.manifest.description.general = answer.general;
      this.manifest.description.foreground = answer.foreground;
      this.manifest.description.background = answer.background;
      this.saveManifest();
      this.application.getVersion().parse(this.manifest);
      await this.application.getVersion().update();
    }
    t.done();
  }
}