import * as Sentry from '@sentry/node';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { Mutex } from 'async-mutex';
import pick from 'lodash.pick';
import WebSocket from 'ws';
import fs, { statSync, existsSync, mkdirSync, unlinkSync, rmSync, readFileSync, writeFileSync, readdirSync, copyFileSync, createReadStream, createWriteStream } from 'fs';
import { yellow, magenta, green, blue, red, bold, white } from 'kleur/colors';
import figlet from 'figlet';
import { clearLine, cursorTo } from 'readline';
import updateNotifier from 'simple-update-notifier';
import axios from 'axios';
import '@sentry/tracing';
import FormData from 'form-data';
import { clearLine as clearLine$1, cursorTo as cursorTo$1 } from 'node:readline';
import prompt from 'prompts';
import url, { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import watch from 'node-watch';
import detect from 'detect-port';
import spawn from 'cross-spawn';
import browserSync from 'browser-sync';

function _regeneratorRuntime() {
  _regeneratorRuntime = function () {
    return exports;
  };
  var exports = {},
    Op = Object.prototype,
    hasOwn = Op.hasOwnProperty,
    defineProperty = Object.defineProperty || function (obj, key, desc) {
      obj[key] = desc.value;
    },
    $Symbol = "function" == typeof Symbol ? Symbol : {},
    iteratorSymbol = $Symbol.iterator || "@@iterator",
    asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator",
    toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  function define(obj, key, value) {
    return Object.defineProperty(obj, key, {
      value: value,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), obj[key];
  }
  try {
    define({}, "");
  } catch (err) {
    define = function (obj, key, value) {
      return obj[key] = value;
    };
  }
  function wrap(innerFn, outerFn, self, tryLocsList) {
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator,
      generator = Object.create(protoGenerator.prototype),
      context = new Context(tryLocsList || []);
    return defineProperty(generator, "_invoke", {
      value: makeInvokeMethod(innerFn, self, context)
    }), generator;
  }
  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }
  exports.wrap = wrap;
  var ContinueSentinel = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });
  var getProto = Object.getPrototypeOf,
    NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype);
  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      define(prototype, method, function (arg) {
        return this._invoke(method, arg);
      });
    });
  }
  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if ("throw" !== record.type) {
        var result = record.arg,
          value = result.value;
        return value && "object" == typeof value && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) {
          invoke("next", value, resolve, reject);
        }, function (err) {
          invoke("throw", err, resolve, reject);
        }) : PromiseImpl.resolve(value).then(function (unwrapped) {
          result.value = unwrapped, resolve(result);
        }, function (error) {
          return invoke("throw", error, resolve, reject);
        });
      }
      reject(record.arg);
    }
    var previousPromise;
    defineProperty(this, "_invoke", {
      value: function (method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function (resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }
        return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(innerFn, self, context) {
    var state = "suspendedStart";
    return function (method, arg) {
      if ("executing" === state) throw new Error("Generator is already running");
      if ("completed" === state) {
        if ("throw" === method) throw arg;
        return doneResult();
      }
      for (context.method = method, context.arg = arg;;) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }
        if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) {
          if ("suspendedStart" === state) throw state = "completed", context.arg;
          context.dispatchException(context.arg);
        } else "return" === context.method && context.abrupt("return", context.arg);
        state = "executing";
        var record = tryCatch(innerFn, self, context);
        if ("normal" === record.type) {
          if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue;
          return {
            value: record.arg,
            done: context.done
          };
        }
        "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg);
      }
    };
  }
  function maybeInvokeDelegate(delegate, context) {
    var methodName = context.method,
      method = delegate.iterator[methodName];
    if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel;
    var record = tryCatch(method, delegate.iterator, context.arg);
    if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel;
    var info = record.arg;
    return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel);
  }
  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };
    1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry);
  }
  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal", delete record.arg, entry.completion = record;
  }
  function Context(tryLocsList) {
    this.tryEntries = [{
      tryLoc: "root"
    }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) return iteratorMethod.call(iterable);
      if ("function" == typeof iterable.next) return iterable;
      if (!isNaN(iterable.length)) {
        var i = -1,
          next = function next() {
            for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next;
            return next.value = undefined, next.done = !0, next;
          };
        return next.next = next;
      }
    }
    return {
      next: doneResult
    };
  }
  function doneResult() {
    return {
      value: undefined,
      done: !0
    };
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: !0
  }), defineProperty(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: !0
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) {
    var ctor = "function" == typeof genFun && genFun.constructor;
    return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name));
  }, exports.mark = function (genFun) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun;
  }, exports.awrap = function (arg) {
    return {
      __await: arg
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    void 0 === PromiseImpl && (PromiseImpl = Promise);
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
    return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () {
    return this;
  }), define(Gp, "toString", function () {
    return "[object Generator]";
  }), exports.keys = function (val) {
    var object = Object(val),
      keys = [];
    for (var key in object) keys.push(key);
    return keys.reverse(), function next() {
      for (; keys.length;) {
        var key = keys.pop();
        if (key in object) return next.value = key, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, exports.values = values, Context.prototype = {
    constructor: Context,
    reset: function (skipTempReset) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined);
    },
    stop: function () {
      this.done = !0;
      var rootRecord = this.tryEntries[0].completion;
      if ("throw" === rootRecord.type) throw rootRecord.arg;
      return this.rval;
    },
    dispatchException: function (exception) {
      if (this.done) throw exception;
      var context = this;
      function handle(loc, caught) {
        return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught;
      }
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i],
          record = entry.completion;
        if ("root" === entry.tryLoc) return handle("end");
        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc"),
            hasFinally = hasOwn.call(entry, "finallyLoc");
          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
            if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
          } else {
            if (!hasFinally) throw new Error("try statement without catch or finally");
            if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
          }
        }
      }
    },
    abrupt: function (type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }
      finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null);
      var record = finallyEntry ? finallyEntry.completion : {};
      return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record);
    },
    complete: function (record, afterLoc) {
      if ("throw" === record.type) throw record.arg;
      return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel;
    },
    finish: function (finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel;
      }
    },
    catch: function (tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if ("throw" === record.type) {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }
      throw new Error("illegal catch attempt");
    },
    delegateYield: function (iterable, resultName, nextLoc) {
      return this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      }, "next" === this.method && (this.arg = undefined), ContinueSentinel;
    }
  }, exports;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

function directoryExists(filePath) {
  try {
    return statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}
function fileExists(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
function createFolders(dir) {
  var paths = dir.split('/').slice(0, -1);
  var path = '';
  paths.forEach(function (p) {
    path += p + "/";
    if (!existsSync(path)) {
      mkdirSync(path);
    }
  });
}
function copyFile(src, dst) {
  copyFileSync(src, dst);
}
function deleteFile(file) {
  if (existsSync(file) && statSync(file).isFile()) {
    unlinkSync(file);
  }
}
function deleteFolder(dir) {
  if (existsSync(dir)) {
    rmSync(dir, {
      recursive: true,
      force: true
    });
  }
}
function loadFile(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch (err) {
    return '';
  }
}
function loadJsonFile(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    return {};
  }
}
function saveFile(file, data) {
  writeFileSync(file, data);
}
function saveJsonFile(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 4));
}
function getAllFiles(dir, filter, ignoreDir) {
  var files = [];
  try {
    if (statSync(dir).isDirectory()) {
      readdirSync(dir).forEach(function (f) {
        if (!ignoreDir.includes(f)) {
          var filePath = dir + "/" + f;
          if (statSync(filePath).isFile()) {
            if (filter(filePath)) {
              files.push(filePath);
            }
          } else {
            files = files.concat(getAllFiles(filePath, filter, ignoreDir));
          }
        }
      });
    }
  } catch (err) {
    return [];
  }
  return files;
}
function getFileTime(file) {
  var fileTime;
  if (fileExists(file)) {
    fileTime = statSync(file).mtime;
  }
  return fileTime;
}
function getFileTimeISO(file) {
  var fileTime = getFileTime(file);
  if (fileTime) {
    return fileTime.toISOString();
  }
  return '';
}

var Config = /*#__PURE__*/function () {
  function Config() {
    this.custom = void 0;
    this.custom = loadJsonFile('wappsto.json');
  }
  var _proto = Config.prototype;
  _proto.foreground = function foreground() {
    return this.custom.foreground || 'foreground';
  };
  _proto.background = function background() {
    return this.custom.background || 'background';
  };
  _proto.host = function host() {
    return this.custom.host || 'https://wappsto.com';
  };
  _proto.env = function env() {
    if (this.host().includes('dev.')) {
      return 'development';
    }
    if (this.host().includes('qa.')) {
      return 'testing';
    }
    if (this.host().includes('staging.')) {
      return 'staging';
    }
    return 'production';
  };
  _proto.hostname = function hostname() {
    return this.host().split('//')[1];
  };
  _proto.websocket = function websocket() {
    return this.custom.websocket || "wss://" + this.hostname();
  };
  _proto.isCustomHost = function isCustomHost() {
    return !!this.custom.host;
  };
  _proto.port = function port() {
    return this.custom.port || 3000;
  };
  _proto.cacheFolder = function cacheFolder() {
    if (this.custom.cacheFolder) {
      if (!this.custom.cacheFolder.endsWith('/')) {
        this.custom.cacheFolder += '/';
      }
      return this.custom.cacheFolder;
    }
    return '.wappsto-cli-cache/';
  };
  _proto.reload = function reload() {
    this.custom = loadJsonFile('wappsto.json');
  };
  _proto.browser = function browser() {
    return this.custom.browser || 'default';
  };
  return Config;
}();
var config = /*#__PURE__*/new Config();

var VERSION = "2.0.0";

var Tui = /*#__PURE__*/function () {
  function Tui() {
    this.traceEnabled = false;
    this.debug = false;
    this.verbose = false;
    this.blocked = null;
  }
  var _proto = Tui.prototype;
  _proto.checkForUpdate = function checkForUpdate() {
    return updateNotifier({
      pkg: {
        name: 'wappsto-cli',
        version: VERSION
      }
    });
  };
  _proto.clear = function clear() {
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
  };
  _proto.header = function header(text) {
    this.clear();
    this.write("\n" + yellow(figlet.textSync(text, {
      font: 'ANSI Shadow',
      horizontalLayout: 'full'
    })) + "\r");
    this.write(magenta("[Wappsto CLI - Seluxit A/S - Version: " + VERSION + "]") + "\n\n");
    return this.checkForUpdate();
  };
  _proto.block = function block() {
    this.blocked = [];
  };
  _proto.unblock = function unblock() {
    var _this = this;
    var tmp = this.blocked;
    this.blocked = null;
    if (tmp) {
      tmp.forEach(function (item) {
        _this.write(item);
      });
    }
  };
  _proto.showLog = function showLog(msg, type, timestamp, logType) {
    var res = '';
    if (timestamp) {
      res = magenta(timestamp + ":") + " ";
    }
    if (type) {
      if (type === 'Background') {
        res += green(type);
      } else {
        res += blue(type);
      }
      res += ' - ';
    }
    if (logType === 'error') {
      res += red(msg);
    } else if (logType === 'warn') {
      res += yellow(msg);
    } else {
      res += msg;
    }
    this.showMessage(res);
  };
  _proto.showTraffic = function showTraffic(method, url, input, output) {
    if (this.debug) {
      this.clear();
      if (input.password) {
        input.password = '*****';
      }
      this.write(yellow('T') + " " + yellow('HTTP') + " - " + green(method) + " " + blue(url));
      this.write(': ');
      try {
        this.write(JSON.stringify(input));
      } catch (e) {
        console.log(input);
        this.write(red('Circular Structure'));
      }
      this.write(" " + yellow('=>') + " ");
      try {
        this.write(JSON.stringify(output));
      } catch (e) {
        this.write(blue('Binary Data'));
      }
      this.write('\n');
    }
  };
  _proto.showVerbose = function showVerbose(type, msg, data) {
    if (this.verbose) {
      this.clear();
      this.write(yellow('I') + " " + yellow(type) + " - " + green(msg));
      if (data) {
        this.write(" => " + JSON.stringify(data));
      }
      this.write('\n');
    }
  };
  _proto.showDebug = function showDebug(type, msg, data) {
    if (this.debug) {
      this.clear();
      this.write(yellow('D') + " " + blue(type) + " - " + green(msg));
      if (data) {
        this.write(" => " + JSON.stringify(data));
      }
      this.write('\n');
    }
  };
  _proto.showMessage = function showMessage(msg, str, end) {
    this.clear();
    this.write(green('*') + " " + bold(white(msg)));
    if (str) {
      this.write(str);
    }
    this.write(end || '\n');
  };
  _proto.showStatus = function showStatus(msg) {
    this.clear();
    this.write(green('*') + " " + bold(green(msg)) + "\n");
  };
  _proto.showWarning = function showWarning(msg) {
    this.clear();
    this.write(red('!') + " " + bold(yellow(msg)) + "\n");
  };
  _proto.showError = function showError(msg, err) {
    var strMsg = bold(red(msg));
    var strErr = '';
    if (err) {
      var data;
      if (err.response && err.response.data) {
        data = err.response.data;
      } else if (err.data) {
        data = err.data;
      }
      if (data) {
        if (data.code === 117000000) ; else if (data.code === 300098) {
          strMsg += red(data.message) + "\n";
          strMsg += "Please visit " + config.host() + "/pricing for more information";
        } else {
          strErr = JSON.stringify(data) + "\n";
        }
      } else if (err.stack) {
        console.error(err);
      } else if (typeof err === 'string') {
        strErr = err + "\n";
      } else {
        strErr = JSON.stringify(err) + "\n";
      }
    }
    this.clear();
    this.write("\r" + red('!') + " " + strMsg + "\n");
    if (this.verbose && strErr) {
      this.write(strErr);
    }
  };
  _proto.trace = function trace(model, method, data) {
    if (!this.traceEnabled) {
      return;
    }
    var str = bold(red(model)) + "." + bold(blue(method));
    if (data) {
      console.trace(str, data);
    } else {
      console.trace(str);
    }
  };
  _proto.write = function write(msg) {
    if (this.blocked) {
      this.blocked.push(msg);
      return;
    }
    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write(msg);
    }
  };
  return Tui;
}();
var tui = /*#__PURE__*/new Tui();

