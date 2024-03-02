"use strict";
require('dotenv').config();
const config = process.env;
class RedisCache {
    constructor() {
        this.cache = new Map();
        this.cacheTime = config.CACHETIME;
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, timeout) {
        this.cache.set(key, value);
    }
    push(key, value, timeout) {
        if (timeout && typeof timeout !== 'number')
            throw new Error('Timeout must be a number');
        let data;
        if (this.cache.has(key)) {
            // this.cache.set(key, [...this.cache.get(key), value])
            data = this.cache.get(key);
            data.push(value);
            this.cache.set(key, data);
        }
        else {
            this.cache.set(key, [value]);
        }
        if (timeout)
            setTimeout(() => {
                this.cache.delete(key);
            }, timeout);
    }
    pop(key, value) {
        try {
            if (this.cache.has(key)) {
                let arr = this.cache.get(key);
                if (arr !== 'undefined' && typeof arr === 'object') {
                    arr.splice(arr === null || arr === void 0 ? void 0 : arr.indexOf(value), 1);
                    this.cache.set(key, arr);
                }
            }
        }
        catch (e) {
        }
    }
    delete(key) {
        try {
            this.cache.delete(key);
        }
        catch (e) {
        }
    }
    del(key) {
        try {
            this.cache.delete(key);
        }
        catch (e) {
        }
    }
    has(key) {
        return this.cache.has(key);
    }
    rpush(key, value) {
        let arr = this.cache.get(key) || [];
        if (typeof arr === 'object')
            arr.push(value);
        this.cache.set(key, arr);
    }
    // lrange(key: string, start: number, end: number)
    // :any[] | undefined {
    //   let arr = this.cache.get(key) || []
    //   if (typeof arr === 'object')
    //     return arr.slice(start, end)
    //   return undefined
    // }
    lrange(key, start, end) {
        // 示例：异步模拟获取范围内的元素
        return new Promise(resolve => {
            const arr = this.cache.get(key) || [];
            resolve(arr.slice(start, end === -1 ? arr.length : end));
        });
    }
    lrem(key, count, value) {
        let arr = this.cache.get(key) || [];
        if (typeof arr === 'object') {
            let index = arr.indexOf(value);
            if (index !== -1) {
                arr.splice(index, 1);
                this.cache.set(key, arr);
            }
        }
    }
    flushall() {
        this.cache.clear();
    }
}
const handler = {
    get(target, prop, receiver) {
        const propName = prop.toLowerCase(); // 统一转换为小写
        const originalMethod = target[propName];
        if (typeof originalMethod === 'function') {
            return function (...args) {
                const result = originalMethod.apply(this, args);
                // 检查结果是否已经是Promise
                if (result instanceof Promise) {
                    return result;
                }
                else {
                    // 对于同步方法，将结果包装在Promise中
                    return Promise.resolve(result);
                }
            };
        }
        else {
            return Reflect.get(target, propName, receiver);
        }
    },
};
const cache = new Proxy(new RedisCache(), handler);
module.exports = cache;
