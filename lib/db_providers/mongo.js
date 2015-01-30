var mongoose = require('mongoose')
var _ = require('lodash')

exports = module.exports = function (options) {
  var db = connect(options)
  var FileModel = setFileSchema(db, options)
  var AttributeModel = setAttributeSchema(db, options)

  this.save = function (file, callback) {
    var newFile = new FileModel(file)
    newFile.save(function (err, file) {
      if (err) {
        throw 'error saving file to database: ' + err
      }
      callback(file._id)
    })
  }

  this.delete = function (id, callback) {
    FileModel.findOneAndRemove(mongoose.Types.ObjectId(id), function (err, file) {
      if (err) {
        throw 'error deleting file' + err
      }
      callback(file)
    })
  }

  this.findById = function (id, callback) {
    FileModel.findById(mongoose.Types.ObjectId(id), function (err, file) {
      if (err) {
        throw 'error finding file' + err
      }
      callback(file)
    })
  }

  this.updateFileName = function (id, name, callback) {
    var _id = mongoose.Types.ObjectId(id)
    var update = { name: name }
    FileModel.findByIdAndUpdate(_id, update, function (err, file) {
      if (err) {
        throw 'error updating name' + err
      }
      callback(file.toObject())
    })
  }

  this.updateAttributes = function (id, attributes, callback) {
    var _id = mongoose.Types.ObjectId(id)
    var update = { attributes: attributes }
    FileModel.findByIdAndUpdate(_id, update, function (err, file) {
      if (err) {
        throw 'error updating attributes' + err
      }
      callback(file.toObject())
    })
  }

  this.query = function (query, options, callback) {
    var conditions = {}
    _.forEach(query, function (value, attribute) {
      if (_.isPlainObject(value)) {
        var compare = Object.keys(value)[0]
        switch (compare) {
          case '$lt':
            conditions['attributes.' + attribute] = {
              $lt: value[compare]
            }
            break
          case  '$gt':
            conditions['attributes.' + attribute] = {
              $gt: value[compare]
            }
            break
          case  '$lte':
            conditions['attributes.' + attribute] = {
              $lte: value[compare]
            }
            break
          case '$gte':
            conditions['attributes.' + attribute] = {
              $gte: value[compare]
            }
            break
          default:
            conditions['attributes.' + attribute] = value[compare]
            break
        }
        return
      }
      conditions['attributes.' + attribute] = value
    })
    FileModel.find(conditions).skip(options.skip).limit(options.limit).exec(function (err, files) {
      if (err) {
        throw 'error querying files' + err
      }
      callback(files)
    })
  }

  this.listAttributes = function (folderName, callback) {
    var o = {}

    o.map = function () {
      for (var index in this.attributes) {
        for (var key in this.attributes[index]) {
          if (key.length > 0) {
            emit(this.folder, key)
          }
        }
      }
    }

    o.reduce = function (folderId, attributes) {
      var listOfAttributes = ''
      var count = attributes.length

      for (var i = 0; i < count; i++) {
        // skips duplicates
        if (listOfAttributes.indexOf(',' + attributes[i]) > -1) {
          continue
        }
        // first attribute is set the list of attribute, the rest are then
        // prepended with a comma. this will then be split after pulling from
        // the database
        listOfAttributes = (listOfAttributes === '') ?
          attributes[i] : listOfAttributes + ',' + attributes[i]
      }
      return listOfAttributes
    }

    o.out = { replace: options.collectionPrefix + '.attributes' }

    o.verbose = true
    FileModel.mapReduce(o, function (err) {
      if (err) {
        throw 'error making list of attributes' + err
      }
      AttributeModel.findById(folderName, function (err, attributes) {
        if (err) {
          throw 'error finding list of attributes' + err
        }
        var list = attributes.value.split(',')
        callback(list)
      })
    })
  }

  this.ObjectId = function () {
    return new mongoose.Types.ObjectId()
  }

  function connect (options) {
    return mongoose.createConnection(options.connectionString)
  }

  function setFileSchema (db, options) {
    var FileSchema = new mongoose.Schema({
      folder: String,
      name: String,
      attributes: Array
    })
    return db.model(options.collectionPrefix + '.files', FileSchema)
  }

  function setAttributeSchema (db, options) {
    var AttributeSchema = new mongoose.Schema({
      _id: String,
      value: String
    })
    return db.model(options.collectionPrefix + '.attributes', AttributeSchema)
  }
}
