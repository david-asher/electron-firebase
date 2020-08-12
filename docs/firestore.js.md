## Modules

<dl>
<dt><a href="#firestoreInterface to Google Cloud Firestore Database using high-level interface objects. All Firestore document I/O is performed in the security context of the logged-in user and the specific app you have built.It is important to understand the structure of a Firestore because it is not a file tree. A single document may contain a set of properties, but not another document. A document may also contain collections. A collection is a set of documents, but not properties. Therefore a document is always a member of a collection, and a collection is a member of a document. You can describe a specific path to a document, and it must always be an even number of path components since the document parent will be a collection, except for the root document of the Firestore. If you follow only thisinterface for access to the Firestore, you will not have direct access to the root document.module_">firestoreInterface to Google Cloud Firestore Database using high-level interface objects. All Firestore document I/O is performed in the security context of the logged-in user and the specific app you have built.It is important to understand the structure of a Firestore because it is not a file tree. A single document may contain a set of properties, but not another document. A document may also contain collections. A collection is a set of documents, but not properties. Therefore a document is always a member of a collection, and a collection is a member of a document. You can describe a specific path to a document, and it must always be an even number of path components since the document parent will be a collection, except for the root document of the Firestore. If you follow only thisinterface for access to the Firestore, you will not have direct access to the root document.</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#firestore">firestore</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#exp_module_firestore--firestoreDoc+about">firestoreDoc#about(docPath)</a> ⇒ <code>Promise.&lt;DocumentSnapshot&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+read">firestoreDoc#read(docPath)</a> ⇒ <code>Promise.&lt;object&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+write">firestoreDoc#write(docPath, [contents])</a> ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+merge">firestoreDoc#merge(docPath, [contents])</a> ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+update">firestoreDoc#update(docPath, [contents])</a> ⇒ <code>Promise.&lt;DocumentReference&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+delete">firestoreDoc#delete(docPath)</a> ⇒ <code>Promise.&lt;void&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+query">firestoreDoc#query(collectionPath, fieldName, fieldMatch, [matchOperator])</a> ⇒ <code>Promise.&lt;QuerySnapshot&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+field">firestoreDoc#field(docPath, fieldName)</a> ⇒ <code>Promise.&lt;any&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+union">firestoreDoc#union(docPath, arrayName, newValue)</a> ⇒ <code>Promise.&lt;array&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+splice">firestoreDoc#splice(docPath, arrayName, newValue)</a> ⇒ <code>Promise.&lt;array&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+push">firestoreDoc#push(docPath, arrayName, newValue)</a> ⇒ <code>Promise.&lt;array&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--firestoreDoc+pop">firestoreDoc#pop(docPath, arrayName)</a> ⇒ <code>Promise.&lt;(string|number|object)&gt;</code> ⏏</dt>
<dd></dd>
<dt><a href="#exp_module_firestore--initialize">initialize(userid, projectId)</a> ⏏</dt>
<dd><p>Firestore interfaces are defined when your app starts:</p>
<ul>
<li>.doc - A Firestore subtree (/users/userid/) for the signed-in user&#39;s documents in Firestore</li>
<li>.app - A Firestore subtree (/apps/projectId/) for the app being used, accessible to all users</li>
<li>.public - A Firestore subtree (/apps/public/) that any user or app and read or write to</li>
</ul>
</dd>
</dl>

<a name="firestoreInterface to Google Cloud Firestore Database using high-level interface objects. All Firestore document I/O is performed in the security context of the logged-in user and the specific app you have built.It is important to understand the structure of a Firestore because it is not a file tree. A single document may contain a set of properties, but not another document. A document may also contain collections. A collection is a set of documents, but not properties. Therefore a document is always a member of a collection, and a collection is a member of a document. You can describe a specific path to a document, and it must always be an even number of path components since the document parent will be a collection, except for the root document of the Firestore. If you follow only thisinterface for access to the Firestore, you will not have direct access to the root document.module_"></a>

## firestoreInterface to Google Cloud Firestore Database using high-level interface objects. All Firestore document I/O is performed in the security context of the logged-in user and the specific app you have built.It is important to understand the structure of a Firestore because it is not a file tree. A single document may contain a set of properties, but not another document. A document may also contain collections. A collection is a set of documents, but not properties. Therefore a document is always a member of a collection, and a collection is a member of a document. You can describe a specific path to a document, and it must always be an even number of path components since the document parent will be a collection, except for the root document of the Firestore. If you follow only thisinterface for access to the Firestore, you will not have direct access to the root document.
**See**

- [https://firebase.google.com/docs/firestore/manage-data/structure-data](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [https://firebase.google.com/docs/firestore/data-model](https://firebase.google.com/docs/firestore/data-model)Once a firestore object is defined, all document I/O is performed relative to (constrained to)this top-level document, so your code can't wander astray into other parts of the Firestorewhere you don't belong. Each API starts with a docPath parameter, and if null will refer to the top-level doc, into which you can read and write fields. If you want to create or work with documents, the docPath parameter must have an even number of path segments, e.g. "/maps/chicago" in which casethe collection "maps" will be automatically created if it doesn't exist. After initialization three objects are available from this module:* .doc - A Firestore subtree (/users/<userid>/) for the signed-in user's documents in Firestore* .app - A Firestore subtree (/apps/<projectId>/) for the app being used, accessible to all users* .public - A Firestore subtree (/apps/public/) that any user or app and read or write to

<a name="firestore"></a>

## firestore
**Kind**: global class  
<a name="new_firestore_new"></a>

### new firestoreDoc(rootCollectionName, topLevelDocument)

| Param | Type | Description |
| --- | --- | --- |
| rootCollectionName | <code>string</code> | Top level segmentation of your Firestore, e.g. "users" |
| topLevelDocument | <code>string</code> | A specific name (i.e. constraint) for this document tree, e.g. userId |

