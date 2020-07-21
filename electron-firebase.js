/* electron-firebase.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * High-level functions for quickly building the main application.
 * @module electron-firebase
 */

module.exports = {
    applib:    require('./lib/applibrary'),
    auth:      require('./lib/authentication'),
    fbstorage: require('./lib/fbstorage'),
    file:      require('./lib/fileutils'),
    firestore: require('./lib/firestore'),
    local:     require('./lib/localstorage'),
    server:    require('./lib/webserver'),
    fbwindow:  require('./lib/windows'),
    mainapp:   require('./lib/mainapp')
}