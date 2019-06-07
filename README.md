# wappsto-cli
[![Build Status](https://travis-ci.com/Wappsto/wappsto-cli.svg?branch=master)](https://travis-ci.com/Wappsto/wappsto-cli)
[![Depfu](https://badges.depfu.com/badges/c25acea9b059ab7760cb61d1de54f29d/overview.svg)](https://depfu.com/github/Wappsto/wappsto-cli?project_id=7056)
[![Coverage Status](https://coveralls.io/repos/github/Wappsto/wappsto-cli/badge.svg?branch=master)](https://coveralls.io/github/Wappsto/wappsto-cli?branch=master)

Command Line Interface for Wappsto, so that it is possible to create Wapps locally.

# Table of Contents
1. [Install](#install)
2. [Usage](#usage)
3. [Configuration](#configuration)
4. [Frameworks](#frameworks)
5. [Related](#related)
6. [License](#license)

## Install

Just install the package using npm.

```
npm install wappsto-cli --save-dev
```

## Usage

### Create

To create a Wapp run the `create-wapp` using `npx`:

```sh
npx create-wapp
```

It will ask for your 'username' and 'password' to Wappsto, unless you already logged in.
Here you get the option to download any exsisting Wapps or create a new Wapp.

This will generate a file called manifest.json where you can modify the description of your wapp.
### Update

To update the Wapp run the `update-wapp` using `npx`:

```sh
npx update-wapp
```

This will upload all your files to Wappsto and download any new files created for your Wapp.

### Run

To start a web server that will serve the Wapp run the `serve-wapp` using `npx`:

```sh
npx serve-wapp
```

This will run a local web server where you can test your wapp. It is default listen on port 3000.
Any notifications from your Wapp is presented in the terminal where you are running `serve-wapp`.

### Delete

To delete the Wapp run the `delete-wapp` using `npx`:

```sh
npx delete-wapp
```

This will delete your Wapp locally and/or remotely.

### Reinstall

To trigger a reinstall of the application run:
```sh
npx update-wapp --reinstall
```

## Configuration

You can configure wappsto-cli by creating a 'wappsto.json' file and add this:

```json
{
 "foreground": "foreground",
 "background": "background",
 "port": "3000"
}
```

Valid options is:

| Option     | Default      | Description                                           |
|------------|--------------|-------------------------------------------------------|
| foreground | `foreground` | The folder where the foreground files will be stored. |
| background | `background` | The folder where the background files will be stored. |
| port       | `3000`       | The port the web server will serve the Wapp on.       |

## Frameworks

Here is some examples on how to configure frameworks to work with wappsto-cli.

### React

If you are using React framework, you can [configure](https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development#configuring-the-proxy-manually) the React development server, by installing the following package:

```
npm install http-proxy-middleware --save
```

and creating a file `src/setupProxy.js` with this:

```js
const proxy = require('http-proxy-middleware');
const Wapp = require('wappsto-cli');

const wapp = new Wapp();

const HOST = wapp.host;
let sessionID = '';

const run = async () => {
    await wapp.init();
    sessionID = await wapp.getInstallationSession();
};
run();

module.exports = function(app) {
    app.use(proxy('/services', {
            target: HOST,
            changeOrigin: true,
            ws: true,
            logLevel: 'error',
    }));

    // set a cookie
    app.use((req, res, next) => {
        res.cookie('sessionID', sessionID, { maxAge: 900000 });
        next();
    });
};
```

And insert `"homepage": "./",` into your `package.json` file.

To use the build version of React, change the `foreground` configuration to `build` and then run `npm run build` to build the react application.
Then run `npx serve-wapp` to serve the build version of your react application.

## Related

- [wapp-api](https://github.com/wappsto/wapp-api)

## License

Apache 2.0 © [Seluxit A/S](https://www.seluxit.com)
