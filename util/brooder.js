var is = {
    isFunction: function (obj) {
        return (typeof obj === 'function') && obj.constructor === Function;
    },
    isEmptyObject: function (obj) {
        for (var a in obj) {
            return false;
        }
        return true;
    },
    isUndefined: function (obj) {
        return obj === undefined;
    },
    isWindow: function (obj) {
        return obj !== undefined && obj !== null && obj === obj.window;
    },
    isDocument: function (obj) {
        return obj !== null && obj.nodeType === obj.DOCUMENT_NODE;
    },
    isObject: function (obj) {
        return  typeof (obj) === "object" && Object.prototype.toString.call(obj).toLowerCase() === "[object object]" && !obj.length;
    },
    isString: function (obj) {
        return (typeof obj === 'string') && obj.constructor === String;
    },
    isNumber: function (obj) {
        return typeof obj === "number";
    },
    isNumeric: function (obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    },
    isAvalid: function (obj) {
        return obj !== null && obj !== undefined;
    },
    isArray: function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    isQueryString: function (str) {
        return is.isString(str) && /(^|&).*=([^&]*)(&|$)/.test(str);
    },
    isElement: function (e) {
        return e && e.nodeType === 1 && e.nodeName;
    }
};

var json = {
    parse: function (str) {
        return window.JSON.parse(str);
    },
    stringify: function (obj) {
        return window.JSON.stringify(obj);
    },
    each: function (object, fn) {
        var name, i = 0, length = object.length, isObj = length === undefined || is.isFunction(object);
        if (isObj) {
            for (name in object) {
                if (fn.call(object[ name ], name, object[ name ]) === false) {
                    break;
                }
            }
        } else {
            while (i < length) {
                if (fn.call(object[ i ], i, object[ i++ ]) === false) {
                    break;
                }
            }
        }
        return object;
    },
    clone: function (obj) {
        var a;
        if (is.isArray(obj)) {
            a = [];
            for (var i = 0; i < obj.length; i++) {
                a[i] = json.clone(obj[i]);
            }
            return a;
        } else if (is.isObject(obj)) {
            a = {};
            for (var i in obj) {
                a[i] = json.clone(obj[i]);
            }
            return a;
        } else {
            return obj;
        }
    },
    cover: function () {
        var obj, key, val, vals, arrayis, clone, result = arguments[0] || {}, i = 1, length = arguments.length, isdeep = false;
        if (typeof result === "boolean") {
            isdeep = result;
            result = arguments[1] || {};
            i = 2;
        }
        if (typeof result !== "object" && !is.isFunction(result)) {
            result = {};
        }
        if (length === i) {
            result = this;
            i = i - 1;
        }
        while (i < length) {
            obj = arguments[i];
            if (obj !== null) {
                for (key in obj) {
                    val = result[key];
                    vals = obj[key];
                    if (result === vals) {
                        continue;
                    }
                    arrayis = is.isArray(vals);
                    if (isdeep && vals && (is.isObject(vals) || arrayis)) {
                        if (arrayis) {
                            arrayis = false;
                            clone = val && is.isArray(val) ? val : [];
                        } else {
                            clone = val && is.isObject(val) ? val : {};
                        }
                        result[key] = json.cover(isdeep, clone, vals);
                    } else if (vals !== undefined) {
                        result[key] = vals;
                    }
                }
            }
            i++;
        }
        return result;
    }
};

var util = {
    uuid: function () {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''), uuid = new Array(36), rnd = 0, r;
        for (var i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid[i] = '-';
            } else if (i === 14) {
                uuid[i] = '4';
            } else {
                if (rnd <= 0x02)
                    rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    }
};

