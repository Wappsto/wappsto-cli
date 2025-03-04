import prompts, { Answers, PromptObject } from 'prompts';
import { OauthClient21, OauthExternal21 } from '../types/application.d';
import type { Request } from '../types/custom';
import { JsonObjType, Manifest } from '../types/custom.d';
import Wappsto from '../wappsto';
import Spinner from './spinner';
import tui from './tui';

class Questions {
  private async ask(
    questions: PromptObject<string>[]
  ): Promise<Answers<string> | false> {
    const start = Spinner.stop();
    let done = false;
    return new Promise<Answers<string> | false>((resolve) => {
      const onCancel = () => {
        if (start) {
          Spinner.start();
        }
        done = true;
        resolve(false);
        return false;
      };
      prompts(questions, { onCancel }).then((answers) => {
        if (!done) {
          done = true;
          if (start) {
            Spinner.start();
          }
          resolve(answers);
        }
      });
    });
  }

  askWappstoCredentials(host: string): Promise<Answers<string> | false> {
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

  private askForNewWapp() {
    return this.ask([
      {
        name: 'name',
        type: 'text',
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
        type: 'text',
        message: 'Please enter the Author of your Wapp:',
      },
      {
        name: 'version',
        type: 'text',
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
        type: 'multiselect',
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
        type: 'text',
        message: 'Please enter a general description about your Wapp:',
      },
      {
        name: 'foreground',
        type: (prev: JsonObjType, values: JsonObjType) =>
          values.features.indexOf('foreground') !== -1 ? 'text' : null,
        message:
          'Please enter a description about your foreground part of your Wapp:',
      },
      {
        name: 'background',
        type: (prev: JsonObjType, values: JsonObjType) =>
          values.features.indexOf('background') !== -1 ? 'text' : null,
        message:
          'Please enter a description about your background part of your Wapp:',
      },
      {
        name: 'examples',
        type: 'confirm',
        message: 'Generate example files for the Wapp?',
        initial: false,
      },
    ]);
  }

  async askCreateWapp(
    wapps: {
      title: string;
      value: string;
    }[],
    present: boolean
  ): Promise<JsonObjType | false> {
    let newWapp = true;
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
        newWapp = false;
      }
    }

