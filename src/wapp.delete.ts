import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';

export default class DeleteWapp extends Wapp {
  async delete(): Promise<void> {
    if (!this.present()) {
      tui.showError('No Wapp found in current folder');
      return;
    }

    let t = this.measure('Ask the human');
    const answers = await questions.deleteWapp();
    t.done();
    if (answers === false) {
      return;
    }

    if (!answers.del) {
      return;
    }

    if (!answers.local && !answers.remote) {
      tui.showWarning('Nothing deleted');
      return;
    }

    t = this.measure('Deleting wapp');
    Spinner.setMessage('Deleting Wapp');

    if (answers.local) {
      this.deleteLocal();
    }

    if (answers.remote) {
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
        Spinner.stop();
        tui.showError(`Failed to delete application: ${err}`);
        return;
      }
    }

    Spinner.stop();
    tui.showMessage('Wapp deleted');
    t.done();
  }
}
