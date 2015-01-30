var should = require('should')
var assert = require('assert')
var fs = require('fs-extra')
var mongoose = require('mongoose')

var folderdb = require('../lib/folderdb')

describe('folderdb service tests with mongo', function () {
  var tempFolder = './tests/tempFiles'
  var options = {
    name: 'myFolder',
    path: './myFolder',
    mongo: {
      connectionString: 'mongodb://localhost:27017/test',
      collectionPrefix: 'myfolder'
    }
  }

  var myFolder = folderdb.LocalFolder(options)

  before(function (done) {
    fs.mkdirs(options.path, function () {
      fs.mkdirs(tempFolder, function () {
        done()
      })
    })
  })

  after(function (done) {
    fs.remove(options.path, function () {
      fs.remove(tempFolder, function () {
        mongoose.connect(options.mongo.connectionString, function () {
          var files = options.mongo.collectionPrefix + '.files'
          mongoose.connection.db.dropCollection(files, function () {
            var attributes = options.mongo.collectionPrefix + '.attributes'
            mongoose.connection.db.dropCollection(attributes, function () {
              done()
            })
          })
        })
      })
    })
  })

  it('should store a file', function (done) {
    var filePath = tempFolder + '/storeFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    myFolder.store(filePath, [], function () {
      done()
    })
  })

  it('should replace a file', function (done) {
    var oldFilePath = tempFolder + '/replaceFileTest1.txt'
    fs.writeFileSync(oldFilePath, 'test1')

    var newFilePath = tempFolder + '/replaceFileTest2.txt'
    fs.writeFileSync(newFilePath, 'test2')

    myFolder.store(oldFilePath, [], function (fileId) {
      myFolder.replace(fileId, newFilePath, function (file) {
        assert.equal(file._id.toString(), fileId.toString())

        var data = fs.readFileSync(options.path + '/' + fileId + '.txt', {
          encoding: 'utf8'
        })

        assert.equal(data, 'test2')
        done()
      })
    })
  })

  it('should update a file attribute', function (done) {
    var filePath = tempFolder + '/updateFileAttributeTest.txt'
    fs.writeFileSync(filePath, 'test')

    var attributes = [{attribute: 1}]

    myFolder.store(filePath, attributes, function (fileId) {
      var newAttributes = [{newAttribute: 2}]

      myFolder.update(fileId, newAttributes, function (file) {
        assert.deepEqual(file.attributes, newAttributes)
        done()
      })
    })
  })

  it('should find a file', function (done) {
    var filePath = tempFolder + '/findFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    myFolder.store(filePath, [], function (fileId) {
      myFolder.find(fileId, function (file) {
        assert.equal(file._id.toString(), fileId.toString())
        done()
      })
    })
  })

  it('should delete a file', function (done) {
    var filePath = tempFolder + '/deleteFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    myFolder.store(filePath, [], function (fileId) {
      myFolder.delete(fileId, function () {
        assert.throws(myFolder.find(fileId, function () {
          done()
        }))
      })
    })
  })

  it('should query a file', function (done) {
    var filePath = tempFolder + '/findFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    var attributes = [
      {attribute1: 'string'},
      {attribute2: 2},
      {attribute3: new Date(new Date().setDate(new Date().getDate() - 1))}
    ]

    myFolder.store(filePath, attributes, function (fileId) {
      var conditions = {
        attribute1: 'string',
        attribute2: { $gt: 1 },
        attribute3: { $lt: new Date() }
      }
      myFolder.query(conditions, null, function (files) {
        assert.equal(files[0]._id.toString(), fileId)
        done()
      })
    })
  })

  it('should read a file', function (done) {
    var filePath = tempFolder + '/readFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    myFolder.store(filePath, [], function (fileId) {
      myFolder.read(fileId, {encoding: 'UTF-8'}, function (data, file) {
        assert.equal(file._id.toString(), fileId)
        assert.equal(data, 'test')
        done()
      })
    })
  })

  it('should return list of used attributes', function (done) {
    var filePath = tempFolder + '/listAttributesTest.txt'
    fs.writeFileSync(filePath, 'test')

    var attributes = [
      {attribute1: 'string'},
      {attribute2: 2},
      {attribute3: new Date()}
    ]

    myFolder.store(filePath, attributes, function () {
      myFolder.attributes(function (listOfAttributes) {
        assert.notEqual(listOfAttributes.length, 0)
        done()
      })
    })
  })
})
