<a name="module_store"></a>

## store
Interface to Google Cloud Storage in the security context of the authenticated user.

**See**

- [Firebase Storage](https://firebase.google.com/docs/storage/)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Security Rules](https://firebase.google.com/docs/storage/security/)
- [Object Naming Guidelines](https://cloud.google.com/storage/docs/naming#objectnames)

**Example** *(To enable user-level security, go to the Firebase console and set the storage rules to the following.)*  
```js
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

* [store](#module_store)
    * [uploadFile(filepath, content)](#exp_module_store--uploadFile) ⏏
    * [downloadFile(filepath)](#exp_module_store--downloadFile) ⏏
    * [findFileByPath(filepath)](#exp_module_store--findFileByPath) ⇒ <code>Promise</code> ⏏
    * [aboutFile(filepath)](#exp_module_store--aboutFile) ⇒ <code>Promise</code> ⏏
    * [updateFileMeta(filepath, metadata)](#exp_module_store--updateFileMeta) ⏏
    * [deleteFile(filepath)](#exp_module_store--deleteFile) ⏏

<a name="exp_module_store--uploadFile"></a>

### uploadFile(filepath, content) ⏏
Uploads local content and creates a file in Firebase. The file will be stored in 
Google Cloud Storage for Firebase, and a record of the file will be kept in the 
Cloud Firestore database, for easy reference and searching.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to store the file in the Cloud, relative to the current user |
| content | <code>string</code> \| <code>JSON</code> \| <code>buffer</code> \| <code>object</code> \| <code>array</code> | File content to be written, objects must be serializable |

<a name="exp_module_store--downloadFile"></a>

### downloadFile(filepath) ⏏
Download a file from Firebase.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to retreive the file from the Cloud, relative to the current user |

<a name="exp_module_store--findFileByPath"></a>

### findFileByPath(filepath) ⇒ <code>Promise</code> ⏏
Searches the Cloud Firestore database for a file record that matches the given filepath

**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the Cloud Firestore record  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to find the file in the Cloud, relative to the current user |

<a name="exp_module_store--aboutFile"></a>

### aboutFile(filepath) ⇒ <code>Promise</code> ⏏
Gets meta information about the file, including a secure download URL that can be used anywhere

**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the meta information about the file  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to find the file in the Cloud, relative to the current user |

<a name="exp_module_store--updateFileMeta"></a>

### updateFileMeta(filepath, metadata) ⏏
Change some metadata aspects of a stored file

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to update the file in the Cloud, relative to the current user |
| metadata |  | One or more metadata parameters to change |
| metadata.cacheControl | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control |
| metadata.contentDisposition | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/content-Disposition |
| metadata.contentEncoding | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding |
| metadata.contentLanguage | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language |
| metadata.contentType | <code>string</code> | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type |

<a name="exp_module_store--deleteFile"></a>

### deleteFile(filepath) ⏏
Delete the file from Google Cloud Storage for Firebase and remove the file's record from 
Cloud Firestore

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| filepath | <code>string</code> | Path and filename to delete the file in the Cloud, relative to the current user |