var Stream = /*#__PURE__*/function () {
  function Stream(wappsto, subscription, callback, session, installation_id, remote) {
    this.ws = void 0;
    this.wappsto = void 0;
    this.subscription = void 0;
    this.installation_id = void 0;
    this.remote = true;
    this.last_permission_request = void 0;
    this.last_stream_event = void 0;
    this.session = void 0;
    this.callback = void 0;
    this.wappsto = wappsto;
    this.session = session || '';
    this.callback = callback;
    this.subscription = subscription;
    this.installation_id = installation_id || '';
    this.remote = remote === undefined ? true : remote;
  }
  var _proto = Stream.prototype;
  _proto.open = function open() {
    var _this = this;
    var subStr = '';
    this.subscription.forEach(function (s) {
      if (subStr !== '') {
        subStr += ',';
      }
      subStr += s;
    });
    subStr = "[" + subStr + "]";
    var host = config.host().split('//')[1];
    var ses = this.session || this.wappsto.session.id;
    var wss = config.websocket() + "/services/2.1/websocket/open?x-session=" + ses + "&subscription=" + subStr;
    var reconnectInterval = 10 * 1000;
    var connect = function connect() {
      _this.ws = new WebSocket(wss, {
        origin: "https://" + host
      });
      _this.ws.on('close', function (code, msg) {
        switch (code) {
          case 1000:
            setTimeout(connect, 1);
            break;
          default:
            tui.showError("Stream closed: " + msg + " (" + code + ")");
            setTimeout(connect, reconnectInterval);
        }
      });
      _this.ws.on('error', function (err) {
        tui.showError("Stream error", err);
      });
      _this.ws.on('message', function (message) {
        _this.parseStreamEvent(message, _this.callback);
      });
    };
    connect();
  };
  _proto.close = function close() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  };
  _proto.printConsoleMessage = function printConsoleMessage(data, callback) {
    if (!this.remote) {
      return;
    }
    var body = JSON.parse(data.body);
    var msg = '';
    var timestamp = new Date(body.time).toLocaleTimeString();
    Object.keys(body.arguments).forEach(function (key) {
      if (typeof body.arguments[key] === 'string') {
        msg += body.arguments[key] + " ";
      } else {
        msg += JSON.stringify(body.arguments[key]);
      }
    });
    var eventMsg = {
      type: 'Background',
      timestamp: timestamp
    };
    switch (body.key) {
      case 'log':
        eventMsg.log = msg;
        break;
      case 'error':
        eventMsg.error = msg;
        break;
      case 'warn':
        eventMsg.warn = msg;
        break;
      default:
        eventMsg.log = "Unknown Background Message '" + body.key + "' - " + msg;
    }
    callback(eventMsg);
  };
  _proto.handleNotification = /*#__PURE__*/function () {
    var _handleNotification = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(data, callback) {
      var readNotification;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (!(data.read !== 'unread')) {
              _context.next = 2;
              break;
            }
            return _context.abrupt("return");
          case 2:
            if (!(this.installation_id && data.base.from !== this.installation_id)) {
              _context.next = 4;
              break;
            }
            return _context.abrupt("return");
          case 4:
            readNotification = true;
            _context.t0 = data.base.code;
            _context.next = _context.t0 === 1100028 ? 8 : _context.t0 === 1100031 ? 10 : _context.t0 === 1100002 ? 10 : _context.t0 === 1100003 ? 10 : _context.t0 === 1100006 ? 12 : _context.t0 === 1100004 ? 12 : 13;
            break;
          case 8:
            if (data.custom.code === 1299999) {
              callback({
                reinstall: true,
                log: data.custom.description
              });
            } else {
              callback({
                status: data.custom.description
              });
            }
            return _context.abrupt("break", 14);
          case 10:
            if (this.last_permission_request !== data.timestamp) {
              this.last_permission_request = data.timestamp;
              readNotification = false;
              callback({
                req: data.custom,
                action: data.base.action,
                installation: data.base.from,
                id: data.meta.id
              });
            }
            return _context.abrupt("break", 14);
          case 12:
            return _context.abrupt("break", 14);
          case 13:
            callback(data);
          case 14:
            if (!readNotification) {
              _context.next = 17;
              break;
            }
            _context.next = 17;
            return this.wappsto.readNotification(data.meta.id);
          case 17:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }));
    function handleNotification(_x, _x2) {
      return _handleNotification.apply(this, arguments);
    }
    return handleNotification;
  }();
  _proto.parseStreamEvent = /*#__PURE__*/function () {
    var _parseStreamEvent = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(message, callback) {
      var event, data, msg;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            event = JSON.parse(message);
            if (!(!event.meta || !event.meta.id)) {
              _context2.next = 4;
              break;
            }
            return _context2.abrupt("return");
          case 4:
            if (!(this.last_stream_event === event.meta.id)) {
              _context2.next = 6;
              break;
            }
            return _context2.abrupt("return");
          case 6:
            this.last_stream_event = event.meta.id;
            if (!(event.event === 'delete')) {
              _context2.next = 9;
              break;
            }
            return _context2.abrupt("return");
          case 9:
            data = event.data;
            _context2.t0 = event.meta_object.type;
            _context2.next = _context2.t0 === 'state' ? 13 : _context2.t0 === 'installation' ? 14 : _context2.t0 === 'extsync' ? 16 : _context2.t0 === 'notification' ? 18 : _context2.t0 === 'console' ? 21 : 26;
            break;
          case 13:
            return _context2.abrupt("break", 27);
          case 14:
            callback({
              application: data.application,
              status: 'Installation Updated',
              session: true
            });
            return _context2.abrupt("break", 27);
          case 16:
            try {
              if (data.uri !== 'extsync/wappsto/editor/console') {
                callback({
                  log: data.body,
                  type: 'ExtSync IN',
                  timestamp: new Date().toLocaleTimeString()
                });
              } else {
                this.printConsoleMessage(data, callback);
              }
            } catch (err) {
              tui.showError(err);
              callback(data.body);
            }
            return _context2.abrupt("break", 27);
          case 18:
            _context2.next = 20;
            return this.handleNotification(data, callback);
          case 20:
            return _context2.abrupt("break", 27);
          case 21:
            if (!(event.type === 'error')) {
              _context2.next = 26;
              break;
            }
            msg = data;
            if (event.extra && event.extra.output) {
              msg += "\n" + event.extra.output;
            }
            callback({
              error: msg,
              type: 'Background',
              timestamp: event.timestamp
            });
            return _context2.abrupt("break", 27);
          case 26:
            callback(data);
          case 27:
            _context2.next = 32;
            break;
          case 29:
            _context2.prev = 29;
            _context2.t1 = _context2["catch"](0);
            tui.showError('Failed to handle stream event', _context2.t1);
          case 32:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this, [[0, 29]]);
    }));
    function parseStreamEvent(_x3, _x4) {
      return _parseStreamEvent.apply(this, arguments);
    }
    return parseStreamEvent;
  }();
  return Stream;
}();

var transaction$1;
function startTrace(command) {
  if (process.env.NODE_ENV !== 'test') {
    Sentry.init({
      dsn: 'https://ef7592dc40c34510b9246633e453ef0e@sentry.iot.seluxit.com/124',
      tracesSampleRate: 1.0,
      environment: config.env(),
      release: "wappsto-cli@" + VERSION
    });
    transaction$1 = Sentry.startTransaction({
      op: command,
      name: "Wappsto CLI - " + command
    });
  }
  return transaction$1;
}
function setUser(session) {
  if (process.env.NODE_ENV !== 'test') {
    Sentry.setUser({
      id: session.user || 'unknown user'
    });
  }
}
var Trace = /*#__PURE__*/function () {
  function Trace(name, description, data) {
    this.span = void 0;
    if (process.env.NODE_ENV !== 'test') {
      if (transaction$1) {
        this.span = transaction$1.startChild({
          op: name,
          description: description
        });
        if (data) {
          var _this$span;
          (_this$span = this.span) == null ? void 0 : _this$span.setData('data', data);
        }
      }
    }
  }
  var _proto = Trace.prototype;
  _proto.ok = function ok() {
    if (this.span) {
      this.span.setStatus('ok');
    }
  };
  _proto.error = function error(status) {
    if (this.span) {
      var _status$response;
      if (typeof status === 'string') {
        this.span.setStatus(status);
      } else if ((_status$response = status.response) != null && _status$response.status) {
        this.span.setStatus(status.response.status);
      } else {
        this.span.setStatus('unknown');
      }
    }
  };
  _proto.done = function done(status) {
    if (this.span) {
      if (status) {
        this.error(status);
      } else {
        this.ok();
      }
      this.span.finish();
    }
  };
  return Trace;
}();

var HTTP = /*#__PURE__*/function () {
  function HTTP() {}
  HTTP.trace = function trace(method, url, data) {
    return new Trace("HTTP " + method, url, data);
  };
  HTTP.setHeader = function setHeader(name, value) {
    axios.defaults.headers.common[name] = value;
  };
  HTTP.removeHeader = function removeHeader(name) {
    delete axios.defaults.headers.common[name];
  };
  HTTP.wrap = /*#__PURE__*/function () {
    var _wrap = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(func, url, data, config) {
      var t, response, _err$response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (data === void 0) {
              data = {};
            }
            t = HTTP.trace(func, url);
            _context.prev = 2;
            if (!(config === undefined)) {
              _context.next = 9;
              break;
            }
            _context.next = 6;
            return axios[func](url, data);
          case 6:
            response = _context.sent;
            _context.next = 12;
            break;
          case 9:
            _context.next = 11;
            return axios[func](url, data, config);
          case 11:
            response = _context.sent;
          case 12:
            tui.showTraffic(func, url, data, response.data);
            t.done();
            return _context.abrupt("return", response);
          case 17:
            _context.prev = 17;
            _context.t0 = _context["catch"](2);
            if (axios.isAxiosError(_context.t0)) {
              tui.showTraffic(func, url, data, (_err$response = _context.t0.response) == null ? void 0 : _err$response.data);
            }
            t.done(_context.t0);
            throw _context.t0;
          case 22:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[2, 17]]);
    }));
    function wrap(_x, _x2, _x3, _x4) {
      return _wrap.apply(this, arguments);
    }
    return wrap;
  }();
  HTTP.get = /*#__PURE__*/function () {
    var _get = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(url, options) {
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            if (options === void 0) {
              options = {};
            }
            return _context2.abrupt("return", HTTP.wrap('get', url, options));
          case 2:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    function get(_x5, _x6) {
      return _get.apply(this, arguments);
    }
    return get;
  }();
  HTTP.post = /*#__PURE__*/function () {
    var _post = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(url, data, options) {
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            if (options === void 0) {
              options = {};
            }
            return _context3.abrupt("return", HTTP.wrap('post', url, data, options));
          case 2:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    function post(_x7, _x8, _x9) {
      return _post.apply(this, arguments);
    }
    return post;
  }();
  HTTP.put = /*#__PURE__*/function () {
    var _put = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(url, data, options) {
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            if (options === void 0) {
              options = {};
            }
            return _context4.abrupt("return", HTTP.wrap('put', url, data, options));
          case 2:
          case "end":
            return _context4.stop();
        }
      }, _callee4);
    }));
    function put(_x10, _x11, _x12) {
      return _put.apply(this, arguments);
    }
    return put;
  }();
  HTTP.patch = /*#__PURE__*/function () {
    var _patch = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(url, data, options) {
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            if (options === void 0) {
              options = {};
            }
            return _context5.abrupt("return", HTTP.wrap('patch', url, data, options));
          case 2:
          case "end":
            return _context5.stop();
        }
      }, _callee5);
    }));
    function patch(_x13, _x14, _x15) {
      return _patch.apply(this, arguments);
    }
    return patch;
  }();
  HTTP["delete"] = /*#__PURE__*/function () {
    var _delete2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(url, options) {
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            if (options === void 0) {
              options = {};
            }
            return _context6.abrupt("return", HTTP.wrap('delete', url, options));
          case 2:
          case "end":
            return _context6.stop();
        }
      }, _callee6);
    }));
    function _delete(_x16, _x17) {
      return _delete2.apply(this, arguments);
    }
    return _delete;
  }();
  return HTTP;
}();

var Model = /*#__PURE__*/function () {
  function Model(type) {
    this.meta = {
      id: '',
      type: '',
      version: '2.1',
      revision: 1,
      updated: ''
    };
    this.HOST = void 0;
    this.cacheFolder = void 0;
    tui.trace('model', 'constructor');
    this.meta.type = type;
    this.HOST = Model.getHost(type);
    this.cacheFolder = config.cacheFolder();
  }
  Model.getHost = function getHost(type) {
    return config.host() + "/services/2.1/" + type;
  };
  var _proto = Model.prototype;
  _proto.getAttributes = function getAttributes() {
    return [];
  };
  _proto.toJSON = function toJSON(full) {
    var meta = Object.assign({}, pick(this.meta, ['id', 'type', 'version', 'revision', 'updated']));
    var json = Object.assign({
      meta: meta
    }, this.removeUndefined(pick(this, this.getAttributes())));
    return json;
  };
  _proto.parse = function parse(data) {
    try {
      Object.assign(this, pick(data, this.getAttributes().concat(['meta'])));
    } catch (err) {
      this.handleException("Failed to parse data in " + this.meta.type, err);
    }
  };
  _proto.save = function save() {
    var data = this.toJSON();
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    saveFile("" + this.cacheFolder + this.meta.type, data);
  };
  _proto.load = function load() {
    var data = loadFile("" + this.cacheFolder + this.meta.type);
    if (data) {
      try {
        data = JSON.parse(data);
      } catch (e) {}
      this.parse(data);
    }
  };
  _proto.clear = function clear() {
    deleteFile("" + this.cacheFolder + this.meta.type);
  };
  _proto.fetch = /*#__PURE__*/function () {
    var _fetch = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return HTTP.get(this.url + "?expand=2&verbose=true");
          case 3:
            response = _context.sent;
            this.parse(response.data);
            return _context.abrupt("return", true);
          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](0);
            this.handleException("Failed to fetch " + this.meta.type, _context.t0);
          case 11:
            return _context.abrupt("return", false);
          case 12:
          case "end":
            return _context.stop();
        }
      }, _callee, this, [[0, 8]]);
    }));
    function fetch() {
      return _fetch.apply(this, arguments);
    }
    return fetch;
  }();
  _proto.update = /*#__PURE__*/function () {
    var _update = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
      var response;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return HTTP.patch("" + this.url, this.toJSON(false));
          case 3:
            response = _context2.sent;
            this.parse(response.data);
            return _context2.abrupt("return", true);
          case 8:
            _context2.prev = 8;
            _context2.t0 = _context2["catch"](0);
            this.handleException("Failed to update " + this.meta.type + ": " + this.id, _context2.t0);
          case 11:
            return _context2.abrupt("return", false);
          case 12:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this, [[0, 8]]);
    }));
    function update() {
      return _update.apply(this, arguments);
    }
    return update;
  }();
  _proto["delete"] = /*#__PURE__*/function () {
    var _delete2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return HTTP["delete"]("" + this.url);
          case 3:
            _context3.next = 14;
            break;
          case 5:
            _context3.prev = 5;
            _context3.t0 = _context3["catch"](0);
            _context3.t1 = _context3.t0.response.data.code;
            _context3.next = _context3.t1 === 300020 ? 10 : _context3.t1 === 9900067 ? 11 : _context3.t1 === 300024 ? 12 : 13;
            break;
          case 10:
            return _context3.abrupt("break", 14);
          case 11:
            return _context3.abrupt("break", 14);
          case 12:
            throw Error('Can not delete application that is published!');
          case 13:
            this.handleException("Failed to delete " + this.meta.type + ": " + this.id, _context3.t0);
          case 14:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this, [[0, 5]]);
    }));
    function _delete() {
      return _delete2.apply(this, arguments);
    }
    return _delete;
  }();
  _proto.removeUndefined = function removeUndefined(obj, deep) {
    var _this = this;
    if (deep === void 0) {
      deep = 10;
    }
    if (obj && deep > 0) {
      Object.keys(obj).forEach(function (key) {
        var value = obj[key];
        var type = typeof value;
        if (type === 'object') {
          _this.removeUndefined(value, deep -= 1);
        } else if (type === 'undefined') {
          delete obj[key];
        }
      });
    }
    return obj;
  };
  _proto.trace = function trace(method, data) {
    return new Trace(this.meta.type || 'model', method, data);
  };
  Model.trace = function trace(type, method, data) {
    return new Trace(type, method, data);
  };
  _proto.handleException = function handleException(msg, err) {
    Model.handleException(msg, err);
  };
  Model.handleException = function handleException(msg, err) {
    if (process.env.NODE_ENV !== 'test') {
      Sentry.captureException(err);
    }
    tui.showError(msg, err);
  };
  _createClass(Model, [{
    key: "id",
    get: function get() {
      return this.meta.id || '';
    }
  }, {
    key: "revision",
    get: function get() {
      return this.meta.revision || 1;
    }
  }, {
    key: "url",
    get: function get() {
      return this.HOST + "/" + this.id;
    }
  }]);
  return Model;
}();

var Installation = /*#__PURE__*/function (_Model) {
  _inheritsLoose(Installation, _Model);
  function Installation() {
    var _this;
    _this = _Model.call(this, 'installation') || this;
    _this.application = '';
    _this.version_id = '';
    _this.session_user = false;
    _this.extsync = false;
    _this.status = {};
    _this.payment = {};
    _this.oauth = [];
    _this.oauth_connect = [];
    _this.session = void 0;
    _this.token_installation = '';
    _this.supported_features = [];
    _this.load();
    return _this;
  }
  var _proto = Installation.prototype;
  _proto.getAttributes = function getAttributes() {
    return ['token_installation', 'supported_features', 'application', 'version_id', 'session'];
  };
  _proto.create = /*#__PURE__*/function () {
    var _create = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(id) {
      var response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return HTTP.post("" + this.HOST, {
              application: id
            });
          case 3:
            response = _context.sent;
            this.parse(response.data);
            this.save();
            return _context.abrupt("return", true);
          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](0);
            this.handleException('Failed to create installation', _context.t0);
            return _context.abrupt("return", false);
          case 13:
          case "end":
            return _context.stop();
        }
      }, _callee, this, [[0, 9]]);
    }));
    function create(_x) {
      return _create.apply(this, arguments);
    }
    return create;
  }();
  _proto.fetchById = /*#__PURE__*/function () {
    var _fetchById = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(id) {
      var url, response;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            url = this.HOST + "?expand=2&this_version_id=" + id;
            _context2.next = 4;
            return HTTP.get(url);
          case 4:
            response = _context2.sent;
            if (!(response.data && response.data.length)) {
              _context2.next = 11;
              break;
            }
            this.parse(response.data[0]);
            this.save();
            return _context2.abrupt("return", true);
          case 11:
            tui.showError("Failed to fetch installation by ID: " + id);
          case 12:
            _context2.next = 17;
            break;
          case 14:
            _context2.prev = 14;
            _context2.t0 = _context2["catch"](0);
            this.handleException("Failed to load installation: " + id, _context2.t0);
          case 17:
            return _context2.abrupt("return", false);
          case 18:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this, [[0, 14]]);
    }));
    function fetchById(_x2) {
      return _fetchById.apply(this, arguments);
    }
    return fetchById;
  }();
  _proto.restart = /*#__PURE__*/function () {
    var _restart = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return HTTP.patch("" + this.url, {
              restart: {
                new_process: true
              }
            });
          case 3:
            _context3.next = 8;
            break;
          case 5:
            _context3.prev = 5;
            _context3.t0 = _context3["catch"](0);
            this.handleException("Failed to restart installation: " + this.id, _context3.t0);
          case 8:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this, [[0, 5]]);
    }));
    function restart() {
      return _restart.apply(this, arguments);
    }
    return restart;
  }();
  _proto.reinstall = /*#__PURE__*/function () {
    var _reinstall = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return HTTP.patch("" + this.url, {
              restart: {
                new_process: true,
                new_user: true
              }
            });
          case 3:
            _context4.next = 8;
            break;
          case 5:
            _context4.prev = 5;
            _context4.t0 = _context4["catch"](0);
            this.handleException("Failed to reinstall installation: " + this.id, _context4.t0);
          case 8:
          case "end":
            return _context4.stop();
        }
      }, _callee4, this, [[0, 5]]);
    }));
    function reinstall() {
      return _reinstall.apply(this, arguments);
    }
    return reinstall;
  }();
  _proto.stop = /*#__PURE__*/function () {
    var _stop = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return HTTP.patch("" + this.url, {
              restart: {
                stop_background: true
              }
            });
          case 3:
            return _context5.abrupt("return", true);
          case 6:
            _context5.prev = 6;
            _context5.t0 = _context5["catch"](0);
            this.handleException("Failed to stop installation: " + this.id, _context5.t0);
            return _context5.abrupt("return", false);
          case 10:
          case "end":
            return _context5.stop();
        }
      }, _callee5, this, [[0, 6]]);
    }));
    function stop() {
      return _stop.apply(this, arguments);
    }
    return stop;
  }();
  _proto.setExtSync = /*#__PURE__*/function () {
    var _setExtSync = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(enableExtSync) {
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return HTTP.patch("" + this.url, {
              extsync: enableExtSync
            });
          case 3:
            _context6.next = 8;
            break;
          case 5:
            _context6.prev = 5;
            _context6.t0 = _context6["catch"](0);
            this.handleException("Failed to change ExtSync for installation: " + this.id, _context6.t0);
          case 8:
          case "end":
            return _context6.stop();
        }
      }, _callee6, this, [[0, 5]]);
    }));
    function setExtSync(_x3) {
      return _setExtSync.apply(this, arguments);
    }
    return setExtSync;
  }();
  _proto.deleteById = /*#__PURE__*/function () {
    var _deleteById = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(id) {
      return _regeneratorRuntime().wrap(function _callee7$(_context7) {
        while (1) switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return HTTP["delete"](this.HOST + "?this_version_id=" + id);
          case 3:
            _context7.next = 12;
            break;
          case 5:
            _context7.prev = 5;
            _context7.t0 = _context7["catch"](0);
            _context7.t1 = _context7.t0.response.data.code;
            _context7.next = _context7.t1 === 300020 ? 10 : 11;
            break;
          case 10:
            return _context7.abrupt("break", 12);
          case 11:
            this.handleException("Failed to delete installation: " + id, _context7.t0);
          case 12:
          case "end":
            return _context7.stop();
        }
      }, _callee7, this, [[0, 5]]);
    }));
    function deleteById(_x4) {
      return _deleteById.apply(this, arguments);
    }
    return deleteById;
  }();
  _createClass(Installation, [{
    key: "token",
    get: function get() {
      return this.token_installation;
    }
  }, {
    key: "hasForeground",
    get: function get() {
      return this.supported_features.indexOf('foreground') !== -1;
    }
  }, {
    key: "hasBackground",
    get: function get() {
      return this.supported_features.indexOf('background') !== -1;
    }
  }]);
  return Installation;
}(Model);

