<a name="module_server"></a>

## server
This module sets up a local webserver which is primarily used for secure communication with 
a BrowserWindow. Although it is possible to use IPC for this purpose, that would require enabling 
the nodeIntegration option for the window, which would expose the app to all manner of mischief. 
The webserver is an instance of express, configured for HTTPS with a self-signed cert.

<a name="exp_module_server--start"></a>

### start(mainApp, staticFolders) ⇒ <code>Promise.&lt;express&gt;</code> ⏏
This function will start the HTTPS local webserver and configure static document serving.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;express&gt;</code> - Returns a reference to the express middleware that can be used to create API routes  
**See**

- [Electron app](https://electronjs.org/docs/api/app#app)
- [expressjs](https://expressjs.com/)


| Param | Type | Description |
| --- | --- | --- |
| mainApp | <code>app</code> | The Electron main app |
| staticFolders | <code>array</code> | A list of folder names to be configured for static document serving |

