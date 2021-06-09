const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const mock = new MockAdapter(axios);
const store = {
    version: {},
    application: {},
    installation: {},
    file: {},
    stream: {},
};

mock.onAny().reply((options) => {
    const url = new URL(options.url);
    const { method } = options;
    const paths = url.pathname.split('/services/')[1].split('/');

    let path = paths.shift();
    if (['2.0', '2.1'].includes(path)) {
        path = paths.shift();
    }
    let id = paths.shift() || '';
    const query = url.search.replace('?', '');

    let data = {};
    let status = 501;
    let res = {};

    // console.log(`${method} ${path} (${id}) ${query}`);
    // console.log(store);
    try {
        if (options.data && options.data[0] === '{') {
            data = JSON.parse(options.data);
        }
    } catch (err) {
        process.stderr.write(options.data);
        process.stderr.write(err);
    }

    const session = options.headers['x-session'];

    switch (path) {
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

    case 'application':
        switch (method) {
        case 'post':
            if (id === '') {
                id = 'application_id';
            }
            status = 201;
            data.meta = {
                id,
                revision: 1,
            };
            data.version[0].meta = {
                id: 'version_id',
                revision: 1,
            };
            if (!data.version[0].file) {
                data.version[0].file = [];
            }
            store.application[id] = data;
            [store.version.version_id] = data.version;
            res = data;
            break;
        case 'get':
            if (id === '') {
                status = 200;
                res = Object.values(store.application);
            } else {
                status = 200;
                res = store.application[id];
            }
            break;
        case 'delete':
            status = 200;
            delete store.application[id];
            break;
        default:
        }
        break;

    case 'version':
        switch (method) {
        case 'get':
            status = 200;
            if (!store.version[id].file) {
                store.version[id].file = [];
            }
            if (!store.version[id].meta) {
                store.version[id].meta = { id: 'version_id' };
            }
            if (!store.version[id].meta.revision) {
                store.version[id].meta.revision = 1;
            }
            res = store.version[id];
            break;
        case 'delete':
            if (store.application.application_id) {
                delete store.application.application_id;
            }
            delete store.version[id];
            status = 200;
            break;
        case 'patch':
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
                if (Array.isArray(store.version[id][key])) {
                    if (!store.version[id][key].includes(data[key][0])) {
                        store.version[id][key].push(data[key][0]);
                    }
                } else {
                    store.version[id][key] = data[key];
                }
            });

            store.application.application_id.version[0] = store.version[id];
            res = store.version[id];
            break;
        default:
        }
        break;

    case 'installation':
        switch (method) {
        case 'post':
            if (id === '') {
                id = 'installation_id';
            }
            status = 201;
            data.meta = {
                id,
            };
            if (!data.file) {
                data.file = [];
            }
            store.installation[id] = data;
            res = data;
            break;
        case 'get':
            if (query === 'expand=2&this_name=Wapp%20Creator') {
                status = 200;
                res = {
                    session: 'sessionID',
                };
            } else if (query === 'expand=2&this_version_id=version_id') {
                status = 200;
                res = store.installation.installation_id;
            } else if (store.installation[id]) {
                status = 200;
                res = store.installation[id];
            } else {
                status = 404;
            }
            break;
        case 'patch':
            if (store.installation[id]) {
                status = 200;
                res = store.installation[id];
            } else {
                status = 404;
            }
            break;
        case 'delete':
            if (query === 'this_version_id=version_id') {
                status = 200;
                delete store.installation.version_id;
            } else if (query === 'this_version_id=wrong_version_id') {
                status = 401;
                res = {
                    code: 300020,
                };
            } else if (id === 'wrong_version_id') {
                status = 404;
            }
            break;
        default:
        }
        break;

    case 'file':
        switch (method) {
        case 'get':
            status = 200;
            res = 'file content';
            break;
        case 'delete':
            status = 200;
            break;
        default:
        }
        break;

    case 'stream':
        if (method === 'post') {
            if (id === '') {
                id = 'stream_id';
            }
            status = 201;
            if (!data.meta) {
                data.meta = {
                    id,
                };
            }
            store.stream[id] = data;
            res = data;
        } else if (method === 'get') {
            if (id === '') {
                status = 200;
                res = Object.values(store.stream);
            } else if (store.stream[id]) {
                status = 200;
                res = store.stream[id];
            } else {
                status = 404;
            }
        }
        break;

    case 'network':
        switch (method) {
        case 'get':
            status = 200;
            if (query.includes('[wrong]')) {
                res = [];
            } else {
                res = [{
                    meta: {
                        id: 'network_id',
                    },
                    name: 'network',
                }];
            }
            break;
        default:
        }
        break;

    case 'acl':
        switch (method) {
        case 'patch':
            status = 200;
            break;
        default:
        }
        break;

    case 'notification':
        switch (method) {
        case 'patch':
            status = 200;
            break;
        default:
        }
        break;
    default:
        break;
    }

    if (status !== 200) {
        if (status === 501) {
            process.stderr.write(`*** unhandled *** ${method} ${url}\n`);
        }
        if (!Object.keys(res).length) {
            res = { };
        }
    }

    return [status, res];
});
