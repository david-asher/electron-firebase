<a name="module_firestore"></a>

## firestore
Interface to Google Cloud Firestore Database using high-level interface objects. All Firestore document I/O is performed in the security context of the logged-in user and the specific app you have built.It is important to understand the structure of a Firestore because it is not a file tree. A single document may contain a set of properties, but not another document. A document may also contain collections. A collection is a set of documents, but not properties. Therefore a document is always a member of a collection, and a collection is a member of a document. You can describe a specific path to a document, and it must always be an even number of path components since the document parent will be a collection, except for the root document of the Firestore. If you follow only thisinterface for access to the Firestore, you will not have direct access to the root document.

**See**

- [https://firebase.google.com/docs/firestore/manage-data/structure-data](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [https://firebase.google.com/docs/firestore/data-model](https://firebase.google.com/docs/firestore/data-model)Once a firestore object is defined, all document I/O is performed relative to (constrained to)this top-level document, so your code can't wander astray into other parts of the Firestorewhere you don't belong. Each API starts with a docPath parameter, and if null will refer to the top-level doc, into which you can read and write fields. If you want to create or work with documents, the docPath parameter must have an even number of path segments, e.g. "/maps/chicago" in which casethe collection "maps" will be automatically created if it doesn't exist. After initialization three objects are available from this module:* .doc - A Firestore subtree (/users/<userid>/) for the signed-in user's documents in Firestore* .app - A Firestore subtree (/apps/<projectId>/) for the app being used, accessible to all users* .public - A Firestore subtree (/apps/public/) that any user or app and read or write to


* [firestore](#module_firestore)
    * [firestoreDoc#about(docPath)](#exp_module_firestore--firestoreDoc+about) ⇒ <code>Promise.&lt;DocumentSnapshot&gt;</code> ⏏
    * [firestoreDoc#read(docPath)](#exp_module_firestore--firestoreDoc+read) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
    * [firestoreDoc#write(docPath, [contents])](#exp_module_firestore--firestoreDoc+write) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
    * [firestoreDoc#merge(docPath, [contents])](#exp_module_firestore--firestoreDoc+merge) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
    * [firestoreDoc#update(docPath, [contents])](#exp_module_firestore--firestoreDoc+update) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
    * [firestoreDoc#delete(docPath)](#exp_module_firestore--firestoreDoc+delete) ⇒ <code>Promise.&lt;void&gt;</code> ⏏
    * [firestoreDoc#query(collectionPath, fieldName, fieldMatch, [matchOperator])](#exp_module_firestore--firestoreDoc+query) ⇒ <code>Promise.&lt;QuerySnapshot&gt;</code> ⏏
    * [firestoreDoc#field(docPath, fieldName)](#exp_module_firestore--firestoreDoc+field) ⇒ <code>Promise.&lt;any&gt;</code> ⏏
    * [firestoreDoc#union(docPath, arrayName, newValue)](#exp_module_firestore--firestoreDoc+union) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [firestoreDoc#splice(docPath, arrayName, newValue)](#exp_module_firestore--firestoreDoc+splice) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [firestoreDoc#push(docPath, arrayName, newValue)](#exp_module_firestore--firestoreDoc+push) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
    * [firestoreDoc#pop(docPath, arrayName)](#exp_module_firestore--firestoreDoc+pop) ⇒ <code>Promise.&lt;(string\|number\|object)&gt;</code> ⏏
    * [initialize(userid, projectId)](#exp_module_firestore--initialize) ⏏

<a name="exp_module_firestore--firestoreDoc+about"></a>

### firestoreDoc#about(docPath) ⇒ <code>Promise.&lt;DocumentSnapshot&gt;</code> ⏏
Gets a DocumentSnapshot for the Firestore document which contains meta information and functionsto get data, test existence, etc.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentSnapshot&gt;</code> - An object which can be used to get further information and dataabout the document: .exists, .id, .metadata, .get(), .data(), .isEqual()  
**See**: [DocumentSnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Relative path to a Firebase document within the root collection |

<a name="exp_module_firestore--firestoreDoc+read"></a>

### firestoreDoc#read(docPath) ⇒ <code>Promise.&lt;object&gt;</code> ⏏
Reads the Firestore document at the requested path and returns an object representing the content.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;object&gt;</code> - The contents of the requested document  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |

<a name="exp_module_firestore--firestoreDoc+write"></a>

### firestoreDoc#write(docPath, [contents]) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
Creates a new document in the Firestore at the requested path, else updates an existing documentif it already exists, overwriting all fields.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentReference&gt;</code> - DocumentReference for the docPath  
**See**: [https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| [contents] | <code>object</code> | Content to write into new document, or merge into existing document |

<a name="exp_module_firestore--firestoreDoc+merge"></a>

### firestoreDoc#merge(docPath, [contents]) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
Creates a new document in the Firestore at the requested path, else updates an existing documentif it already exists, merging all fields.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentReference&gt;</code> - DocumentReference for the docPath  
**See**: [https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| [contents] | <code>object</code> | Content to write into new document, or merge into existing document |

<a name="exp_module_firestore--firestoreDoc+update"></a>

### firestoreDoc#update(docPath, [contents]) ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏
Updates an existing document in the Firestore at the requested path with the given contents. Likemerge() except it will fail if the document does not exist.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;DocumentReference&gt;</code> - DocumentReference for the docPath  
**See**: [https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| [contents] | <code>object</code> | Content to write into new document, or merge into existing document |

<a name="exp_module_firestore--firestoreDoc+delete"></a>

### firestoreDoc#delete(docPath) ⇒ <code>Promise.&lt;void&gt;</code> ⏏
Deletes the Firestore document at the given path.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;void&gt;</code> - Returns a promise that resolves once the document is deleted  
**See**: [DocumentReference delete()](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#delete)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |

<a name="exp_module_firestore--firestoreDoc+query"></a>

### firestoreDoc#query(collectionPath, fieldName, fieldMatch, [matchOperator]) ⇒ <code>Promise.&lt;QuerySnapshot&gt;</code> ⏏
Queries a collection to find a match for a specific field name with optional matching operator.

**Kind**: Exported function  
**See**

- [Query where()](https://firebase.google.com/docs/reference/node/firebase.firestore.Query#where)
- [QuerySnapshot](https://firebase.google.com/docs/reference/node/firebase.firestore.QuerySnapshot)


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| collectionPath | <code>string</code> |  | The path to a collection, cannot be blank |
| fieldName | <code>string</code> |  | The name of a document field to search against all of the collection documents |
| fieldMatch | <code>string</code> |  | The value of the fieldName to match against |
| [matchOperator] | <code>string</code> | <code>&quot;&#x3D;&#x3D;&quot;</code> | Optional comparison operator, defaults to "==" |

<a name="exp_module_firestore--firestoreDoc+field"></a>

### firestoreDoc#field(docPath, fieldName) ⇒ <code>Promise.&lt;any&gt;</code> ⏏
Gets the value of a specified field within a Firestore document.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;any&gt;</code> - The data at the specified field location or undefined if no such field exists in the document  
**See**: [DocumentSnapshot get()](https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#get)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| fieldName | <code>string</code> | The name of a top-level field within the Firebase document |

<a name="exp_module_firestore--firestoreDoc+union"></a>

### firestoreDoc#union(docPath, arrayName, newValue) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
This function will insert a new value, or multiple values, onto an array field of the Firestore document. Each specified element that doesn't already exist in the array will be added to the end. If the field being modified is not already an array it will be overwritten with an array containing exactly the specified elements.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - - The array after the new value is inserted  
**See**: [FieldValue union](https://firebase.google.com/docs/reference/node/firebase.firestore.FieldValue#static-arrayunion)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| arrayName | <code>string</code> | The name of the array field to be updated |
| newValue | <code>\*</code> | The new value to push on the array field |

<a name="exp_module_firestore--firestoreDoc+splice"></a>

### firestoreDoc#splice(docPath, arrayName, newValue) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
This function will remove a value, or multiple values, from an array field of the Firestore document.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - - The array after the value is removed  
**See**: [FieldValue remove](https://firebase.google.com/docs/reference/node/firebase.firestore.FieldValue#static-arrayremove)  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| arrayName | <code>string</code> | The name of the array field to be updated |
| newValue | <code>\*</code> | The new value to push on the array field |

<a name="exp_module_firestore--firestoreDoc+push"></a>

### firestoreDoc#push(docPath, arrayName, newValue) ⇒ <code>Promise.&lt;array&gt;</code> ⏏
This function will push a new value onto the end of an array field of the Firestore document.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;array&gt;</code> - The updated array field  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| arrayName | <code>string</code> | The name of the array field to be updated |
| newValue | <code>\*</code> | The new value to push on the array field |

<a name="exp_module_firestore--firestoreDoc+pop"></a>

### firestoreDoc#pop(docPath, arrayName) ⇒ <code>Promise.&lt;(string\|number\|object)&gt;</code> ⏏
This function will pop a value from the end of an array field of the Firestore document.

**Kind**: Exported function  
**Returns**: <code>Promise.&lt;(string\|number\|object)&gt;</code> - The popped value  

| Param | Type | Description |
| --- | --- | --- |
| docPath | <code>string</code> | Path to a Firebase document |
| arrayName | <code>string</code> | The name of the array field to be updated |

<a name="exp_module_firestore--initialize"></a>

### initialize(userid, projectId) ⏏
Firestore interfaces are defined when your app starts:* .doc - A Firestore subtree (/users/userid/) for the signed-in user's documents in Firestore* .app - A Firestore subtree (/apps/projectId/) for the app being used, accessible to all users* .public - A Firestore subtree (/apps/public/) that any user or app and read or write to

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| userid | <code>string</code> | The Firebase assigned userId from authentication process |
| projectId | <code>string</code> | Unique string for this application, typically the Firebase projectId |

