<a name="module_window"></a>

## window
This module will open and manage Electron BrowserWindow instances.


* [window](#module_window)
    * [open](#exp_module_window--open) ⏏
        * [new open(urlToOpen, [setOptions])](#new_module_window--open_new)
        * _instance_
            * [.window()](#module_window--open+window)
            * [.waitForShow()](#module_window--open+waitForShow) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.waitForClose()](#module_window--open+waitForClose) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.resize()](#module_window--open+resize) ⇒ <code>object</code>
            * [.send(channel, payload)](#module_window--open+send)
            * [.receive(channel, [callback])](#module_window--open+receive) ⇒ <code>Promise.&lt;(string\|number\|object\|array)&gt;</code>
            * [.close()](#module_window--open+close)
        * _inner_
            * [~openModal(urlToOpen, parentWindow, setOptions)](#module_window--open..openModal) ⇒ <code>Promise.&lt;WindowObject&gt;</code>

<a name="exp_module_window--open"></a>

### open ⏏
Opens a BrowserWindow.

**Kind**: Exported class  
**See**: [BrowserWindow options](https://electronjs.org/docs/api/browser-window)  
<a name="new_module_window--open_new"></a>

#### new open(urlToOpen, [setOptions])
Create a window.open object. The window will automatically track window changes in size and position and keep the bounds changes in localStorage.

**Returns**: <code>Promise.&lt;WindowObject&gt;</code> - An WindowObject inhereted from BrowserWindow  

| Param | Type | Description |
| --- | --- | --- |
| urlToOpen | <code>string</code> | Opens the window and loads this page |
| [setOptions] | <code>options</code> | A set of options for changing the window properties |

<a name="module_window--open+window"></a>

#### open.window()
Why is this function here? If you create a new window.open object and pass that to dialog.showMessageBox() for a modal doalog, it won't render the dialog content(i.e. it's a blank dialog). Even when you capture the constructor super(), the callto showMessageBox() still comes up blank. This method returns an actualBrowserWindow object that is satisfactory for building a modal dialog.

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
<a name="module_window--open+waitForShow"></a>

#### open.waitForShow() ⇒ <code>Promise.&lt;void&gt;</code>
If you open the window with option show:false then call window.show(), use this functionto get a Promise that returns after the window is visible.

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
<a name="module_window--open+waitForClose"></a>

#### open.waitForClose() ⇒ <code>Promise.&lt;void&gt;</code>
If you close the window with window.close(), use this functionto get a Promise that returns after the window is destroyed.

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
<a name="module_window--open+resize"></a>

#### open.resize() ⇒ <code>object</code>
Recalls the last saved position and shape of the window, particularly useful for the first showing of the window.

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
**Returns**: <code>object</code> - Returns the previous bounds object that the window will now be set to  
<a name="module_window--open+send"></a>

#### open.send(channel, payload)
Sends a message - a payload on a specific channel - to the BrowserWindow

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
**See**: [BrowserWindow.webContents.send()](https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | A topic which the BrowserWindow should be expecting |
| payload | <code>string</code> \| <code>number</code> \| <code>object</code> \| <code>array</code> | The message content to send on the topic |

<a name="module_window--open+receive"></a>

#### open.receive(channel, [callback]) ⇒ <code>Promise.&lt;(string\|number\|object\|array)&gt;</code>
Receives a message event from the BrowserWindow, with optional callback or Promise interface. The callbackor Promise will fire whenever a message event is received on the channel.

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
**Returns**: <code>Promise.&lt;(string\|number\|object\|array)&gt;</code> - If no callback is supplied then a Promise is returned  
**See**: [BrowserWindow.webContents.send()](https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | A topic which the BrowserWindow should be expecting |
| [callback] | <code>function</code> | Optional callback function to receive the message event |

<a name="module_window--open+close"></a>

#### open.close()
Close the window.

**Kind**: instance method of [<code>open</code>](#exp_module_window--open)  
<a name="module_window--open..openModal"></a>

#### open~openModal(urlToOpen, parentWindow, setOptions) ⇒ <code>Promise.&lt;WindowObject&gt;</code>
Similar to window.open() except a modal window is created as a child to the parentWindow.

**Kind**: inner method of [<code>open</code>](#exp_module_window--open)  
**Returns**: <code>Promise.&lt;WindowObject&gt;</code> - An WindowObject inhereted from BrowserWindow  
**See**: [BrowserWindow options](https://electronjs.org/docs/api/browser-window)  

| Param | Type | Description |
| --- | --- | --- |
| urlToOpen | <code>string</code> | Opens the window and loads this page |
| parentWindow | <code>BrowserWindow</code> | A BrowserWindow which will contain the model window |
| setOptions | <code>options</code> | A set of options for changing the window properties |

