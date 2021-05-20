#!/usr/bin/env node

const tui = require('../lib/tui');

tui.header('Wappsto CLI Help');

tui.showMessage('Valid commands:');
tui.showMessage('npx create-wapp => Creates a new wapp in the current dir');
tui.showMessage('npx update-wapp => Syncs the files with Wappsto');
tui.showMessage('npx serve-wapp => Starts a local web server and serves your foreground files');
tui.showMessage('npx delete-wapp => Deletes the wapp from wappsto');