function validateFile(file) {
  var ending = file.split('.').slice(-1)[0];
  return ['html', 'svg', 'yaml', 'yml', 'css', 'js', 'mjs', 'cjs', 'json', 'gif', 'png', 'jpg', 'jpeg'].indexOf(ending) !== -1;
}
function getFileName(file) {
  if (file.startsWith(config.foreground())) {
    return file.replace(config.foreground() + "/", '');
  }
  if (file.startsWith(config.background())) {
    return file.replace(config.background() + "/", '');
  }
  var tmp = file.split('/');
  tmp.shift();
  return tmp.join('/');
}
function getFileUse(file) {
  if (file.startsWith(config.foreground())) {
    return 'foreground';
  }
  if (file.startsWith(config.background())) {
    return 'background';
  }
  return file.split('/')[0];
}
function getFilePath(use) {
  switch (use) {
    case 'foreground':
      return config.foreground();
    case 'background':
      return config.background();
    default:
      return use;
  }
}
function compareVersions(oldVersion, newVersion) {
  if (!oldVersion || !newVersion) {
    return false;
  }
  var keys = Object.keys(oldVersion);
  var _loop = function _loop() {
    var key = keys[i];
    var obj1 = oldVersion[key];
    var obj2 = newVersion[key];
    if (typeof oldVersion[key] === 'string') {
      if (obj1 !== obj2) {
        return {
          v: true
        };
      }
    } else if (Array.isArray(oldVersion[key])) {
      if (obj1.length === obj2.length && obj1.every(function (u, index) {
        return u === obj2[index];
      })) {
        return {
          v: true
        };
      }
    } else if (compareVersions(oldVersion[key], newVersion[key])) {
      return {
        v: true
      };
    }
  };
  for (var i = 0; i < keys.length; i += 1) {
    var _ret = _loop();
    if (typeof _ret === "object") return _ret.v;
  }
  return false;
}

var File = /*#__PURE__*/function (_Model) {
  _inheritsLoose(File, _Model);
  function File(data, parent) {
    var _this;
    _this = _Model.call(this, 'file') || this;
    _this.name = '';
    _this.type = void 0;
    _this.parent = void 0;
    _this.modified = void 0;
    _this.status = '';
    _this.parse(data);
    _this.parent = parent;
    return _this;
  }
  var _proto = File.prototype;
  _proto.getAttributes = function getAttributes() {
    return ['name', 'type', 'modified'];
  };
  _proto.compare = function compare(path) {
    var _this$parent$used_fil;
    var type = getFileUse(path);
    return ((_this$parent$used_fil = this.parent.used_files[type]) == null ? void 0 : _this$parent$used_fil.includes(this.id)) || false;
  };
  _proto.syncModified = function syncModified() {
    var use = this.use;
    this.modified = getFileTimeISO(getFilePath(use) + "/" + this.name);
  };
  _proto.deleteLocal = function deleteLocal() {
    deleteFile(this.path);
  };
  _proto.download = /*#__PURE__*/function () {
    var _download = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(filePath) {
      var _this2 = this;
      var response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return HTTP.get("" + this.url, {
              responseType: 'stream'
            });
          case 2:
            response = _context.sent;
            if (!(response && response.data)) {
              _context.next = 5;
              break;
            }
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              var path = filePath || _this2.path;
              createFolders(path);
              var error = function error() {
                reject();
              };
              var done = function done() {
                _this2.syncModified();
                resolve();
              };
              if (response.data.pipe) {
                var writer = createWriteStream(path);
                response.data.pipe(writer);
                writer.on('finish', done);
                writer.on('error', error);
              } else {
                saveFile(path, response.data);
                done();
              }
            }));
          case 5:
            throw new Error("Failed to download " + this.path + " (" + this.id + ")");
          case 6:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }));
    function download(_x) {
      return _download.apply(this, arguments);
    }
    return download;
  }();
  _proto.update = /*#__PURE__*/function () {
    var _update = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
      var data, response;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            data = new FormData();
            data.append(this.id, createReadStream(this.path));
            _context2.prev = 2;
            _context2.next = 5;
            return HTTP.put(this.url + "?verbose=true", data, {
              headers: data.getHeaders()
            });
          case 5:
            response = _context2.sent;
            this.parse(response.data);
            return _context2.abrupt("return", true);
          case 10:
            _context2.prev = 10;
            _context2.t0 = _context2["catch"](2);
            this.handleException("Failed to update File: " + this.name, _context2.t0);
          case 13:
            return _context2.abrupt("return", false);
          case 14:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this, [[2, 10]]);
    }));
    function update() {
      return _update.apply(this, arguments);
    }
    return update;
  }();
  _createClass(File, [{
    key: "use",
    get: function get() {
      var _this3 = this;
      var use = '/tmp';
      ['foreground', 'background', 'icon', 'widget'].forEach(function (type) {
        var _this3$parent$used_fi;
        if ((_this3$parent$used_fi = _this3.parent.used_files[type]) != null && _this3$parent$used_fi.includes(_this3.id)) {
          use = type;
        }
      });
      return use;
    }
  }, {
    key: "path",
    get: function get() {
      return getFilePath(this.use) + "/" + this.name;
    }
  }]);
  return File;
}(Model);
File.create = /*#__PURE__*/function () {
  var _ref = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(filePath, parent) {
    var m, use, name, data, response;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          m = parent;
          use = getFileUse(filePath);
          name = getFileName(filePath);
          data = new FormData();
          data.append(name, createReadStream(getFilePath(use) + "/" + name));
          _context3.prev = 5;
          _context3.next = 8;
          return HTTP.post(m.url + "/file/" + use + "?verbose=true", data, {
            headers: data.getHeaders()
          });
        case 8:
          response = _context3.sent;
          return _context3.abrupt("return", new File(response.data, parent));
        case 12:
          _context3.prev = 12;
          _context3.t0 = _context3["catch"](5);
          File.handleException("Failed to create File: " + name, _context3.t0);
        case 15:
          return _context3.abrupt("return", null);
        case 16:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[5, 12]]);
  }));
  return function (_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var Version = /*#__PURE__*/function (_Model) {
  _inheritsLoose(Version, _Model);
  function Version(data, parent) {
    var _this;
    _this = _Model.call(this, 'version') || this;
    _this.name = '';
    _this.author = void 0;
    _this.version_app = void 0;
    _this.supported_features = void 0;
    _this.max_number_installation = void 0;
    _this.description = void 0;
    _this.status = 'idle';
    _this.used_files = {};
    _this.permission = void 0;
    _this.file = [];
    _this.parent = void 0;
    _this.parse(data);
    _this.parent = parent;
    return _this;
  }
  var _proto = Version.prototype;
  _proto.getAttributes = function getAttributes() {
    return ['name', 'author', 'version_app', 'supported_features', 'max_number_installation', 'description', 'status', 'used_files', 'file', 'permission'];
  };
  _proto.parse = function parse(data) {
    var _this2 = this;
    var fileData = data.file;
    delete data.file;
    _Model.prototype.parse.call(this, data);
    if (fileData) {
      if (fileData.length > 0 && typeof fileData[0] !== 'string') {
        this.file = [];
        fileData.forEach(function (f) {
          _this2.file.push(new File(f, _this2));
        });
      }
    }
  };
  _proto.toJSON = function toJSON(full) {
    if (full === void 0) {
      full = true;
    }
    var data = _Model.prototype.toJSON.call(this, full);
    if (full) {
      data.file = [];
      this.file.forEach(function (file) {
        if (typeof file !== 'string') {
          data.file.push(file.toJSON());
        }
      });
    } else {
      delete data.file;
    }
    return data;
  };
  _proto.clone = /*#__PURE__*/function () {
    var _clone = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return HTTP.get(this.url + "?expand=2&verbose=true");
          case 3:
            response = _context.sent;
            return _context.abrupt("return", new Version(response.data, this.parent));
          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            this.handleException("Failed to get version: " + this.id, _context.t0);
          case 10:
            return _context.abrupt("return", new Version({
              meta: {
                id: this.id
              }
            }, this.parent));
          case 12:
          case "end":
            return _context.stop();
        }
      }, _callee, this, [[0, 7]]);
    }));
    function clone() {
      return _clone.apply(this, arguments);
    }
    return clone;
  }();
  _proto.findFile = function findFile(filePath) {
    var files = this.getFiles();
    return files.find(function (f) {
      return filePath === f.path;
    });
  };
  _proto.createFile = /*#__PURE__*/function () {
    var _createFile = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(filePath) {
      var f;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return File.create(filePath, this);
          case 2:
            f = _context2.sent;
            if (f) {
              this.file.push(f);
            }
            return _context2.abrupt("return", f);
          case 5:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this);
    }));
    function createFile(_x) {
      return _createFile.apply(this, arguments);
    }
    return createFile;
  }();
  _proto.updateFile = function updateFile(filePath, newFile) {};
  _proto.getFiles = function getFiles() {
    var files = [];
    this.file.forEach(function (file) {
      if (typeof file !== 'string') {
        files.push(file);
      }
    });
    return files;
  };
  _proto.publish = /*#__PURE__*/function () {
    var _publish = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      var response;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return HTTP.patch("" + this.url, {
              status: 'commit'
            });
          case 3:
            response = _context3.sent;
            this.parse(response.data);
            return _context3.abrupt("return", true);
          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3["catch"](0);
            this.handleException("Failed to update " + this.meta.type + ": " + this.id, _context3.t0);
          case 11:
            return _context3.abrupt("return", false);
          case 12:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this, [[0, 8]]);
    }));
    function publish() {
      return _publish.apply(this, arguments);
    }
    return publish;
  }();
  return Version;
}(Model);

var Application = /*#__PURE__*/function (_Model) {
  _inheritsLoose(Application, _Model);
  function Application(data) {
    var _this;
    _this = _Model.call(this, 'application') || this;
    _this.name = '';
    _this.version = [];
    _this.oauth_client = [];
    _this.oauth_external = [];
    _this.application_product = [];
    _this.parse(data);
    return _this;
  }
  var _proto = Application.prototype;
  _proto.getAttributes = function getAttributes() {
    return ['name', 'name_identifier', 'version'];
  };
  _proto.toJSON = function toJSON(full) {
    if (full === void 0) {
      full = true;
    }
    var data = _Model.prototype.toJSON.call(this, full);
    if (full) {
      data.version = [];
      for (var i = 0; i < this.version.length; i += 1) {
        var ver = this.version[i];
        if (typeof ver !== 'string') {
          data.version.push(ver.toJSON());
        }
      }
    } else {
      delete data.version;
    }
    return data;
  };
  _proto.getVersion = function getVersion() {
    if (this.version.length > 0) {
      var last = this.version[this.version.length - 1];
      if (typeof last !== 'string') {
        return last;
      }
    }
    return new Version({}, this);
  };
  _proto.getOAuthExternal = function getOAuthExternal() {
    var oauth = [];
    this.oauth_external.forEach(function (o) {
      if (typeof o !== 'string') {
        oauth.push(o);
      }
    });
    return oauth;
  };
  _proto.getOAuthClient = function getOAuthClient() {
    var oauth = [];
    this.oauth_client.forEach(function (o) {
      if (typeof o !== 'string') {
        oauth.push(o);
      }
    });
    return oauth;
  };
  _proto.parse = function parse(data) {
    var _this2 = this;
    _Model.prototype.parse.call(this, data);
    var vs = this.version || [];
    this.version = [];
    vs.forEach(function (v) {
      _this2.version.push(new Version(v, _this2));
    });
  };
  Application.create = /*#__PURE__*/function () {
    var _create = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(info) {
      var result, data, response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            result = undefined;
            if (!info.description || info.object_requested) {
              data = {
                name: info.name,
                title: '',
                author: info.author,
                version_app: info.version,
                status: 'idle',
                description: {
                  general: info.general,
                  version: '',
                  foreground: info.foreground,
                  background: info.background,
                  widget: ''
                },
                file: [],
                supported_features: info.features || info.supported_features,
                permission: info.permission
              };
            } else {
              data = info;
            }
            if (!data.info) {
              delete data.icon;
            }
            data.executable = {
              engine: 'node'
            };
            _context.prev = 4;
            _context.next = 7;
            return HTTP.post(Model.getHost('application') + "?verbose=true", {
              version: [data]
            });
          case 7:
            response = _context.sent;
            result = new Application(response.data);
            _context.next = 14;
            break;
          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](4);
            Model.handleException('Failed to create the application', _context.t0);
          case 14:
            return _context.abrupt("return", result);
          case 15:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[4, 11]]);
    }));
    function create(_x) {
      return _create.apply(this, arguments);
    }
    return create;
  }();
  _proto.get = /*#__PURE__*/function () {
    var _get = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
      var response;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return HTTP.get(this.url + "?expand=2&verbose=true");
          case 3:
            response = _context2.sent;
            return _context2.abrupt("return", response.data);
          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2["catch"](0);
            this.handleException("Failed to get application: " + this.id, _context2.t0);
          case 10:
            return _context2.abrupt("return", {});
          case 11:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this, [[0, 7]]);
    }));
    function get() {
      return _get.apply(this, arguments);
    }
    return get;
  }();
  _proto.getAll = /*#__PURE__*/function () {
    var _getAll = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      var result, response;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            result = [];
            _context3.prev = 1;
            _context3.next = 4;
            return HTTP.get(this.HOST + "?expand=2&verbose=true");
          case 4:
            response = _context3.sent;
            response.data.forEach(function (data) {
              var app = new Application(data);
              result.push(app);
            });
            _context3.next = 11;
            break;
          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3["catch"](1);
            Model.handleException('Failed to load all applications', _context3.t0);
          case 11:
            return _context3.abrupt("return", result);
          case 12:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this, [[1, 8]]);
    }));
    function getAll() {
      return _getAll.apply(this, arguments);
    }
    return getAll;
  }();
  _proto.createOauthExternal = /*#__PURE__*/function () {
    var _createOauthExternal = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(oauth) {
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            if (!(this.oauth_external.length === 0)) {
              _context4.next = 12;
              break;
            }
            _context4.prev = 1;
            _context4.next = 4;
            return HTTP.post(this.url + "/oauth_external", oauth);
          case 4:
            tui.showMessage('External OAuth created');
            _context4.next = 10;
            break;
          case 7:
            _context4.prev = 7;
            _context4.t0 = _context4["catch"](1);
            tui.showError('Failed to create OAuth External', _context4.t0);
          case 10:
            _context4.next = 25;
            break;
          case 12:
            if (!(typeof this.oauth_external[0] !== 'string')) {
              _context4.next = 24;
              break;
            }
            _context4.prev = 13;
            _context4.next = 16;
            return HTTP.patch(this.url + "/oauth_external/" + this.oauth_external[0].meta.id, oauth);
          case 16:
            tui.showMessage('External OAuth updated');
            _context4.next = 22;
            break;
          case 19:
            _context4.prev = 19;
            _context4.t1 = _context4["catch"](13);
            this.handleException('Failed to update OAuth External', _context4.t1);
          case 22:
            _context4.next = 25;
            break;
          case 24:
            tui.showError('Failed to update OAuth External, because old OAuth was not loaded correctly');
          case 25:
          case "end":
            return _context4.stop();
        }
      }, _callee4, this, [[1, 7], [13, 19]]);
    }));
    function createOauthExternal(_x2) {
      return _createOauthExternal.apply(this, arguments);
    }
    return createOauthExternal;
  }();
  _proto.createOauthClient = /*#__PURE__*/function () {
    var _createOauthClient = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(oauth) {
      var newOauth;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            newOauth = oauth;
            if (typeof oauth.redirect_uri === 'string') {
              newOauth.redirect_uri = [oauth.redirect_uri];
            }
            if (typeof oauth.path_access_token === 'string') {
              newOauth.path_access_token = [oauth.path_access_token];
            }
            _context5.prev = 3;
            _context5.next = 6;
            return HTTP.post(this.url + "/oauth_client", oauth);
          case 6:
            tui.showMessage('OAuth Client created');
            _context5.next = 24;
            break;
          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5["catch"](3);
            if (!(_context5.t0.response.data.code === 500232)) {
              _context5.next = 23;
              break;
            }
            _context5.prev = 12;
            _context5.next = 15;
            return HTTP.patch(this.url + "/oauth_client", oauth);
          case 15:
            tui.showMessage('OAuth Client updated');
            _context5.next = 21;
            break;
          case 18:
            _context5.prev = 18;
            _context5.t1 = _context5["catch"](12);
            this.handleException('Failed to create OAuth Client', _context5.t1);
          case 21:
            _context5.next = 24;
            break;
          case 23:
            this.handleException('Failed to create OAuth Client', _context5.t0);
          case 24:
          case "end":
            return _context5.stop();
        }
      }, _callee5, this, [[3, 9], [12, 18]]);
    }));
    function createOauthClient(_x3) {
      return _createOauthClient.apply(this, arguments);
    }
    return createOauthClient;
  }();
  _proto.syncFiles = function syncFiles() {
    var files = this.getVersion().getFiles();
    files.forEach(function (file) {
      file.syncModified();
    });
  };
  _proto.publish = /*#__PURE__*/function () {
    var _publish = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(newVersion) {
      var version;
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            version = this.getVersion();
            version.version_app = newVersion;
            _context6.next = 4;
            return version.update();
          case 4:
            if (!_context6.sent) {
              _context6.next = 6;
              break;
            }
            return _context6.abrupt("return", version.publish());
          case 6:
            return _context6.abrupt("return", false);
          case 7:
          case "end":
            return _context6.stop();
        }
      }, _callee6, this);
    }));
    function publish(_x4) {
      return _publish.apply(this, arguments);
    }
    return publish;
  }();
  return Application;
}(Model);

