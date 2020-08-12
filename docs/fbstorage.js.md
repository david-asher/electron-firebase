<a name="module_store"></a>

## store
Interface to Google Cloud Storage in the security context of the authenticated user. Keep track of every file add/remove in firestore becausefirebase cloud storage does not allow listing/searching for files.And use the REST API directly because the node.js interface does not include storage.Ugh.

**See**

- [Firebase Storage](https://firebase.google.com/docs/storage/)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Security Rules](https://firebase.google.com/docs/storage/security/)
- [Object Naming Guidelines](https://cloud.google.com/storage/docs/naming#objectnames)

**Example**  
```js
<caption>To enable user-level security, go to the Firebase console and set the storage rules to the following.</caption>service firebase.storage {  match /b/{bucket}/o {    match /users/{userId}/{allPaths=**} {      allow read, write: if request.auth.uid == userId;    }    match /apps/{projectId}/{allPaths=**} {      allow read, write: if request.auth != null && request.auth.token.aud == projectId;    }    match /public/{allPaths=**} {      allow read: if true      allow write: if request.auth != null    }  }}
```

* [store](#module_store)
    * [fileStore#_metaFixup(filepath)](#exp_module_store--fileStore+_metaFixup) ⇒ <code>Promise</code> ⏏
    * [fileStore#find(filepath, queryMatch)](#exp_module_store--fileStore+find) ⇒ <code>object</code> ⏏
    * [fileStore#list(folderpath, queryMatch)](#exp_module_store--fileStore+list) ⇒ <code>object</code> ⏏
    * [fileStore#upload(filepath, content)](#exp_module_store--fileStore+upload) ⇒ <code>object</code> ⏏
    * [fileStore#update(filepath, metadata)](#exp_module_store--fileStore+update) ⇒ <code>object</code> ⏏
    * [fileStore#download(filepath)](#exp_module_store--fileStore+download) ⇒ <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> ⏏
    * [fileStore#about(filepath)](#exp_module_store--fileStore+about) ⇒ <code>Promise</code> ⏏
    * [fileStore#delete(filepath)](#exp_module_store--fileStore+delete) ⇒ <code>null</code> \| <code>string</code> ⏏

<a name="exp_module_store--fileStore+_metaFixup"></a>

### fileStore#\_metaFixup(filepath) ⇒ <code>Promise</code> ⏏
Searches the Cloud Firestore database for a file record that matches the given filepath

**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the Cloud Firestore record  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to find the file in the Cloud, relative to the current user |

<a name="exp_module_store--fileStore+find"></a>

### fileStore#find(filepath, queryMatch) ⇒ <code>object</code> ⏏
Search the storage records in the Firestore database for a file matching the specific filepath given. The newest document matching the search criteria will be returned.

**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filepath | <code>string</code> |  | Path and filename to store the file in the Cloud |
| queryMatch | <code>string</code> | <code>&quot;path&quot;</code> | optional match parameter to query for something other than path |

<a name="exp_module_store--fileStore+list"></a>

### fileStore#list(folderpath, queryMatch) ⇒ <code>object</code> ⏏
Search the storage records in the Firestore database for all files where their folder matches the specific path given, and return an array with the metadata for each file.

**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| folderpath | <code>string</code> |  | Path to query file storage |
| queryMatch | <code>string</code> | <code>&quot;folder&quot;</code> | optional match parameter to query for something other than folder |

<a name="exp_module_store--fileStore+upload"></a>

### fileStore#upload(filepath, content) ⇒ <code>object</code> ⏏
Uploads local content and creates a file in Google Cloud Storage for Firebase, and a record of the file will be kept in the Cloud Firestore database, for easy reference and searching. Accepts contents as string, JSON string, object (serializable), array, or buffer. Returns a Promise containing file metadata, as:{ name: 'users/[user-id]/Test/FileTest',  bucket: 'your-app-here.appspot.com',  generation: '123456789123456',  metageneration: '1',  contentType: 'application/json',  timeCreated: '2019-02-05T03:06:24.435Z',  updated: '2019-02-05T03:06:24.435Z',  storageClass: 'STANDARD',  size: '1005',  md5Hash: 'H3Anb534+vX2Y1HVwJxlyw==',  contentEncoding: 'identity',  contentDisposition: 'inline; filename*=utf-8\'\'FileTest',  crc32c: 'yTf15w==',  etag: 'AAAAAAA=',  downloadTokens: '00000000' }

**Kind**: Exported function  
**Returns**: <code>object</code> - - metafile descriptor for the requested file  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to store the file in the Cloud |
| content | <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> | File content to be written, objects must be serializable |

<a name="exp_module_store--fileStore+update"></a>

### fileStore#update(filepath, metadata) ⇒ <code>object</code> ⏏
Change some metadata aspects of a stored file

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

<a name="exp_module_store--fileStore+download"></a>

### fileStore#download(filepath) ⇒ <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> ⏏
Download a file from Firebase Storage.

**Kind**: Exported function  
**Returns**: <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> - - file content  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to retreive the file |

<a name="exp_module_store--fileStore+about"></a>

### fileStore#about(filepath) ⇒ <code>Promise</code> ⏏
Gets meta information about the file, including a secure download URL that can be used anywhere

**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the meta information about the file  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to find the file in the Cloud, relative to the current user |

<a name="exp_module_store--fileStore+delete"></a>

### fileStore#delete(filepath) ⇒ <code>null</code> \| <code>string</code> ⏏
Delete the file from Google Cloud Storage for Firebase and remove the file's record from Cloud Firestore

**Kind**: Exported function  
**Returns**: <code>null</code> \| <code>string</code> - - empty response unless there is an error  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to delete the file in the Cloud, relative to the current user |

