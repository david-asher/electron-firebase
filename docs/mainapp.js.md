<a name="module_mainapp"></a>

## mainapp
High-level functions for quickly building the main application.


* [mainapp](#module_mainapp)
    * [event](#exp_module_mainapp--event) ⏏
    * [setupAppConfig()](#exp_module_mainapp--setupAppConfig) ⏏
    * [sendToBrowser(channel, payload)](#exp_module_mainapp--sendToBrowser) ⏏
    * [getFromBrowser(channel, [callback])](#exp_module_mainapp--getFromBrowser) ⇒ <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> ⏏
    * [catchErrorAlert(errorMessage, [dialogTitle])](#exp_module_mainapp--catchErrorAlert) ⏏
    * [closeMainWindow()](#exp_module_mainapp--closeMainWindow) ⏏
    * [beforeCloseApplication()](#exp_module_mainapp--beforeCloseApplication) ⏏
    * [signoutUser()](#exp_module_mainapp--signoutUser) ⏏
    * [createMainWindow()](#exp_module_mainapp--createMainWindow) ⏏
    * [onUserLogin(user, [bForceUpdate])](#exp_module_mainapp--onUserLogin) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
    * [apiPostLoginToken(req, res, next)](#exp_module_mainapp--apiPostLoginToken) ⏏
    * [apiGetAppConfig(req, res, next)](#exp_module_mainapp--apiGetAppConfig) ⏏
    * [evtSetAppContext(browserInfo)](#exp_module_mainapp--evtSetAppContext) ⏏
    * [startWebServices()](#exp_module_mainapp--startWebServices) ⏏
    * [startMainApp()](#exp_module_mainapp--startMainApp) ⏏

<a name="exp_module_mainapp--event"></a>

### event ⏏
Exports a node.js Event Emitter object that can be used to send and receive 
messages with other parts of the application.

**Kind**: Exported member  
**See**: [Events](https://nodejs.org/api/events.html)  
<a name="exp_module_mainapp--setupAppConfig"></a>

### setupAppConfig() ⏏
Must be called before other APIs. Reads the two configuration files, app-config.json and 
firebase-config.json, and creates a global.appContext object with various information.

**Kind**: Exported function  
<a name="exp_module_mainapp--sendToBrowser"></a>

### sendToBrowser(channel, payload) ⏏
Sends a message - a payload on a specific channel - to the global.mainWindow.

**Kind**: Exported function  
**See**: {link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|BrowserWindow.webContents.send()}  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | A topic which the BrowserWindow should be expecting |
| payload | <code>string</code> \| <code>number</code> \| <code>object</code> \| <code>array</code> | The message content to send on the topic |

<a name="exp_module_mainapp--getFromBrowser"></a>

### getFromBrowser(channel, [callback]) ⇒ <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> ⏏
Receives a message event from the global.mainWindow, with optional callback or Promise interface. The callback
or Promise will fire whenever a message event is received on the channel.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> - If no callback is supplied then a Promise is returned  
**See**: {link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|BrowserWindow.webContents.send()}  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | A topic which the BrowserWindow should be expecting |
| [callback] | <code>function</code> | Optional callback function to receive the message event |

<a name="exp_module_mainapp--catchErrorAlert"></a>

### catchErrorAlert(errorMessage, [dialogTitle]) ⏏
Shows a modal error dialog box.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| errorMessage | <code>string</code> | Error message to show to the user |
| [dialogTitle] | <code>string</code> | Optional dialog title, defaults to "ERROR" |

<a name="exp_module_mainapp--closeMainWindow"></a>

### closeMainWindow() ⏏
Closes the main window and quits the app.

**Kind**: Exported function  
<a name="exp_module_mainapp--beforeCloseApplication"></a>

### beforeCloseApplication() ⏏
Call this before the app closes to perform some app cleanup.

**Kind**: Exported function  
<a name="exp_module_mainapp--signoutUser"></a>

### signoutUser() ⏏
Handles the workflow for signing out the current user. The user will be presented with a 
dialog box asking them to confirm signout, and optionally to sign out of the current
identity provider as well as the app. Fires the user-signout event when complete.

**Kind**: Exported function  
<a name="exp_module_mainapp--createMainWindow"></a>

### createMainWindow() ⏏
Handles all of the workflow to create the main application window which will be 
available to the app as global.mainWindow. Fires the main-window-open event
after the window is open and visible.

**Kind**: Exported function  
<a name="exp_module_mainapp--onUserLogin"></a>

### onUserLogin(user, [bForceUpdate]) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
This function is called after a user login has completed, which can happen after a new login
workflow, or after a re-login from a previous session. Fires the user-login event when complete.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves after the CloudStore updates are completed  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>object</code> | The user object that was returned from the login workflow |
| [bForceUpdate] | <code>boolean</code> | Optional, set to true to force the user's persistent profile in the Firebase Cloudstore to be update with the latest identity provider information |

<a name="exp_module_mainapp--apiPostLoginToken"></a>

### apiPostLoginToken(req, res, next) ⏏
Called at the end of the Firebase UI workflow for user login when the loginStart.html BrowserWindow
has completed the login cycle and has credentials to report back to the app. req.body will contain the 
new user credentials.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>object</code> | Express request object |
| res | <code>object</code> | Express response object |
| next | <code>function</code> | Express next function |

<a name="exp_module_mainapp--apiGetAppConfig"></a>

### apiGetAppConfig(req, res, next) ⏏
Called at the start of the Firebase UI workflow to obtain the Firebase configuration from the app.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>object</code> | Express request object |
| res | <code>object</code> | Express response object |
| next | <code>function</code> | Express next function |

<a name="exp_module_mainapp--evtSetAppContext"></a>

### evtSetAppContext(browserInfo) ⏏
When the main BrowserWindow starts it will report context information. This function will 
merge that information into the global.appContext.

**Kind**: Exported function  

| Param | Type |
| --- | --- |
| browserInfo | <code>object</code> | 

<a name="exp_module_mainapp--startWebServices"></a>

### startWebServices() ⏏
Starts the HTTPS webserver which is user for secure communication from the BrowserWindow,
sets up the routes to implement the APIs for login, and configures the top-level paths
for serving static content.

**Kind**: Exported function  
<a name="exp_module_mainapp--startMainApp"></a>

### startMainApp() ⏏
This is it, the function that kicks it all off.

**Kind**: Exported function  
