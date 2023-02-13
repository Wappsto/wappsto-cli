import prompts from 'prompts';
import tui from './tui';
import { Manifest } from '../types/custom.d';
import { OauthExternal21, OauthClient21 } from '../types/application.d';
import Trace from './trace';

type Request = {
  collection: string;
  message: string;
  name_installation: string;
  type: string;
};

class Questions {
  private async ask(questions: any[]): Promise<any | false> {
    const t = new Trace('User Input', questions[0].message);
    return new Promise<any | false>((resolve) => {
      const onCancel = () => {
        t.done('unknown');
        resolve(false);
        return false;
      };
      prompts(questions, { onCancel }).then((answers) => {
        t.done();
        resolve(answers);
      });
    });
  }

  askWappstoCredentials(
    host: string
  ): Promise<{ username: string; password: string } | false> {
    return this.ask([
      {
        name: 'username',
        type: 'text' as const,
        message: `Enter your ${host} e-mail address:`,
        validate: (value: string) => {
          if (value === '') {
            return 'Please enter your e-mail address.';
          }
          return true;
        },
      },
      {
        name: 'password',
        type: 'password' as const,
        message: 'Enter your password:',
        validate: (value: string) => {
          if (value === '') {
            return 'Please enter your password.';
          }
          return true;
        },
      },
    ]);
  }

  async askForNewWapp(
    wapps: {
      title: string;
      value: string;
    }[],
    present: boolean
  ): Promise<Record<string, any> | false> {
    const choices = [
      {
        title: 'Create new Wapp',
        value: 'new',
      },
    ];

    if (wapps.length > 0) {
      choices.push({
        title: 'Download an existing Wapp',
        value: 'download',
      });
    }
    if (present) {
      tui.showWarning('It seams like you already have a wapp in this folder!');
      const override = await this.ask([
        {
          name: 'override',
          type: 'confirm' as const,
          initial: () => false,
          message: 'Do you want to delete your local wapp?',
        },
      ]);
      if (override === false) {
        return false;
      }
      if (!override.override) {
        choices.push({
          title: 'Generate a new Wapp from existing wapp',
          value: 'generate',
        });
      }
    }

    const ifNew = (values: any) =>
      values.create === 'new' || values.create === undefined;

    return this.ask([
      {
        message: 'How do you want to create the Wapp?',
        name: 'create',
        type: present || wapps.length !== 0 ? 'select' : null,
        choices,
      },
      {
        name: 'wapp',
        type: (prev: any, values: any) =>
          values.create === 'download' ? 'select' : null,
        message: 'Please choose the wapp to download:',
        choices: wapps,
      },
      {
        name: 'name',
        type: (prev: any, values: any) => (ifNew(values) ? 'text' : null),
        message: 'Please enter the name of your Wapp:',
        validate: (answer: string) => {
          if (answer === '') {
            return "Name can't be empty";
          }
          return true;
        },
      },
      {
        name: 'author',
        type: (prev: any, values: any) => (ifNew(values) ? 'text' : null),
        message: 'Please enter the Author of your Wapp:',
      },
      {
        name: 'version',
        type: (prev: any, values: any) => (ifNew(values) ? 'text' : null),
        message: 'Please enter the Version of your Wapp:',
        initial: '0.0.1',
        validate: (answer: string) => {
          if (/^\d+\.\d+\.\d+$/.test(answer)) {
            return true;
          }
          return 'Version must be in the format: 1.1.1';
        },
      },
      {
        name: 'features',
        type: (prev: any, values: any) =>
          ifNew(values) ? 'multiselect' : null,
        message: 'Please choose features for the Wapp:',
        choices: [
          {
            title: 'Foreground',
            value: 'foreground',
            selected: true,
          },
          {
            title: 'background',
            value: 'background',
          },
        ],
        validate: (answer: string[]) => {
          if (answer && answer.length === 0) {
            return 'You must select at least one feature';
          }
          return true;
        },
      },
      {
        name: 'general',
        type: (prev: any, values: any) => (ifNew(values) ? 'text' : null),
        message: 'Please enter a general description about your Wapp:',
      },
      {
        name: 'foreground',
        type: (prev: any, values: any) =>
          ifNew(values) && values.features.indexOf('foreground') !== -1
            ? 'text'
            : null,
        message:
          'Please enter a description about your foreground part of your Wapp:',
      },
      {
        name: 'background',
        type: (prev: any, values: any) =>
          ifNew(values) && values.features.indexOf('background') !== -1
            ? 'text'
            : null,
        message:
          'Please enter a description about your background part of your Wapp:',
      },
      {
        name: 'examples',
        type: (prev: any, values: any) => (ifNew(values) ? 'confirm' : null),
        message: 'Generate example files for the Wapp?',
        initial: false,
      },
    ]);
  }

