# folderdb

folderdb allows you to store files with searchable key value attributes.

This makes it easier to keep track of files across applications as well as within an application.

## Requirements

folderdb uses Mongo to store attributes

## Setup

```javascript

    var folderdb = require('folderdb')

    // set up configuration
    var options = {
      name: 'myFolder',
      path: './myFolder', // Location to store files
      mongo: {
        connectionString: 'mongodb://localhost:27017/test',
        collectionPrefix: 'myfolder'
      }
    }

    // init a local folder for storing files
    var myFolder = folderdb.LocalFolder(options)

```

## API

__store(filePath, attributes, fn)__

Moves the file to folder location and stores any attributes to mongo. Returns the file's ObjectId.

```javascript

    myFolder.store('path/to/file', [{attribute1: value}, {attribute2: value}], fn(fileId) {})

```

__replace(id, filePath, fn)__

Replaces an existing file. Updates file name and extension from new file.

```javascript

    myFolder.replace(fileId, 'path/to/new/file', fn(file) {})

```

__update(id, filePath, fn)__

Replaces all the attributes for a file.

```javascript

    myFolder.update(fileId, [{attribute3: value}, {attribute4: value}], fn(file) {})

```


__delete(id, fn)__

Deletes the file.

```javascript

    myFolder.delete(fileId, fn() {})

```

__find(id, fn)__

Returns the file object.

```javascript

    myFolder.find(fileId, fn(file) {})

```

__query(conditions, options, fn)__

Returns a list of files that meet all conditions.

```javascript

    // Compare functions include: $gt, $gte, $lt, $lte
    var conditions = {
      attribute1: 'string',
      attribute2: { $gt: 1 },
      attribute3: { $lt: new Date() }
    }

    // If options are not supplied defaults are used 
    // var options = {
    //   skip: 0,
    //   limit: 100
    // }
    
    myFolder.query(conditions, options, fn(listOfFiles) {
      // listOfFiles[0].attributes = [
      //   {attribute1: 'string'},
      //   {attribute2: 2,
      //   {attribute3: Thu Jan 1 2015 15:00:00 GMT-0800 (PST)}
      // ]
    })

```


__read(id, readOptions, fn)__

Returns the file's data and file object.

```javascript

    // Same options as fs.readFile
    var readOptions = {
      encoding: 'UTF-8',
      flag: 'r'
    }
    myFolder.read(fileId, fn(data, file) {})

```

__attributes(fn)__

Returns a list of used attributes.

```javascript

    myFolder.attributes(fn(listOfAttributes) {
      // listOfAttributes = [
      //   'attribute1', 
      //   'attribute2', 
      //   'attribute3',
      //   'attribute4'
      // ]
    })

```

## File Object

```javascript

    [ 
      { _id: 54cae43f9f5be0dd3ee02ae3,
        folder: 'myFolder',
        name: 'fileName.jpg',
        attributes: [ 
          { attribute1: value },
          { attribute2: value }
        ] 
      }
    ]

```