<a name="module_mainapp"></a>

## mainapp
High-level functions for quickly building the main application.


* [mainapp](#module_mainapp)
    * [event](#exp_module_mainapp--event) ⏏
    * [setupAppConfig()](#exp_module_mainapp--setupAppConfig) ⏏
    * [sendToBrowser(channel, payload)](#exp_module_mainapp--sendToBrowser) ⏏
    * [getFromBrowser(channel, [callback])](#exp_module_mainapp--getFromBrowser) ⇒ <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> ⏏
    * [closeApplication()](#exp_module_mainapp--closeApplication) ⏏
    * [signoutUser()](#exp_module_mainapp--signoutUser) ⏏
    * [onUserLogin(user)](#exp_module_mainapp--onUserLogin) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
    * [registerAPI(method, urlInvocation, apiRouteFunction)](#exp_module_mainapp--registerAPI) ⏏
    * [startMainApp(options)](#exp_module_mainapp--startMainApp) ⏏

<a name="exp_module_mainapp--event"></a>

### event ⏏
Exports a node.js Event Emitter object that can be used to send and receive messages with other parts of the application.

**Kind**: Exported member  
**See**: [Events](https://nodejs.org/api/events.html)  
<a name="exp_module_mainapp--setupAppConfig"></a>

### setupAppConfig() ⏏
Must be called before other APIs. Reads the two configuration files, app-config.json and firebase-config.json, and creates a global.appContext object with various information.

**Kind**: Exported function  
<a name="exp_module_mainapp--sendToBrowser"></a>

### sendToBrowser(channel, payload) ⏏
Sends a message - a payload on a specific channel - to the global.mainWindow.

**Kind**: Exported function  
**See**: [BrowserWindow.webContents.send()](https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | A topic which the BrowserWindow should be expecting |
| payload | <code>string</code> \| <code>number</code> \| <code>object</code> \| <code>array</code> | The message content to send on the topic |

<a name="exp_module_mainapp--getFromBrowser"></a>

### getFromBrowser(channel, [callback]) ⇒ <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> ⏏
Receives a message event from the global.mainWindow, with optional callback or Promise interface. The callbackor Promise will fire whenever a message event is received on the channel.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> - If no callback is supplied then a Promise is returned  
**See**: [BrowserWindow.webContents.send()](https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | A topic which the BrowserWindow should be expecting |
| [callback] | <code>function</code> | Optional callback function to receive the message event |

<a name="exp_module_mainapp--closeApplication"></a>

### closeApplication() ⏏
**Kind**: Exported function  
<a name="exp_module_mainapp--signoutUser"></a>

### signoutUser() ⏏
**Kind**: Exported function  
<a name="exp_module_mainapp--onUserLogin"></a>

### onUserLogin(user) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
This function is called after a user login has completed, which can happen after a new loginworkflow, or after a re-login from a previous session. Fires the user-login event when complete.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves after the CloudStore updates are completed  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>object</code> | The user object that was returned from the login workflow |

<a name="exp_module_mainapp--registerAPI"></a>

### registerAPI(method, urlInvocation, apiRouteFunction) ⏏
Registers a function that will respond to an API request from the Browser. This willset up a route with the [express](http://expressjs.com/) middleware in the Main node.js process. For Browser pages, the /scripts/webutils.js file contains an api() function that can beused to invoke a route registered with registerAPI().

**Kind**: Exported function  
**See**: [Routing in Express](http://expressjs.com/en/guide/routing.html)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | the HTTPS method such as 'GET', 'POST', etc. |
| urlInvocation | <code>string</code> | the localhost URL to invoke, e.g. "/api/loginready" |
| apiRouteFunction | <code>function</code> | API request called in express style i.e. (req,res,next) |

<a name="exp_module_mainapp--startMainApp"></a>

### startMainApp(options) ⏏
This is it, the function that kicks it all off.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | May contain show, width, height, title, main_html |

