## Modules

<dl>
<dt><a href="#fbstorageInterface to Google Cloud Storage in the security context of the authenticated user. Keep track of every file add/remove in firestore becausefirebase cloud storage does not allow listing/searching for files.Use the REST API directly because the node.js interface does not include storage.After initialization the fbstorage module will contain 3 objects_* .file - file access limited to the current signed-in user* .app - file access limited to any user of this app but not other apps* .public - file access without restrictionmodule_">fbstorageInterface to Google Cloud Storage in the security context of the authenticated user. Keep track of every file add/remove in firestore becausefirebase cloud storage does not allow listing/searching for files.Use the REST API directly because the node.js interface does not include storage.After initialization the fbstorage module will contain 3 objects:* .file - file access limited to the current signed-in user* .app - file access limited to any user of this app but not other apps* .public - file access without restriction</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#fbstorage">fbstorage</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#exp_module_store--fileStore+find">fileStore#find(filepath, queryMatch)</a> ⇒ <code>object</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_store--fileStore+list">fileStore#list(folderpath, queryMatch)</a> ⇒ <code>object</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_store--fileStore+upload">fileStore#upload(filepath, content)</a> ⇒ <code>object</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_store--fileStore+update">fileStore#update(filepath, metadata)</a> ⇒ <code>object</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_store--fileStore+download">fileStore#download(filepath)</a> ⇒ <code>string</code> | <code>JSON</code> | <code>buffer</code> | <code>object</code> | <code>array</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_store--fileStore+about">fileStore#about(filepath)</a> ⇒ <code>Promise</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_store--fileStore+delete">fileStore#delete(filepath)</a> ⇒ <code>null</code> | <code>string</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--initialize">initialize()</a> ⏏</dt>
<dd></dd>
</dl>

<a name="fbstorageInterface to Google Cloud Storage in the security context of the authenticated user. Keep track of every file add/remove in firestore becausefirebase cloud storage does not allow listing/searching for files.Use the REST API directly because the node.js interface does not include storage.After initialization the fbstorage module will contain 3 objects_* .file - file access limited to the current signed-in user* .app - file access limited to any user of this app but not other apps* .public - file access without restrictionmodule_"></a>

## fbstorageInterface to Google Cloud Storage in the security context of the authenticated user. Keep track of every file add/remove in firestore becausefirebase cloud storage does not allow listing/searching for files.Use the REST API directly because the node.js interface does not include storage.After initialization the fbstorage module will contain 3 objects:\* .file - file access limited to the current signed-in user\* .app - file access limited to any user of this app but not other apps\* .public - file access without restriction
**See**

- [Firebase Storage](https://firebase.google.com/docs/storage/)
- [Object Naming Guidelines](https://cloud.google.com/storage/docs/naming#objectnames)

**Example**  
```js
const { fbstorage } = require( 'electron-firebase' )// get list of folders only accessible to the signed-in userconst fileFolderList = await fbstorage.file.folders()
```
<a name="fbstorage"></a>

## fbstorage
**Kind**: global class  
<a name="new_fbstorage_new"></a>

### new fileStore(firestoreRoot, storeName, setPrefix)

| Param | Type | Description |
| --- | --- | --- |
| firestoreRoot | <code>string</code> | a database object defined in firestore.js |
| storeName | <code>string</code> | just a moniker |
| setPrefix | <code>string</code> | the first two segments of the file path, e.g. user/userid |