var queue = function () {
    this.list = [];
    this.length = null;
    this.current = null;
    this.state = "init";//running,end,stop.
    this._start = null;
    this._progress = null;
    this._complete = null;
    this.result = null;
};
queue.prototype.add = function (fn, error, parameter) {
    if (this.state === "init") {
        this.list.push({
            fn: fn,
            parameter: parameter,
            error: error || null
        });
    } else {
        throw Error("[brooder]-this queue can not add task when it is not in state of init.");
    }
    return this;
};
queue.prototype.next = function (data) {
    this._progress && this._progress.call(this, {
        total: this.length,
        runed: this.length - this.list.length,
        data: data
    });
    queue._fire.call(this, data);
    return this;
};
queue.prototype.left = function () {
    return this.list.length;
};
queue.prototype.total = function () {
    return this.length;
};
queue.prototype.run = function (data) {
    if (this.length === null) {
        this._start && this._start.call(this);
        this.length = this.list.length;
    }
    this.state = 'running';
    queue._fire.call(this, data);
};
queue.prototype.stop = function () {
    if (this.state === "running") {
        this.state = "stop";
    }
    return this;
};
queue.prototype.reset = function () {
    this.length === null;
    this.state = "init";
    this.result = null;
    return this;
};
queue.prototype.clean = function () {
    this.list.length = 0;
    this.state = "end";
    this.length = 0;
    this.reuslt = null;
    return this;
};
queue.prototype.isRunning = function () {
    return this.state === "running";
};
queue.prototype.isEnd = function () {
    return this.state === "end";
};
queue.prototype.isStop = function () {
    return this.state === "stop";
};
queue.prototype.start = function (fn) {
    fn && (this._start = fn);
    return this;
};
queue.prototype.progress = function (fn) {
    fn && (this._progress = fn);
    return this;
};
queue.prototype.complete = function (fn) {
    fn && (this._complete = fn);
    if (this.state === "end") {
        this._complete.call(this, this.result);
    }
    return this;
};
queue._fire = function (result) {
    if (this.list.length > 0) {
        var a = this.list.shift(), ths = this;
        this.current = a;
        try {
            a.fn && a.fn.call(ths, result, a.parameter);
        } catch (e) {
            queue.error.call(this, result, e);
            this.next(result);
        }
    } else {
        this.state = 'end';
        this.result = result;
        this._complete && this._complete.call(this, result);
    }
    return this;
};
queue.error = function (result, e) {
    if (this.current) {
        this.current.error && this.current.error.call(this, result, e, this.current.parameter);
    }
};

var dynamicQueue = function () {
    this.state = "waiting";//waiting,running
    this.__list__ = [];
    this.result = null;
    this.current = null;
    this._complete = null;
    this._notify = null;
    this.waits = 1;
    this._completeTimes = 0;
    this._handleTimes = 0;
};
dynamicQueue.prototype.add = function (fn, error, parameters) {
    this.__list__.push({
        fn: fn,
        error: error,
        parameters: parameters
    });
    if (this.state === "waiting") {
        if (this.__list__.length === this.waits) {
            dynamicQueue._fire.call(this, this.result);
        }
    }
    return this;
};
dynamicQueue.prototype.size = function () {
    return this.__list__.length;
};
dynamicQueue.prototype.wait = function (num) {
    if (arguments.length === 0 || num === 0) {
        num = 10000000;
    }
    this.waits = num;
    return this;
};
dynamicQueue.prototype.work = function (data) {
    if (this.state === "waiting") {
        this.waits = 1;
        dynamicQueue.next.call(this, data);
    }
    return this;
};
dynamicQueue.prototype.delay = function (time) {
    this.add(function (data) {
        var ths = this;
        setTimeout(function () {
            ths.next(data);
        }, time);
    });
    return this;
};
dynamicQueue.prototype.notify = function (fn) {
    fn && (this._notify = fn);
    return this;
};
dynamicQueue.prototype.complete = function (fn) {
    fn && (this._complete = fn);
    return this;
};
dynamicQueue.prototype.isRunning = function () {
    return this.state === "running";
};
dynamicQueue.prototype.isWaiting = function () {
    return this.state === "waiting";
};
dynamicQueue.prototype.isHandleAtOnce = function () {
    if (this.state === "running" && this.__list__.length > 0) {
        return false;
    } else {
        return true;
    }
};
dynamicQueue.prototype.completeTimes = function () {
    return this._completeTimes;
};
dynamicQueue.prototype.handleTimes = function () {
    return this._handleTimes;
};
dynamicQueue.prototype.clean = function () {
    this.__list__.length = 0;
    this.state = "waiting";
    for (var i in this) {
        this[i] = null;
    }
};
dynamicQueue.prototype.next = function (data) {
    dynamicQueue.next.call(this, data);
    return this;
};
dynamicQueue.prototype.error = function (e) {
    return dynamicQueue.error.call(this, e);
};
dynamicQueue.next = function (data) {
    this._notify && this._notify.call(this, data);
    dynamicQueue._fire.call(this, data);
    return this;
};
dynamicQueue.error = function (data) {
    if (this.current) {
        this.current.error && this.current.error(this, data);
    }
    return this;
};
dynamicQueue._fire = function (result) {
    if (this.__list__.length > 0) {
        this.state = 'running';
        this._handleTimes = this._handleTimes + 1;
        var a = this.__list__.shift(), ths = this;
        this.current = a;
        try {
            a.fn && a.fn.call(ths, result, a.parameters);
        } catch (e) {
            dynamicQueue.error.call(e);
            dynamicQueue.next.call(ths, result);
        }
    } else {
        if (this.state === 'running') {
            this.result = result;
            this.state = 'waiting';
            this._completeTimes = this._completeTimes + 1;
            this.current = null;
        }
        this._complete && this._complete.call(this, result);
    }
    return this;
};

