const fs = require('fs')
const XLSX = require("xlsx")
const YAML = require('yaml')
const sprintf = require('sprintf-js').sprintf

/**
 *
 * @param filepath the path of the YAML file containing the config
 * @param collections optional
 */
const mapYamlFile = function (filepath, collections) {
    return mapYaml(fs.readFileSync(filepath, 'utf8'), collections)
}

/**
 *
 * @param yaml string containing containing the config in yaml format
 * @param collections optional
 */
const mapYaml = function (yaml, collections) {
    return map(YAML.parse(yaml), collections)
}
/**
 * @param collections (optional)
 * collections: {
 *     in1: [
 *       {f1: 'in1-o1-f1'},
 *       {f1: 'in1-o2-f1'}
 *     ],
 *     in2: [
 *       {f1: 'in2-o1-f1'},
 *       {f1: 'in2-o2-f1'}
 *     ]
 * }
 * @param config
 * config: [
 *   {
 *     name: 'in1' // the collection name
 *     jobs: [
 *       load: ...
 *       save: ...
 *       copyTo: ...
 *       cloneObjects: ...
 *       filterObjects: ...
 *       filterFields: ...
 *       mapFields: ...
 *       copyToArray: ...
 *       mapValues: ...
 *       mergeObjects: ...
 *       aggregate: ...
 *     ]
 *   }
 * ]
 */
const map = function (config, collections) {
    collections = collections || {}
    if (typeof collections !== 'object' || Array.isArray(collections)) {
        throw 'map.collections is not an object'
    }
    if (Array.isArray(config)) {
        config.forEach(c => {
            map(c, collections)
        })
    } else {
        config.jobs.forEach(job => {
            if (job.load) {
                load(job.load, collections, config.name)
            }
            if (job.save) {
                save(job.save, collections, config.name)
            }
            if (job.copyTo) {
                copyTo(job.copyTo, collections, config.name)
            }
            if (job.cloneObjects) {
                cloneObjects(job.cloneObjects, collections, config.name)
            }
            if (job.filterObjects) {
                filterObjects(job.filterObjects, collections, config.name)
            }
            if (job.filterFields) {
                filterFields(job.filterFields, collections, config.name)
            }
            if (job.mapFields) {
                mapFields(job.mapFields, collections, config.name)
            }
            if (job.copyToArray) {
                copyToArray(job.copyToArray, collections, config.name)
            }
            if (job.mapValues) {
                mapValues(job.mapValues, collections, config.name)
            }
            if (job.mergeObjects) {
                mergeObjects(job.mergeObjects, collections, config.name)
            }
            if (job.aggregate) {
                aggregate(job.aggregate, collections, config.name)
            }
        })
    }
    return collections
}

/**
 * load: {
 *   path: './file.xlsx',
 *   sheetName: 'Sheet1', // omit to use the collectionName
 *   rangeFrom: if set, override the starting range of the sheet. e.g. 'D4' will start reading from the D4 cell
 *   rangeTo: if set, override the ending range of the sheet. e.g. 'E18' will stop reading after the E18 cell
 * }
 */
const load = function (config, collections, collectionName) {
    console.info(sprintf('load: file `%s`, sheet `%s` to %s', config.path, config.sheetName, collectionName))
    if (!config.path) {
        throw sprintf('map.config.%s.load.path is missing', collectionName)
    }
    let filenameTokens = config.path.split('.')
    let ext = filenameTokens[filenameTokens.length - 1]
    if (ext === 'json') {
        collections[collectionName] = JSON.parse(fs.readFileSync(config.path, 'UTF-8'))
    } else {
        let xlsx = XLSX.readFile(config.path)
        let sheet = xlsx.Sheets[config.sheetName || collectionName]
        if (!sheet) {
            throw sprintf('sheet `%s` not found in file `%s`', config.sheetName, config.path)
        }
        // replace range. e.g. for rangeFrom=D4, range A1:E15 would change to D4:E15
        if (config.rangeFrom) {
            sheet['!ref'] = sheet['!ref'].replace(/.*:/, config.rangeFrom + ':')
        }
        if (config.rangeTo) {
            sheet['!ref'] = sheet['!ref'].replace(/:.*/, ":" + config.rangeTo)
        }
        collections[collectionName] = XLSX.utils.sheet_to_json(sheet)
    }
}

/**
 *
 * save: {
 *   path: './out.xlsx'
 *   sheetName: 'Sheet1' // (optional) omit to use the dataName as default
 * }
 *
 */
const save = function (config, collections, collectionName) {
    console.info(sprintf('save: `%s` in xlsx file `%s`', collectionName, config.path))
    if (!config.path) {
        throw 'save.path is missing'
    }
    if (!collections[collectionName]) {
        throw sprintf('collections.%s is missing', collectionName)
    }
    // get it from the map or create a new one
    let workbook = XLSX.utils.book_new()
    let worksheet = XLSX.utils.json_to_sheet(collections[collectionName])
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || collectionName)
    XLSX.writeFile(workbook, config.path)

    console.info(sprintf('save: `%s` in json file `%s`', collectionName, config.path + '.json'))
    fs.writeFileSync(config.path + '.json', JSON.stringify(collections[collectionName], null, 2))
}

