/* electron-firebase.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * High-level functions for quickly building the main application.
 * @module electron-firebase
 */

module.exports = {
    applib:    require('./lib/modules/applibrary'),
    auth:      require('./lib/modules/authentication'),
    store:     require('./lib/modules/fbstorage'),
    file:      require('./lib/modules/fileutils'),
    firestore: require('./lib/modules/firestore'),
    local:     require('./lib/modules/localstorage'),
    server:    require('./lib/modules/webserver'),
    window:    require('./lib/modules/windows'),
    mainapp:   require('./lib/modules/mainapp')
}