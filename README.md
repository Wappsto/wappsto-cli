# wappsto-cli
[![Build Status](https://travis-ci.com/Wappsto/wappsto-cli.svg?branch=master)](https://travis-ci.com/Wappsto/wappsto-cli)
[![Depfu](https://badges.depfu.com/badges/c25acea9b059ab7760cb61d1de54f29d/overview.svg)](https://depfu.com/github/Wappsto/wappsto-cli?project_id=7056)
[![Coverage Status](https://coveralls.io/repos/github/Wappsto/wappsto-cli/badge.svg?branch=master)](https://coveralls.io/github/Wappsto/wappsto-cli?branch=master)

Command Line Interface for Wappsto, so that it is possible to create Wapps locally.


## Install

```
$ npm install wappsto-cli --save-dev
```

## Usage

### Create

To create a Wapp:

```sh
npx create-wapp
```

It will ask for your 'username' and 'password' to Wappsto, unless you already logged in.
Here you get the option to download any exsisting Wapps or create a new Wapp.

This will generate a file called manifest.json where you can modify the description of your wapp.
### Update

To update the Wapp:

```sh
npx update-wapp
```

This will upload all your files to Wappsto and download any new files created for your Wapp.

### Run

To run the Wapp:

```sh
npx serve-wapp
```

This will run a local web server where you can test your wapp. It is default listen on port 3000.
Any notifications from your Wapp is presented in the terminal where you are running 'serve-wapp'.

### Delete

To delete the Wapp:

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

### foreground

The folder where the foreground files will be stored. Default 'foreground'.

### background

The folder where the background files will be stored. Default 'background'.

### port

The port the web server will serve the Wapp on. Default '3000'.

## Related

- [wapp-api](https://github.com/wappsto/wapp-api)

## License

Apache 2.0 © [Seluxit A/S](https://www.seluxit.com)
