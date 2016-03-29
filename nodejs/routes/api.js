"use strict";
const https = require('https');
var express = require('express');
var router = express.Router();
const DeviceDB = require('../models/device.js');
const deviceModel = new DeviceDB();

router.get('/devices/status', function (req, res, next) {
  deviceModel.getAllStatus()
    .then(devices => res.send(devices))
    .catch(reason => res.status(reason.status).send(reason));
});

router.get('/device/:deviceId', function (req, res, next) {
  deviceModel.getById(req.params.deviceId)
    .then(device=> res.send(device))
    .catch(reason => res.status(reason.status).send(reason));
});

router.post('/device', function (req, res, next) {
  deviceModel.insert(req.body)
    .then(device=> res.send(device))
    .catch(reason => res.status(reason.status).send(reason));
});


router.post('/device/:deviceId/status', function (req, res, next) {
  deviceModel.update(req.params.deviceId, req.body)
    .then(device=> res.send(device))
    .catch(reason => res.status(reason.status).send(reason));
});

router.post('/device/:deviceId/register', function (req, res, next) {
  let deviceId = req.params.deviceId;
  deviceModel.getById(deviceId)
    .then(device=> {
      let registrationId = req.body.registration_id;
      if (device.subscriptions.indexOf(registrationId) == -1) {
        device.subscriptions.push(registrationId);
      }
      return deviceModel.update(req.params.deviceId, device);
    })
    .then(device=> res.send(device))
    .catch(reason => res.status(reason.status).send(reason));
});

router.delete('/device/:deviceId/register/:registerId', function (req, res, next) {
  let deviceId = req.params.deviceId;
  let registrationId = req.params.registerId;
  console.log('Now deleting registration: %s from device: %s', registrationId, deviceId);
  deviceModel.getById(deviceId)
    .then(device=> {
      let registrationIndex = device.subscriptions.indexOf(registrationId);
      if (registrationIndex > -1) {
        device.subscriptions.splice(registrationIndex, 1);
      }
      return deviceModel.update(req.params.deviceId, device);
    })
    .then(device=> res.send(device))
    .catch(reason => res.status(reason.status).send(reason));
});

router.post('/device/:deviceId/notify', function (req, res, next) {
  let deviceId = req.params.deviceId;
  let registrationObj = { registration_ids: [] };

  deviceModel.getById(deviceId)
    .then(device=> {

      registrationObj.registration_ids = device.subscriptions;
      var options = {
        hostname: 'android.googleapis.com',
        port: 443,
        headers: {
          "Content-type": "application/json",
          "Authorization": "key=<your-gcm-auth-key-here>"
        },
        path: '/gcm/send',
        method: 'POST'
      };
      var req = https.request(options, (response) => {
        console.log('statusCode: ', response.statusCode);
        console.log('headers: ', response.headers);
        response.on('data', (d) => {
          process.stdout.write(d);
          if (response.statusCode == 200) {
            res.send({success:true});
          } else {
            res.status(response.statusCode).send({success:false});
          }
        });
      });
      req.write(JSON.stringify(registrationObj));
      req.end();

      req.on('error', (e) => {
        console.error(e);
      });
    })
    .catch(reason => res.status(reason.status).send(reason));
});

module.exports = router;
