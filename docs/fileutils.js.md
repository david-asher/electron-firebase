<a name="module_file"></a>

## file
Functions for local file I/O. All functions are synchronous.


* [file](#module_file)
    * [readFile(fileName)](#exp_module_file--readFile) ⇒ <code>string</code> \| <code>buffer</code> ⏏
    * [writeFile(fileName, fileContent)](#exp_module_file--writeFile) ⏏
    * [isFile(fileName)](#exp_module_file--isFile) ⇒ <code>boolean</code> ⏏
    * [isFolder(folderName)](#exp_module_file--isFolder) ⇒ <code>boolean</code> ⏏
    * [makeFolder(folderName)](#exp_module_file--makeFolder) ⇒ <code>boolean</code> ⏏
    * [listFolders(folderName)](#exp_module_file--listFolders) ⇒ <code>array</code> ⏏
    * [listFiles(folderName)](#exp_module_file--listFiles) ⇒ <code>array</code> ⏏
    * [deleteFolder(folderName)](#exp_module_file--deleteFolder) ⇒ <code>boolean</code> ⏏
    * [deleteFile(fileName)](#exp_module_file--deleteFile) ⇒ <code>boolean</code> ⏏
    * [readJSON(fileName)](#exp_module_file--readJSON) ⇒ <code>object</code> ⏏
    * [writeJSON(fileName, fileContent)](#exp_module_file--writeJSON) ⏏
    * [updateJSON(fileName, updateObject)](#exp_module_file--updateJSON) ⏏
    * [checkCommand(commandString)](#exp_module_file--checkCommand) ⇒ <code>boolean</code> ⏏

<a name="exp_module_file--readFile"></a>

### readFile(fileName) ⇒ <code>string</code> \| <code>buffer</code> ⏏
Reads a local file and returns the contents.

**Kind**: Exported function  
**Returns**: <code>string</code> \| <code>buffer</code> - - File contents, will be converted to a string if possible  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |

<a name="exp_module_file--writeFile"></a>

### writeFile(fileName, fileContent) ⏏
Writes buffer or string content to a local file.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |
| fileContent | <code>string</code> \| <code>buffer</code> | Content to write |

<a name="exp_module_file--isFile"></a>

### isFile(fileName) ⇒ <code>boolean</code> ⏏
Check if a local file exists.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the file exists  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |

<a name="exp_module_file--isFolder"></a>

### isFolder(folderName) ⇒ <code>boolean</code> ⏏
Check if the given path is a folder.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the give path exists and is a folder  

| Param | Type | Description |
| --- | --- | --- |
| folderName | <code>string</code> | Path to local folder |

<a name="exp_module_file--makeFolder"></a>

### makeFolder(folderName) ⇒ <code>boolean</code> ⏏
Create a new folder at the given path.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the folder was successfully created  

| Param | Type | Description |
| --- | --- | --- |
| folderName | <code>string</code> | Path to local folder |

<a name="exp_module_file--listFolders"></a>

### listFolders(folderName) ⇒ <code>array</code> ⏏
Return a list of folders at the given path. Does not include hidden folders.

**Kind**: Exported function  
**Returns**: <code>array</code> - A list of folder names  

| Param | Type | Description |
| --- | --- | --- |
| folderName | <code>string</code> | Path to local folder |

<a name="exp_module_file--listFiles"></a>

### listFiles(folderName) ⇒ <code>array</code> ⏏
Return a list of files at the given path. Does not include hidden files.

**Kind**: Exported function  
**Returns**: <code>array</code> - A list of files names  

| Param | Type | Description |
| --- | --- | --- |
| folderName | <code>string</code> | Path to local folder |

<a name="exp_module_file--deleteFolder"></a>

### deleteFolder(folderName) ⇒ <code>boolean</code> ⏏
Delete the folder at the given path.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - Returns true if the folder was successfully deleted  

| Param | Type | Description |
| --- | --- | --- |
| folderName | <code>string</code> | Path to local folder |

<a name="exp_module_file--deleteFile"></a>

### deleteFile(fileName) ⇒ <code>boolean</code> ⏏
Deletes the local file.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the file exists and was deleted.  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |

<a name="exp_module_file--readJSON"></a>

### readJSON(fileName) ⇒ <code>object</code> ⏏
Reads the local JSON file and returns its object representation.

**Kind**: Exported function  
**Returns**: <code>object</code> - Contents of the local file parsed as an object  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |

<a name="exp_module_file--writeJSON"></a>

### writeJSON(fileName, fileContent) ⏏
Writes a serializable object as JSON to a local file.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |
| fileContent | <code>object</code> | Content to write as JSON |

<a name="exp_module_file--updateJSON"></a>

### updateJSON(fileName, updateObject) ⏏
Given an object, reads a local JSON file and merges the object with file contents, writing back the merged object as JSON.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | Path to local file |
| updateObject | <code>object</code> | A serializable object to be merged with the JSON file |

<a name="exp_module_file--checkCommand"></a>

### checkCommand(commandString) ⇒ <code>boolean</code> ⏏
Checks whether the command exists, i.e. can be run with an exec() statement.

**Kind**: Exported function  
**Returns**: <code>boolean</code> - True if the command exists  

| Param | Type | Description |
| --- | --- | --- |
| commandString | <code>string</code> | A shell comment to be tested |