var Spinner = /*#__PURE__*/function () {
  function Spinner(title) {
    this.timer = void 0;
    this.title = void 0;
    this.frames = ['|', '/', '-', '\\'];
    this.title = title;
  }
  var _proto = Spinner.prototype;
  _proto.setMessage = function setMessage(message) {
    tui.showVerbose('STATUS', message);
    this.title = message;
  };
  _proto.start = function start() {
    var _this = this;
    var len = this.frames.length;
    var i = 0;
    this.timer = setInterval(function () {
      var str = _this.frames[i % len];
      i += 1;
      clearLine$1(process.stdout, 0);
      cursorTo$1(process.stdout, 0);
      tui.write(str + " " + _this.title);
    }, 80);
  };
  _proto.stop = function stop() {
    clearLine$1(process.stdout, 0);
    cursorTo$1(process.stdout, 0);
    clearInterval(this.timer);
  };
  return Spinner;
}();

var Questions = /*#__PURE__*/function () {
  function Questions() {}
  var _proto = Questions.prototype;
  _proto.ask = /*#__PURE__*/function () {
    var _ask = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(questions) {
      var t;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            t = new Trace('User Input', questions[0].message);
            return _context.abrupt("return", new Promise(function (resolve) {
              var onCancel = function onCancel() {
                t.done('unknown');
                resolve(false);
                return false;
              };
              prompt(questions, {
                onCancel: onCancel
              }).then(function (answers) {
                t.done();
                resolve(answers);
              });
            }));
          case 2:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    function ask(_x) {
      return _ask.apply(this, arguments);
    }
    return ask;
  }();
  _proto.askWappstoCredentials = function askWappstoCredentials(host) {
    return this.ask([{
      name: 'username',
      type: 'text',
      message: "Enter your " + host + " e-mail address:",
      validate: function validate(value) {
        if (value === '') {
          return 'Please enter your e-mail address.';
        }
        return true;
      }
    }, {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
      validate: function validate(value) {
        if (value === '') {
          return 'Please enter your password.';
        }
        return true;
      }
    }]);
  };
  _proto.askForNewWapp = /*#__PURE__*/function () {
    var _askForNewWapp = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(wapps, present) {
      var choices, override, ifNew;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            choices = [{
              title: 'Create new Wapp',
              value: 'new'
            }];
            if (wapps.length > 0) {
              choices.push({
                title: 'Download an existing Wapp',
                value: 'download'
              });
            }
            if (!present) {
              _context2.next = 10;
              break;
            }
            tui.showWarning('It seams like you already have a wapp in this folder!');
            _context2.next = 6;
            return this.ask([{
              name: 'override',
              type: 'confirm',
              initial: function initial() {
                return false;
              },
              message: 'Do you want to delete your local wapp?'
            }]);
          case 6:
            override = _context2.sent;
            if (!(override === false)) {
              _context2.next = 9;
              break;
            }
            return _context2.abrupt("return", false);
          case 9:
            if (!override.override) {
              choices.push({
                title: 'Generate a new Wapp from existing wapp',
                value: 'generate'
              });
            }
          case 10:
            ifNew = function ifNew(values) {
              return values.create === 'new' || values.create === undefined;
            };
            return _context2.abrupt("return", this.ask([{
              message: 'How do you want to create the Wapp?',
              name: 'create',
              type: present || wapps.length !== 0 ? 'select' : null,
              choices: choices
            }, {
              name: 'wapp',
              type: function type(prev, values) {
                return values.create === 'download' ? 'select' : null;
              },
              message: 'Please choose the wapp to download:',
              choices: wapps
            }, {
              name: 'name',
              type: function type(prev, values) {
                return ifNew(values) ? 'text' : null;
              },
              message: 'Please enter the name of your Wapp:',
              validate: function validate(answer) {
                if (answer === '') {
                  return "Name can't be empty";
                }
                return true;
              }
            }, {
              name: 'author',
              type: function type(prev, values) {
                return ifNew(values) ? 'text' : null;
              },
              message: 'Please enter the Author of your Wapp:'
            }, {
              name: 'version',
              type: function type(prev, values) {
                return ifNew(values) ? 'text' : null;
              },
              message: 'Please enter the Version of your Wapp:',
              initial: '0.0.1',
              validate: function validate(answer) {
                if (/^\d\.\d\.\d$/.test(answer)) {
                  return true;
                }
                return 'Version must be in the format: 1.1.1';
              }
            }, {
              name: 'features',
              type: function type(prev, values) {
                return ifNew(values) ? 'multiselect' : null;
              },
              message: 'Please choose features for the Wapp:',
              choices: [{
                title: 'Foreground',
                value: 'foreground',
                selected: true
              }, {
                title: 'background',
                value: 'background'
              }],
              validate: function validate(answer) {
                if (answer && answer.length === 0) {
                  return 'You must select at least one feature';
                }
                return true;
              }
            }, {
              name: 'general',
              type: function type(prev, values) {
                return ifNew(values) ? 'text' : null;
              },
              message: 'Please enter a general description about your Wapp:'
            }, {
              name: 'foreground',
              type: function type(prev, values) {
                return ifNew(values) && values.features.indexOf('foreground') !== -1 ? 'text' : null;
              },
              message: 'Please enter a description about your foreground part of your Wapp:'
            }, {
              name: 'background',
              type: function type(prev, values) {
                return ifNew(values) && values.features.indexOf('background') !== -1 ? 'text' : null;
              },
              message: 'Please enter a description about your background part of your Wapp:'
            }, {
              name: 'examples',
              type: function type(prev, values) {
                return ifNew(values) ? 'confirm' : null;
              },
              message: 'Generate example files for the Wapp?',
              initial: false
            }]));
          case 12:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this);
    }));
    function askForNewWapp(_x2, _x3) {
      return _askForNewWapp.apply(this, arguments);
    }
    return askForNewWapp;
  }();
  _proto.configureWapp = /*#__PURE__*/function () {
    var _configureWapp = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(oauthExternal, oauthClient, permissions) {
      var _permissions$create, _permissions$create2, _permissions$create3, _permissions$create4, _permissions$create5;
      var external, client, type, extSyncQuestions, validateEmptyString, oauthExtQuestions, oauthClientQuestions, permissionQuestions;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            validateEmptyString = function _validateEmptyString(input) {
              return input.length > 0 ? true : 'You must enter a valid string';
            };
            external = oauthExternal[0] || {};
            client = oauthClient[0] || {};
            _context3.next = 5;
            return this.ask([{
              name: 'config',
              type: 'select',
              message: 'What do you want to configure?',
              choices: [{
                title: 'ExtSync',
                value: 'extsync'
              }, {
                title: 'External OAuth',
                value: 'external_oauth'
              }, {
                title: 'OAuth Client',
                value: 'oauth_client'
              }, {
                title: 'Permissions',
                value: 'permissions'
              }]
            }]);
          case 5:
            type = _context3.sent;
            extSyncQuestions = [{
              name: 'extsync',
              type: 'confirm',
              message: 'Should ExtSync be enabled for your Wapp?'
            }];
            oauthExtQuestions = [{
              name: 'oauth_version',
              type: 'select',
              choices: [{
                title: '1.0'
              }, {
                title: '2.0'
              }],
              initial: external.oauth_version || '1.0',
              message: 'Version:'
            }, {
              name: 'name',
              type: 'text',
              validate: validateEmptyString,
              initial: external.name,
              message: 'Name:'
            }, {
              name: 'description',
              type: 'text',
              validate: validateEmptyString,
              initial: external.description,
              message: 'Description:'
            }, {
              name: 'api_key',
              type: 'text',
              validate: validateEmptyString,
              initial: external.api_key,
              message: 'API Key:'
            }, {
              name: 'api_secret_key',
              type: 'text',
              validate: validateEmptyString,
              initial: external.api_secret_key,
              message: 'API Secret Key:'
            }, {
              name: 'api_site',
              type: 'text',
              validate: validateEmptyString,
              initial: external.api_site,
              message: 'API Site:'
            }];
            oauthClientQuestions = [{
              name: 'name',
              type: 'text',
              validate: validateEmptyString,
              initial: client.name,
              message: 'Name:'
            }, {
              name: 'company',
              type: 'text',
              validate: validateEmptyString,
              initial: client.company,
              message: 'Company:'
            }, {
              name: 'description',
              type: 'text',
              validate: validateEmptyString,
              initial: client.description,
              message: 'Description:'
            }, {
              name: 'homepage_url',
              type: 'text',
              validate: validateEmptyString,
              initial: client.homepage_url,
              message: 'Homepage Url:'
            }, {
              name: 'path_access_token',
              type: 'text',
              validate: validateEmptyString,
              initial: client.path_access_token,
              message: 'Path Access Token:'
            }, {
              name: 'redirect_uri',
              type: 'text',
              validate: validateEmptyString,
              initial: client.redirect_uri,
              message: 'Redirect Uri:'
            }];
            permissionQuestions = [{
              name: 'create',
              type: 'multiselect',
              message: 'What permissions do your wapp need?',
              choices: [{
                title: 'Network',
                value: 'network',
                selected: permissions == null ? void 0 : (_permissions$create = permissions.create) == null ? void 0 : _permissions$create.includes('network')
              }, {
                title: 'Data',
                value: 'data',
                selected: permissions == null ? void 0 : (_permissions$create2 = permissions.create) == null ? void 0 : _permissions$create2.includes('data')
              }, {
                title: 'stream',
                value: 'stream',
                selected: permissions == null ? void 0 : (_permissions$create3 = permissions.create) == null ? void 0 : _permissions$create3.includes('stream')
              }, {
                title: 'Analytic',
                value: 'analytic',
                selected: permissions == null ? void 0 : (_permissions$create4 = permissions.create) == null ? void 0 : _permissions$create4.includes('analytic')
              }, {
                title: 'Notification',
                value: 'notification',
                selected: permissions == null ? void 0 : (_permissions$create5 = permissions.create) == null ? void 0 : _permissions$create5.includes('notification')
              }]
            }, {
              type: 'confirm',
              name: 'permit_to_send_email',
              message: 'Do your Wapp need to send email?',
              initial: permissions == null ? void 0 : permissions.permit_to_send_email
            }, {
              type: 'confirm',
              name: 'permit_to_send_sms',
              message: 'Do your Wapp need to send SMS?',
              initial: permissions == null ? void 0 : permissions.permit_to_send_sms
            }];
            _context3.t0 = type.config;
            _context3.next = _context3.t0 === 'external_oauth' ? 13 : _context3.t0 === 'oauth_client' ? 14 : _context3.t0 === 'permissions' ? 15 : _context3.t0 === 'extsync' ? 16 : 16;
            break;
          case 13:
            return _context3.abrupt("return", this.ask(oauthExtQuestions));
          case 14:
            return _context3.abrupt("return", this.ask(oauthClientQuestions));
          case 15:
            return _context3.abrupt("return", this.ask(permissionQuestions));
          case 16:
            return _context3.abrupt("return", this.ask(extSyncQuestions));
          case 17:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this);
    }));
    function configureWapp(_x4, _x5, _x6) {
      return _configureWapp.apply(this, arguments);
    }
    return configureWapp;
  }();
  _proto.deleteWapp = function deleteWapp() {
    return this.ask([{
      name: 'del',
      type: 'confirm',
      message: 'Do you want to delete the Wapp?',
      initial: false
    }, {
      name: 'local',
      type: function type(prev) {
        return prev ? 'confirm' : null;
      },
      message: 'Do you want to delete the local files?'
    }, {
      name: 'remote',
      type: function type(prev, values) {
        return values.del ? 'confirm' : null;
      },
      message: 'Do you want to delete the Wapp on Wappsto?'
    }]);
  };
  _proto.precisePermissionRequest = function precisePermissionRequest(request) {
    var msg = '';
    var type = 'data';
    if (request.collection) {
      type = request.collection;
    }
    if (request.message) {
      msg = request.message;
    } else {
      msg = request.name_installation + " would like to save " + type + " under your account. Allow?";
    }
    return this.ask([{
      name: 'accept',
      type: 'confirm',
      message: msg
    }]);
  };
  _proto.permissionRequest = function permissionRequest(request, data) {
    var msg = '';
    if (request.message) {
      msg = request.message;
    } else {
      msg = "Please choose the " + request.type + " to share with " + request.name_installation + ":";
    }
    return this.ask([{
      name: 'permission',
      type: 'multiselect',
      message: msg,
      choices: data
    }]);
  };
  _proto.remoteVersionUpdated = function remoteVersionUpdated() {
    return this.ask([{
      name: 'local',
      type: 'confirm',
      initial: true,
      message: 'Do you want to override local version information with remote information?'
    }]);
  };
  _proto.fileConflict = function fileConflict(file) {
    return this.ask([{
      message: "Conflict on file \xB4" + file,
      name: 'conflict',
      type: 'select',
      choices: [{
        title: 'Overwrite local file with remote file',
        value: 'overwrite'
      }, {
        title: 'Upload local file to server',
        value: 'upload'
      }, {
        title: 'Overwrite this local file and all next',
        value: 'overwrite_all'
      }, {
        title: 'Upload this local file and all next',
        value: 'upload_all'
      }, {
        title: 'Abort',
        value: 'abort'
      }]
    }]);
  };
  _proto.askDeleteLocalFile = function askDeleteLocalFile(file) {
    return this.ask([{
      name: 'delete',
      type: 'confirm',
      "default": true,
      message: file + " was deleted on the server, do you want to delete the local file?"
    }]);
  };
  _proto.askOverwriteFiles = function askOverwriteFiles() {
    return this.ask([{
      name: 'overwrite',
      type: 'confirm',
      "default": false,
      message: 'Do you want to overwrite your local files with example files?'
    }]);
  };
  _proto.askPublishWapp = function askPublishWapp(oldVersion) {
    return this.ask([{
      name: 'version',
      type: 'text',
      initial: oldVersion,
      message: "The version of the wapp is " + oldVersion + ", what is the new version",
      validate: function validate(answer) {
        if (/^\d\.\d\.\d$/.test(answer)) {
          return true;
        }
        return 'Version must be in the format: 1.1.1';
      }
    }]);
  };
  return Questions;
}();
var questions = /*#__PURE__*/new Questions();

