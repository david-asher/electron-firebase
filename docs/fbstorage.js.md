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
    * [~fileStore](#module_fbstorage..fileStore)
        * [new fileStore(firestoreRoot, storeName, setPrefix)](#new_module_fbstorage..fileStore_new)
        * [.folders(filepath, content)](#module_fbstorage..fileStore+folders)

<a name="module_fbstorage..fileStore"></a>

### fbstorage~fileStore
**Kind**: inner class of [<code>fbstorage</code>](#module_fbstorage)  

* [~fileStore](#module_fbstorage..fileStore)
    * [new fileStore(firestoreRoot, storeName, setPrefix)](#new_module_fbstorage..fileStore_new)
    * [.folders(filepath, content)](#module_fbstorage..fileStore+folders)

<a name="new_module_fbstorage..fileStore_new"></a>

#### new fileStore(firestoreRoot, storeName, setPrefix)
Create a new fileStore interface.


| Param | Type | Description |
| --- | --- | --- |
| firestoreRoot | <code>string</code> | a database object defined in firestore.js |
| storeName | <code>string</code> | just a moniker |
| setPrefix | <code>string</code> | the first two segments of the file path, e.g. user/userid |

<a name="module_fbstorage..fileStore+folders"></a>

#### fileStore.folders(filepath, content)
**Kind**: instance method of [<code>fileStore</code>](#module_fbstorage..fileStore)  

| Param | Type |
| --- | --- |
| filepath | <code>\*</code> | 
| content | <code>\*</code> | 

