import lowdb from 'lowdb';
import fileAsyncStorage from 'lowdb/lib/file-async';

export default class Database {
  constructor(dbPath) {
    this.db = lowdb(dbPath, { storage: fileAsyncStorage });
  }

  get(collection, query, sort, limit) {
    // if the database doesn't exist, add the document
    // and return the inserted document as the result.
    if (!this.db.has(collection).value()) {
      return [];
    }
    // If the sort param is not given, use the DB interface
    if (!sort) {
      return this.db.get(collection).filter(query).take(limit).value();
    }
    // The db does not support sorting by multiple keys, get all data
    // and sort it by each key (and its order) and then apply the limit
    const allDocs = this.db.get(collection).filter(query).value();
    const sorted = Object.keys(sort).reduce((unsorted, key) => {
      return unsorted.sort(function (x, y) {
        const order = sort[key];
        return (x[key] > y[key]) ? order * 1 : order * -1;
      });
    }, allDocs);
    // apply the limit after sorting
    return sorted.slice(0, limit);
  }

  set(collection, item) {
    // if the database doesn't exist, add the item
    // and return the inserted item as the result.
    if (!this.db.has(collection).value()) {
      this.db.set(collection, [item]).value();
      return item;
    }
    // if the item already exists in the database, update it
    if (this.db.get(collection).find({ id: item.id }).value()) {
      this.db.get(collection).find({ id: item.id }).assign(item).value();
      return item;
    }
    // If the item is not available in the database, insert it
    const coll = this.db.get(collection).value();
    this.db.set(collection, [...coll, item]).value();
    return item;
  }
}