var Session = /*#__PURE__*/function (_Model) {
  _inheritsLoose(Session, _Model);
  function Session() {
    var _this;
    _this = _Model.call(this, 'session') || this;
    _this.user = void 0;
    _this.load();
    return _this;
  }
  var _proto = Session.prototype;
  _proto.getAttributes = function getAttributes() {
    return ['user'];
  };
  _proto.login = /*#__PURE__*/function () {
    var _login = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(user, pass) {
      var response;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return HTTP.post(this.HOST, {
              username: user,
              password: pass,
              remember_me: true
            });
          case 2:
            response = _context.sent;
            this.parse(response.data);
            this.save();
          case 5:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }));
    function login(_x, _x2) {
      return _login.apply(this, arguments);
    }
    return login;
  }();
  _proto.clear = function clear() {
    _Model.prototype.clear.call(this);
    HTTP.removeHeader('x-session');
  };
  _proto.toJSON = function toJSON(full) {
    return this.id;
  };
  _proto.parse = function parse(data) {
    if (typeof data === 'string') {
      this.meta.id = data.toString().trim();
      HTTP.setHeader('x-session', this.id);
    } else {
      _Model.prototype.parse.call(this, data);
    }
  };
  _proto.validate = /*#__PURE__*/function () {
    var _validate = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            if (!this.meta.id) {
              _context2.next = 5;
              break;
            }
            _context2.next = 3;
            return this.fetch();
          case 3:
            if (!_context2.sent) {
              _context2.next = 5;
              break;
            }
            return _context2.abrupt("return", true);
          case 5:
            this.clear();
            return _context2.abrupt("return", false);
          case 7:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this);
    }));
    function validate() {
      return _validate.apply(this, arguments);
    }
    return validate;
  }();
  return Session;
}(Model);

var Wappsto = /*#__PURE__*/function () {
  function Wappsto() {
    this.HOST = void 0;
    this.session = void 0;
    this.HOST = config.host();
    this.session = new Session();
  }
  var _proto = Wappsto.prototype;
  _proto.login = /*#__PURE__*/function () {
    var _login = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var status, validSession, creds;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            status = new Spinner('Authenticating you, please wait...');
            status.start();
            _context.next = 4;
            return this.session.validate();
          case 4:
            validSession = _context.sent;
            status.stop();
            if (!validSession) {
              _context.next = 8;
              break;
            }
            return _context.abrupt("return");
          case 8:
            _context.next = 10;
            return questions.askWappstoCredentials(config.isCustomHost() ? this.HOST : 'Wappsto');
          case 10:
            creds = _context.sent;
            if (!(creds === false)) {
              _context.next = 13;
              break;
            }
            return _context.abrupt("return");
          case 13:
            status.start();
            _context.prev = 14;
            _context.next = 17;
            return this.session.login(creds.username, creds.password);
          case 17:
            status.stop();
            _context.next = 24;
            break;
          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](14);
            status.stop();
            throw new Error('LoginError');
          case 24:
          case "end":
            return _context.stop();
        }
      }, _callee, this, [[14, 20]]);
    }));
    function login() {
      return _login.apply(this, arguments);
    }
    return login;
  }();
  _proto.updateACL = /*#__PURE__*/function () {
    var _updateACL = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(id, addID, create, method) {
      var _this = this;
      var methods;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            methods = {};
            method.forEach(function (m) {
              methods[m] = true;
            });
            _context3.next = 5;
            return HTTP.patch(this.HOST + "/services/2.0/acl?propagate=true&id=[" + id + "]", {
              permission: [{
                meta: {
                  id: addID
                },
                restriction: [{
                  create: create,
                  method: methods
                }]
              }]
            });
          case 5:
            _context3.next = 15;
            break;
          case 7:
            _context3.prev = 7;
            _context3.t0 = _context3["catch"](0);
            _context3.t1 = _context3.t0.response.data.code;
            _context3.next = _context3.t1 === 9900071 ? 12 : 14;
            break;
          case 12:
            setTimeout( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
              return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                while (1) switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.next = 2;
                    return _this.updateACL(id, addID, create, method);
                  case 2:
                  case "end":
                    return _context2.stop();
                }
              }, _callee2);
            })), 100);
            return _context3.abrupt("break", 15);
          case 14:
            tui.showError('Failed to update ACL', _context3.t0);
          case 15:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this, [[0, 7]]);
    }));
    function updateACL(_x, _x2, _x3, _x4) {
      return _updateACL.apply(this, arguments);
    }
    return updateACL;
  }();
  _proto.updateACLRestriction = /*#__PURE__*/function () {
    var _updateACLRestriction = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(id, collection) {
      var aclResponse, aclRestriction;
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return HTTP.get(this.HOST + "/services/2.0/acl/" + id + "/permission/" + id);
          case 3:
            aclResponse = _context4.sent;
            aclRestriction = aclResponse.data.installation;
            if (!aclRestriction[0].create.includes(collection)) {
              _context4.next = 7;
              break;
            }
            return _context4.abrupt("return");
          case 7:
            aclRestriction[0].create.push(collection);
            _context4.next = 10;
            return HTTP.patch(this.HOST + "/services/2.0/acl/" + id + "/permission/" + id + "?propagate=true", {
              restriction: aclRestriction
            });
          case 10:
            _context4.next = 15;
            break;
          case 12:
            _context4.prev = 12;
            _context4.t0 = _context4["catch"](0);
            tui.showError('Failed to update ACL Restriction', _context4.t0);
          case 15:
          case "end":
            return _context4.stop();
        }
      }, _callee4, this, [[0, 12]]);
    }));
    function updateACLRestriction(_x5, _x6) {
      return _updateACLRestriction.apply(this, arguments);
    }
    return updateACLRestriction;
  }();
  _proto.find = /*#__PURE__*/function () {
    var _find = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(type, search, method, quantity, notShared) {
      var result, url, response;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            result = {};
            _context5.prev = 1;
            url = type + "?expand=0&" + search + "&method=[" + method + "]&quantity=" + quantity + "&not_shared_with=" + notShared;
            _context5.next = 5;
            return HTTP.get(this.HOST + "/services/" + url);
          case 5:
            response = _context5.sent;
            result = response.data;
            _context5.next = 12;
            break;
          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5["catch"](1);
            tui.showError('Failed to find', _context5.t0);
          case 12:
            return _context5.abrupt("return", result);
          case 13:
          case "end":
            return _context5.stop();
        }
      }, _callee5, this, [[1, 9]]);
    }));
    function find(_x7, _x8, _x9, _x10, _x11) {
      return _find.apply(this, arguments);
    }
    return find;
  }();
  _proto.readNotification = /*#__PURE__*/function () {
    var _readNotification = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(id, status) {
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            if (status === void 0) {
              status = 'read';
            }
            _context6.prev = 1;
            _context6.next = 4;
            return HTTP.patch(this.HOST + "/services/2.0/notification/" + id, {
              meta: {
                id: id
              },
              read: status
            });
          case 4:
            _context6.next = 9;
            break;
          case 6:
            _context6.prev = 6;
            _context6.t0 = _context6["catch"](1);
            if (!_context6.t0.response || !_context6.t0.response.data || _context6.t0.response.data.code !== 9900147) {
              tui.showError('Failed to read notification', _context6.t0);
            }
          case 9:
          case "end":
            return _context6.stop();
        }
      }, _callee6, this, [[1, 6]]);
    }));
    function readNotification(_x12, _x13) {
      return _readNotification.apply(this, arguments);
    }
    return readNotification;
  }();
  return Wappsto;
}();

function getDirName() {
  return dirname(fileURLToPath(import.meta.url));
}

