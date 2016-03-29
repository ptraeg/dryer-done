"use strict";

var fs = require('fs');
var path = require('path');

const low = require('lowdb');
const storage = require('lowdb/file-async');
const db = low('db.json', { storage });


module.exports = class Device {

constructor() {
}

getAllStatus() {
  let devicePromise = new Promise((resolve, reject) => {
    let devices = db('devices').map(device => {
      return { id: device.id, name: device.name, vibeStatus: device.vibeStatus, lastUpdated: device.lastUpdated };
    });
    resolve(devices);
  });
  return devicePromise;
}

getById(deviceId) {
  let devicePromise = new Promise((resolve, reject) => {
    let device = db('devices').find({ id: deviceId });
    if (device) {
      resolve(device);
    } else {
      reject({status: 404, message: "Not found"});
    }
  });
  return devicePromise;
}

update(deviceId, device) {
  console.log('Updating id: %s device: ', deviceId, db('devices').find({ id: deviceId }));
  if (db('devices').find({ id: deviceId })) {
    device.lastUpdated = new Date().toISOString();
    return db('devices')
      .chain()
      .find({ id: deviceId })
      .assign(device)
      .value();
  } else {
    return Promise.reject({ status: 404, message: 'Not found' });
  }

}

insert(device) {
  let devicePromise = new Promise((resolve, reject) => {
    device.lastUpdated = new Date().toISOString();
    db('devices')
      .push(device)
      .then(devices => {
        // It's necessary to run a query after the push since the promise fulfilled by the push returns
        // all objects and not just the one we inserted.
        console.log('Insert completed: %O', devices);
        let insertedDevice = db('devices').find({ id: device.id });
        console.log('Inserted: %O', insertedDevice);
        resolve(insertedDevice);
      });
  });
  return devicePromise;
}

}