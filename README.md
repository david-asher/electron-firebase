# electron-firebase
Electron-Firebase is a quickstart framework for building cross-platform cloud-connected desktop 
applications using [Electron](https://electronjs.org/) and [Firebase](https://firebase.google.com/). 
With a few configuration settings you can include a complete authentication workflow into your app
that can use email/password, phone number, google, facebook, or many other identity providers. 

Electron-Firebase is unusual in being both an [NPM module](https://docs.npmjs.com/about-packages-and-modules) 
and an example application, and it spans both worlds of the Browser JavaScript environment and the host node.js 
environment. As such, it will install several folders and files into the root of the NPM application that form
the example application, which you are encouraged to modify for your own purposes.

- [electron-firebase](#electron-firebase)
  - [What Electron-Firebase provides for you](#what-electron-firebase-provides-for-you)
  - [Opinionated](#opinionated)
  - [NOT opinionated](#not-opinionated)
  - [Platform support](#platform-support)
- [Installation Process Overview](#installation-process-overview)
  - [Create a Firebase project](#create-a-firebase-project)
  - [Enable Firebase Custom Tokens](#enable-firebase-custom-tokens)
  - [Enable the IAM API](#enable-the-iam-api)
  - [Setup Identity Providers](#setup-identity-providers)
  - [Electron-Firebase Module Installation](#electron-firebase-module-installation)
  - [Edit firebase-config.json parameters](#edit-firebase-configjson-parameters)
    - [Firebase project settings](#firebase-project-settings)
    - [Firebase hosting URL](#firebase-hosting-url)
    - [Service account](#service-account)
  - [Deploy security rules and cloud functions](#deploy-security-rules-and-cloud-functions)
  - [Add authorized domain](#add-authorized-domain)
  - [Setup identity providers](#setup-identity-providers-1)
    - [Create an "app" in the identity provider](#create-an-app-in-the-identity-provider)
    - [Configure the identity provider in Firebase](#configure-the-identity-provider-in-firebase)
    - [Exchange App ID and Secret](#exchange-app-id-and-secret)
    - [Enter the redirect URL at the identity provider](#enter-the-redirect-url-at-the-identity-provider)
    - [Modify app-config.json "providers"](#modify-app-configjson-providers)
- [Configuration files](#configuration-files)
  - [config/firebase-config.json](#configfirebase-configjson)
  - [config/content-security-policy.json](#configcontent-security-policyjson)
  - [config/app-config.json](#configapp-configjson)
    - [debugMode](#debugmode)
    - [webapp](#webapp)
    - [webFolders](#webfolders)
    - [apis](#apis)
    - [logout](#logout)
  - [providers](#providers)
- [The example application](#the-example-application)
  - [Start the example application](#start-the-example-application)
  - [Example application files and structure](#example-application-files-and-structure)
- [API documentation](#api-documentation)

## What Electron-Firebase provides for you
* An authentication workflow within an application context for many identity providers, including phone and email
* Authentication persistence, so that a user can launch your app at any time without signing in again
* Security and privacy throughout the authentication sign-in and persistence processes
* True cross-platform cloud-connected application building across MacOS, Windows, and Linux
* Methods for communication between the Electron Browser and Main processes
* Authorized user access to database and cloud storage with Firebase security rules
* API access to Firebase Cloud Storage, which is not supported in node.js
* Firebase Cloud Storage listing and searching capability
* Persistence of window positions on the screen automagically when the user changes them
* An example application for a quick start in writing your own application
* Please, please, please modify the splash page (/pages/splashpage.html) before releasing your own application

## Opinionated
The design of Electron-Firebase is specifically __opinionated__ in a few key areas:
* The integration between Electron and Firebase should be sufficiently complete that a developer can
install this framework and quickly get started writing an application
* The [Electron Main Process](https://www.electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes) 
is where most Firebase access should happen since that has access to all of the node.js APIs and operating system. 
The exception being the [firebaseui](https://firebase.google.com/docs/auth/web/firebaseui) authentication workflow
which has to execute in the Browser (Electron "Renderer" process). 
* Access to the Firebase database and storage should enforce authorization so that your app can only
perform operations in the context of the signed-in user and application. 
* Communication between the Browser and Main processes must be secured when the Browser content contains
foreign content or private information, such as the firebaseui workflow.

## NOT opinionated
Electron-Firebase is specifically __not opinionated__ in these areas:
* There is no application build and packaging process since there are multiple ways to accomplish this.
* There is no preferred UI framework. The example app uses [Bootstrap](https://getbootstrap.com/) in a minimal way.
* The Firebase API and capability set continues to expand, such as crash analytics, performance 
monitoring, and so on. Electron-Firebase does not integrate Firebase any further than the application foundation
of authentication, database, and storage.

## Platform support
Electron-Firebase has been tested on:
* Ubuntu Linux 20.04.2 LTS (Focal Fossa)
* Apple Mac OS 11.3 (Big Sur)
* Microsoft Windows 10 Home 20H2

# Installation Process Overview
Although Electron-Firebase is an NPM module, there is some preparation to complete before it can be installed. 
This process may appear complicated because it involes setting up a Cloud service (Firebase) and establishing
trust relationships with various identity providers. This is work that needs to be done for any kind of cloud
connected application, but once configured, Electron-Firebase automates much of the rest. The sequence of 
operations is important, and no steps are optional. The process should be identical for any platform that you
are using, excepting the text editor and terminal that you use. 
* [Create a Firebase project](#create-a-firebase-project)
* [Enable Firebase custom tokens](#enable-firebase-custom-tokens)
* [Enable the IAM API](#enable-the-iam-api)
* [Setup identity providers](#setup-identity-providers)
* [Electron-Firebase Module Installation](#electron-firebase-module-installation)
* [Edit firebase-config.json parameters](#edit-firebase-configjson-parameters)
* [Deploy security rules and cloud functions](#deploy-security-rules-and-cloud-functions)
* [Start the example application](#start-the-example-application)

## Create a Firebase project
* Go to [Firebase] and create an account if you do not already have one
* From the [Firebase Console](https://console.firebase.google.com/u/0/), create a new Firebase project
* From the __Project Overview__, make sure that you have the __Blaze Plan__ selected

## Enable Firebase Custom Tokens
Electron-Firebase uses [Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens) to help manage
the authentication process, where 
the [Service Account ID](https://firebase.google.com/docs/auth/admin/create-custom-tokens?hl=fi#using_a_service_account_id) 
method will be used. To enable this capability, you must grant the "Service Account Token Creator" IAM role to 
your project's service account as follows.
* Open the [IAM and Admin Page](https://console.cloud.google.com/project/_/iam-admin?hl=fi) in the Google Cloud Platform Console.
* Select your project and click "Continue".
* Click the edit icon corresponding to the service account you wish to update.
* Click on "Add Another Role".
* Type "Service Account Token Creator" into the search filter, and select it from the results.
* Click "Save" to confirm the role grant.

## Enable the IAM API
* Go to [Google Console IAM API Dashboard](https://console.developers.google.com/apis/api/iam.googleapis.com) 
* Select your project
* If the Activation Status is not "Enabled" then click on "Enable API"
It may take a few minutes for this status to be propagated to your project.

## Setup Identity Providers
configure facebook
https://developers.facebook.com/apps/
Products --> Settings --> Client OAuth Settings
paste: Valid OAuth Redirect URIs
--> Save Changes

## Electron-Firebase Module Installation
```
# initialize your project
mkdir <your-project>
cd <your-project>
npm init

# install the electron-firebase framework and example application
npm install electron-firebase
```

## Edit firebase-config.json parameters
__It is highly recommended that you add firebase-config.json to your .gitignore file. It contains project-specific__
__information that you do not want to check in with the app, nor should it be packaged when building your app.__

* Edit __./config/firebase-config.json__ using your favorite text editor, preferably one based on Electron
* Open the [Firebase Console](https://console.firebase.google.com/) and select your project

Be very careful when cutting/pasting values, as things will certainly not work if there are any errors
or JSON syntax violation. 

### Firebase project settings
* Click on the configuration gear next to __Project Overview__ and select __Project Settings__
* Scroll down to __Firebase SDK snippet__ and select __Config__
* Cut and paste the following fields carefully into the __./config/firebase-config.json__ file:
    * "apiKey"
    * "authDomain"
    * "databaseURL"
    * "projectId"
    * "storageBucket"
    * "messagingSenderId"
    * "appId"

### Firebase hosting URL
* Select __Develop__ 🠊 __Hosting__
* Under your project Domain, right click on the firebaseapp.com link, else create your Custom Domain
* Paste the hosting URL to
    * "hostingUrl"

### Service account
* Select Project __Settings__ 🠊 __Service accounts__
* Under Firebase service account, copy the entire string ending with gserviceaccount.com
* Paste the service account to:
    * "serviceAccountId"
* Save your changes to the __./config/firebase-config.json__ file.

## Deploy security rules and cloud functions
The following command will deploy Firebase rules and cloud functions to the Firebase Cloud. 
These are critical for authentication and authorization to function properly. The deploy process
needs to run only once for your project, or subsequently if the security rules or cloud functions
are ever modified. These files are administrative and should not bundled with your application. 
```
npm run deploy
```

## Add authorized domain
* Open the [Firebase Console](https://console.firebase.google.com/) and select your project
* Select __Authentication__ 🠊 __Sign-in Method__
* Scroll down to __Authorized Domains__
* Click __Add Domain__
* Enter __localhost__ and click __Add__

## Setup identity providers
[Firebase Authentication](https://firebase.google.com/docs/auth) uses industry standards like OAuth 2.0 and OpenID Connect
to support popular federated identity providers like Google, Facebook, Twitter, and many more. In order for your app to have
authentication options such as "Sign in with Facebook", each identity provider needs to know about your app, and your 
app needs to know something about each identity provider that you would like to support. The following instructions use
Facebook as an example. The other identity providers will have very similar processes but will differ in some details. 

### Create an "app" in the identity provider
* Go to [Facebook for Developers](https://developers.facebook.com/) 
* Create a developer account if you don't have one, else just sign in with your developer credentials
* Click on __My Apps__
* Click __Add a New App__
* Click __For Everything Else__
* Enter the __App Display Name__ but you should make this the same as the application name that you present to users
* Enter __App Contact Email__ 
* Click __Create App ID__
* On the __Add a Product__ page, select __Facebook Login__ Setup button
* On the __Quickstart__ page, select __Web__ option
* Fill in the __Tell Us about Your Website__ URL and save; take no other action on the __Web__ page
* Leave this page up for the next few instructions

### Configure the identity provider in Firebase
* Open the [Firebase Console](https://console.firebase.google.com/) and select your project
* Click __Authentication__
* Click __Sign-in Method__
* Click on the __Facebook__ entry and select __Enable__
* Leave this page up for the next few instructions

### Exchange App ID and Secret
* Back on the [Facebook for Developers](https://developers.facebook.com/) page, select __Settings__ 🠊 __Basic__
* Select the __App ID__ information and copy
* Return to the [Firebase Console](https://console.firebase.google.com/) page, __Facebook__ selected
* Paste the __App ID__ in the identity provider __Sign-in Method__ dialog
* Back on the [Facebook for Developers](https://developers.facebook.com/) page, select __Show__ by the __App Secret__
* Select the __App Secret__ information and copy
* Return to the [Firebase Console](https://console.firebase.google.com/) page, __Sign-in Method__ dialog
* Paste the __APP Secret__ but leave this dialog open for the next step

### Enter the redirect URL at the identity provider
* Return to the [Firebase Console](https://console.firebase.google.com/) page, __Sign-in Method__ dialog
* Copy the contents of the __OAuth redirect URI__ and click __Save__
* Back on the [Facebook for Developers](https://developers.facebook.com/) page
* Select left menu __Facebook Login__ 🠊 __Settings__
* Paste the redirect URI under __Valid OAuth Redirect URIs__
* Click __Save Changes__

### Modify app-config.json "providers"
* Open the __./config/app-config.json__ file with your favorite text editor
* Add "facebook.com" to the __providers__ list
* Repeat the entire setup process for any other identity providers that you wish to support
* Possible values are 
    * password
    * phone
    * google.com
    * facebook.com
    * twitter.com
    * github.com
    * apple.com
    * microsoft.com
    * yahoo.com

# Configuration files

## config/firebase-config.json
> **IMPORTANT**: These file parameters must be changed to support your unique firebase project. 
For details, see section: [Edit firebase-config.json parameters](#edit-firebase-config.json-parameters)

## config/content-security-policy.json
> **IMPORTANT**: If you add new identify providers, you will probably need to add their web asset URLs to this file. 
The web pages in electron-firebase define [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) 
so they may securely be used with foreign scripts and pages, which is a critical component of the signin process. 
Managing complex Content Security Policy strings can be challenging, so electron-firebase provides this configuration file
so that you can list all of the elements individually. Note that there are several style-src 'unsafe-hash' entries which
are compensating for the firebasui web page having a few inline style elements.

## config/app-config.json
A number of parameters may be modified in the __./config/app-config.json__ file. Changing some of them could
cause your application to stop working if they are not coordinated with application code changes. 

### debugMode
Set this value to __true__ to enable debug mode: some log messages will be visible, network calls with be logged, 
and Browser (renderer) windows will be opened in developer/debug mode.

### webapp
These keys describe some critical operating parameters like the localhost port. Most of the filenames and paths are
shared information between the main process and renderer. "persistentUser" enables the renderer (Browser) process 
to securely store a token that persists the firebase user identity between sessions, which makes sense for an app 
that stays resident on a private computer. If your app is intended to be used in a public or shared context, you may 
want to set "persistentUser" to false which will force a login every time the app is started.

### webFolders
Electron-Firebase operates a TLS web server within the Main node.js process that hosts APIs that the Browser 
can access. This is "static" web content, meaning that referencing one of these pages will not run a dynamic 
script on the web server. 

### apis
These entries are localhost URLs that the Browser uses to make API requests to the Main process. You shouldn't
modify these, but it's a way to keep consistent API definitions between the Browser and Main processes. You can
use this mechanism if you would like to add custom Main process apis that can be accessed by the Browser, or in fact
by any other application with access to localhost.

### logout
There are really two levels of sign-in and two levels of sign-out - the Firebase application, and the identity
provider. The Firebase signout process does not handle the identity provider level, so these URLs are provided
as a way to perform a "deep logout".

## providers
This list determines which choices for identity provider will be presented to the user. So this list must be
modified to match the set of identity providers to be supported by your application.

# The example application
The npm install process copies an example application to your project folder. This application 
generates some data sets based on the user's authentication profile, and allows the user to view that 
information in the Firestore database or Firebase Cloud Storage. 

## Start the example application
To run the example application:
```
npm start
```

## Example application files and structure
The example application installs the following folders and files, which you are free to modify. When performing
a subsequent npm install, any modified example application files will not be overwritten, so if you want to get the 
newest version before an update you should change the names of the modified files.
* /config - configuration files for your application
* /functions - functions to be deployed to the Firebase Cloud
* /pages - top-level web server folder for HTML pages accessible to the Browser
* /scripts - top-level web server folder for JavaScript modules to the Browser
* main.js - the example application main file and overall program structure
* answerBrowser.js - app support file, functions that export APIs used by the Browser
* setupApp.js - app support file that generates example data sets on startup

# API documentation
Typical usage of the APIs:
```javascript
const fbe = require('firebase-electron')
fbe.auth.initializeFirebase()
```

| API | Description |
| --- | --- |
| [mainapp](docs/mainapp.js.md) | Higher-level functions for quickly building your app.  |
| [auth](docs/authentication.js.md) | Authentication workflow for Google Firebase.   |
| [firestore](docs/firestore.js.md) | Interface to the Firestore Database in the security context of the authenticated user.  |
| [fbstorage](docs/fbstorage.js.md) | Interface to Google Cloud Storage in the security context of the authenticated user.  |
| [file](docs/fileutils.js.md) | Functions for local file I/O. All functions are synchronous.  |
| [applib](docs/applibrary.js.md) | Collection of utilities for JSON, objects, and events.  |
| [local](docs/localstorage.js.md) | Functions that use the localStorage capability in a BrowserWindow.  |
| [server](docs/webserver.js.md) | A local webserver for secure communication with a BrowserWindow.  |
| [fbwindow](docs/windows.js.md) | Open and manage Electron BrowserWindow instances.  |
