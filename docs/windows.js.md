<a name="windowThis module will open and manage Electron BrowserWindow instances.module_"></a>

## windowThis module will open and manage Electron BrowserWindow instances.
<a name="windowThis module will open and manage Electron BrowserWindow instances.module_..openModal"></a>

### windowThis module will open and manage Electron BrowserWindow instances.~openModal(urlToOpen, parentWindow, setOptions) ⇒ <code>Promise.&lt;WindowObject&gt;</code>
Similar to window.open() except a modal window is created as a child to the parentWindow.

**Kind**: inner method of [<code>windowThis module will open and manage Electron BrowserWindow instances.</code>](#windowThis module will open and manage Electron BrowserWindow instances.module_)  
**Returns**: <code>Promise.&lt;WindowObject&gt;</code> - An WindowObject inhereted from BrowserWindow  
**See**: [BrowserWindow options](https://electronjs.org/docs/api/browser-window)  

| Param | Type | Description |
| --- | --- | --- |
| urlToOpen | <code>string</code> | Opens the window and loads this page |
| parentWindow | <code>BrowserWindow</code> | A BrowserWindow which will contain the model window |
| setOptions | <code>options</code> | A set of options for changing the window properties |

