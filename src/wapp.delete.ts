import Wapp from './wapp';
import tui from './util/tui';
import questions from './util/questions';
import { section } from './util/trace';

export default class DeleteWapp extends Wapp {
  async delete(): Promise<void> {
    if (!this.present()) {
      tui.showError('No Wapp found in current folder');
      return;
    }

    const answers = await section('Wait for user input', () => {
      return questions.deleteWapp();
    });

    if (answers === false || !answers.del) {
      return;
    }

    if (!answers.local && !answers.remote) {
      tui.showWarning('Nothing to delete');
      return;
    }

    section('Deleting wapp', async () => {
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
          tui.showError(`Failed to delete wapp: ${err}`);
          return;
        }
      }
    });

    tui.showMessage('Wapp deleted');
  }
}
