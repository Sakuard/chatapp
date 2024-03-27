// @ts-check
// const config = require('./config.js');
require('dotenv').config();
const config = process.env;

class RedisCache {
    constructor() {
        this.cache = new Map();
        this.cacheTime = config.CACHETIME; // 24 hours
    }

    get(key) {
        return this.cache.get(key);
    }
    set(key, value, timeout) {
        this.cache.set(key, value);
        if (timeout) {
            setTimeout(() => this.cache.delete(key), timeout)
        }
    }
    push(key, val, timeout) {
        // console.log(`timeout: ${timeout},${(timeout && typeof timeout !== 'number')}`)
        // if (this.cache.has(key))
            // console.log(`key: ${key}, val: `, this.cache.get(key))
        if (timeout && typeof timeout !== 'number')
            throw new Error('timeout must be a number');
        if (this.cache.has(key)) {
            this.cache.set(key, [...this.cache.get(key), val]);
        }
        else {
            this.cache.set(key, [val]);
        }
        if (timeout)
            setTimeout(() => {
                this.cache.delete(key);
                // console.log(`key: ${key} deleted`)
            }, timeout);
        // console.log(`key: ${key}, val:`, this.cache.get(key))
    }
    pop(key, val) {
        // console.log(`key: ${key}, val: `, this.cache.get(key))
        try {
            if (this.cache.has(key)) {
                let arr = this.cache.get(key);
                arr.splice(arr.indexOf(val), 1);
                this.cache.set(key, arr);
            }
        }catch (err) {
        }
        // console.log(`key: ${key}, val:`, this.cache.get(key))
    }


    delete(key) {
        try {
            this.cache.delete(key);
        }catch (err) {
        }
    }
    del(key) {
        this.cache.delete(key);
    }
    has(key) {
        return this.cache.has(key);
    }

    rPush(key, value) {
      let arr = this.cache.get(key) || [];
      arr.push(value);
      this.cache.set(key, arr);
    //   console.log(`key: ${key}, val:`, this.cache.get(key))
    }
    lRange(key, start, end) {
      let arr = this.cache.get(key) || [];
      return arr.slice(start, end);
    }

    lRem(key, count, value) {
      let arr = this.cache.get(key) || [];
      const index = arr.indexOf(value);
      if (index > -1) {
        arr.splice(index, count);
        this.cache.set(key, arr);
      }
    }
    flushAll() {
      this.cache.clear();
    }
    LRANGE(key, start, end) {
      // let arr = this.cache.get(key) || [];
      // return arr.slice(start, end);
      return new Promise(resolve => {
        let arr = this.cache.get(key) || [];
        resolve(arr.slice(start, end===-1?arr.length:end));
      })  
    }
}

module.exports = new RedisCache();
