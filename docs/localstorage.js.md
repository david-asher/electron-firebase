<a name="module_local"></a>

## local
Functions that use the localStorage capability in a BrowserWindow to store persistent information. These APIsrun in the main node.js process and use IPC to request and transfer information from the browser. Thisfeature is used in conjunction with the weblocal.js file if referenced by a BrowserWindow. weblocal.js shouldnot be loaded into more than one BrowserWindow. This API is intended to mimic the localStorage API available in every Browser, except the getItem() call must be asynchronous and replies with either a callback or a promise.

**See**: [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)  

* [local](#module_local)
    * [setItem(key, value)](#exp_module_local--setItem) ⏏
    * [removeItem(key)](#exp_module_local--removeItem) ⏏
    * [getItem(key, [optionalCallback])](#exp_module_local--getItem) ⇒ <code>Promise.&lt;(string\|object)&gt;</code> ⏏

<a name="exp_module_local--setItem"></a>

### setItem(key, value) ⏏
When passed a key name and value, will add that key to the Storage object, or update that key's value if it already exists. This function will not confirm that the key and valuewere written to the BrowserWindow localStorage.

**Kind**: Exported function  
**See**: [localStorage setItem()](https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | The name of the key you want to create/update |
| value | <code>\*</code> | The value you want to give the key you are creating/updating |

<a name="exp_module_local--removeItem"></a>

### removeItem(key) ⏏
When passed a key name, will remove that key from the Storage object if it exists. If there is no item associated with the given key, this function will do nothing.

**Kind**: Exported function  
**See**: [localStorage removeItem()](https://developer.mozilla.org/en-US/docs/Web/API/Storage/removeItem)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The name of the key you want to remove |

<a name="exp_module_local--getItem"></a>

### getItem(key, [optionalCallback]) ⇒ <code>Promise.&lt;(string\|object)&gt;</code> ⏏
When passed a key name, will return that key's value, or null if the key does not exist.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;(string\|object)&gt;</code> - A promise which resolves to containing the value of the key. If the key does not exist, null is returned.  
**See**: [localStorage getItem()](https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The name of the key you want to retrieve the value of |
| [optionalCallback] | <code>\*</code> | Optional callback function to retreive the |

