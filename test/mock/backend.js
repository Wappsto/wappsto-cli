const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const mock = new MockAdapter(axios);
const store = {};

mock.onAny().reply((options) => {
    const url = options.url.indexOf('services') !== -1 ? options.url.split('/services/')[1] : options.url.split('/files/')[1];
    const { method } = options;
    let data = {};

    try {
        if (options.data && options.data[0] === '{') {
            data = JSON.parse(options.data);
        }
    } catch (err) {
        process.stderr.write(options.data);
        process.stderr.write(err);
    }

    const session = options.headers['x-session'];

    let status = 501;
    let res = {};
    switch (url) {
    case 'session':
        if (method === 'get') {
            if (session === 'session') {
                status = 200;
            } else {
                status = 401;
            }
        } else if (data.username === 'user@wappsto.com' && data.password === 'password') {
            status = 200;
            res = {
                meta: {
                    id: 'session',
                },
            };
        } else {
            status = 401;
        }
        break;
    case 'application?verbose=true':
    case 'application':
        if (method === 'post') {
            status = 201;
            data.meta = {
                id: 'application_id',
            };
            data.version[0].meta = {
                id: 'version_id',
            };
            store.application_id = data;
            [store.version_id] = data.version;
            res = data;
        }
        break;
    case 'application?expand=2&verbose=true':
        if (method === 'get') {
            status = 200;
            res = [];
            if (store.application_id) {
                res.push(store.application_id);
            }
        }
        break;

    case 'application/application_id?expand=2&verbose=true':
    case 'application/application_id':
        if (method === 'get') {
            status = 200;
            res = store.application_id;
        } else if (method === 'delete') {
            status = 200;
            delete store.application_id;
        }
        break;

    case 'version/version_id?expand=2&verbose=true':
    case 'version/version_id':
        if (method === 'get') {
            status = 200;
            res = store.version_id;
        } else if (method === 'delete') {
            delete store.application_id.version;
            delete store.version_id;
            status = 200;
        } else if (method === 'patch') {
            status = 200;

            if (data.file) {
                if (!data.file[0].meta) {
                    data.file[0].meta = {
                        id: 'file_id',
                    };
                }
                data.file[0].meta.updated = 'now';
            }

            Object.keys(data).forEach((key) => {
                if (Array.isArray(store.version_id[key])) {
                    store.version_id[key].push(data[key][0]);
                } else {
                    store.version_id[key] = data[key];
                }
            });

            store.application_id.version[0] = store.version_id;
            res = store.version_id;
        } else if (method === 'put') {
            status = 200;
        }
        break;

    case 'installation':
        if (method === 'post') {
            status = 201;
            data.meta = {
                id: 'installation_id',
            };
            if (!data.file) {
                data.file = [];
            }
            store.installation_id = data;
            res = data;
        }
        break;
    case 'installation?this_version_id=version_id':
        if (method === 'get') {
            status = 200;
            res = store.installation_id;
        } else if (method === 'delete') {
            status = 200;
            delete store.installation_id;
        }
        break;
    case 'version/wrong_version_id':
        status = 200;
        break;
    case 'installation?this_version_id=wrong_version_id':
        status = 401;
        res = {
            code: 300020,
        };
        break;
    case 'installation/installation_id':
        if (method === 'patch') {
            status = 200;
        }
        break;
    case 'installation?expand=2&this_version_id=version_id':
        if (method === 'get') {
            status = 200;
            res = store.installation_id;
        }
        break;
    case 'installation?expand=2&this_name=Wapp%20Creator':
        if (method === 'get') {
            status = 200;
            res = {
                session: 'sessionID',
            };
        }
        break;

    case 'file/file_id':
        if (method === 'get') {
            status = 200;
            res = 'file content';
        } else if (method === 'delete') {
            status = 200;
        }
        break;
    case 'stream':
        if (method === 'post') {
            status = 201;
            if (!data.meta) {
                data.meta = {
                    id: 'stream_id',
                };
            }
            store.stream_id = data;
            res = data;
        } else if (method === 'get') {
            status = 200;
            res = store.stream_id;
        }
        break;
    case 'stream?expand=2':
        status = 200;
        break;
    default:
        break;
    }
    if (status === 501) {
        process.stderr.write(`*** unhandled *** ${method} ${url}`);
        process.stderr.write(options);
    }
    return [status, res];
});
