/*
*
*  Modifications by Peter Traeg based on: Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

'use strict';

var reg;
var sub;
var isSubscribed = false;
var subscribeButton = document.querySelector('button');

if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported');
  navigator.serviceWorker.register('/js/sw.js')
    .then(function (serviceWorkerRegistration) {
      reg = serviceWorkerRegistration;
      reg.pushManager.getSubscription()
        .then(function (subscription) {
          sub = subscription;
          if (sub) {
            subscribeButton.textContent = 'Unsubscribe';
            isSubscribed = true;
          }
          subscribeButton.disabled = false;
        })
      console.log('Service Worker is ready :^)', reg);
    })
    .catch(function (error) {
      console.log('Service Worker Error :^(', error);
    });
}

subscribeButton.addEventListener('click', function () {
  if (isSubscribed) {
    unsubscribe();
  } else {
    subscribe();
  }
});

function subscribe() {
  reg.pushManager.subscribe({ userVisibleOnly: true }).
    then(function (pushSubscription) {
      sub = pushSubscription;
      addRegistration(parseEndpointForId(sub.endpoint));
      console.log('Subscribed! Endpoint:', sub.endpoint);
      subscribeButton.textContent = 'Unsubscribe';
      isSubscribed = true;
    });
}

function unsubscribe() {
  var subscriptionId = parseEndpointForId(sub.endpoint);
  sub.unsubscribe().then(function (event) {
    removeRegistration(subscriptionId);
    subscribeButton.textContent = 'Subscribe';
    console.log('Unsubscribed!', event);
    isSubscribed = false;
  }).catch(function (error) {
    console.log('Error unsubscribing', error);
    subscribeButton.textContent = 'Subscribe';
  });
}

function parseEndpointForId(endpoint) {
  return endpoint.substring(endpoint.indexOf('/send/') + 6);
}

function addRegistration(subscriptionId) {
  var deviceId = document.getElementById('deviceId').innerText;

  console.log('Now registering device: %s with subscription: %s', deviceId, subscriptionId);
  fetch(`/api/device/${deviceId}/register`, {
    method: 'POST',
    cache: 'default',
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({ "registration_id": subscriptionId })
  })
    .then(function (response) {
      console.log('Subscription successfully registered: %s', response);
    })
    .catch(function (error) {
      console.error('Subscription failed: %s', error);
    });
}

function removeRegistration(subscriptionId) {
  var deviceId = document.getElementById('deviceId').innerText;

  console.log('Now registering device: %s with subscription: %s', deviceId, subscriptionId);
  fetch(`/api/device/${deviceId}/register/${subscriptionId}`, {
    method: 'DELETE',
    cache: 'default'
  })
    .then(function (response) {
      console.log('Subscription successfully un-registered: %s', response);
    })
    .catch(function (error) {
      console.error('Subscription failed: %s', error);
    });
}
