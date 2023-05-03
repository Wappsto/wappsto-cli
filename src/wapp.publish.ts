import Wapp from './wapp.update';
import tui from './util/tui';
import { section } from './util/trace';
import questions from './util/questions';

export default class PublishWapp extends Wapp {
  async publish(): Promise<void> {
    if (!this.present()) {
      tui.showError('No Wapp found in current folder');
      return;
    }

    let res = await section('Loading application', () => {
      return this.application.fetch();
    });

    if (!res) {
      return;
    }

    const pendig = this.application.getPendingVersion();

    const answers = await section('Wait for user input', () => {
      return questions.askPublishWapp(this.manifest.version_app, !!pendig);
    });

    if (answers === false) {
      return;
    }

    let identifier = this.manifest.name_identifier;
    if (!identifier) {
      const newName = await section('Wait for user input', () => {
        return questions.askForNameIdentifier();
      });

      if (newName === false) {
        return;
      }

      identifier = newName.identifier;
    }
    res = await section('Updating version', () => {
      return this.update();
    });

    res = await section('Publishing new version', () => {
      return this.application.publish(answers.version, answers.change);
    });

    if (res) {
      this.saveApplication();
      tui.showMessage(`Wapp published with version ${answers.version}`);
    }
  }
}
