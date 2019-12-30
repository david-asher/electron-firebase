<a name="module_data"></a>

## data
Interface to Google Cloud Firestore Database. All Firestore document I/O is performed in the 
security context of the logged-in user.
This data module manages a default set of root-level 
collections: data.files, data.docs, data.apps, which are used to keep track of Cloud Storage files, 
Firestore document sets, and registered electron apps.

**See**

- [Firestore Authentication](https://firebase.google.com/docs/firestore/security/rules-conditions#authentication)
- [Firestore Rules](https://firebase.google.com/docs/reference/rules/rules.firestore)

**Example** *(To enable user-level security, go to the Firebase console and set the database rules to the following.)*  
```js
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create, read, update, delete: if request.auth.uid == userId;
    }
    match /users/{userId}/{document=**} {
      allow create, read, update, delete: if request.auth.uid == userId;
    }
  }
}
```

* [data](#module_data)
    * [setup(user, [bForceUpdate])](#exp_module_data--setup) ⇒ <code>object</code> ⏏
    * [docRef(rootCollection, [docPath])](#exp_module_data--docRef) ⇒ <code>DocumentReference</code> ⏏
    * [docCreate(rootCollection, docPath, contents)](#exp_module_data--docCreate) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
    * [docRead(rootCollection, docPath, [bGetFromServer])](#exp_module_data--docRead) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
    * [docGetField(rootCollection, docPath, fieldName, [bGetFromServer])](#exp_module_data--docGetField) ⇒ <code>Promise.&lt;any&gt;</code> ⏏
    * [docAbout(rootCollection, docPath, [bGetFromServer])](#exp_module_data--docAbout) ⇒ <code>Promise.&lt;DocumentSnapshot&gt;</code> ⏏
    * [docUpdate(rootCollection, docPath, contents)](#exp_module_data--docUpdate) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
    * [docDelete(rootCollection, docPath)](#exp_module_data--docDelete) ⇒ <code>Promise.&lt;void&gt;</code> ⏏
    * [docFind(rootCollection, fieldName, fieldMatch, [matchOperator])](#exp_module_data--docFind) ⇒ <code>Promise.&lt;QuerySnapshot&gt;</code> ⏏
    * [updateArrayElement(docRef, arrayName, newValue, [bGetFromServer])](#exp_module_data--updateArrayElement) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [removeArrayElement(docRef, arrayName, oldValue, [bGetFromServer])](#exp_module_data--removeArrayElement) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [addToRootCollections(collectionName)](#exp_module_data--addToRootCollections) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [removeFromRootCollections(collectionName)](#exp_module_data--removeFromRootCollections) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [listRootCollections()](#exp_module_data--listRootCollections) ⇒ <code>Promise.&lt;array&gt;</code> ⏏

<a name="exp_module_data--setup"></a>

### setup(user, [bForceUpdate]) ⇒ <code>object</code> ⏏
The setup() function must be called before any other API call in this module.

**Kind**: Exported function  
**Returns**: <code>object</code> - The Firestore document that represent this user  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>User</code> | Object returned from authentication module which describes a user |
| [bForceUpdate] | <code>boolean</code> | If true, any new information in the User object will be merged into the root user Firestore document |

<a name="exp_module_data--docRef"></a>

### docRef(rootCollection, [docPath]) ⇒ <code>DocumentReference</code> ⏏
Returns a DocumentReference that can be used with Firestore APIs. If no path is specified, an 
automatically-generated unique ID will be used for the returned DocumentReference.

**Kind**: Exported function  
**Returns**: <code>DocumentReference</code> - Object that can be used to refer to the specified document  
**See**: [DocumentReference](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference)  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| [docPath] | <code>string</code> | Relative path to a Firebase document within the root collection |

<a name="exp_module_data--docCreate"></a>

### docCreate(rootCollection, docPath, contents) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
Creates a new document in the Firestore at the requested path.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentReference&gt;</code> - A DocumentReference to the new Firestore document  
**See**: [DocumentReference set()](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#set)  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |
| contents | <code>object</code> | Content to write |

<a name="exp_module_data--docRead"></a>

### docRead(rootCollection, docPath, [bGetFromServer]) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
Reads the Firestore document at the requested path and returns an object representing the content.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;object&gt;</code> - The contents of the requested document  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |
| [bGetFromServer] | <code>boolean</code> | If true, forces a read from the cloud instead of the local cache |

<a name="exp_module_data--docGetField"></a>

### docGetField(rootCollection, docPath, fieldName, [bGetFromServer]) ⇒ <code>Promise.&lt;any&gt;</code> ⏏
Gets the value at a specified field within a Firestore document.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;any&gt;</code> - The data at the specified field location or undefined if no such field exists in the document  
**See**: [DocumentSnapshot get()](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#get)  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |
| fieldName | <code>string</code> | The name of a top-level field within the Firebase document |
| [bGetFromServer] | <code>boolean</code> | If true, forces a read from the cloud instead of the local cache |

<a name="exp_module_data--docAbout"></a>

### docAbout(rootCollection, docPath, [bGetFromServer]) ⇒ <code>Promise.&lt;DocumentSnapshot&gt;</code> ⏏
Gets a DocumentSnapshot for the Firestore document which contains meta information and functions
to get data, test existence, etc.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentSnapshot&gt;</code> - An object which can be used to get further information and data  
**See**: [DocumentSnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot)  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |
| [bGetFromServer] | <code>boolean</code> | If true, forces a read from the cloud instead of the local cache |

<a name="exp_module_data--docUpdate"></a>

### docUpdate(rootCollection, docPath, contents) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
Updates the content to an existing Firestore document, merging and overwriting fields.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentReference&gt;</code> - A DocumentReference to the updated Firestore document  
**See**: [DocumentReference set()](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#set)  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |
| contents | <code>object</code> | Content to update |

<a name="exp_module_data--docDelete"></a>

### docDelete(rootCollection, docPath) ⇒ <code>Promise.&lt;void&gt;</code> ⏏
Deletes the Firestore document

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;void&gt;</code> - Returns a promise that resolves once the document is deleted  
**See**: [DocumentReference delete()](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#delete)  

| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection set |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |

<a name="exp_module_data--docFind"></a>

### docFind(rootCollection, fieldName, fieldMatch, [matchOperator]) ⇒ <code>Promise.&lt;QuerySnapshot&gt;</code> ⏏
Queries a collection of documents to find a match for a specific field name with optional matching operator.

**Kind**: Exported function  
**See**

- [Query where()](https://firebase.google.com/docs/reference/node/firebase.firestore.Query#where)
- [QuerySnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.QuerySnapshot)


| Param | Type | Description |
| --- | --- | --- |
| rootCollection | <code>string</code> | The name of a root-level collection |
| fieldName | <code>string</code> | The name of a document field to search against all of the collection documents |
| fieldMatch | <code>string</code> | The value of the fieldName to match against |
| [matchOperator] | <code>string</code> | Optional comparison operator, defaults to "==" |

<a name="exp_module_data--updateArrayElement"></a>

### updateArrayElement(docRef, arrayName, newValue, [bGetFromServer]) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
This function will push a new value onto an array field of the Firestore document. The document 
only updates if the new value doesn't exist in the array. Don't use this function for array values
that are complex objects.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - The updated array field  

| Param | Type | Description |
| --- | --- | --- |
| docRef | <code>DocumentReference</code> | Reference to the document to be updated |
| arrayName | <code>string</code> | The name of the array field to be updated |
| newValue | <code>\*</code> | The new value to push on the array field |
| [bGetFromServer] | <code>boolean</code> | If true, forces a read from the cloud before updating the array field |

<a name="exp_module_data--removeArrayElement"></a>

### removeArrayElement(docRef, arrayName, oldValue, [bGetFromServer]) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
This function will remove a value from an array field of the Firestore document. The document 
only updates if the old value existed in the array. Don't use this function for array values
that are complex objects.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - The updated array field  

| Param | Type | Description |
| --- | --- | --- |
| docRef | <code>DocumentReference</code> | Reference to the document to be updated |
| arrayName | <code>string</code> | The name of the array field to be updated |
| oldValue | <code>\*</code> | The old value to be removed from the array field |
| [bGetFromServer] | <code>boolean</code> | If true, forces a read from the cloud before updating the array field |

<a name="exp_module_data--addToRootCollections"></a>

### addToRootCollections(collectionName) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
Adds a new collection name to the top-level collection set, which can be used in other APIs 
requiring rootCollection.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - The updated set of top-level collections  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>sring</code> | The name of a new collection to be added to the top-level set |

<a name="exp_module_data--removeFromRootCollections"></a>

### removeFromRootCollections(collectionName) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
Removes a collection name from the top-level collection set.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - The updated set of top-level collections  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>sring</code> | The name of a collection to be removed from the top-level set |

<a name="exp_module_data--listRootCollections"></a>

### listRootCollections() ⇒ <code>Promise.&lt;array&gt;</code> ⏏
Returns the list of top-level collections.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - The updated set of top-level collections  
