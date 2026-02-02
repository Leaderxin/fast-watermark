/**
 * Worker Pool Manager - 管理多个Web Worker进行并行处理
 */

class WorkerPool {
    constructor(workerScript, maxWorkers = navigator.hardwareConcurrency || 4) {
        this.workerScript = workerScript;
        this.maxWorkers = maxWorkers;
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
        this.initialized = false;
    }

    // 初始化Worker池
    async init() {
        if (this.initialized) return;

        // 创建所有Worker
        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = new Worker(this.workerScript);
            worker.onmessage = this.handleWorkerMessage.bind(this, i);
            worker.onerror = this.handleWorkerError.bind(this, i);
            this.workers.push({
                worker,
                busy: false,
                currentTask: null
            });
        }

        // 初始化所有Worker的WASM模块
        await Promise.all(this.workers.map(w => {
            return new Promise((resolve, reject) => {
                const initHandler = (e) => {
                    if (e.data.type === 'init') {
                        w.worker.removeEventListener('message', initHandler);
                        if (e.data.success) {
                            resolve();
                        } else {
                            reject(new Error('Worker initialization failed'));
                        }
                    }
                };
                w.worker.addEventListener('message', initHandler);
                w.worker.postMessage({ type: 'init' });
            });
        }));

        this.initialized = true;
    }

    // 处理Worker消息
    handleWorkerMessage(workerIndex, e) {
        const worker = this.workers[workerIndex];
        const task = worker.currentTask;

        if (!task) return;

        if (e.data.type === 'process' && e.data.success) {
            // 任务完成
            task.resolve(e.data.result);
        } else if (e.data.type === 'error') {
            // 任务失败
            task.reject(new Error(e.data.error));
        }

        // 标记Worker为空闲
        worker.busy = false;
        worker.currentTask = null;
        this.activeWorkers--;

        // 处理下一个任务
        this.processNextTask();
    }

    // 处理Worker错误
    handleWorkerError(workerIndex, error) {
        const worker = this.workers[workerIndex];
        const task = worker.currentTask;

        if (task) {
            task.reject(error);
        }

        worker.busy = false;
        worker.currentTask = null;
        this.activeWorkers--;

        this.processNextTask();
    }

    // 处理下一个任务
    processNextTask() {
        if (this.taskQueue.length === 0) return;

        // 找到空闲的Worker
        const idleWorker = this.workers.find(w => !w.busy);
        if (!idleWorker) return;

        // 获取下一个任务
        const task = this.taskQueue.shift();

        // 分配任务给Worker
        idleWorker.busy = true;
        idleWorker.currentTask = task;
        this.activeWorkers++;

        // 判断消息类型：如果任务数据包含 chunkIndex，则是分片处理
        const messageType = task.data.chunkIndex !== undefined ? 'processChunk' : 'process';

        // 发送任务给Worker
        idleWorker.worker.postMessage({
            type: messageType,
            data: task.data
        });
    }

    // 添加任务到队列
    addTask(imageData, config) {
        return new Promise((resolve, reject) => {
            this.taskQueue.push({
                data: { imageData, config },
                resolve,
                reject
            });

            // 尝试处理任务
            this.processNextTask();
        });
    }

    // 批量处理多个图片
    async processBatch(images, config) {
        const tasks = images.map(image => this.addTask(image, config));
        return Promise.all(tasks);
    }

    // 关闭所有Worker
    terminate() {
        this.workers.forEach(w => w.worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
        this.initialized = false;
    }

    // 获取Worker数量
    getWorkerCount() {
        return this.maxWorkers;
    }

    // 获取活跃Worker数量
    getActiveWorkerCount() {
        return this.activeWorkers;
    }

    // 获取队列中的任务数量
    getQueueLength() {
        return this.taskQueue.length;
    }
}

// 导出Worker池
export { WorkerPool };