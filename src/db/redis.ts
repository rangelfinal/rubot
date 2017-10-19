import * as Promise from 'bluebird';
import * as redis from 'redis';

export default class Redis {
  public static client = redis.createClient(process.env.REDIS_URL as string);

  // Converting callback based functions to promise based functions
  // It's better than promisifyAll as Typescript can derive the typings from it
  public static getAsync = Promise.promisify(Redis.client.get, { context: Redis.client });
  public static lrangeAsync = Promise.promisify(Redis.client.lrange, { context: Redis.client });
  public static hgetallAsync = Promise.promisify(Redis.client.hgetall, { context: Redis.client });

  /**
   * Set a key-value pair in Redis
   * @param {string}    key
   * @param {string | number | boolean} value
   */
  public static setValue(key: string, value: string | number | boolean): void {
    Redis.client.set(key, value.toString());
  }

  /**
   * Get a value from Redis
   * @param  {string}          key
   * @return {Promise<string>}
   */
  public static getValue(key: string): Promise<string> {
    return Redis.getAsync(key);
  }

  /**
   * Send a array to Redis
   * @param  {string}                 key
   * @param  {(string|number|boolean} arr
   */
  public static setArray(key: string, arr: (string|number|boolean)[]): void {
    Redis.client.rpush(key, ...arr.map(x => x.toString()));
  }

  /**
   * Get a array from Redis
   * @param  {[type]}  key
   * @return {Promise}
   */
  public static getArray(key: string): Promise<string[] | number[] | boolean[]> {
    return Redis.lrangeAsync(key, 0, -1);
  }

  public static ObjectToArray(obj: object): string[] {
    const arr = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push[key.toString()];
        arr.push[obj[key].toString()];
      }
    }
    return arr;
  }

  /**
   * Send a shallow object (no nesting) to Redis
   * @param {string} key
   * @param {object} obj
   */
  public static setShallowObject(key: string, obj: object[]): void {
    Redis.client.hmset(key, Redis.ObjectToArray(obj));
  }

  /**
   * Get a shallow object (no nesting) from Redis
   * @param  {string}          key
   * @return {Promise<object>}
   */
  public static getShallowObject(key: string): Promise<object> {
    return Redis.hgetallAsync(key);
  }

  /**
   * Send a array of shallow objects to Redis
   * @param {string}   key
   * @param {object[]} arr
   */
  public static setObjectArray(key: string, arr: object[]): void {
    for (const [index,obj] of arr.entries()) {
      Redis.client.hmset(key + ':' + index, Redis.ObjectToArray(obj));
      Redis.client.rpush(key, key + ':' + index);
    }
  }

  /**
   * Get a array of shallow objects from Redis
   * @param  {[type]}            key
   * @return {Promise<object[]>}
   */
  public static getObjectArray(key: string): Promise<object[]> {
    return Redis.getArray(key).then((values) => {
      const promises = [];

      for (const value of values) {
        promises.push(
          Redis.hgetallAsync(value.toString()),
        );
      }

      return Promise.all(promises);
    });
  }

}
