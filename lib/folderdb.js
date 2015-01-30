var fs = require('fs-extra')
var path = require('path')
var _ = require('lodash')

var MongoDb = require('./db_providers/mongo')

module.exports = {
  // folder.LocalFolder
  //
  // Locally hosted folder database
  //
  // @name: name of the folder
  // @path: path to directory where files are store
  // @mongo: configuration for mongodb
  //
  //  ex: folderdb.LocalFolder({
  //    name: 'myFolder',
  //    path: 'myFolder',
  //    mongo: {
  //      connectionString: 'mongodb://..',
  //      collectionPrefix: 'myFolder'
  //    }
  //  })
  //
  LocalFolder: function (options) {
    fs.ensureDirSync(options.path)

    var mongo = new MongoDb(options.mongo)

    return {
      // localFolder.store
      //
      // Move a file into the folderdb and save attributes to database
      //
      // @filePath: path to file to be stored
      // @attributes: array of key value pairs of attributes
      // @callback: returns fileId
      //
      //  ex: localFolder.store('path/to/file.ext', [
      //    {attribute1: value},
      //    {attribute2: value}
      //  ], function (fileId) {})
      //
      store: function (filePath, attributes, callback) {
        var file = {
          _id: mongo.ObjectId(),
          name: path.basename(filePath),
          ext: path.extname(filePath)
        }
        var newFilePath = options.path + '/' + file._id + file.ext

        fs.rename(filePath, newFilePath, function (err) {
          if (err) {
            throw err
          }

          mongo.save({
            _id: file._id,
            folder: options.name,
            name: file.name,
            attributes: attributes
          }, callback)
        })
      },
      // localFolder.replace
      //
      // Replace existing file with new file
      //
      // @id: id of file to replace
      // @filePath: path to file to be used
      // @callback
      //
      //  ex: localFolder.replace('id', 'path/to/file.ext', function () {})
      //
      replace: function (id, filePath, callback) {
        mongo.findById(id, function (file) {
          var newFile = {
            id: id,
            name: path.basename(filePath),
            ext: path.extname(filePath)
          }
          var newFilePath = options.path + '/' + newFile.id + newFile.ext
          fs.remove(options.path + '/' + file._id + file.ext, function (err) {
            if (err) {
              throw err
            }

            fs.rename(filePath, newFilePath, function (err) {
              if (err) {
                throw err
              }
              mongo.updateFileName(file.id, newFile.name, callback)
            })
          })
        })
      },
      // localFolder.update
      //
      // Replace existing attributes with new attributes
      //
      // @id: id of file to update
      // @attributes: array of attributes
      // @callback: returns file
      //
      //  ex: localFolder.update('id', [{attribute3: '123'}], function (file) {})
      //
      update: function (id, attributes, callback) {
        mongo.updateAttributes(id, attributes, callback)
      },
      // localFolder.delete
      //
      // delete file from database and from filesystem
      //
      // @id: id of file to delete
      // @callback
      //
      //  ex: localFolder.update('id', function () {})
      //
      delete: function (id, callback) {
        mongo.delete(id, function (file) {
          fs.remove(options.path + '/' + file._id + file.ext, function (err) {
            if (err) {
              throw err
            }
            callback()
          })
        })
      },
      // localFolder.find
      //
      // find a file using id
      //
      // @id: id of file to delete
      // @callback
      //
      //  ex: localFolder.find('id', function (file) {})
      //
      find: function (id, callback) {
        mongo.findById(id, function (file) {
          callback(file.toObject())
        })
      },
      // localFolder.query
      //
      // query files based on attributes
      //
      // @conditions: conditions that files must meet
      // @options: skip and limit
      // @callback: returns array of files
      //
      //  ex: localFolder.query({attribute: {gt: 0},
      //                        {skip:0, limit:0}, function (file) {})
      //
      query: function (conditions, options, callback) {
        options = _.assign({
          skip: 0,
          limit: 100
        }, options)
        mongo.query(conditions, options, function (files) {
          callback(files)
        })
      },
      // localFolder.read
      //
      // reads file contents
      //
      // @id: conditions that files must meet to be returned
      // @readOptions: options for fs.readFile
      // @callback: returns file's data and file object
      //
      //  ex: localFolder.read('id', {encoding: 'UTF-8'}, function (data) {})
      //
      read: function (id, readOptions, callback) {
        mongo.findById(id, function (file) {
          var ext = file.name.split('.')
          ext = '.' + ext[ext.length - 1]
          fs.readFile(options.path + '/' + id + ext, readOptions, function (err, data) {
            if (err) {
              throw err
            }
            callback(data, file)
          })
        })
      },
      // localFolder.attributes
      //
      // returns unique list of attributes used within the folder
      //
      // @callback: returns list of attributes
      //
      //  ex: localFolder.read(function(attributes) {})
      //
      attributes: function (callback) {
        mongo.listAttributes(options.name, callback)
      }
    }
  }
}
