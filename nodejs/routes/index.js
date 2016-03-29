const Device = require("../models/device");
const api = require('./api');

const DeviceDB = require('../models/device.js');
const deviceModel = new DeviceDB();

const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    deviceModel.getAllStatus()
    .then(devices => res.render('index', { title: 'Dryer Done', devices: devices }))
    .catch(reason => res.status(reason.status).send(reason));
});

router.get('/device/:deviceId', function(req, res, next) {
  deviceModel.getById(req.params.deviceId)
    .then(device => {
        device.lastUpdated = new Date(device.lastUpdated).toLocaleString();
        res.render('device', { title: 'Device: ' + device.name, device: device })
      })
    .catch(reason => res.status(reason.status).send(reason));
});

router.use('/api', api);

module.exports = router;