  async configureWapp(
    manifest: Manifest,
    oauthExternal: OauthExternal21[],
    oauthClient: OauthClient21[]
  ): Promise<Record<string, any> | false> {
    const external = oauthExternal[0] || {};
    const client = oauthClient[0] || {};

    const type = await this.ask([
      {
        name: 'config',
        type: 'select' as const,
        message: 'What do you want to configure?',
        choices: [
          { title: 'Description', value: 'description' },
          {
            title: 'External OAuth',
            value: 'external_oauth',
          },
          { title: 'OAuth Client', value: 'oauth_client' },
          { title: 'Permissions', value: 'permissions' },
        ],
      },
    ]);

    /* istanbul ignore next */
    function validateEmptyString(input: string) {
      return input.length > 0 ? true : 'You must enter a valid string';
    }

    const descriptionQuestions = [
      {
        name: 'name',
        validate: validateEmptyString,
        type: 'text',
        initial: manifest.name,
        message: 'Name of the wapp:',
      },
      {
        name: 'author',
        validate: validateEmptyString,
        type: 'text',
        initial: manifest.author,
        message: 'Name of the Author:',
      },
      {
        name: 'general',
        validate: validateEmptyString,
        type: 'text',
        initial: manifest.description.general,
        message: 'General description of your wapp:',
      },
      {
        name: 'foreground',
        validate: validateEmptyString,
        type:
          manifest.supported_features.indexOf('foreground') !== -1
            ? 'text'
            : null,
        message: 'Foreground description of your Wapp:',
      },
      {
        name: 'background',
        validate: validateEmptyString,
        type:
          manifest.supported_features.indexOf('background') !== -1
            ? 'text'
            : null,
        message: 'Background description of your Wapp:',
      },
    ];

    const oauthExtQuestions = [
      {
        name: 'oauth_version',
        type: 'select' as const,
        choices: [{ title: '1.0' }, { title: '2.0' }],
        initial: external.oauth_version || '1.0',
        message: 'Version:',
      },
      {
        name: 'name',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: external.name,
        message: 'Name:',
      },
      {
        name: 'description',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: external.description,
        message: 'Description:',
      },
      {
        name: 'api_key',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: external.api_key,
        message: 'API Key:',
      },
      {
        name: 'api_secret_key',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: external.api_secret_key,
        message: 'API Secret Key:',
      },
      {
        name: 'api_site',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: external.api_site,
        message: 'API Site:',
      },
    ];

    const oauthClientQuestions = [
      {
        name: 'name',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.name,
        message: 'Name:',
      },
      {
        name: 'company',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.company,
        message: 'Company:',
      },
      {
        name: 'description',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.description,
        message: 'Description:',
      },
      {
        name: 'homepage_url',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.homepage_url,
        message: 'Homepage Url:',
      },
      {
        name: 'path_access_token',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.path_access_token,
        message: 'Path Access Token:',
      },
      {
        name: 'redirect_uri',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.redirect_uri,
        message: 'Redirect Uri:',
      },
    ];

    const permissionQuestions = [
      {
        name: 'create',
        type: 'multiselect' as const,
        message: 'What permissions do your wapp need?',
        choices: [
          {
            title: 'Network',
            value: 'network',
            selected: manifest.permission?.create?.includes('network'),
          },
          {
            title: 'Data',
            value: 'data',
            selected: manifest.permission?.create?.includes('data'),
          },
          {
            title: 'stream',
            value: 'stream',
            selected: manifest.permission?.create?.includes('stream'),
          },
          {
            title: 'Analytic',
            value: 'analytic',
            selected: manifest.permission?.create?.includes('analytic'),
          },
          {
            title: 'Notification',
            value: 'notification',
            selected: manifest.permission?.create?.includes('notification'),
          },
        ],
      },
      {
        type: 'confirm' as const,
        name: 'permit_to_send_email',
        message: 'Do your Wapp need to send email?',
        initial: manifest.permission?.permit_to_send_email,
      },
      {
        type: 'confirm' as const,
        name: 'permit_to_send_sms',
        message: 'Do your Wapp need to send SMS?',
        initial: manifest.permission?.permit_to_send_sms,
      },
    ];

    switch (type.config) {
      case 'external_oauth':
        return this.ask(oauthExtQuestions);
      case 'oauth_client':
        return this.ask(oauthClientQuestions);
      case 'permissions':
        return this.ask(permissionQuestions);
      default:
        return this.ask(descriptionQuestions);
    }
  }

