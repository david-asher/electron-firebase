<a name="module_applib"></a>

## applib
Collection of utilities for JSON, objects, events, web request.


* [applib](#module_applib)
    * [isJSON(s)](#exp_module_applib--isJSON) ⇒ <code>boolean</code> ⏏
    * [isObject(obj)](#exp_module_applib--isObject) ⇒ <code>boolean</code> ⏏
    * [parseJSON(inputSerialized)](#exp_module_applib--parseJSON) ⇒ <code>object</code> ⏏
    * [stringifyJSON(inputObject)](#exp_module_applib--stringifyJSON) ⇒ <code>string</code> ⏏
    * [compactJSON(inputObject)](#exp_module_applib--compactJSON) ⇒ <code>string</code> ⏏
    * [mergeObjects(...objects)](#exp_module_applib--mergeObjects) ⇒ <code>object</code> ⏏
    * [request(options)](#exp_module_applib--request) ⇒ <code>Promise.&lt;object&gt;</code> ⏏

<a name="exp_module_applib--isJSON"></a>

### isJSON(s) ⇒ <code>boolean</code> ⏏
Tests whether the input looks like a JSON string.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the input is likely a JSON string  

| Param | Type | Description |
| --- | --- | --- |
| s | <code>\*</code> | a parameter to be tested |

<a name="exp_module_applib--isObject"></a>

### isObject(obj) ⇒ <code>boolean</code> ⏏
Tests whether the input is an object.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the input is an object  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>\*</code> | a parameter to be tested |

<a name="exp_module_applib--parseJSON"></a>

### parseJSON(inputSerialized) ⇒ <code>object</code> ⏏
Converts a JSON string to an object, handling errors so this won't throw an exception.

**Kind**: Exported function  
**Returns**: <code>object</code> - Null if there is an error, else a valid object  

| Param | Type | Description |
| --- | --- | --- |
| inputSerialized | <code>string</code> | A JSON string |

<a name="exp_module_applib--stringifyJSON"></a>

### stringifyJSON(inputObject) ⇒ <code>string</code> ⏏
Converts an object into a JSON string with space/newline formatting, handling errors so it won't throw an exception.

**Kind**: Exported function  
**Returns**: <code>string</code> - Null if there is an error, else a JSON string  

| Param | Type | Description |
| --- | --- | --- |
| inputObject | <code>object</code> | a valid JavaScript object |

<a name="exp_module_applib--compactJSON"></a>

### compactJSON(inputObject) ⇒ <code>string</code> ⏏
Same as stringifyJSON except the result is compact without spaces and newlines.

**Kind**: Exported function  
**Returns**: <code>string</code> - Null if there is an error, else a JSON string  

| Param | Type | Description |
| --- | --- | --- |
| inputObject | <code>object</code> | a valid JavaScript object |

<a name="exp_module_applib--mergeObjects"></a>

### mergeObjects(...objects) ⇒ <code>object</code> ⏏
Performs a deep merge of the input objects.

**Kind**: Exported function  
**Returns**: <code>object</code> - A JavaScript object  

| Param | Type | Description |
| --- | --- | --- |
| ...objects | <code>any</code> | A parameter set (comma-separated) of objects |

<a name="exp_module_applib--request"></a>

### request(options) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
A promise interface for the npm request HTTP client. The response object from the returnedpromise contains these important properties: .status, .statusText, .headers, .data

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;object&gt;</code> - Promise object represents the HTTP response  
**See**

- [https://www.npmjs.com/package/axios](https://www.npmjs.com/package/axios)
- [https://nodejs.org/api/https.html#https_https_request_options_callback](https://nodejs.org/api/https.html#https_https_request_options_callback)
- [https://nodejs.org/api/http.html#http_class_http_serverresponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)


| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Parameters that define this request |