var Wapp = /*#__PURE__*/function () {
  function Wapp(remote) {
    this.mutex = void 0;
    this.wapp_files = void 0;
    this.ignoreFolders = void 0;
    this.wapp_folders = void 0;
    this.wapp_folders_create = void 0;
    this.cacheFolder = void 0;
    this.wappsto = void 0;
    this.application = void 0;
    this.installation = void 0;
    this.manifest = void 0;
    this.ignore_file = void 0;
    this.wappStream = void 0;
    this.userStream = void 0;
    this.sessionCallback = void 0;
    this.mutex = new Mutex();
    this.cacheFolder = config.cacheFolder();
    this.initCacheFolder();
    this.wapp_files = [this.cacheFolder + "application", this.cacheFolder + "installation", 'manifest.json'];
    this.ignoreFolders = ['node_modules', '.node_modules'];
    this.wapp_folders = [config.foreground(), config.background(), 'icon'];
    this.wapp_folders_create = ['icon'];
    this.wappsto = new Wappsto();
    this.application = new Application(loadJsonFile(this.cacheFolder + "application"));
    this.installation = new Installation();
    this.manifest = loadJsonFile('manifest.json');
    this.ignore_file = this.cacheFolder + "\nnode_modules\n";
  }
  var _proto = Wapp.prototype;
  _proto.init = /*#__PURE__*/function () {
    var _init = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var t;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            t = this.measure('Login', 'Validate session');
            _context.next = 3;
            return this.wappsto.login();
          case 3:
            setUser(this.wappsto.session);
            t.done();
          case 5:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }));
    function init() {
      return _init.apply(this, arguments);
    }
    return init;
  }();
  _proto.initCacheFolder = function initCacheFolder() {
    if (!directoryExists(this.cacheFolder)) {
      createFolders(this.cacheFolder);
    }
  };
  _proto.present = function present() {
    var oldWapp = false;
    this.wapp_files.forEach(function (f) {
      oldWapp = oldWapp || fileExists(f);
    });
    return oldWapp;
  };
  _proto.deleteLocal = function deleteLocal() {
    this.wapp_files.forEach(function (f) {
      deleteFile(f);
    });
    this.wapp_folders.forEach(function (f) {
      deleteFolder(f);
    });
  };
  _proto.create = /*#__PURE__*/function () {
    var _create = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(validate) {
      var _this = this;
      var listWapps, updateFiles, t, status, wapps, newWapp, new_app, wapp, customFolders, ignore, addLines;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            listWapps = [];
            t = this.measure('Loading all applications');
            status = new Spinner('Loading Wapps, please wait...');
            status.start();
            _context3.next = 6;
            return this.application.getAll();
          case 6:
            wapps = _context3.sent;
            if (wapps.length) {
              wapps.forEach(function (w) {
                if (w.version && typeof w.version[0] !== 'string') {
                  var name = w.version[0].name;
                  listWapps.push({
                    title: name + " (" + w.id + ")",
                    value: w.id
                  });
                }
              });
            }
            status.stop();
            t.done();
            t = this.measure('Ask the human');
            _context3.next = 13;
            return questions.askForNewWapp(listWapps, this.present());
          case 13:
            newWapp = _context3.sent;
            if (!(newWapp === false)) {
              _context3.next = 16;
              break;
            }
            return _context3.abrupt("return");
          case 16:
            t.done();
            _context3.t0 = newWapp.create;
            _context3.next = _context3.t0 === 'download' ? 20 : _context3.t0 === 'generate' ? 30 : 53;
            break;
          case 20:
            t = this.measure('Downloading wapp');
            wapp = wapps.find(function (w) {
              return w.id === newWapp.wapp;
            });
            if (wapp) {
              _context3.next = 25;
              break;
            }
            tui.showError('Failed to find Application from id');
            return _context3.abrupt("return");
          case 25:
            this.deleteLocal();
            _context3.next = 28;
            return this.downloadWapp(wapp);
          case 28:
            t.done();
            return _context3.abrupt("break", 76);
          case 30:
            t = this.measure('Generating wapp');
            status.setMessage('Creating Wapp, please wait...');
            status.start();
            if (this.manifest.meta) {
              this.saveManifest();
            }
            _context3.next = 36;
            return Application.create(this.manifest);
          case 36:
            new_app = _context3.sent;
            if (new_app) {
              _context3.next = 41;
              break;
            }
            status.stop();
            t.done('unknown');
            throw new Error('Failed to generate Application');
          case 41:
            this.application = new_app;
            _context3.next = 44;
            return this.installation.create(this.versionID);
          case 44:
            this.saveApplication();
            status.stop();
            _context3.next = 48;
            return this.update();
          case 48:
            updateFiles = _context3.sent;
            updateFiles.forEach( /*#__PURE__*/function () {
              var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(f) {
                var tmpFile, localFile, remoteFile, localBuff, remoteBuff;
                return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                  while (1) switch (_context2.prev = _context2.next) {
                    case 0:
                      if (!validate) {
                        _context2.next = 12;
                        break;
                      }
                      tmpFile = _this.cacheFolder + "file/" + f.name;
                      _context2.next = 4;
                      return f.download(tmpFile);
                    case 4:
                      localFile = loadFile(f.path);
                      remoteFile = loadFile(tmpFile);
                      if (!(localFile && remoteFile)) {
                        _context2.next = 12;
                        break;
                      }
                      localBuff = Buffer.from(localFile);
                      remoteBuff = Buffer.from(remoteFile);
                      if (!(localBuff.compare(remoteBuff) !== 0)) {
                        _context2.next = 12;
                        break;
                      }
                      tui.showError(f.name + " was not uploaded correctly");
                      return _context2.abrupt("return");
                    case 12:
                      tui.showMessage(f.name + " was " + f.status);
                    case 13:
                    case "end":
                      return _context2.stop();
                  }
                }, _callee2);
              }));
              return function (_x2) {
                return _ref.apply(this, arguments);
              };
            }());
            if (this.application && this.installation.id) {
              tui.showMessage("Wapp created with id: " + this.application.id);
            }
            t.done();
            return _context3.abrupt("break", 76);
          case 53:
            t = this.measure('Creating wapp');
            status.setMessage('Creating Wapp, please wait...');
            status.start();
            _context3.next = 58;
            return Application.create(newWapp);
          case 58:
            new_app = _context3.sent;
            if (new_app) {
              _context3.next = 63;
              break;
            }
            status.stop();
            t.done('unknown');
            throw new Error('Failed to create Application');
          case 63:
            this.application = new_app;
            customFolders = {
              foreground: config.foreground(),
              background: config.background()
            };
            status.stop();
            _context3.next = 68;
            return this.createFolders(newWapp.features, newWapp.examples, customFolders);
          case 68:
            status.start();
            _context3.next = 71;
            return this.installation.create(this.application.getVersion().id);
          case 71:
            this.saveApplication();
            status.stop();
            if (this.application) {
              tui.showMessage("Wapp created with id: " + this.application.id);
            }
            t.done();
            return _context3.abrupt("break", 76);
          case 76:
            if (fileExists('.gitignore')) {
              ignore = loadFile('.gitignore');
              addLines = '';
              this.ignore_file.split('\n').forEach(function (line) {
                if (ignore && !ignore.includes(line)) {
                  addLines += line + "\n";
                }
              });
              if (addLines) {
                ignore += "\n" + addLines;
                saveFile('.gitignore', ignore);
              }
            } else {
              saveFile('.gitignore', this.ignore_file);
            }
          case 77:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this);
    }));
    function create(_x) {
      return _create.apply(this, arguments);
    }
    return create;
  }();
  _proto.createFolders = /*#__PURE__*/function () {
    var _createFolders = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(folders, createExamples, folderMapping) {
      var dirs, exampleFiles, allDirs, overwrite, i, f, path, exPath, j, answers, _j, file;
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            dirs = folders || this.wapp_folders;
            exampleFiles = {
              foreground: ['main.js', 'index.html'],
              background: ['main.js', 'package.json']
            };
            allDirs = dirs.concat(this.wapp_folders_create);
            i = 0;
          case 4:
            if (!(i < allDirs.length)) {
              _context4.next = 28;
              break;
            }
            f = allDirs[i];
            path = folderMapping ? folderMapping[f] || f : f;
            createFolders(path + "/.");
            if (!(createExamples && exampleFiles[f])) {
              _context4.next = 25;
              break;
            }
            exPath = getDirName() + "/../examples/simple/" + f;
            if (!(overwrite === undefined)) {
              _context4.next = 24;
              break;
            }
            j = 0;
          case 12:
            if (!(j < exampleFiles[f].length)) {
              _context4.next = 24;
              break;
            }
            if (!fileExists(path + "/" + exampleFiles[f][j])) {
              _context4.next = 21;
              break;
            }
            _context4.next = 16;
            return questions.askOverwriteFiles();
          case 16:
            answers = _context4.sent;
            if (!(answers === false)) {
              _context4.next = 19;
              break;
            }
            return _context4.abrupt("return");
          case 19:
            overwrite = answers.overwrite;
            return _context4.abrupt("break", 24);
          case 21:
            j += 1;
            _context4.next = 12;
            break;
          case 24:
            for (_j = 0; _j < exampleFiles[f].length; _j += 1) {
              file = exampleFiles[f][_j];
              if (!fileExists(path + "/" + file) || overwrite === true) {
                copyFile(exPath + "/" + file, path + "/" + file);
              }
            }
          case 25:
            i += 1;
            _context4.next = 4;
            break;
          case 28:
          case "end":
            return _context4.stop();
        }
      }, _callee4, this);
    }));
    function createFolders$1(_x3, _x4, _x5) {
      return _createFolders.apply(this, arguments);
    }
    return createFolders$1;
  }();
  _proto.downloadWapp = /*#__PURE__*/function () {
    var _downloadWapp = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(app) {
      var status, files, i, file;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            status = new Spinner("Downloading Wapp " + app.getVersion().name);
            status.start();
            this.application = app;
            _context5.next = 5;
            return this.createFolders();
          case 5:
            files = app.getVersion().getFiles();
            i = 0;
          case 7:
            if (!(i < files.length)) {
              _context5.next = 21;
              break;
            }
            file = files[i];
            _context5.prev = 9;
            status.setMessage("Downloading " + file.name + ", please wait...");
            _context5.next = 13;
            return file.download();
          case 13:
            _context5.next = 18;
            break;
          case 15:
            _context5.prev = 15;
            _context5.t0 = _context5["catch"](9);
            file.deleteLocal();
          case 18:
            i += 1;
            _context5.next = 7;
            break;
          case 21:
            status.setMessage('Downloading installation, please wait...');
            _context5.next = 24;
            return this.installation.fetchById(app.getVersion().id);
          case 24:
            this.saveApplication();
            status.stop();
            tui.showMessage("Downloaded Wapp " + app.getVersion().name);
          case 27:
          case "end":
            return _context5.stop();
        }
      }, _callee5, this, [[9, 15]]);
    }));
    function downloadWapp(_x6) {
      return _downloadWapp.apply(this, arguments);
    }
    return downloadWapp;
  }();
  _proto.saveApplication = function saveApplication() {
    this.application.save();
    this.saveManifest(this.application.getVersion());
  };
  _proto.saveManifest = function saveManifest(version) {
    var data;
    if (version) {
      data = version.toJSON();
    } else {
      data = this.manifest;
    }
    var newVersion = pick(data, ['name', 'author', 'version_app', 'max_number_installation', 'supported_features', 'description', 'permission']);
    saveJsonFile('manifest.json', newVersion);
    this.manifest = newVersion;
  };
  _proto.uploadFile = /*#__PURE__*/function () {
    var _uploadFile = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(filePath) {
      var localVersion, localFile;
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            localVersion = this.application.getVersion();
            localFile = localVersion.findFile(filePath);
            if (!localFile) {
              _context6.next = 10;
              break;
            }
            _context6.next = 5;
            return localFile.update();
          case 5:
            _context6.next = 7;
            return this.installation.restart();
          case 7:
            tui.showMessage(filePath + " was updated");
            _context6.next = 11;
            break;
          case 10:
            tui.showVerbose('WAPP', filePath + " was changed but is not part of the version");
          case 11:
          case "end":
            return _context6.stop();
        }
      }, _callee6, this);
    }));
    function uploadFile(_x7) {
      return _uploadFile.apply(this, arguments);
    }
    return uploadFile;
  }();
  _proto.getAllLocalFiles = function getAllLocalFiles() {
    var _this2 = this;
    var localFiles = [];
    this.wapp_folders.forEach(function (folder) {
      localFiles = localFiles.concat(getAllFiles(folder, validateFile, _this2.ignoreFolders));
    });
    return localFiles;
  };
  _proto.update = /*#__PURE__*/function () {
    var _update = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(reinstall) {
      var _this3 = this;
      var results, localFiles, updateFiles, upload, overrideAll, uploadAll, t, localVersion, status, remoteVersion, overide, version, cmp, localVersionFiles, remoteVersionFiles, allFiles, i, file, remoteUpdated, locallyUpdated, fileTime, rf, lf, localIndex, run, answers, _answers, _i, filePath, newFile;
      return _regeneratorRuntime().wrap(function _callee7$(_context7) {
        while (1) switch (_context7.prev = _context7.next) {
          case 0:
            if (this.present()) {
              _context7.next = 2;
              break;
            }
            return _context7.abrupt("return", []);
          case 2:
            results = [];
            localFiles = [];
            updateFiles = [];
            upload = true;
            overrideAll = false;
            uploadAll = false;
            t = this.measure('Compare versions');
            localVersion = this.application.getVersion();
            status = new Spinner('Updating Wapp, please wait...');
            status.start();
            status.setMessage('Downloading version, please wait...');
            _context7.next = 15;
            return localVersion.clone();
          case 15:
            remoteVersion = _context7.sent;
            if (!(remoteVersion && remoteVersion.revision !== localVersion.revision && !compareVersions(this.manifest, remoteVersion.toJSON()))) {
              _context7.next = 25;
              break;
            }
            status.stop();
            _context7.next = 20;
            return questions.remoteVersionUpdated();
          case 20:
            overide = _context7.sent;
            status.start();
            if (!(overide === false)) {
              _context7.next = 24;
              break;
            }
            return _context7.abrupt("return", []);
          case 24:
            if (overide.local) {
              upload = false;
            }
          case 25:
            if (!upload) {
              _context7.next = 35;
              break;
            }
            status.setMessage('Updating version, please wait...');
            version = this.application.getVersion();
            version.parse(this.manifest);
            _context7.next = 31;
            return version.update();
          case 31:
            if (_context7.sent) {
              _context7.next = 35;
              break;
            }
            status.stop();
            t.done('unknown');
            return _context7.abrupt("return", []);
          case 35:
            t.done();
            t = this.measure('Comparing files');
            localFiles = this.getAllLocalFiles();
            cmp = function cmp(item, file) {
              return item.path === file.path;
            };
            localVersionFiles = localVersion.getFiles();
            remoteVersionFiles = remoteVersion.getFiles();
            allFiles = remoteVersionFiles.concat(localVersionFiles.filter(function (item) {
              return !remoteVersionFiles.find(function (file) {
                return cmp(item, file);
              });
            }));
            i = 0;
          case 43:
            if (!(i < allFiles.length)) {
              _context7.next = 109;
              break;
            }
            file = allFiles[i];
            if (file) {
              _context7.next = 47;
              break;
            }
            return _context7.abrupt("continue", 106);
          case 47:
            remoteUpdated = false;
            locallyUpdated = false;
            fileTime = null;
            rf = remoteVersion.findFile(file.path);
            lf = localVersion.findFile(file.path);
            localIndex = localFiles.indexOf(file.path);
            if (localIndex !== -1) {
              localFiles.splice(localFiles.indexOf(file.path), 1);
            }
            fileTime = getFileTimeISO(file.path);
            if (lf && rf) {
              if (rf.meta.updated !== lf.meta.updated) {
                remoteUpdated = true;
                tui.showVerbose('FILE', file.path + " is changed on the server", {
                  remote: rf.meta.updated,
                  local: lf.meta.updated
                });
              }
              if (fileTime && lf.modified !== fileTime) {
                locallyUpdated = true;
                tui.showVerbose('FILE', file.path + " is changed on disk");
              }
            }
            if (overrideAll) {
              locallyUpdated = false;
            } else if (uploadAll) {
              remoteUpdated = false;
            }
            if (!(remoteUpdated && locallyUpdated)) {
              _context7.next = 80;
              break;
            }
            status.stop();
            run = true;
          case 60:
            if (!run) {
              _context7.next = 79;
              break;
            }
            run = false;
            _context7.next = 64;
            return questions.fileConflict(file.path);
          case 64:
            answers = _context7.sent;
            if (!(answers === false)) {
              _context7.next = 67;
              break;
            }
            return _context7.abrupt("return", []);
          case 67:
            _context7.t0 = answers.conflict;
            _context7.next = _context7.t0 === 'override_all' ? 70 : _context7.t0 === 'overwrite' ? 71 : _context7.t0 === 'upload_all' ? 73 : _context7.t0 === 'upload' ? 74 : _context7.t0 === 'abort' ? 76 : 77;
            break;
          case 70:
            overrideAll = true;
          case 71:
            locallyUpdated = false;
            return _context7.abrupt("break", 77);
          case 73:
            uploadAll = true;
          case 74:
            remoteUpdated = false;
            return _context7.abrupt("break", 77);
          case 76:
            process.exit();
          case 77:
            _context7.next = 60;
            break;
          case 79:
            status.start();
          case 80:
            file.status = 'unknown';
            if (!(rf && !lf || remoteUpdated && !locallyUpdated)) {
              _context7.next = 85;
              break;
            }
            try {
              status.setMessage("Downloading " + file.path + ", please wait...");
              results.push(file.download());
              file.status = 'downloaded';
            } catch (err) {
              file.status = 'not downloaded';
            }
            _context7.next = 105;
            break;
          case 85:
            if (!(!remoteUpdated && locallyUpdated)) {
              _context7.next = 91;
              break;
            }
            status.setMessage("Uploading " + file.path + ", please wait...");
            file.status = 'updated';
            results.push(file.update());
            _context7.next = 105;
            break;
          case 91:
            if (!(lf && !fileTime)) {
              _context7.next = 96;
              break;
            }
            file.status = 'deleted';
            if (rf) {
              status.setMessage("Deleting " + file.path + ", please wait...");
              results.push(file["delete"]());
            }
            _context7.next = 105;
            break;
          case 96:
            if (!(!rf && lf && !locallyUpdated)) {
              _context7.next = 105;
              break;
            }
            status.stop();
            _context7.next = 100;
            return questions.askDeleteLocalFile(file.path);
          case 100:
            _answers = _context7.sent;
            status.start();
            if (!(_answers === false)) {
              _context7.next = 104;
              break;
            }
            return _context7.abrupt("return", []);
          case 104:
            if (_answers["delete"]) {
              file.status = 'deleted';
              file.deleteLocal();
            }
          case 105:
            if (file.status !== 'unknown') {
              updateFiles.push(file);
            }
          case 106:
            i += 1;
            _context7.next = 43;
            break;
          case 109:
            _i = 0;
          case 110:
            if (!(_i < localFiles.length)) {
              _context7.next = 120;
              break;
            }
            filePath = localFiles[_i];
            status.setMessage("Creating " + filePath + ", please wait...");
            _context7.next = 115;
            return this.application.getVersion().createFile(filePath);
          case 115:
            newFile = _context7.sent;
            if (newFile) {
              newFile.status = 'created';
              updateFiles.push(newFile);
            }
          case 117:
            _i += 1;
            _context7.next = 110;
            break;
          case 120:
            t.done();
            t = this.measure('Update version');
            status.setMessage('Loading version, please wait...');
            _context7.next = 125;
            return this.installation.fetchById(this.versionID);
          case 125:
            if (reinstall) {
              results.push(this.installation.reinstall());
            } else {
              results.push(this.installation.restart());
            }
            results.push(this.application.getVersion().fetch());
            _context7.next = 129;
            return Promise.all(results);
          case 129:
            status.setMessage('Loading application, please wait...');
            _context7.next = 132;
            return new Promise(function (resolve) {
              var ts = _this3.measure('Wait', 'Waiting for files to be updated');
              setTimeout(function () {
                try {
                  _this3.application.fetch().then(function () {
                    _this3.application.syncFiles();
                    _this3.saveApplication();
                    ts.done();
                    resolve();
                  });
                } catch (err) {
                  ts.done(err);
                  resolve();
                }
              }, 500);
            });
          case 132:
            status.stop();
            t.done();
            return _context7.abrupt("return", updateFiles);
          case 135:
          case "end":
            return _context7.stop();
        }
      }, _callee7, this);
    }));
    function update(_x8) {
      return _update.apply(this, arguments);
    }
    return update;
  }();
  _proto.publish = /*#__PURE__*/function () {
    var _publish = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
      var status, answers, res;
      return _regeneratorRuntime().wrap(function _callee8$(_context8) {
        while (1) switch (_context8.prev = _context8.next) {
          case 0:
            if (this.present()) {
              _context8.next = 2;
              break;
            }
            return _context8.abrupt("return");
          case 2:
            status = new Spinner('Loading application, please wait...');
            status.start();
            _context8.next = 6;
            return this.application.fetch();
          case 6:
            status.stop();
            _context8.next = 9;
            return questions.askPublishWapp(this.manifest.version_app);
          case 9:
            answers = _context8.sent;
            if (!(answers === false)) {
              _context8.next = 12;
              break;
            }
            return _context8.abrupt("return");
          case 12:
            status.setMessage('Publishing new version, please wait...');
            status.start();
            _context8.next = 16;
            return this.application.publish(answers.version);
          case 16:
            res = _context8.sent;
            if (res) {
              this.saveApplication();
              status.stop();
              tui.showMessage("Wapp published with version " + answers.version);
            } else {
              status.stop();
            }
          case 18:
          case "end":
            return _context8.stop();
        }
      }, _callee8, this);
    }));
    function publish() {
      return _publish.apply(this, arguments);
    }
    return publish;
  }();
  _proto.configure = /*#__PURE__*/function () {
    var _configure = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
      var t, answer;
      return _regeneratorRuntime().wrap(function _callee9$(_context9) {
        while (1) switch (_context9.prev = _context9.next) {
          case 0:
            if (this.present()) {
              _context9.next = 2;
              break;
            }
            return _context9.abrupt("return");
          case 2:
            t = this.measure('Load application');
            _context9.next = 5;
            return this.application.fetch();
          case 5:
            t.done();
            t = this.measure('Ask the human');
            _context9.next = 9;
            return questions.configureWapp(this.application.getOAuthExternal(), this.application.getOAuthClient(), this.manifest.permission);
          case 9:
            answer = _context9.sent;
            t.done();
            if (!(answer === false)) {
              _context9.next = 13;
              break;
            }
            return _context9.abrupt("return");
          case 13:
            if (!answer.extsync) {
              _context9.next = 19;
              break;
            }
            t = this.measure('setExtSync');
            this.installation.setExtSync(answer.extsync);
            t.done();
            _context9.next = 39;
            break;
          case 19:
            if (!answer.api_site) {
              _context9.next = 25;
              break;
            }
            t = this.measure('createOauthExternal');
            this.application.createOauthExternal(answer);
            t.done();
            _context9.next = 39;
            break;
          case 25:
            if (!answer.redirect_uri) {
              _context9.next = 31;
              break;
            }
            t = this.measure('createOauthClient');
            this.application.createOauthClient(answer);
            t.done();
            _context9.next = 39;
            break;
          case 31:
            if (!answer.create) {
              _context9.next = 39;
              break;
            }
            t = this.measure('changePermission');
            this.manifest.permission = answer;
            this.saveManifest();
            this.application.getVersion().permission = answer;
            _context9.next = 38;
            return this.application.getVersion().update();
          case 38:
            t.done();
          case 39:
          case "end":
            return _context9.stop();
        }
      }, _callee9, this);
    }));
    function configure() {
      return _configure.apply(this, arguments);
    }
    return configure;
  }();
  _proto["delete"] = /*#__PURE__*/function () {
    var _delete2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10() {
      var _this4 = this;
      var answer, status, results;
      return _regeneratorRuntime().wrap(function _callee10$(_context10) {
        while (1) switch (_context10.prev = _context10.next) {
          case 0:
            if (this.present()) {
              _context10.next = 2;
              break;
            }
            return _context10.abrupt("return");
          case 2:
            _context10.next = 4;
            return questions.deleteWapp();
          case 4:
            answer = _context10.sent;
            if (!(answer === false)) {
              _context10.next = 7;
              break;
            }
            return _context10.abrupt("return");
          case 7:
            if (!answer.del) {
              _context10.next = 30;
              break;
            }
            if (!(!answer.local && !answer.remote)) {
              _context10.next = 11;
              break;
            }
            tui.showWarning('Nothing deleted');
            return _context10.abrupt("return");
          case 11:
            status = new Spinner('Deleting Wapp, please wait...');
            status.start();
            if (answer.local) {
              this.deleteLocal();
            }
            if (!answer.remote) {
              _context10.next = 28;
              break;
            }
            results = [];
            this.application.version.forEach(function (v) {
              if (v.id) {
                results.push(v["delete"]());
                results.push(_this4.installation.deleteById(v.id));
              }
            });
            if (this.application.id) {
              results.push(this.application["delete"]());
            }
            _context10.prev = 18;
            _context10.next = 21;
            return Promise.all(results);
          case 21:
            _context10.next = 28;
            break;
          case 23:
            _context10.prev = 23;
            _context10.t0 = _context10["catch"](18);
            status.stop();
            tui.showError("Failed to delete application: " + _context10.t0);
            return _context10.abrupt("return");
          case 28:
            status.stop();
            tui.showMessage('Wapp deleted');
          case 30:
          case "end":
            return _context10.stop();
        }
      }, _callee10, this, [[18, 23]]);
    }));
    function _delete() {
      return _delete2.apply(this, arguments);
    }
    return _delete;
  }();
  _proto.getInstallationSession = /*#__PURE__*/function () {
    var _getInstallationSession = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
      var ret;
      return _regeneratorRuntime().wrap(function _callee11$(_context11) {
        while (1) switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return this.installation.fetchById(this.versionID);
          case 2:
            ret = _context11.sent;
            if (ret) {
              _context11.next = 5;
              break;
            }
            return _context11.abrupt("return");
          case 5:
            if (this.sessionCallback) {
              this.sessionCallback(this.installation.session);
            }
            return _context11.abrupt("return", this.installation.session);
          case 7:
          case "end":
            return _context11.stop();
        }
      }, _callee11, this);
    }));
    function getInstallationSession() {
      return _getInstallationSession.apply(this, arguments);
    }
    return getInstallationSession;
  }();
  _proto.getInstallationToken = function getInstallationToken() {
    return this.installation.token;
  };
  _proto.handleStreamEvent = /*#__PURE__*/function () {
    var _handleStreamEvent = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(data) {
      var _this5 = this;
      var oldSession, newSession, _this$wappStream, _this$wappStream2;
      return _regeneratorRuntime().wrap(function _callee13$(_context13) {
        while (1) switch (_context13.prev = _context13.next) {
          case 0:
            if (!(data && data.application !== this.application.id)) {
              _context13.next = 2;
              break;
            }
            return _context13.abrupt("return");
          case 2:
            if (!(data && data.installation !== this.installation.id)) {
              _context13.next = 4;
              break;
            }
            return _context13.abrupt("return");
          case 4:
            if (!data.reinstall) {
              _context13.next = 13;
              break;
            }
            oldSession = this.installation.session;
            _context13.next = 8;
            return this.getInstallationSession();
          case 8:
            newSession = _context13.sent;
            if (oldSession !== newSession) {
              (_this$wappStream = this.wappStream) == null ? void 0 : _this$wappStream.close();
              (_this$wappStream2 = this.wappStream) == null ? void 0 : _this$wappStream2.open();
            }
            if (data.log) {
              tui.showStatus(data.log);
            }
            _context13.next = 38;
            break;
          case 13:
            if (!data.log) {
              _context13.next = 17;
              break;
            }
            tui.showLog(data.log, data.type, data.timestamp);
            _context13.next = 38;
            break;
          case 17:
            if (!data.error) {
              _context13.next = 21;
              break;
            }
            if (data.type === 'Background') {
              tui.showLog(data.error, data.type, data.timestamp, 'error');
            } else {
              tui.showError(data.error);
            }
            _context13.next = 38;
            break;
          case 21:
            if (!data.warn) {
              _context13.next = 25;
              break;
            }
            if (data.type === 'Background') {
              tui.showLog(data.warn, data.type, data.timestamp, 'warn');
            } else {
              tui.showWarning(data.warn);
            }
            _context13.next = 38;
            break;
          case 25:
            if (!data.status) {
              _context13.next = 32;
              break;
            }
            tui.showStatus(data.status);
            if (!data.session) {
              _context13.next = 30;
              break;
            }
            _context13.next = 30;
            return this.getInstallationSession();
          case 30:
            _context13.next = 38;
            break;
          case 32:
            if (!data.req) {
              _context13.next = 37;
              break;
            }
            _context13.next = 35;
            return this.mutex.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12() {
              var opts, search, items, results, answers, status, _answers2, _answers3;
              return _regeneratorRuntime().wrap(function _callee12$(_context12) {
                while (1) switch (_context12.prev = _context12.next) {
                  case 0:
                    tui.block();
                    opts = [];
                    search = [];
                    if (!data.req.limitation) {
                      _context12.next = 27;
                      break;
                    }
                    Object.keys(data.req.limitation).forEach(function (key) {
                      var lim = data.req.limitation[key];
                      Object.keys(lim).forEach(function (type) {
                        search.push("this_" + type + "=[" + lim[type].join(',') + "]");
                      });
                    });
                    _context12.next = 7;
                    return _this5.wappsto.find(data.req.type, search.join('&'), data.req.method, data.req.quantity, _this5.installation.id);
                  case 7:
                    items = _context12.sent;
                    if (!items.length) {
                      _context12.next = 24;
                      break;
                    }
                    items.forEach(function (item) {
                      opts.push({
                        name: item.name + " (" + item.meta.id + ")",
                        value: item.meta.id
                      });
                    });
                    results = [];
                    _context12.next = 13;
                    return questions.permissionRequest(data.req, opts);
                  case 13:
                    answers = _context12.sent;
                    if (!(answers === false)) {
                      _context12.next = 16;
                      break;
                    }
                    return _context12.abrupt("return");
                  case 16:
                    answers.permission.forEach(function (per) {
                      results.push(_this5.wappsto.updateACL(per, data.installation, [], data.req.method));
                    });
                    status = 'read';
                    if (answers.permission.length) {
                      status = 'accepted';
                    }
                    results.push(_this5.wappsto.readNotification(data.id, status));
                    _context12.next = 22;
                    return Promise.all(results);
                  case 22:
                    _context12.next = 25;
                    break;
                  case 24:
                    tui.showWarning("Failed to find anything matching the permission request from " + data.req.name_installation);
                  case 25:
                    _context12.next = 66;
                    break;
                  case 27:
                    if (!data.req.collection) {
                      _context12.next = 48;
                      break;
                    }
                    _context12.next = 30;
                    return questions.precisePermissionRequest(data.req);
                  case 30:
                    _answers2 = _context12.sent;
                    if (!(_answers2 === false)) {
                      _context12.next = 33;
                      break;
                    }
                    return _context12.abrupt("return");
                  case 33:
                    if (!_answers2.accept) {
                      _context12.next = 44;
                      break;
                    }
                    if (!(data.req.method[0] === 'add')) {
                      _context12.next = 39;
                      break;
                    }
                    _context12.next = 37;
                    return _this5.wappsto.updateACLRestriction(data.installation, data.req.collection);
                  case 37:
                    _context12.next = 40;
                    break;
                  case 39:
                    tui.showWarning("Unknown '" + data.req.method[0] + "' permission request");
                  case 40:
                    _context12.next = 42;
                    return _this5.wappsto.readNotification(data.id, 'accepted');
                  case 42:
                    _context12.next = 46;
                    break;
                  case 44:
                    _context12.next = 46;
                    return _this5.wappsto.readNotification(data.id, 'denied');
                  case 46:
                    _context12.next = 66;
                    break;
                  case 48:
                    if (!data.req.name_installation) {
                      _context12.next = 65;
                      break;
                    }
                    _context12.next = 51;
                    return questions.precisePermissionRequest(data.req);
                  case 51:
                    _answers3 = _context12.sent;
                    if (!(_answers3 === false)) {
                      _context12.next = 54;
                      break;
                    }
                    return _context12.abrupt("return");
                  case 54:
                    if (!_answers3.accept) {
                      _context12.next = 61;
                      break;
                    }
                    _context12.next = 57;
                    return _this5.installation.setExtSync(true);
                  case 57:
                    _context12.next = 59;
                    return _this5.wappsto.readNotification(data.id, 'accepted');
                  case 59:
                    _context12.next = 63;
                    break;
                  case 61:
                    _context12.next = 63;
                    return _this5.wappsto.readNotification(data.id, 'denied');
                  case 63:
                    _context12.next = 66;
                    break;
                  case 65:
                    tui.showError('Failed to handle request', data.req);
                  case 66:
                    tui.unblock();
                  case 67:
                  case "end":
                    return _context12.stop();
                }
              }, _callee12);
            })));
          case 35:
            _context13.next = 38;
            break;
          case 37:
            if (typeof data !== 'string') {
              tui.showMessage(JSON.stringify(data));
            } else {
              tui.showMessage(data);
            }
          case 38:
          case "end":
            return _context13.stop();
        }
      }, _callee13, this);
    }));
    function handleStreamEvent(_x9) {
      return _handleStreamEvent.apply(this, arguments);
    }
    return handleStreamEvent;
  }();
  _proto.openStream = /*#__PURE__*/function () {
    var _openStream = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(sessionCallback) {
      return _regeneratorRuntime().wrap(function _callee14$(_context14) {
        while (1) switch (_context14.prev = _context14.next) {
          case 0:
            if (sessionCallback) {
              this.sessionCallback = sessionCallback;
            }
            this.userStream = new Stream(this.wappsto, ['/notification', '/installation'], this.handleStreamEvent);
            this.userStream.open();
            this.wappStream = new Stream(this.wappsto, ['/extsync', '/console'], this.handleStreamEvent, this.installation.session);
            this.wappStream.open();
          case 5:
          case "end":
            return _context14.stop();
        }
      }, _callee14, this);
    }));
    function openStream(_x10) {
      return _openStream.apply(this, arguments);
    }
    return openStream;
  }();
  _proto.measure = function measure(name, description, data) {
    return new Trace(name, description, data);
  };
  _createClass(Wapp, [{
    key: "host",
    get: function get() {
      return this.wappsto.HOST;
    }
  }, {
    key: "versionID",
    get: function get() {
      return this.application.getVersion().id;
    }
  }, {
    key: "hasForeground",
    get: function get() {
      return this.installation.hasForeground;
    }
  }, {
    key: "hasBackground",
    get: function get() {
      return this.installation.hasBackground;
    }
  }]);
  return Wapp;
}();

