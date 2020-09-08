<a name="module_server"></a>

## server
This module sets up a local webserver which is primarily used for secure communication with a BrowserWindow. Although it is possible to use IPC for this purpose, that would require enabling the nodeIntegration option for the window, which would expose the app to all manner of mischief. The webserver is an instance of express, configured for HTTPS with a self-signed cert.

<a name="exp_module_server--start"></a>

### start(mainApp, staticFolders) ⏏
Start the HTTPS server for the Main node.js process.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| mainApp | <code>object</code> | Reference to the Electron app |
| staticFolders | <code>array</code> | List of folders that will be exposed from the webserver as static content |

