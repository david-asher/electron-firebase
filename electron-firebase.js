/* electron-firebase.js
 * Copyright (c) 2019-2021 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * API interface to electron-firebase, pulls in all needed modules
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