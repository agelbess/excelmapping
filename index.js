const fs = require('fs')

const XLSX = require("xlsx")
const YAML = require('yaml')
const sprintf = require('sprintf-js').sprintf

/**
 * @param collections
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
 *       mapFields: ...
 *     ]
 *   }
 * ]
 */
const map = function (collections, config) {
    if (typeof collections !== 'object' || Array.isArray(collections)) {
        throw 'map.collections is not an object'
    }
    if (Array.isArray(config)) {
        config.forEach(c => {
            map(collections, c)
        })
    } else {
        config.jobs.forEach(job => {
            if (job.load) {
                load(collections, config.name, job.load)
            }
            if (job.save) {
                save(collections, config.name, job.save)
            }
            if (job.copyTo) {
                copyTo(collections, config.name, job.copyTo)
            }
            if (job.cloneObjects) {
                cloneObjects(collections, config.name, job.cloneObjects)
            }
            if (job.filterObjects) {
                filterObjects(collections, config.name, job.filterObjects)
            }
            if (job.filterFields) {
                filterFields(collections, config.name, job.filterFields)
            }
            if (job.mapFields) {
                mapFields(collections, config.name, job.mapFields)
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
const load = function (collections, collectionName, config) {
    if (!config.path) {
        throw sprintf('map.config.%s.load.path is missing', collectionName)
    }
    let xlsx = XLSX.readFile(config.path)
    let sheet = xlsx.Sheets[config.sheetName || collectionName]
    // replace range. e.g. for rangeFrom=D4, range A1:E15 would change to D4:E15
    if (config.rangeFrom) {
        sheet['!ref'] = sheet['!ref'].replace(/.*:/, config.rangeFrom + ':')
    }
    if (config.rangeTo) {
        sheet['!ref'] = sheet['!ref'].replace(/:.*/, ":" + config.rangeTo)
    }
    collections[collectionName] = XLSX.utils.sheet_to_json(sheet)
}

/**
 *
 * save: {
 *   path: './out.xlsx',
 *   sheetName: 'Sheet1' // omit to use the dataName as default
 * }
 *
 */
const save = function (collections, collectionName, config) {
    const workbookMap = {}
    if (!config.path) {
        throw 'save.path is missing'
    }
    if (!collections[collectionName]) {
        throw sprintf('collections.%s is missing', collectionName)
    }
    // get it from the map or create a new one
    let workbook = workbookMap[config.path] || XLSX.utils.book_new()
    let worksheet = XLSX.utils.json_to_sheet(collections[collectionName])
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || collectionName)
    XLSX.writeFile(workbook, config.path)
}

/**
 * copyTo: 'out1' // copy `in1` collection into `out1`
 */
const copyTo = function (collections, collectionName, config) {
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
const cloneObjects = function (collections, collectionName, config) {
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let newCollection = []
    if (!Array.isArray(config.values)) {
        throw sprintf('map.config.%s.cloneObjects.%s.values is not an array', collectionName, config.field)
    }
    source.forEach(o => {
        newCollection.push({...o})
        if (config.filter.includes(o[config.field])) {
            config.values.forEach(value => {
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

const filterObjects = function (collections, collectionName, config) {
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
 *   include: ['f1'] // include only the fields in the include array
 *   ### OR ###
 *   exclude: ['f1'] // include all the fields but the ones in the exclude array
 * }
 */
const filterFields = function (collections, collectionName, config) {
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let include = config.include
    let exclude = config.exclude
    if (include && exclude) {
        throw sprintf('map.config.%s.filterFields.include and exclude cannot exist together', collectionName)
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
 * mapFields: {
 *   f1: 's1', // change field of collection's objects from `f1` to `s1`
 *   f2: 's2'
 * }
 */
const mapFields = function (collections, collectionName, config) {
    if (!collections[collectionName]) {
        throw sprintf('data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    for (let mapField in config) {
        source.forEach(o => {
            for (let field in o) {
                if (mapField === field) {
                    let newField = config[mapField]
                    o[newField] = o[field]
                    delete o[field]
                }
            }
        })
    }
}


exports.map = map
