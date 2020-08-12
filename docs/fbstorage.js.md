<a name="module_fbstorage"></a>

## fbstorage
Interface to Google Cloud Storage in the security context of the authenticated user. Keep track of every file add/remove in firestore becausefirebase cloud storage does not allow listing/searching for files.Use the REST API directly because the node.js interface does not include storage.After initialization the fbstorage module will contain 3 objects:* .file - file access limited to the current signed-in user* .app - file access limited to any user of this app but not other apps* .public - file access without restriction

**See**

- [Firebase Storage](https://firebase.google.com/docs/storage/)
- [Object Naming Guidelines](https://cloud.google.com/storage/docs/naming#objectnames)

**Example**  
```js
const { fbstorage } = require( 'electron-firebase' )// get list of folders only accessible to the signed-in userconst fileFolderList = await fbstorage.file.folders()
```

* [fbstorage](#module_fbstorage)
    * [fileStore#find(filepath, queryMatch)](#exp_module_fbstorage--fileStore+find) ⇒ <code>object</code> ⏏
    * [fileStore#list(folderpath, queryMatch)](#exp_module_fbstorage--fileStore+list) ⇒ <code>object</code> ⏏
    * [fileStore#upload(filepath, content)](#exp_module_fbstorage--fileStore+upload) ⇒ <code>object</code> ⏏
    * [fileStore#update(filepath, metadata)](#exp_module_fbstorage--fileStore+update) ⇒ <code>object</code> ⏏
    * [fileStore#download(filepath)](#exp_module_fbstorage--fileStore+download) ⇒ <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> ⏏
    * [fileStore#about(filepath)](#exp_module_fbstorage--fileStore+about) ⇒ <code>Promise</code> ⏏
    * [fileStore#delete(filepath)](#exp_module_fbstorage--fileStore+delete) ⇒ <code>null</code> \| <code>string</code> ⏏
    * [initialize()](#exp_module_fbstorage--initialize) ⏏

<a name="exp_module_fbstorage--fileStore+find"></a>

### fileStore#find(filepath, queryMatch) ⇒ <code>object</code> ⏏
**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filepath | <code>string</code> |  | Path and filename to store the file in the Cloud |
| queryMatch | <code>string</code> | <code>&quot;path&quot;</code> | optional match parameter to query for something other than path |

<a name="exp_module_fbstorage--fileStore+list"></a>

### fileStore#list(folderpath, queryMatch) ⇒ <code>object</code> ⏏
**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| folderpath | <code>string</code> |  | Path to query file storage |
| queryMatch | <code>string</code> | <code>&quot;folder&quot;</code> | optional match parameter to query for something other than folder |

<a name="exp_module_fbstorage--fileStore+upload"></a>

### fileStore#upload(filepath, content) ⇒ <code>object</code> ⏏
**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to store the file in the Cloud |
| content | <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> | File content to be written, objects must be serializable |

**Example**  
```js
{ name: 'users/[user-id]/Test/FileTest',  bucket: 'your-app-here.appspot.com',  generation: '123456789123456',  metageneration: '1',  contentType: 'application/json',  timeCreated: '2019-02-05T03:06:24.435Z',  updated: '2019-02-05T03:06:24.435Z',  storageClass: 'STANDARD',  size: '1005',  md5Hash: 'H3Anb534+vX2Y1HVwJxlyw==',  contentEncoding: 'identity',  contentDisposition: 'inline; filename*=utf-8\'\'FileTest',  crc32c: 'yTf15w==',  etag: 'AAAAAAA=',  downloadTokens: '00000000' }
```
<a name="exp_module_fbstorage--fileStore+update"></a>

### fileStore#update(filepath, metadata) ⇒ <code>object</code> ⏏
**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to update the file in the Cloud, relative to the current user |
| metadata |  | One or more metadata parameters to change |
| metadata.cacheControl | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control |
| metadata.contentDisposition | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/content-Disposition |
| metadata.contentEncoding | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding |
| metadata.contentLanguage | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language |
| metadata.contentType | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type |

<a name="exp_module_fbstorage--fileStore+download"></a>

### fileStore#download(filepath) ⇒ <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> ⏏
**Kind**: Exported function  
**Returns**: <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> - - file content  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to retreive the file |

<a name="exp_module_fbstorage--fileStore+about"></a>

### fileStore#about(filepath) ⇒ <code>Promise</code> ⏏
**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the meta information about the file  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to find the file in the Cloud, relative to the current user |

<a name="exp_module_fbstorage--fileStore+delete"></a>

### fileStore#delete(filepath) ⇒ <code>null</code> \| <code>string</code> ⏏
**Kind**: Exported function  
**Returns**: <code>null</code> \| <code>string</code> - - empty response unless there is an error  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to delete the file in the Cloud, relative to the current user |

<a name="exp_module_fbstorage--initialize"></a>

### initialize() ⏏
**Kind**: Exported function  
