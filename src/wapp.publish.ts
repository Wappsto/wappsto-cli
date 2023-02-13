import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';

export default class PublishWapp extends Wapp {
  async publish(): Promise<void> {
    if (!this.present()) {
      return;
    }

    const status = new Spinner('Loading application, please wait...');
    status.start();
    let res = await this.application.fetch();
    status.stop();
    if(!res) {
      return;
    }

    const answers = await questions.askPublishWapp(this.manifest.version_app);
    if (answers === false) {
      return;
    }

    status.setMessage('Publishing new version, please wait...');
    status.start();

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