    if (newWapp) {
      let createNew = true;

      if (wapps.length > 0) {
        const answer = await this.ask([
          {
            message: 'How do you want to create the Wapp?',
            name: 'create',
            type: 'select',
            choices: [
              {
                title: 'Create new Wapp',
                value: 'new',
              },
              {
                title: 'Download an existing Wapp',
                value: 'download',
              },
            ],
          },
        ]);
        if (answer === false) {
          return false;
        }
        if (answer.create === 'download') {
          createNew = false;
        }
      }

      let answers;
      if (createNew) {
        answers = await this.askForNewWapp();
      } else {
        answers = await this.ask([
          {
            name: 'wapp',
            type: 'select',
            message: 'Please choose the wapp to download:',
            choices: wapps,
          },
        ]);
      }

      if (answers !== false) {
        answers.create = createNew ? 'new' : 'download';
      }

      return answers;
    } else {
      if (wapps.length > 0) {
        const answer = await this.ask([
          {
            message: 'How do you want to use your current Wapp?',
            name: 'create',
            type: 'select',
            choices: [
              {
                title: 'Generate a new Wapp from existing wapp',
                value: 'generate',
              },
              {
                title: 'Link your current wapp to an existing wapp',
                value: 'link',
              },
            ],
          },
        ]);
        if (answer !== false) {
          if (answer.create === 'link') {
            const wappAnswer = await this.ask([
              {
                name: 'wapp',
                type: 'select',
                message: 'Please choose the wapp to link with:',
                choices: wapps,
              },
            ]);
            if (wappAnswer === false) {
              return false;
            }
            answer.wapp = wappAnswer.wapp;
          }
        }
        return answer;
      } else {
        const answer = await this.ask([
          {
            name: 'create',
            type: 'confirm',
            message: 'Do you want to generate a new Wapp from existing wapp?',
          },
        ]);
        if (answer === false || !answer.create) {
          return false;
        }
        return {
          create: 'generate',
        };
      }
    }
  }

  async configureWapp(
    manifest: Manifest,
    oauthExternal: OauthExternal21[],
    oauthClient: OauthClient21[]
  ): Promise<JsonObjType | false> {
    const external = oauthExternal[0] || {};
    const client = oauthClient[0] || {};

    const type = await this.ask([
      {
        name: 'config',
        type: 'select' as const,
        message: 'What do you want to configure?',
        choices: [
          { title: 'Description', value: 'description' },
          { title: 'Multiple Installations', value: 'multi_installations' },
          {
            title: 'External OAuth',
            value: 'external_oauth',
          },
          { title: 'OAuth Client', value: 'oauth_client' },
          { title: 'Permissions', value: 'permissions' },
        ],
      },
    ]);

    if (type === false) {
      return false;
    }
    
    /* istanbul ignore next */
    function validateEmptyString(input: string) {
      return input.length > 0 ? true : 'You must enter a valid string';
    }

    function validateUrl(input: string) {
      return (
        input.match(/^https?:\/\/[\w\d./]+$/) ? true :
        'Please enter a valid url, starting with http(s)://'
      );
    }

    function optional(input: string, validator: (input: string) => boolean | string) {
      return input.length > 0 ? validator(input) : true;
    }

    function optionalUrl(input: string) {
      return optional(input, validateUrl);
    }

    const descriptionQuestions = [
      {
        name: 'name',
        validate: validateEmptyString,
        type: 'text' as const,
        initial: manifest.name,
        message: 'Name of the wapp:',
      },
      {
        name: 'author',
        validate: validateEmptyString,
        type: 'text' as const,
        initial: manifest.author,
        message: 'Name of the Author:',
      },
      {
        name: 'general',
        validate: validateEmptyString,
        type: 'text' as const,
        initial: manifest.description.general,
        message: 'General description of your wapp:',
      },
      {
        name: 'foreground',
        validate: validateEmptyString,
        type:
          manifest.supported_features.indexOf('foreground') !== -1
            ? ('text' as const)
            : null,
        message: 'Foreground description of your Wapp:',
      },
      {
        name: 'background',
        validate: validateEmptyString,
        type:
          manifest.supported_features.indexOf('background') !== -1
            ? ('text' as const)
            : null,
        message: 'Background description of your Wapp:',
      },
    ];

    const oauthExtQuestions = [
      {
        name: 'oauth_version',
        type: 'select' as const,
        choices: [
          { title: '1.0', value: '1.0' },
          { title: '2.0', value: '2.0' },
        ],
        initial: external.oauth_version === '2.0' ? 1 : 0,
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
        validate: validateUrl,
        initial: external.api_site,
        message: 'API Site:',
      },
      {
        name: 'api_callback',
        type: 'text' as const,
        initial: external.api_callback,
        message: 'API Callback:',
      },
      {
        name: 'access_token_method',
        type: 'select' as const,
        choices: [
          { title: 'GET', value: 'get' },
          { title: 'POST', value: 'post' },
        ],
        initial: external.access_token_method === 'post' ? 1 : 0,
        message: 'Access Token Method:',
      },
      {
        name: 'refresh_access_token_method',
        type: 'select' as const,
        choices: [
          { title: 'GET', value: 'get' },
          { title: 'POST', value: 'post' },
        ],
        initial: external.refresh_access_token_method === 'post' ? 1 : 0,
        message: 'Refresh Token Method:',
      },
      {
        name: 'oauth_request_token_url',
        type: 'text' as const,
        validate: optionalUrl,
        initial: external.oauth_request_token_url,
        message: 'Request Token URL:',
      },
      {
        name: 'oauth_access_token_url',
        type: 'text' as const,
        validate: optionalUrl,
        initial: external.oauth_access_token_url,
        message: 'Access Token URL:',
      },
      {
        name: 'oauth_refresh_access_token_url',
        type: 'text' as const,
        validate: optionalUrl,
        initial: external.oauth_refresh_access_token_url,
        message: 'Refresh Access Token URL:',
      },
      {
        name: 'api_extra_request',
        type: 'confirm' as const,
        initial: external.api_extra_request ? true : false,
        message: 'Extra Request:',
      },
      {
        name: 'api_extra_request_appid',
        type: (prev: JsonObjType, value: JsonObjType) => (value.api_extra_request ? 'text': null),
        initial: external.api_extra_request?.appid as string | undefined,
        message: 'Extra Request App ID:',
      },
      {
        name: 'api_extra_request_grant_type',
        type: (prev: JsonObjType, value: JsonObjType) => (value.api_extra_request ? 'text': null),
        initial: external.api_extra_request?.grant_type as string | undefined,
        message: 'Extra Request Grant Type:',
      },
      {
        name: 'api_extra_request_deviceid',
        type: (prev: JsonObjType, value: JsonObjType) => (value.api_extra_request ? 'text': null),
        initial: external.api_extra_request?.deviceid as string | undefined,
        message: 'Extra Request Device ID:',
      },
      {
        name: 'api_extra_request_devicename',
        type: (prev: JsonObjType, value: JsonObjType) => (value.api_extra_request ? 'text': null),
        initial: external.api_extra_request?.devicename as string | undefined,
        message: 'Extra Request Device Name:',
      },
      {
        name: 'api_extra_access_token',
        type: 'confirm' as const,
        initial: external.api_extra_access_token ? true : false,
        message: 'Extra Access Token:',
      },
      {
        name: 'api_extra_access_token_grant_type',
        type: (prev: JsonObjType, value: JsonObjType) => (value.api_extra_request ? 'text': null),
        initial: external.api_extra_access_token?.grant_type as string | undefined,
        message: 'Extra Access Token Grant Type:',
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
        initial: client.path_access_token?.[0],
        message: 'Path Access Token:',
      },
      {
        name: 'redirect_uri',
        type: 'text' as const,
        validate: validateEmptyString,
        initial: client.redirect_uri?.[0],
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
            title: 'Analytics',
            value: 'analytics',
            selected: manifest.permission?.create?.includes('analytics'),
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

    const multiInstallationsQuestions = [
      {
        name: 'allow',
        type: 'confirm' as const,
        message: 'Is this wapp allowed to be installed multiple times',
        initial: manifest.max_number_installation === 1 ? false : true,
      },
    ];

    let answers;
    switch (type.config) {
      case 'external_oauth':
        answers = await this.ask(oauthExtQuestions);
        if (answers !== false) {
          if(answers.api_extra_request) {
            answers.api_extra_request = {
              appid: answers.api_extra_request_appid,
              grant_type: answers.api_extra_request_grant_type,
              deviceid: answers.api_extra_request_deviceid,
              devicename: answers.api_extra_request_devicename
            };
          } else {
            delete answers.api_extra_request;
          }

          if(answers.api_extra_access_token) {
            answers.api_extra_access_token = {
              grant_type: answers.api_extra_access_token_grant_type
            };
          } else {
            delete answers.api_extra_access_token;
          }

          delete answers.api_extra_request_appid;
          delete answers.api_extra_request_grant_type;
          delete answers.api_extra_request_deviceid;
          delete answers.api_extra_request_devicename;
          delete answers.api_extra_access_token_grant_type;
        }
        break;
      case 'oauth_client':
        answers = await this.ask(oauthClientQuestions);
        break;
      case 'permissions':
        answers = await this.ask(permissionQuestions);
        break;
      case 'multi_installations':
        answers = await this.ask(multiInstallationsQuestions);
        break;
      case 'description':
      default:
        answers = await this.ask(descriptionQuestions);
        break;
    }

    if (answers !== false) {
      answers.type = type.config;
    }
    return answers;
  }

  deleteWapp(): Promise<Answers<string> | false> {
    return this.ask([
      {
        name: 'del',
        type: 'confirm' as const,
        message: 'Do you want to delete the Wapp?',
        initial: false,
      },
      {
        name: 'local',
        type: (prev: JsonObjType) => (prev ? 'confirm' : null),
        message: 'Do you want to delete the local files?',
      },
      {
        name: 'remote',
        type: (prev: JsonObjType, values: JsonObjType) =>
          values.del ? 'confirm' : null,
        message: 'Do you want to delete the Wapp on Wappsto?',
      },
    ]);
  }

  async precisePermissionRequest(
    request: Request,
    wappsto: Wappsto
  ): Promise<Answers<string> | false> {
    let msg = '';
    let type = 'data';

    if (request.collection) {
      type = Array.isArray(request.collection)
        ? request.collection[0]
        : request.collection.toString();
    }

    if (request.message) {
      msg = request.message;
    } else {
      const method = request.method?.length ? request.method[0] : 'save';
      msg = `${request.name_installation} would like to ${method} ${type} under your account. Allow?`;
      if (method === 'retrieve') {
        if (request.data) {
          const type = request.data[0].meta.type;
          const id = request.data[0].meta.id;
          const model = await wappsto.getModel(type, id);
          if (model) {
            if (model.name) {
              msg = `${request.name_installation} would like access to the ${type} ${model.name} (${id}). Allow?`;
            } else {
              msg = `${request.name_installation} would like access to the ${type} with id ${id}. Allow?`;
            }
          } else {
            Spinner.stop();
            tui.unblock();
            tui.showError(`Failed to find a ${type} with id ${id}`);
            return false;
          }
        }
      }
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
    data: { title: string; value: string }[]
  ): Promise<Answers<string> | false> {
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

  remoteVersionUpdated(): Promise<Answers<string> | false> {
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

  fileConflict(file: string): Promise<Answers<string> | false> {
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

  askDeleteLocalFile(file: string): Promise<Answers<string> | false> {
    return this.ask([
      {
        name: 'delete',
        type: 'confirm' as const,
        initial: true,
        message: `${file} was deleted on the server, do you want to delete the local file?`,
      },
    ]);
  }

  askOverwriteFiles(): Promise<Answers<string> | false> {
    return this.ask([
      {
        name: 'overwrite',
        type: 'confirm' as const,
        initial: false,
        message:
          'Do you want to overwrite your local files with example files?',
      },
    ]);
  }

  async askForNameIdentifier() {
    return this.ask([
      {
        name: 'identifier',
        type: 'text' as const,
        message: 'Enter a identifier for your wapp',
      },
    ]);
  }

  async askPublishWapp(
    manifest: Manifest,
    pendingVersion: boolean
  ): Promise<Answers<string> | false> {
    if (pendingVersion) {
      const override = await this.ask([
        {
          name: 'override',
          type: 'confirm',
          initial: () => true,
          message:
            'You already have a published version pending for review, do you want to unpublish this version?',
        },
      ]);
      if (override === false || !override.override) {
        return false;
      }
    }

    const [major_ver, minor_ver, patch_ver] = manifest.version_app.split('.');
    const major = `${Number(major_ver) + 1}.${minor_ver}.${patch_ver}`;
    const minor = `${major_ver}.${Number(minor_ver) + 1}.${patch_ver}`;
    const patch = `${major_ver}.${minor_ver}.${Number(patch_ver) + 1}`;

    return this.ask([
      {
        name: 'bump',
        message: `The version of the wapp is ${manifest.version_app}, what is the new version`,
        type: 'select',
        choices: [
          {
            title: `Major version ${major}`,
            value: major,
          },
          {
            title: `Minor version ${minor}`,
            value: minor,
          },
          {
            title: `Patch version ${patch}`,
            value: patch,
          },
          {
            title: 'Custom version',
            value: 'custom',
          },
        ],
      },
      {
        name: 'version',
        type: (prev: JsonObjType, values: JsonObjType) =>
          values.bump === 'custom' ? 'text' : null,
        initial: manifest.version_app,
        message: `The version of the wapp is ${manifest.version_app}, what is the new version`,
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
        initial: manifest.description.version,
        message: 'What changed in this version',
      },
    ]);
  }
}

const questions: Questions = new Questions();
export default questions;
