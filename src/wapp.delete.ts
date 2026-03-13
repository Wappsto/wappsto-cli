import questions from './util/questions';
import { section } from './util/trace';
import tui from './util/tui';
import Version from './version';
import Wapp from './wapp';

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

    await section('Deleting wapp', async () => {
      const results: Promise<void>[] = [];

      this.application.version.forEach((v: Version | string) => {
        if (typeof v !== 'string' && v.id) {
          results.push(v.delete());
          results.push(this.installation.deleteById(v.id));
        }
      });

      try {
        await Promise.all(results);
      } catch (err) {
        tui.showError(`Failed to delete version/installation: ${err}`);
        return;
      }

      if (this.application.id) {
        try {
          await this.application.delete();
        } catch (err) {
          tui.showError(`Failed to delete wapp: ${err}`);
          return;
        }
      }

      tui.showMessage('Wapp deleted');
    });
  }
}
