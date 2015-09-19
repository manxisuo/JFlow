(function() {
    var root = this;
    var $ = {};
    root.jf = $;

    function isFunction(fn) {
        return typeof fn === 'function';
    }

    /**
     * 安全地调用指定的函数。
     * 只有参数为函数类型时才调用。
     */
    function invokeFn(fn) {
        if (isFunction(fn)) {
            var rArgs = Array.prototype.slice.call(arguments, 1);

            // TODO this?
            return fn.apply(this, rArgs);
        }
    }

    /**
     * 重复执行某个任务，直到满足某个条件为止。
     *
     * @param task 待执行的任务。必选。
     * @param checkFn 检查条件是否满足的函数。必选。
     * @param onComplete 流程完成后的回调函数。可选
     */
    $.repeatTaskUntil = function(task, checkFn, onComplete) {
        var fn = function() {
            task(function() {
                if (!checkFn()) {
                    fn();
                }
                else {
                    invokeFn(onComplete);
                }
            });
        };

        fn();
    };

    /**
     * 将指定的数组的元素作为参数，依次串行调用某个任务函数。
     *
     * @param taskFn 待执行的任务函数。必选。此函数有两个参数：一是当前数组的元素，二是任务执行完成后的回调函数。
     * @param paramArray 参数数组。必选。
     * @param onComplete 流程完成后的回调函数。可选
     */
    $.execTaskWithParams = function(taskFn, paramArray, onComplete) {
        var i = 0, len = paramArray.length;
        var fn = function() {
            if (i < len) {
                taskFn(paramArray[i++], function() {
                    fn();
                });
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
     * @param taskQueue 任务队列。必选。
     * @param onComplete 流程完成后的回调函数。可选
     */
    $.execTaskQueue = function(taskQueue, onComplete) {
        var i = 0, len = taskQueue.length;
        var fn = function() {
            if (i < len) {
                var task = taskQueue[i++];
                task(function() {
                    fn();
                });
            }
            else {
                invokeFn(onComplete);
            }
        };

        fn();
    };

    /**
     * 依次执行指定的任务。
     * 在当前任务完成前，下一个任务会一直被阻塞。
     *
     * @param taskFn 任务函数。可变参数，0个或多个。
     */
    $.execTasks = function(/* task... */) {
        var args = arguments, len = args.length;
        $.execTaskQueue.call(root, Array.prototype.slice.call(args, 0, len));
    };

    /**
     * 依次执行任务队列中的任务。
     * 此函数与execTaskQueue类似，但是在执行任务前会将其从任务队列中取出。
     *
     * @param taskQueue 任务队列。必选。
     * @param onComplete 流程完成后的回调函数。可选
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
     * 创建一个同步的任务。
     *
     * @param taskFn 在任务中执行的函数。必选。
     */
    $.getSyncTask = function(taskFn) {
        return function(cb) {
            taskFn();
            invokeFn(cb);
        };
    };

    /**
     * 创建一个在控制台打印消息的任务。
     */
    $.getLogTask = function(msg) {
        return function(cb) {
            console.log(msg);
            invokeFn(cb);
        };
    };

    /**
     * 创建一个延迟指定时间间隔的任务。
     * 先执行某个函数，再延迟。
     *
     * @param fn 在任务中执行的函数。必填。可以是一个函数或者null。
     * @param period 时间间隔。可选。默认1000毫秒。
     */
    $.getDelayedTask = function(fn, period) {
        if (undefined === period) {
            period = 1000;
        }

        return function(cb) {
            invokeFn(fn);
            setTimeout(function() {
                invokeFn(cb);
            }, period);
        };
    };

    /**
     * 创建一个延迟指定时间间隔的任务。
     * 是delayedTask的特殊情况。
     *
     * @param period 时间间隔。可选。默认1000毫秒。
     */
    $.getSleepTask = function(period) {
        return $.getDelayedTask(null, period);
    };

    function Qr() {
        this.running = false;
        this.queue = [];
        this.lastResult = undefined;
    }

    Qr.prototype.exec = function(task) {
        var _this = this;
        if (!this.running) {
            this.queue.push(function(cb) {
                task(cb, this.lastResult);
            });
            this.running = true;
            $.consumeTaskQueue(this.queue, function(result) {
                _this.running = false;
                _this.lastResult = result;
            });
        }
        else {
            this.queue.push(task);
        }

        return _this;
    };

    Qr.prototype.log = function(msg) {
        return this.exec($.getLogTask(msg));
    };

    Qr.prototype.wait = Qr.prototype.sleep = function(period) {
        return this.exec($.getSleepTask(period));
    };

    $.Qr = Qr;

}).call(this);
