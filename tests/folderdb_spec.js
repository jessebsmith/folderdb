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

    myFolder.store(filePath, null, function () {
      done()
    })
  })

  it('should replace a file', function (done) {
    var oldFilePath = tempFolder + '/replaceFileTest1.txt'
    fs.writeFileSync(oldFilePath, 'test1')

    var newFilePath = tempFolder + '/replaceFileTest2.txt'
    fs.writeFileSync(newFilePath, 'test2')

    myFolder.store(oldFilePath, null, function (fileId) {
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

    var attributes = {
      attribute1: 1
    }

    myFolder.store(filePath, attributes, function (fileId) {
      var newAttributes = {
        attribute2: 2
      }

      myFolder.update(fileId, newAttributes, function (file) {
        assert.deepEqual(file.attributes, newAttributes)
        done()
      })
    })
  })

  it('should update a file attribute with correct format', function (done) {
    var filePath = tempFolder + '/updateFileAttributeTest.txt'
    fs.writeFileSync(filePath, 'test')

    var attributes = [
      {attribute1: 1}
    ]

    myFolder.store(filePath, attributes, function (fileId) {
      var newAttributes = [
        {attribute2: 2}
      ]

      myFolder.update(fileId, newAttributes, function (file) {
        assert.deepEqual(file.attributes, newAttributes[0])
        done()
      })
    })
  })

  it('should find a file', function (done) {
    var filePath = tempFolder + '/findFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    myFolder.store(filePath, null, function (fileId) {
      myFolder.find(fileId, function (file) {
        assert.equal(file._id.toString(), fileId.toString())
        done()
      })
    })
  })

  it('should return valid attribute format', function (done) {
    var filePath = tempFolder + '/findValidFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    var outputAttributes = {
      attribute1: 'value',
      attribute2: 'value2'
    }

    var inputAttributes = [
      {attribute1: 'value'},
      {attribute2: 'value2'}
    ]

    myFolder.store(filePath, inputAttributes, function (fileId) {
      myFolder.find(fileId, function (file) {
        assert.equal(file._id.toString(), fileId.toString())
        assert.deepEqual(file.attributes, outputAttributes)
        done()
      })
    })
  })

  it('should delete a file', function (done) {
    var filePath = tempFolder + '/deleteFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    myFolder.store(filePath, null, function (fileId) {
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

    var attributes = {
        attribute1: 'string',
        attribute2: 2,
        attribute3: new Date(new Date().setDate(new Date().getDate() - 1))
    }

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

  it('should query a file that uses array for attributes', function (done) {
    var filePath = tempFolder + '/findFileTest.txt'
    fs.writeFileSync(filePath, 'test')

    var attributes = [
      {attribute4: 'string'},
      {attribute5: 2},
      {attribute6: new Date(new Date().setDate(new Date().getDate() - 1))}
    ]

    myFolder.store(filePath, attributes, function (fileId) {
      var conditions = {
        attribute4: 'string',
        attribute5: { $gt: 1 },
        attribute6: { $lt: new Date() }
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

    myFolder.store(filePath, null, function (fileId) {
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
      {attribute1: 1},
      {attribute2: 2},
      {attribute3: 3},
      {attribute4: 4},
      {attribute5: 5},
      {attribute6: 6}
    ]

    myFolder.store(filePath, null, function () {
      myFolder.attributes(function (listOfAttributes) {
        assert.equal(listOfAttributes.length, 6)
        done()
      })
    })
  })
})