  deleteWapp(): Promise<
    { del: boolean; local?: boolean; remote?: boolean } | false
  > {
    return this.ask([
      {
        name: 'del',
        type: 'confirm' as const,
        message: 'Do you want to delete the Wapp?',
        initial: false,
      },
      {
        name: 'local',
        type: (prev: any) => (prev ? 'confirm' : null),
        message: 'Do you want to delete the local files?',
      },
      {
        name: 'remote',
        type: (prev: any, values: any) => (values.del ? 'confirm' : null),
        message: 'Do you want to delete the Wapp on Wappsto?',
      },
    ]);
  }

  precisePermissionRequest(
    request: Request
  ): Promise<{ accept: boolean } | false> {
    let msg = '';
    let type = 'data';

    if (request.collection) {
      type = request.collection;
    }

    if (request.message) {
      msg = request.message;
    } else {
      msg = `${request.name_installation} would like to save ${type} under your account. Allow?`;
    }

    return this.ask([
      {
        name: 'accept',
        type: 'confirm' as const,
        message: msg,
      },
    ]);
  }

  permissionRequest(
    request: Request,
    data: any[]
  ): Promise<{ permission: string[] } | false> {
    let msg = '';

    if (request.message) {
      msg = request.message;
    } else {
      msg = `Please choose the ${request.type} to share with ${request.name_installation}:`;
    }

    return this.ask([
      {
        name: 'permission',
        type: 'multiselect' as const,
        message: msg,
        choices: data,
      },
    ]);
  }

  remoteVersionUpdated(): Promise<{ local: boolean } | false> {
    return this.ask([
      {
        name: 'local',
        type: 'confirm' as const,
        initial: true,
        message:
          'Do you want to override local version information with remote information?',
      },
    ]);
  }

  fileConflict(file: string): Promise<{ conflict: string } | false> {
    return this.ask([
      {
        message: `Conflict on file ´${file}`,
        name: 'conflict',
        type: 'select' as const,
        choices: [
          {
            title: 'Overwrite local file with remote file',
            value: 'overwrite',
          },
          {
            title: 'Upload local file to server',
            value: 'upload',
          },
          {
            title: 'Overwrite this local file and all next',
            value: 'overwrite_all',
          },
          {
            title: 'Upload this local file and all next',
            value: 'upload_all',
          },
          {
            title: 'Abort',
            value: 'abort',
          },
        ],
      },
    ]);
  }

  askDeleteLocalFile(file: string): Promise<{ delete: boolean } | false> {
    return this.ask([
      {
        name: 'delete',
        type: 'confirm' as const,
        default: true,
        message: `${file} was deleted on the server, do you want to delete the local file?`,
      },
    ]);
  }

  askOverwriteFiles(): Promise<{ overwrite: boolean } | false> {
    return this.ask([
      {
        name: 'overwrite',
        type: 'confirm' as const,
        default: false,
        message:
          'Do you want to overwrite your local files with example files?',
      },
    ]);
  }

  askPublishWapp(
    oldVersion: string
  ): Promise<{ version: string; change: string } | false> {
    return this.ask([
      {
        name: 'version',
        type: 'text' as const,
        initial: oldVersion,
        message: `The version of the wapp is ${oldVersion}, what is the new version`,
        validate: (answer: string) => {
          if (/^\d+\.\d+\.\d+$/.test(answer)) {
            return true;
          }
          return 'Version must be in the format: 1.1.1';
        },
      },
      {
        name: 'change',
        type: 'text',
        message: 'What changed in this version',
      },
    ]);
  }
}

const questions: Questions = new Questions();
export default questions;
