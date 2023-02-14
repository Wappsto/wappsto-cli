import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';

export default class PublishWapp extends Wapp {
  async publish(): Promise<void> {
    if (!this.present()) {
      tui.showError('No Wapp found in current folder');
      return;
    }

    const status = new Spinner('Loading application');
    let res = await this.application.fetch();
    status.stop();
    if (!res) {
      return;
    }

    const answers = await questions.askPublishWapp(this.manifest.version_app);
    if (answers === false) {
      return;
    }

    status.setMessage('Publishing new version');

    res = await this.application.publish(answers.version, answers.change);
    if (res) {
      this.saveApplication();
      status.stop();

      tui.showMessage(`Wapp published with version ${answers.version}`);
    } else {
      status.stop();
    }
  }
}