/**
 * copyTo: 'out1' // copy `in1` collection into `out1`
 */
const copyTo = function (config, collections, collectionName) {
    console.info(sprintf('copyTo: `%s` to `%s`', collectionName, config))
    let source = collections[collectionName]
    collections[config] = collections[config] || []
    let target = collections[config]
    source.forEach(o => {
        target.push({...o})
    })
}

/**
 * cloneObjects: {
 *   field: 'f1'
 *   filter: ['in1-o1-f1'], // only the objects with f1 in filter
 *   values: ['in1-o1-f1-clone1', 'in1-o1-f1-clone2'] // clone as many times as the values
 * }
 */
const cloneObjects = function (config, collections, collectionName) {
    console.info(sprintf('cloneObjects: `%s.%s`', collectionName, config.field))
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let newCollection = []
    let values = config.values
    let filter = config.filter
    if (typeof values === 'string') {
        values = collections[values]
    }
    if (filter && typeof filter === 'string') {
        filter = collections[filter]
    }
    if (!Array.isArray(values)) {
        throw sprintf('map.config.%s.cloneObjects.values is not an array', collectionName)
    }
    if (!Array.isArray(filter)) {
        throw sprintf('map.config.%s.cloneObjects.filter is not an array', collectionName)
    }
    source.forEach(o => {
        newCollection.push({...o})
        if (filter.includes(o[config.field])) {
            values.forEach(value => {
                let clone = {...o}
                clone[config.field] = value
                newCollection.push(clone)
            })
        }
    })
    collections[collectionName] = newCollection
}

/**
 * filterObjects: [
 *   {
 *     field: 'f1',
 *     include: ['in1-o1-f1'], // include only the objects with f1 in the filter
 *     ### OR ###
 *     exclude: ['in1-o1-f1'] // remove the objects with f1 in the filter
 *   }
 * ]
 */

const filterObjects = function (config, collections, collectionName) {
    console.info(sprintf('filterObjects: `%s`', collectionName))
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let newCollection = []
    source.forEach(o => {
        let push = true;
        config.forEach(filter => {
            let include = filter.include
            let exclude = filter.exclude
            if (include && typeof include === 'string') {
                include = collections[include]
            }
            if (exclude && typeof exclude === 'string') {
                exclude = collections[exclude]
            }
            if (include && exclude) {
                throw sprintf('map.config.%s.filterObjects.%s.include and exclude cannot exist together', collectionName, filter.field)
            }
            if (include && !Array.isArray(include)) {
                throw sprintf('map.config.%s.filterObjects.%s.include is not an array', collectionName, filter.field)
            }
            if (exclude && !Array.isArray(exclude)) {
                throw sprintf('map.config.%s.filterObjects.%s.exclude is not an array', collectionName, filter.field)
            }
            push = push &&
                ((include && include.includes(o[filter.field])) ||
                    (exclude && !exclude.includes(o[filter.field])))
        })
        if (push) {
            newCollection.push({...o})
        }
    })
    collections[collectionName] = newCollection
}

/**
 * filterFields: {
 *   include: ['f1'] // include only the fields in the include array (as an array)
 *   include: 'array' // include only the fields in the include array (as a collection in the collections with name array)
 *   ### OR ###
 *   exclude: ['f1'] // include all the fields but the ones in the exclude array (as an array)
 *   exclude: 'array' // include all the fields but the ones in the exclude array (as a collection)
 * }
 */
const filterFields = function (config, collections, collectionName) {
    console.info(sprintf('filterFields: `%s` include:`%s`, exclude:`%s`', collectionName, config.include, config.exclude))
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let include = config.include
    let exclude = config.exclude
    if (include && exclude) {
        throw sprintf('map.config.%s.filterFields.include and exclude cannot exist together', collectionName)
    }
    if (include && typeof include === 'string') {
        include = collections[include]
    }
    if (exclude && typeof exclude === 'string') {
        exclude = collections[exclude]
    }
    if (include && !Array.isArray(include)) {
        throw sprintf('map.config.%s.filterFields.include is not an array', collectionName)
    }
    if (exclude && !Array.isArray(exclude)) {
        throw sprintf('map.config.%s.filterFields.exclude is not an array', collectionName)
    }
    source.forEach(o => {
        for (let field in o) {
            if ((include && !include.includes(field)) ||
                (exclude && exclude.includes(field))
            ) {
                delete o[field]
            }
        }
    })
}

/**
 * mapFields: 'collectionName' // the collection should contain an array with the mapping as below
 *
 * ### OR ###
 *
 * mapFields: [
 *   {
 *     from: 'f1', // change field of collection's objects from `f1` to `s1`
 *     to: 's1'
 *   },
 *   {
 *     from: 'f2'
 *     to: 's2'
 *   }
 * [
 */
