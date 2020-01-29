# electron-firebase

electron-firebase is a quickstart framework for building cloud-connected desktop applications
using [electron](https://electronjs.org/) and [firebase](https://firebase.google.com/). With a 
few configuration settings you can include a complete authentication workflow into your app
that can use google, github, facebook, twitter, email/password, or phone number to identify
and register a user. 

APIs are provided that access the Google Firestore database and Google Cloud Storage in the
security context of the user, so that your app can automatically scale to many users yet
the app only works in the context of the one signed-in user. Since Google Cloud Storage
does not provide basic functions to list and search files for node.js clients, APIs are
also provided that use the Google Firestore database to track cloud files and allow for 
basic file listing and searching. 

## Prerequisites
* OpenSSL
* nodejs and npm
* git
* For linux systems, libsecret

## Installation
```
npm install -g node-gyp
npm init
npm install electron-firebase
```

## API documentation
Typical usage of the APIs:
```javascript
const fb = require('lib/firebase')
fb.auth.initializeFirebase()
```

You can manage your Firebase API credentials in the Google APIs console:
https://console.developers.google.com/apis/credentials 

MUST ENABLE IAM API
go to https://console.developers.google.com/apis/library/iam.googleapis.com?project=test-electron-eeab2
 * Permission iam.serviceAccounts.signBlob is required to perform this operation
 * on service account projects/-/serviceAccounts/{your-service-account-id}.
 * The easiest way to resolve this is to grant the "Service Account Token Creator" 
 * IAM role to the service account in question, usually 
 * {project-name}@appspot.gserviceaccount.com:

| API | Description |
| --- | --- |
| [mainapp](docs/mainapp.js.md) | Higher-level functions for quickly building your app.  |
| [applib](docs/applibrary.js.md) | Collection of utilities for JSON, objects, and events.  |
| [auth](docs/authentication.js.md) | Authentication workflow for Google Firebase.   |
| [store](docs/fbstorage.js.md) | Interface to Google Cloud Storage in the security context of the authenticated user.  |
| [file](docs/fileutils.js.md) | Functions for local file I/O. All functions are synchronous.  |
| [data](docs/firestore.js.md) | Interface to the Firestore Database in the security context of the authenticated user.  |
| [local](docs/localstorage.js.md) | Functions that use the localStorage capability in a BrowserWindow.  |
| [server](docs/webserver.js.md) | A local webserver for secure communication with a BrowserWindow.  |
| [window](docs/windows.js.md) | Open and manage Electron BrowserWindow instances.  |