var promise = function (task) {
    this.state = 0;//0,1,2
    this.queue = new dynamicQueue();
    this._finally = null;
    this._notify = null;
    this._complete = null;
    this._result = null;
    this._scope = null;
    var ths = this;
    this.queue.complete(function (data) {
        ths._result = data;
        var a = ths._finally && ths._finally.call(ths, data);
        if (a instanceof promise) {
            a.complete(function (b) {
                ths._result = b;
                ths._complete && ths._complete.call(ths, b);
            });
        } else {
            ths._complete && ths._complete.call(ths, data);
        }
    }).notify(function (e) {
        ths._notify && ths._notify(e);
    });
    if (is.isFunction(task)) {
        this.queue.wait();
        this.done(function (a) {
            return a;
        });
        task(function (a) {
            ths.resolve(a);
        }, function (a) {
            ths.reject(a);
        });
    } else if (task) {
        this._result = task;
        this.state = 1;
        this.queue.add(function () {
            this.next(task);
        });
    } else {
        this.queue.wait();
        this.done(function (a) {
            return a;
        });
    }
};
promise.prototype.scope = function (scope) {
    if (arguments.length === 1) {
        this._scope = scope;
        return this;
    } else {
        return this._scope;
    }
};
promise.prototype.then = function (resolver, rejecter) {
    promise.add.call(this, resolver, 1);
    promise.add.call(this, rejecter, 2);
    return this;
};
promise.prototype.wait = function (fn) {
    this.queue.add(function (data) {
        var ths = this;
        fn.call(ths, function (a) {
            ths.next(a);
        }, data);
    });
    return this;
};
promise.prototype.done = function (fn) {
    promise.add.call(this, fn, 1);
    return this;
};
promise.prototype.fail = function (fn) {
    promise.add.call(this, fn, 2);
    return this;
};
promise.prototype.always = function (fn) {
    is.isFunction(fn) && (this._finally = fn);
    return this;
};
promise.prototype.reject = function (data) {
    this.state = 2;
    this.queue.work(data);
    return this;
};
promise.prototype.resolve = function (data) {
    this.state = 1;
    this.queue.work(data);
    return this;
};
promise.prototype.notify = function (fn) {
    is.isFunction(fn) && (this._notify = fn);
    return this;
};
promise.prototype.complete = function (fn) {
    is.isFunction(fn) && (this._complete = fn);
    return this;
};
promise.prototype.delay = function (time) {
    this.queue.delay(time);
    return this;
};
promise.prototype.clean = function () {
    this.queue.clean();
    for (var i in this) {
        this[i] = null;
    }
};
promise.add = function (fn, state) {
    var ps = this;
    if (fn && is.isFunction(fn)) {
        this.queue.add(function (data) {
            var ths = this;
            setTimeout(function () {
                if (ps.state === state) {
                    var a;
                    if (ps._scope) {
                        a = fn && fn.call(ps._scope, data);
                    } else {
                        a = fn && fn(data);
                    }
                    if (a instanceof promise) {
                        a.complete(function (b) {
                            ths.next(b);
                        });
                    } else {
                        ths.next(a);
                    }
                } else {
                    ths.next(data);
                }
            }, 0);
        });
    }
};

module.exports = {
    queue: function () {
        return new queue();
    },
    dynamicQueue: function () {
        return new dynamicQueue();
    },
    promise: function (fn) {
        return new promise(fn);
    },
    all: function () {
        var ps = $.promise();
        if (arguments.length > 0) {
            var a = Array.prototype.slice.call(arguments);
            var total = a.length;
            for (var i = 0; i < a.length; i++) {
                a[i].complete(function () {
                    if (this.isResolve) {
                        total = total - 1;
                        if (total === 0) {
                            ps.resolve();
                        }
                    }
                });
            }
        }
        return ps;
    },
    any: function () {
        var ps = $.promise();
        if (arguments.length > 0) {
            var a = Array.prototype.slice.call(arguments);
            var total = a.length, resolved = false;
            for (var i = 0; i < a.length; i++) {
                a[i].complete(function () {
                    total = total - 1;
                    if (this.isResolve) {
                        resolved = true;
                    }
                    if (total === 0 && resolved) {
                        ps.resolve();
                    }
                });
            }
        }
        return ps;
    },
    extend: function (obj) {
        return json.cover(obj);
    },
    util: function () {
        return util;
    }
};