var optionDefinitions$5 = [{
  name: 'help',
  description: 'Display this usage guide.',
  alias: 'h',
  type: Boolean
}, {
  name: 'validate',
  description: 'Validate all the data that was send to Wappsto.',
  alias: 'V',
  type: Boolean
}, {
  name: 'verbose',
  description: 'Enable verbose output.',
  alias: 'v',
  type: Boolean
}, {
  name: 'debug',
  description: 'Enable debug output.',
  alias: 'd',
  type: Boolean
}, {
  name: 'quiet',
  description: 'Do not print the header.',
  alias: 'q',
  type: Boolean
}];
var sections$6 = [{
  header: 'Create Wapp',
  content: 'Script to create a new wapp on wappsto.'
}, {
  header: 'Synopsis',
  content: ['$ wapp create', '$ wapp create {bold --validate} {bold --vervose}', '$ wapp create {bold --help}']
}, {
  header: 'Options',
  optionList: optionDefinitions$5
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
function create(_x) {
  return _create.apply(this, arguments);
}
function _create() {
  _create = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(argv) {
    var options, wapp;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          options = commandLineArgs(optionDefinitions$5, {
            argv: argv
          });
          _context.next = 9;
          break;
        case 4:
          _context.prev = 4;
          _context.t0 = _context["catch"](0);
          tui.showError(_context.t0.message);
          console.log(commandLineUsage(sections$6));
          return _context.abrupt("return");
        case 9:
          if (!options.help) {
            _context.next = 12;
            break;
          }
          console.log(commandLineUsage(sections$6));
          return _context.abrupt("return");
        case 12:
          tui.debug = options.debug;
          tui.verbose = options.verbose;
          if (options.quiet) {
            _context.next = 17;
            break;
          }
          _context.next = 17;
          return tui.header('Create Wapp');
        case 17:
          _context.prev = 17;
          wapp = new Wapp();
          _context.next = 21;
          return wapp.init();
        case 21:
          _context.next = 23;
          return wapp.create(options.validate);
        case 23:
          _context.next = 28;
          break;
        case 25:
          _context.prev = 25;
          _context.t1 = _context["catch"](17);
          if (_context.t1.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
          } else {
            tui.showError('Create error', _context.t1);
          }
        case 28:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4], [17, 25]]);
  }));
  return _create.apply(this, arguments);
}

var optionDefinitions$4 = [{
  name: 'help',
  description: 'Display this usage guide.',
  alias: 'h',
  type: Boolean
}, {
  name: 'reinstall',
  description: 'Trigger a reinstall of the background wapp.',
  alias: 'r',
  type: Boolean
}, {
  name: 'verbose',
  description: 'Enable verbose output.',
  alias: 'v',
  type: Boolean
}, {
  name: 'debug',
  description: 'Enable debug output.',
  alias: 'd',
  type: Boolean
}, {
  name: 'quiet',
  description: 'Do not print the header.',
  alias: 'q',
  type: Boolean
}];
var sections$5 = [{
  header: 'Update Wapp',
  content: 'Script to sync your local wapp files with wappsto.'
}, {
  header: 'Synopsis',
  content: ['$ wapp update', '$ wapp update {bold --reinstall}', '$ wapp update {bold --help}']
}, {
  header: 'Options',
  optionList: optionDefinitions$4
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
function update(_x) {
  return _update.apply(this, arguments);
}
function _update() {
  _update = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(argv) {
    var options, wapp, files;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          options = commandLineArgs(optionDefinitions$4, {
            argv: argv
          });
          _context.next = 9;
          break;
        case 4:
          _context.prev = 4;
          _context.t0 = _context["catch"](0);
          tui.showError(_context.t0.message);
          console.log(commandLineUsage(sections$5));
          return _context.abrupt("return");
        case 9:
          if (!options.help) {
            _context.next = 12;
            break;
          }
          console.log(commandLineUsage(sections$5));
          return _context.abrupt("return");
        case 12:
          tui.debug = options.debug;
          tui.verbose = options.verbose;
          if (options.quiet) {
            _context.next = 17;
            break;
          }
          _context.next = 17;
          return tui.header('Update Wapp');
        case 17:
          _context.prev = 17;
          wapp = new Wapp();
          _context.next = 21;
          return wapp.init();
        case 21:
          _context.next = 23;
          return wapp.update(options.reinstall);
        case 23:
          files = _context.sent;
          files.forEach(function (f) {
            tui.showMessage(f.path + " was " + f.status);
          });
          tui.showMessage('Wapp Updated');
          _context.next = 31;
          break;
        case 28:
          _context.prev = 28;
          _context.t1 = _context["catch"](17);
          tui.showError('Run error', _context.t1);
        case 31:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4], [17, 28]]);
  }));
  return _update.apply(this, arguments);
}

var optionDefinitions$3 = [{
  name: 'help',
  description: 'Display this usage guide.',
  alias: 'h',
  type: Boolean
}, {
  name: 'verbose',
  description: 'Enable verbose output.',
  alias: 'v',
  type: Boolean
}, {
  name: 'debug',
  description: 'Enable debug output.',
  alias: 'd',
  type: Boolean
}, {
  name: 'quiet',
  description: 'Do not print the header.',
  alias: 'q',
  type: Boolean
}];
var sections$4 = [{
  header: 'Delete Wapp',
  content: 'Script to delete the Wapp on Wappsto.'
}, {
  header: 'Synopsis',
  content: ['$ wapp delete', '$ wapp delete {bold --verbose}', '$ wapp delete {bold --help}']
}, {
  header: 'Options',
  optionList: optionDefinitions$3
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
function Delete(_x) {
  return _Delete.apply(this, arguments);
}
function _Delete() {
  _Delete = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(argv) {
    var options, wapp;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          options = commandLineArgs(optionDefinitions$3, {
            argv: argv
          });
          _context.next = 9;
          break;
        case 4:
          _context.prev = 4;
          _context.t0 = _context["catch"](0);
          tui.showError(_context.t0.message);
          console.log(commandLineUsage(sections$4));
          return _context.abrupt("return");
        case 9:
          if (!options.help) {
            _context.next = 12;
            break;
          }
          console.log(commandLineUsage(sections$4));
          return _context.abrupt("return");
        case 12:
          tui.debug = options.debug;
          tui.verbose = options.verbose;
          _context.prev = 14;
          if (options.quiet) {
            _context.next = 18;
            break;
          }
          _context.next = 18;
          return tui.header('Delete Wapp');
        case 18:
          wapp = new Wapp();
          if (!wapp.present()) {
            _context.next = 26;
            break;
          }
          _context.next = 22;
          return wapp.init();
        case 22:
          _context.next = 24;
          return wapp["delete"]();
        case 24:
          _context.next = 27;
          break;
        case 26:
          tui.showError('No Wapp found in current folder');
        case 27:
          _context.next = 32;
          break;
        case 29:
          _context.prev = 29;
          _context.t1 = _context["catch"](14);
          tui.showError('Run error', _context.t1);
        case 32:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4], [14, 29]]);
  }));
  return _Delete.apply(this, arguments);
}

var optionDefinitions$2 = [{
  name: 'help',
  description: 'Display this usage guide.',
  alias: 'h',
  type: Boolean
}, {
  name: 'verbose',
  description: 'Enable verbose output.',
  alias: 'v',
  type: Boolean
}, {
  name: 'debug',
  description: 'Enable debug output.',
  alias: 'd',
  type: Boolean
}, {
  name: 'quiet',
  description: 'Do not print the header.',
  alias: 'q',
  type: Boolean
}];
var sections$3 = [{
  header: 'Configure Wapp',
  content: 'Script to change settings for your wapp on wappsto.'
}, {
  header: 'Synopsis',
  content: ['$ wapp configure', '$ wapp configure {bold --verbose}', '$ wapp configure {bold --help}']
}, {
  header: 'Options',
  optionList: optionDefinitions$2
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
function configure(_x) {
  return _configure.apply(this, arguments);
}
function _configure() {
  _configure = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(argv) {
    var options, wapp;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          options = commandLineArgs(optionDefinitions$2, {
            argv: argv
          });
          _context.next = 9;
          break;
        case 4:
          _context.prev = 4;
          _context.t0 = _context["catch"](0);
          tui.showError(_context.t0.message);
          console.log(commandLineUsage(sections$3));
          return _context.abrupt("return");
        case 9:
          if (!options.help) {
            _context.next = 12;
            break;
          }
          console.log(commandLineUsage(sections$3));
          return _context.abrupt("return");
        case 12:
          tui.debug = options.debug;
          tui.verbose = options.verbose;
          if (!options.quiet) {
            tui.header('Configure Wapp');
          }
          _context.prev = 15;
          wapp = new Wapp();
          _context.next = 19;
          return wapp.init();
        case 19:
          _context.next = 21;
          return wapp.configure();
        case 21:
          _context.next = 26;
          break;
        case 23:
          _context.prev = 23;
          _context.t1 = _context["catch"](15);
          tui.showError('Run error', _context.t1);
        case 26:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4], [15, 23]]);
  }));
  return _configure.apply(this, arguments);
}

