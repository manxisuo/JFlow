/**
 * @namespace JFlow
 */
(function() {
    var root = this;
    var $ = {};
    root.jf = $;

    /**
     * 在控制台打印消息。
     * 
     * @name JFlow~log
     * @function
     * @param {...*} [arg] 待打印的内容
     */
    function log(/* arg... */) {
        if (console && console.log) {
            Function.prototype.apply.call(console.log, console, arguments);
        }
    }

    /**
     * 检查指定的参数是否是函数。
     * 
     * @name JFlow~isFunction
     * @function
     * @param {*} arg 待检查的参数
     * @return {boolean}
     */
    function isFunction(arg) {
        return typeof arg === 'function';
    }

    /**
     * 安全地调用指定的函数。
     * 只有参数为函数类型时才调用。主要用来调用可选的回调函数。
     * 
     * @name JFlow~invokeFn
     * @function
     * @param {function} fn 待调用函数
     * @param {...*} [arg] 待调用函数的参数
     * @return {*} 调用结果
     */
    function invokeFn(fn/* arg... */) {
        if (isFunction(fn)) {
            var rArgs = Array.prototype.slice.call(arguments, 1);

            // TODO this?
            return fn.apply(this, rArgs);
        }
    }

    /**
     * 表示一个同步或异步任务。
     * 任务执行完成后必须调用cb。
     * 
     * @callback Task
     * @param {function} cb 任务执行完成后调用的函数
     * @param {*} [lastResult] 上一个任务的执行结果
     */

    /**
     * 表示一个同步任务。
     * 
     * @callback SyncTask
     * @param {*} [lastResult] 上一个任务的执行结果
     */

    /**
     * 表示一个消耗数组元素的同步或异步任务。
     * 任务执行完成后必须调用cb。
     * 
     * @callback ArrayTask
     * @param {function} cb 任务执行完成后调用的函数
     * @param {*} item 数组的当前元素
     */

    /**
     * 所有流程完成后的回调函数。
     * 
     * @callback OnComplete
     * @param {...*} item 传给回调函数的参数
     */

    /**
     * 重复执行某个任务，直到条件不满足为止。
     * 
     * @name JFlow#repeatWhen
     * @function
     * @param {Task} task 待执行的任务
     * @param {function} condition 检查条件是否满足的函数
     * @param {OnComplete} [onComplete] 条件满足后的回调函数
     */
    $.repeatWhen = function(task, condition, onComplete) {
        var fn = function(result) {
            if (condition()) {
                task(function(r) {
                    fn(r);
                }, result);
            }
            else {
                invokeFn(onComplete, result);
            }
        };

        fn();
    };

    /**
     * 将指定的数组的元素作为参数，依次串行调用某个任务函数。
     * 
     * @name JFlow#execTaskWithParams
     * @function
     * @param {ArrayTask} task 消耗数组元素的任务
     * @param {any[]} paramArray 参数数组
     * @param {OnComplete} [onComplete] 所有任务执行完成后的回调函数
     */
    $.execTaskWithParams = function(task, paramArray, onComplete) {
        var i = 0, len = paramArray.length;
        var fn = function() {
            if (i < len) {
                task(fn, paramArray[i++]);
            }
            else {
                invokeFn(onComplete);
            }
        };

        fn();
    };

    /**
     * 依次执行任务队列中的任务。
     * 
     * @name JFlow#execTaskQueue
     * @function
     * @param {Task[]} taskQueue 任务队列
     * @param {OnComplete} [onComplete] 所有任务执行完成后的回调函数
     */
    $.execTaskQueue = function(taskQueue, onComplete) {
        var i = 0, len = taskQueue.length;
        var fn = function(result) {
            if (i < len) {
                var task = taskQueue[i++];
                task(function(r) {
                    fn(r);
                }, result);
            }
            else {
                invokeFn(onComplete);
            }
        };

        fn();
    };

    /**
     * 依次执行指定的任务。
     * 
     * @name JFlow#execTasks
     * @function
     * @param {...Task} task 任务
     */
    $.execTasks = function(/* task... */) {
        var args = arguments, len = args.length;
        $.execTaskQueue.call(root, Array.prototype.slice.call(args, 0, len));
    };

    /**
     * 依次执行任务队列中的任务。
     * 此函数与execTaskQueue类似，但是在执行任务前会将其从任务队列中取出。
     * 
     * @name JFlow#consumeTaskQueue
     * @function
     * @param {Task[]} taskQueue 任务队列
     * @param {OnComplete} [onComplete] 所有任务执行完成后的回调函数
     */
    $.consumeTaskQueue = function(taskQueue, onComplete) {
        var fn = function(result) {
            if (taskQueue.length > 0) {
                var task = taskQueue.shift();
                task(function(r) {
                    fn(r);
                }, result);
            }
            else {
                invokeFn(onComplete, result);
            }
        };

        fn();
    };

    /**
     * 创建一个同步任务。
     * 
     * @name JFlow#getSyncTask
     * @function
     * @param {SyncTask} task 待执行的任务函数
     * @return {Task}
     */
    $.getSyncTask = function(task) {
        return function(cb, r) {
            task(r);
            invokeFn(cb, r);
        };
    };

    /**
     * 创建一个在控制台打印消息的任务。
     * 不传参数时打印上一个任务的执行结果。
     * 
     * @name JFlow#getLogTask
     * @function
     * @param {function|*} [msg] 用来生成待打印内容的函数或待打印的内容
     * @return {Task}
     */
    $.getLogTask = function(msg) {
        return function(cb, r) {
            if (isFunction(msg)) {
                var r2 = msg(r);
                log(r2);
            }
            else {
                log(undefined === msg ? r : msg);
            }

            invokeFn(cb, r);
        };
    };

    /**
     * 创建一个在控制台打印时间戳的任务。
     *  
     * @name JFlow#getTsTask
     * @function
     * @return {Task}
     */
    $.getTsTask = function() {
        return function(cb, r) {
            var d = new Date();
            var d = new Date();
            var head = [d.getFullYear(), d.getMonth(), d.getDate()].join('/');
            var tail = [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
            var stamp = head + ' ' + tail + '.' + d.getMilliseconds();
            log(stamp);
            invokeFn(cb, r);
        };
    };

    /**
     * 创建一个延迟指定时间间隔的任务。
     * 先执行某个函数，再延迟。
     * 
     * @name JFlow#getDelayedTask
     * @function
     * @param {null|function} taskFn 待执行的任务函数
     * @param {number} [period=1000] 时间间隔(毫秒)
     * @return {Task}
     */
    $.getDelayedTask = function(taskFn, period) {
        if (undefined === period) {
            period = 1000;
        }

        return function(cb, r) {
            invokeFn(taskFn);
            setTimeout(function() {
                invokeFn(cb, r);
            }, period);
        };
    };

    /**
     * 创建一个延迟指定时间间隔的任务。
     * 只进行延迟，不做任何动作。是delayedTask的特殊情况。
     * 
     * @name JFlow#getSleepTask
     * @function
     * @param {number} [period=1000] 时间间隔(毫秒)
     * @return {Task}
     */
    $.getSleepTask = function(period) {
        return $.getDelayedTask(null, period);
    };

    /**
     * 创建一个重复执行的任务，直到条件不满足为止。
     * 
     * @name JFlow#getRepeatWhenTask
     * @function
     * @param {Task} task 待执行的任务
     * @param {function} condition 检查条件是否满足的函数
     * @param {OnComplete} [onComplete] 条件满足后的回调函数
     */
    $.getRepeatWhenTask = function(task, condition) {
        return function(cb, r) {
            $.repeatWhen(task, condition, cb);
        };
    };

    /**
     * 任务队列处理器。
     *
     * @name JFlow#Qr
     * @constructor
     */
    function Qr() {
        if (!(this instanceof Qr)) {
            return new Qr();
        }

        this.running = false;
        this.queue = [];
        this.lastResult = undefined;
    }

    /**
     * 将一项任务放入队列等待执行。
     * 
     * @name JFlow#Qr#exec
     * @function
     * @param {Task} task 待执行的任务
     * @return {JFlow#Qr}
     */
    Qr.prototype.exec = function(task) {
        var _this = this;
        if (!_this.running) {
            _this.queue.push(function(cb) {
                task(cb, _this.lastResult);
            });
            _this.running = true;
            $.consumeTaskQueue(_this.queue, function(result) {
                _this.running = false;
                _this.lastResult = result;
            });
        }
        else {
            _this.queue.push(task);
        }

        return _this;
    };

    /**
     * 将一项同步任务放入队列等待执行。
     * 
     * @name JFlow#Qr#sync
     * @function
     * @param {SyncTask} task 待执行的任务函数
     * @return {JFlow#Qr}
     */
    Qr.prototype.sync = function(task) {
        return this.exec($.getSyncTask(task));
    }

    /**
     * 将一项控制台打印任务放入队列等待执行。
     * 不传参数时打印上一个任务的执行结果。
     * 
     * @name JFlow#Qr#log
     * @function
     * @param {function|*} [msg] 用来生成待打印内容的函数或待打印的内容
     * @return {JFlow#Qr}
     */
    Qr.prototype.log = function(msg) {
        return this.exec($.getLogTask(msg));
    };

    /**
     * 将一项控制台打印时间戳任务放入队列等待执行。
     * 
     * @name JFlow#Qr#ts
     * @function
     * @return {JFlow#Qr}
     */
    Qr.prototype.ts = function() {
        return this.exec($.getTsTask());
    };
    
    /**
     * 将一项等待(睡眠)任务放入队列等待执行。
     * 别名：sleep。
     * 
     * @name JFlow#Qr#wait
     * @function
     * @param {number} [period=1000] 时间间隔(毫秒)
     * @return {JFlow#Qr}
     */
    Qr.prototype.wait = Qr.prototype.sleep = function(period) {
        return this.exec($.getSleepTask(period));
    };
    
    /**
     * 将一项重复执行直到条件不满足为止的任务放入队列等待执行。
     * 
     * @name JFlow#Qr#repeatWhen
     * @function
     * @param {Task} task 待执行的任务
     * @param {function} condition 检查条件是否满足的函数
     * @return {JFlow#Qr}
     */
    Qr.prototype.repeatWhen = function(task, condition) {
        return this.exec($.getRepeatWhenTask(task, condition));
    };

    $.Qr = Qr;

}).call(this);