const mapFields = function (config, collections, collectionName) {
    console.info('mapFields: `%s`', collectionName)
    if (typeof config === 'string') {
        // read the mapping from existing collections
        config = collections[config]
    }
    if (!collections[collectionName]) {
        throw sprintf('data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    config.forEach(c => {
        source.forEach(o => {
            for (let field in o) {
                if (c.from === field) {
                    o[c.to] = o[c.from]
                }
            }
        })
    })
}

/**
 * Changes the values of the fields in a collection's documents
 * Use it with `from` and `to` or with a map function
 *
 * mapValues: 'collectionName' // the collection should contain an array with the mapping as below
 *
 * ### OR ###
 *
 * mapValues: [
 *   {
 *     field: 'f1',
 *     from: 'val1',
 *     to: 'newVal1'
 *   },
 *   {
 *     map: // an expression that will use the `o` variable as the collection's object to change
 *   }
 * [
 */
const mapValues = function (config, collections, collectionName) {
    console.info('mapValues: `%s`', collectionName)
    if (typeof config === 'string') {
        // read the mapping from existing collections
        config = collections[config]
    }
    if (!collections[collectionName]) {
        throw sprintf('data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    config.forEach(c => {
        source.forEach(o => {
            if (c.field && c.from && c.to) {
                if (o[c.field] === c.from) {
                    o[c.field] = c.to
                }
            } else if (c.map) {
                // uses o as the object to change
                eval(c.map)
            } else {
                throw sprintf('map.config.%s.mapValues.map or field|from|to is missing', collectionName)
            }
        })
    })
}

/**
 * Creates an array in the collections containing the values from a field of the collection's objects
 *
 * copyToArray: {
 *   copyTo: 'array1',
 *   field: 'f1'
 * }
 */
const copyToArray = function (config, collections, collectionName) {
    console.info('copyToArray: `%s.%s` to `%s`', collectionName, config.field, config.copyTo)
    if (!collections[collectionName]) {
        throw sprintf('data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    collections[config.copyTo] = collections[config.copyTo] || []
    let target = collections[config.copyTo]
    source.forEach(o => {
        target.push(o[config.field])
    })
}

/**
 * Merge objects from 2 collections based on a composite key
 *
 * mergeObjects: {
 *     name: the name of the second collection
 *     key: ['f1', 'f2']
 *     strict: true|false // if true, then do not include the unmatched rows of the second collections
 * }
 */

const mergeObjects = function (config, collections, collectionName) {
    console.info('mergeObjects: `%s` and `%s` with key `%s`', collectionName, config.name, config.key)
    if (!collections[collectionName]) {
        throw sprintf('data.%s is missing', collectionName)
    }
    if (!collections[config.name]) {
        throw sprintf('data.%s is missing', config.name)
    }
    if (!config.key || !config.key.length) {
        throw sprintf('config.key is missing or empty array', config.key)
    }
    let col1 = collections[collectionName]
    let col2 = collections[config.name]
    let keyMatchIndexes = [] // keep the indexes of the matched objects of col2
    col2.forEach((o2, i2) => {
        col1.forEach(o1 => {
            let keyMatch = true;
            config.key.forEach(k => {
                if (o1[k] !== o2[k]) {
                    keyMatch = false;
                    return;
                }
            })
            if (keyMatch) {
                for (let field in o2) {
                    o1[field] = o2[field]
                }
                if (!keyMatchIndexes.includes(i2)) {
                    // keep the index as matched
                    keyMatchIndexes.push(i2)
                }
            }
        })
    })
    if (!config.strict) {
        col2.forEach((o2, i2) => {
            if (!keyMatchIndexes.includes(i2)) {
                // no match on that object,
                col1.push(o2)
            }
        })
    }
}

/**
 * creates a collection with objects that contain a field (aggregation field) as an array of the aggregated fields
 *
 * aggregate: {
 *     name : the name of the target collection
 *     aggregatedField: e.g. id
 *     aggregationField: e.g. type (can be an array)
 * }
 */
const aggregate = function (config, collections, collectionName) {
    console.info('aggregate: `%s` field from `%s` as `%s` field on `%s`', config.aggregationField, collectionName, config.aggregatedField, config.name)
    if (!collections[collectionName]) {
        throw sprintf('data.%s is missing', collectionName)
    }
    let aggregationMap = {} // a map, will be converted to array in the end
    const aggregateValue = function (o, aggregationValue) {
        if (!aggregationMap[aggregationValue]) {
            aggregationMap[aggregationValue] = []
        }
        aggregationMap[aggregationValue].push(o[config.aggregatedField])
    }
    collections[collectionName].forEach(o => {
        if (Array.isArray(o[config.aggregationField])) {
            o[config.aggregationField].forEach(value => {
                aggregateValue(o, value);
            })
        } else {
            aggregateValue(o, o[config.aggregationField]);
        }
    })
    let collection = []
    for (let key in aggregationMap) {
        collection.push({[config.aggregationField]: key, [config.aggregatedField]: aggregationMap[key]})
    }
    collections[config.name] = collection
}

exports.mapYamlFile = mapYamlFile
exports.mapYaml = mapYaml
exports.map = map