var optionDefinitions$1 = [{
  name: 'help',
  description: 'Display this usage guide.',
  alias: 'h',
  type: Boolean
}, {
  name: 'port',
  description: 'Change the port that the foreground wapp is served on.',
  alias: 'p',
  type: Number
}, {
  name: 'verbose',
  description: 'Enable verbose output.',
  alias: 'v',
  type: Boolean
}, {
  name: 'debug',
  description: 'Enable debug output.',
  alias: 'd',
  type: Boolean
}, {
  name: 'remote',
  description: 'Run the background wapp on the server',
  alias: 'r',
  type: Boolean
}, {
  name: 'nobrowser',
  description: 'Do not open the browser',
  alias: 'n',
  type: Boolean
}, {
  name: 'reinstall',
  description: 'Trigger a reinstall of the background wapp.',
  alias: 'i',
  type: Boolean
}, {
  name: 'quiet',
  description: 'Do not print the header.',
  alias: 'q',
  type: Boolean
}];
var sections$2 = [{
  header: 'Serve Wapp',
  content: 'Script to run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.'
}, {
  header: 'Synopsis',
  content: ['$ wapp serve', '$ wapp serve {bold --port 4000} {bold --verbose}', '$ wapp serve {bold --remote} {bold --nobrowser}', '$ wapp serve {bold --help}']
}, {
  header: 'Options',
  optionList: optionDefinitions$1
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
function serve(_x) {
  return _serve.apply(this, arguments);
}
function _serve() {
  _serve = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(argv) {
    var options, wapp, isForegroundPresent, isBackgroundPresent, startForegroundServer, _startForegroundServer, registerBackgroundWatcher, startRemoteBackgroundRunner, _startRemoteBackgroundRunner, startLocalBackgroundRunner, _startLocalBackgroundRunner, sessionID, tokenID, backgroundFiles;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _startLocalBackgroundRunner = function _startLocalBackground2() {
            _startLocalBackgroundRunner = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(sessionID, tokenID) {
              var install, _install, start, stop, runner;
              return _regeneratorRuntime().wrap(function _callee6$(_context6) {
                while (1) switch (_context6.prev = _context6.next) {
                  case 0:
                    stop = function _stop(runner) {
                      if (!runner) return;
                      tui.showWarning('Restarting Background Runner ');
                      runner.kill();
                    };
                    start = function _start() {
                      var _runner$stdout, _runner$stderr;
                      var runner = spawn('node', ['main.js'], {
                        cwd: config.background(),
                        env: {
                          baseUrl: config.host() + "/services",
                          sessionID: sessionID,
                          tokenID: tokenID,
                          DISABLE_LOG: 'true'
                        }
                      });
                      runner.on('exit', function (code, signal) {
                        if (!runner.killed) {
                          if (code === 0) {
                            tui.showMessage('Background Wapp stopped normally');
                          } else {
                            tui.showError("Background Wapp crashed - code " + code + " and signal " + signal);
                          }
                        }
                      });
                      function printLog(data, type) {
                        tui.showLog(data.toString().replace(/^\s+|\s+$/g, ''), 'Background', '', type);
                      }
                      (_runner$stdout = runner.stdout) == null ? void 0 : _runner$stdout.on('data', function (data) {
                        printLog(data, 'normal');
                      });
                      (_runner$stderr = runner.stderr) == null ? void 0 : _runner$stderr.on('data', function (data) {
                        printLog(data, 'error');
                      });
                      tui.showMessage('Background Runner Started');
                      return runner;
                    };
                    _install = function _install3() {
                      _install = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
                        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
                          while (1) switch (_context5.prev = _context5.next) {
                            case 0:
                              return _context5.abrupt("return", new Promise(function (resolve, reject) {
                                var _npm$stderr;
                                var npm = spawn('npm', ['install'], {
                                  cwd: config.background()
                                });
                                npm.on('exit', function (code) {
                                  if (code === 0) {
                                    tui.showMessage('Packages installed');
                                    resolve();
                                  } else {
                                    reject();
                                  }
                                });
                                (_npm$stderr = npm.stderr) == null ? void 0 : _npm$stderr.on('data', function (data) {
                                  tui.showError(data);
                                });
                              }));
                            case 1:
                            case "end":
                              return _context5.stop();
                          }
                        }, _callee5);
                      }));
                      return _install.apply(this, arguments);
                    };
                    install = function _install2() {
                      return _install.apply(this, arguments);
                    };
                    tui.showMessage('Starting the background wapp locally');
                    _context6.prev = 5;
                    _context6.next = 8;
                    return install();
                  case 8:
                    runner = start();
                    _context6.next = 13;
                    break;
                  case 11:
                    _context6.prev = 11;
                    _context6.t0 = _context6["catch"](5);
                  case 13:
                    registerBackgroundWatcher( /*#__PURE__*/function () {
                      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(name) {
                        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                          while (1) switch (_context4.prev = _context4.next) {
                            case 0:
                              stop(runner);
                              if (name === config.background() + "/package.json") {
                                install().then(function () {
                                  runner = start();
                                })["catch"](function () {});
                              } else {
                                runner = start();
                              }
                            case 2:
                            case "end":
                              return _context4.stop();
                          }
                        }, _callee4);
                      }));
                      return function (_x7) {
                        return _ref2.apply(this, arguments);
                      };
                    }());
                  case 14:
                  case "end":
                    return _context6.stop();
                }
              }, _callee6, null, [[5, 11]]);
            }));
            return _startLocalBackgroundRunner.apply(this, arguments);
          };
          startLocalBackgroundRunner = function _startLocalBackground(_x4, _x5) {
            return _startLocalBackgroundRunner.apply(this, arguments);
          };
          _startRemoteBackgroundRunner = function _startRemoteBackgroun2() {
            _startRemoteBackgroundRunner = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
              return _regeneratorRuntime().wrap(function _callee3$(_context3) {
                while (1) switch (_context3.prev = _context3.next) {
                  case 0:
                    tui.showMessage('Starting the background wapp on the server');
                    registerBackgroundWatcher( /*#__PURE__*/function () {
                      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(name) {
                        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                          while (1) switch (_context2.prev = _context2.next) {
                            case 0:
                              wapp.uploadFile(name);
                            case 1:
                            case "end":
                              return _context2.stop();
                          }
                        }, _callee2);
                      }));
                      return function (_x6) {
                        return _ref.apply(this, arguments);
                      };
                    }());
                  case 2:
                  case "end":
                    return _context3.stop();
                }
              }, _callee3);
            }));
            return _startRemoteBackgroundRunner.apply(this, arguments);
          };
          startRemoteBackgroundRunner = function _startRemoteBackgroun() {
            return _startRemoteBackgroundRunner.apply(this, arguments);
          };
          registerBackgroundWatcher = function _registerBackgroundWa(cb) {
            var restarting = false;
            watch(config.background(), {
              filter: function filter(f, skip) {
                if (/\/node_modules/.test(f)) return skip;
                if (/\.git/.test(f)) return skip;
                if (/\.#/.test(f)) return skip;
                return /\.js|\.json$/.test(f);
              },
              recursive: true
            }, function (evt, name) {
              if (!restarting) {
                restarting = true;
                cb(name).then(function () {
                  restarting = false;
                });
              }
            });
          };
          _startForegroundServer = function _startForegroundServe2() {
            _startForegroundServer = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(sessionID, tokenID) {
              var port, newPort, haveFile, bs;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    haveFile = function _haveFile(dir, request) {
                      var uri = url.parse(request.url).pathname || '';
                      var filename = path.join(process.cwd(), dir, uri);
                      var index = 'index.html';
                      if (directoryExists(filename)) {
                        if (fileExists(filename + index)) {
                          if (!request.url.endsWith('/')) {
                            request.url += '/';
                          }
                          request.url += index;
                          return true;
                        }
                      } else if (fileExists(filename)) {
                        return true;
                      }
                      return false;
                    };
                    port = options.port || config.port();
                    _context.next = 4;
                    return detect(port);
                  case 4:
                    newPort = _context.sent;
                    if (port !== newPort) {
                      tui.showWarning(port + " is in use, switching to " + newPort);
                    }
                    bs = browserSync.create('Wappsto Wapp');
                    bs.init({
                      logPrefix: 'Wappsto Cli',
                      port: newPort,
                      ui: false,
                      https: false,
                      proxy: {
                        target: "" + config.host(),
                        ws: true,
                        proxyReq: [function (req) {
                          req.setHeader('x-session', sessionID);
                          if (req.headers && req.headers.referer) {
                            req.headers.referer = req.headers.referer.replace("http://localhost:" + newPort, "" + config.host());
                          }
                        }]
                      },
                      middleware: function middleware(request, response, next) {
                        response.setHeader('set-cookie', "sessionID=" + sessionID + "; tokenID=" + tokenID + "; SameSite=Lax");
                        try {
                          if (request.url.includes('services')) {
                            next();
                          } else {
                            if (haveFile(config.foreground(), request)) {
                              response.end(loadFile(config.foreground() + "/" + request.url));
                            } else {
                              response.writeHead(404, {
                                'Content-Type': 'text/plain'
                              });
                              response.end('Not found in your foreground wapp');
                            }
                          }
                        } catch (e) {
                          tui.showError('Failed to serve local file', e);
                        }
                      },
                      files: '*',
                      browser: config.browser(),
                      open: !options.nobrowser,
                      online: true
                    });
                  case 8:
                  case "end":
                    return _context.stop();
                }
              }, _callee);
            }));
            return _startForegroundServer.apply(this, arguments);
          };
          startForegroundServer = function _startForegroundServe(_x2, _x3) {
            return _startForegroundServer.apply(this, arguments);
          };
          isBackgroundPresent = function _isBackgroundPresent() {
            var index = path.join(config.background(), 'main.js');
            if (!fs.existsSync(index)) {
              tui.showWarning("File '" + index + "' not found.");
              return false;
            }
            return true;
          };
          isForegroundPresent = function _isForegroundPresent() {
            var index = path.join(config.foreground(), 'index.html');
            if (!fs.existsSync(index)) {
              tui.showWarning("File '" + index + "' not found.");
              return false;
            }
            return true;
          };
          _context7.prev = 9;
          options = commandLineArgs(optionDefinitions$1, {
            argv: argv
          });
          _context7.next = 18;
          break;
        case 13:
          _context7.prev = 13;
          _context7.t0 = _context7["catch"](9);
          tui.showError(_context7.t0.message);
          console.log(commandLineUsage(sections$2));
          return _context7.abrupt("return");
        case 18:
          if (!options.help) {
            _context7.next = 21;
            break;
          }
          console.log(commandLineUsage(sections$2));
          return _context7.abrupt("return");
        case 21:
          tui.debug = options.debug;
          tui.verbose = options.verbose;
          if (options.quiet) {
            _context7.next = 26;
            break;
          }
          _context7.next = 26;
          return tui.header('Serve Wapp');
        case 26:
          wapp = new Wapp(options.remote || false);
          if (wapp.present()) {
            _context7.next = 30;
            break;
          }
          tui.showError('No Wapp found in current folder');
          return _context7.abrupt("return");
        case 30:
          _context7.prev = 30;
          _context7.next = 33;
          return wapp.init();
        case 33:
          if (!(wapp.hasBackground && options.reinstall)) {
            _context7.next = 37;
            break;
          }
          tui.showMessage('Reinstalling...');
          _context7.next = 37;
          return wapp.installation.reinstall();
        case 37:
          _context7.next = 39;
          return wapp.getInstallationSession();
        case 39:
          sessionID = _context7.sent;
          if (sessionID) {
            _context7.next = 43;
            break;
          }
          tui.showError('Failed to get Session from Installation');
          return _context7.abrupt("return");
        case 43:
          tokenID = wapp.getInstallationToken();
          _context7.next = 46;
          return wapp.openStream();
        case 46:
          if (wapp.hasForeground) {
            if (isForegroundPresent()) {
              startForegroundServer(sessionID, tokenID);
            } else {
              tui.showWarning('No foreground files found, local webserver is not started');
            }
          }
          if (!wapp.hasBackground) {
            _context7.next = 67;
            break;
          }
          if (!isBackgroundPresent()) {
            _context7.next = 66;
            break;
          }
          if (!options.remote) {
            _context7.next = 57;
            break;
          }
          _context7.next = 52;
          return wapp.update();
        case 52:
          backgroundFiles = _context7.sent;
          backgroundFiles.forEach(function (f) {
            tui.showMessage(f.name + " was " + f.status);
          });
          startRemoteBackgroundRunner();
          _context7.next = 64;
          break;
        case 57:
          _context7.next = 59;
          return wapp.installation.stop();
        case 59:
          if (!_context7.sent) {
            _context7.next = 63;
            break;
          }
          startLocalBackgroundRunner(sessionID, tokenID);
          _context7.next = 64;
          break;
        case 63:
          tui.showError('Failed to stop the background runner on the server. Not starting background runner');
        case 64:
          _context7.next = 67;
          break;
        case 66:
          tui.showWarning('No background files found, local background runner is not started');
        case 67:
          _context7.next = 73;
          break;
        case 69:
          _context7.prev = 69;
          _context7.t1 = _context7["catch"](30);
          if (_context7.t1.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
          } else {
            tui.showError('Run error', _context7.t1);
          }
          return _context7.abrupt("return");
        case 73:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[9, 13], [30, 69]]);
  }));
  return _serve.apply(this, arguments);
}

var optionDefinitions = [{
  name: 'help',
  description: 'Display this usage guide.',
  alias: 'h',
  type: Boolean
}, {
  name: 'verbose',
  description: 'Enable verbose output.',
  alias: 'v',
  type: Boolean
}, {
  name: 'debug',
  description: 'Enable debug output.',
  alias: 'd',
  type: Boolean
}, {
  name: 'quiet',
  description: 'Do not print the header.',
  alias: 'q',
  type: Boolean
}];
var sections$1 = [{
  header: 'Publish Wapp',
  content: 'Script to publish a new version of your wapp to wappsto.'
}, {
  header: 'Synopsis',
  content: ['$ wapp publish', '$ wapp publish {bold --help}']
}, {
  header: 'Options',
  optionList: optionDefinitions
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
function publish(_x) {
  return _publish.apply(this, arguments);
}
function _publish() {
  _publish = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(argv) {
    var options, wapp;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          options = commandLineArgs(optionDefinitions, {
            argv: argv
          });
          _context.next = 9;
          break;
        case 4:
          _context.prev = 4;
          _context.t0 = _context["catch"](0);
          tui.showError(_context.t0.message);
          console.log(commandLineUsage(sections$1));
          return _context.abrupt("return");
        case 9:
          if (!options.help) {
            _context.next = 12;
            break;
          }
          console.log(commandLineUsage(sections$1));
          return _context.abrupt("return");
        case 12:
          tui.debug = options.debug;
          tui.verbose = options.verbose;
          if (options.quiet) {
            _context.next = 17;
            break;
          }
          _context.next = 17;
          return tui.header('Publish Wapp');
        case 17:
          _context.prev = 17;
          wapp = new Wapp();
          _context.next = 21;
          return wapp.init();
        case 21:
          _context.next = 23;
          return wapp.publish();
        case 23:
          _context.next = 28;
          break;
        case 25:
          _context.prev = 25;
          _context.t1 = _context["catch"](17);
          tui.showError('Run error', _context.t1);
        case 28:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4], [17, 25]]);
  }));
  return _publish.apply(this, arguments);
}

var mainDefinitions = [{
  name: 'command',
  defaultOption: true
}];
var sections = [{
  header: 'wappsto-cli',
  content: 'Script to create and maintain wapps on {underline wappsto.com}'
}, {
  header: 'Synopsis',
  content: '$ wapp <command> <options>'
}, {
  header: 'Command List',
  content: [{
    name: 'help',
    summary: 'Print information about this script.'
  }, {
    name: 'create',
    summary: 'Create a new wapp on Wappsto.'
  }, {
    name: 'update',
    summary: 'Sync your local files with wappsto.'
  }, {
    name: 'serve',
    summary: 'Run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.'
  }, {
    name: 'configure',
    summary: 'Change settings for your wapp on wappsto.'
  }, {
    name: 'publish',
    summary: 'Publish a new version of your wapp to wappsto.'
  }, {
    name: 'delete',
    summary: 'Delete the Wapp on Wappsto.'
  }]
}, {
  content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}'
}];
var transaction;
_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
  var mainOptions, argv, _transaction;
  return _regeneratorRuntime().wrap(function _callee$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        _context.prev = 0;
        mainOptions = commandLineArgs(mainDefinitions, {
          stopAtFirstUnknown: true
        });
        argv = mainOptions._unknown || [];
        transaction = startTrace(mainOptions.command);
        _context.t0 = mainOptions.command;
        _context.next = _context.t0 === 'create' ? 7 : _context.t0 === 'update' ? 10 : _context.t0 === 'configure' ? 13 : _context.t0 === 'publish' ? 16 : _context.t0 === 'delete' ? 19 : _context.t0 === 'serve' ? 22 : _context.t0 === 'help' ? 25 : 25;
        break;
      case 7:
        _context.next = 9;
        return create(argv);
      case 9:
        return _context.abrupt("break", 27);
      case 10:
        _context.next = 12;
        return update(argv);
      case 12:
        return _context.abrupt("break", 27);
      case 13:
        _context.next = 15;
        return configure(argv);
      case 15:
        return _context.abrupt("break", 27);
      case 16:
        _context.next = 18;
        return publish(argv);
      case 18:
        return _context.abrupt("break", 27);
      case 19:
        _context.next = 21;
        return Delete(argv);
      case 21:
        return _context.abrupt("break", 27);
      case 22:
        _context.next = 24;
        return serve(argv);
      case 24:
        return _context.abrupt("break", 27);
      case 25:
        console.log(commandLineUsage(sections));
        return _context.abrupt("break", 27);
      case 27:
        _context.next = 34;
        break;
      case 29:
        _context.prev = 29;
        _context.t1 = _context["catch"](0);
        Sentry.captureException(_context.t1);
        console.error(_context.t1.message);
        process.exit(-1);
      case 34:
        _context.prev = 34;
        (_transaction = transaction) == null ? void 0 : _transaction.finish();
        return _context.finish(34);
      case 37:
      case "end":
        return _context.stop();
    }
  }, _callee, null, [[0, 29, 34, 37]]);
}))();
//# sourceMappingURL=wappsto-cli.esm.js.map
