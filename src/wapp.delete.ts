import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';

export default class DeleteWapp extends Wapp {
  async delete(): Promise<void> {
    if (!this.present()) {
      return;
    }

    const answer = await questions.deleteWapp();
    if (answer === false) {
      return;
    }
    if (answer.del) {
      if (!answer.local && !answer.remote) {
        tui.showWarning('Nothing deleted');
        return;
      }

      const status = new Spinner('Deleting Wapp, please wait...');
      status.start();

      if (answer.local) {
        this.deleteLocal();
      }
      if (answer.remote) {
        const results = [];

        this.application.version.forEach((v: any) => {
          if (v.id) {
            results.push(v.delete());
            results.push(this.installation.deleteById(v.id));
          }
        });

        if (this.application.id) {
          results.push(this.application.delete());
        }
        try {
          await Promise.all(results);
        } catch (err) {
          status.stop();
          tui.showError(`Failed to delete application: ${err}`);
          return;
        }
      }

      status.stop();
      tui.showMessage('Wapp deleted');
    }
  }
}