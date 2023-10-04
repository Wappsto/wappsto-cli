import questions from './util/questions';
import { section } from './util/trace';
import tui from './util/tui';
import Wapp from './wapp.update';

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

    const pending = this.application.getPendingVersion();

    const answers = await section('Wait for user input', () => {
      return questions.askPublishWapp(this.manifest, !!pending);
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

    res = await section('Publishing new version', async () => {
      const repeat = true;
      while (repeat) {
        try {
          return await this.application.publish(
            answers.version || answers.bump,
            answers.change,
            identifier
          );
        } catch (err: unknown) {
          if ((err as Error).message !== 'name_identifier') {
            return false;
          }

          const newName = await section('Wait for user input', () => {
            return questions.askForNameIdentifier();
          });
          if (newName === false) {
            return false;
          }
          identifier = newName.identifier;
        }
      }
      return false;
    });

    if (res) {
      this.saveApplication();
      tui.showMessage(`Wapp published with version ${answers.version}`);
      tui.showMessage(
        'Before to be available in the market your wapp needs to be validated by our team. Thank you for publishing!'
      );
    }
  }
}
