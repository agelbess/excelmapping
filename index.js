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
 * config: {
 *     in1: {
 *         load: ...
 *         copyTo: ...
 *         cloneObjects: ...
 *         filterObjects: ...
 *         mapFields: ...
 *     }
 * }
 *
 */
const map = function (collections, config) {
    if (typeof collections !== 'object' || Array.isArray(collections)) {
        throw 'map.collections is not an object'
    }
    if (typeof config !== 'object' || Array.isArray(config)) {
        throw 'map.config is not an object'
    }
    for (let collectionName in config) {
        let collectionConfig = config[collectionName]
        if (collectionConfig.load) {
            load(collections, collectionName, collectionConfig.load)
        }
        if (collectionConfig.copyTo) {
            copyTo(collections, collectionName, collectionConfig.copyTo)
        }
        if (collectionConfig.cloneObjects) {
            cloneObjects(collections, collectionName, collectionConfig.cloneObjects)
        }
        if (collectionConfig.filterObjects) {
            filterObjects(collections, collectionName, collectionConfig.filterObjects)
        }
        if (collectionConfig.filterFields) {
            filterFields(collections, collectionName, collectionConfig.filterFields)
        }
        if (collectionConfig.mapFields) {
            mapFields(collections, collectionName, collectionConfig.mapFields)
        }
    }
    return collections
}

/**
 * load: {
 *   path: './file.xlsx',
 *   sheetName: 'Sheet1',
 *   rangeFrom: if set, override the starting range of the sheet. e.g. 'D4' will start reading from the D4 cell
 *   rangeTo: if set, override the ending range of the sheet. e.g. 'E18' will stop reading after the E18 cell
 * }
 */
const load = function (collections, collectionName, config) {
    if (!config.path) {
        throw sprintf('map.config.%s.load.path is missing', collectionName)
    }
    if (!config.sheetName) {
        throw sprintf('map.config.%s.load.sheetName is missing', collectionName)
    }
    let xlsx = XLSX.readFile(config.path)
    let sheet = xlsx.Sheets[config.sheetName]
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
 *   f1: {
 *     filter: ['in1-o1-f1'], // only the objects with f1 in filter
 *     values: ['in1-o1-f1-clone1', 'in1-o1-f1-clone2'] // clone as many times as the values
 *   }
 * }
 */
const cloneObjects = function (collections, collectionName, config) {
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let newCollection = []
    for (let field in config) {
        let filter = config[field].filter
        let values = config[field].values
        if (!Array.isArray(filter)) {
            throw sprintf('map.config.%s.cloneObjects.%s.filter is not an array', collectionName, field)
        }
        if (!Array.isArray(values)) {
            throw sprintf('map.config.%s.cloneObjects.%s.values is not an array', collectionName, field)
        }
        source.forEach(o => {
            newCollection.push({...o})
            if (filter.includes(o[field])) {
                values.forEach(value => {
                    let clone = {...o}
                    clone[field] = value
                    newCollection.push(clone)
                })
            }
        })
    }
    collections[collectionName] = newCollection
}

/**
 * filterObjects: {
 *   f1: {
 *     include: ['in1-o1-f1'], // include only the objects with f1 in the filter
 *     ### OR ###
 *     exclude: ['in1-o1-f1'] // remove the objects with f1 in the filter
 *   }
 * }
 */

const filterObjects = function (collections, collectionName, config) {
    if (!collections[collectionName]) {
        throw sprintf('map.data.%s is missing', collectionName)
    }
    let source = collections[collectionName]
    let newCollection = []
    source.forEach(o => {
        let push = true;
        for (let field in config) {
            let include = config[field].include
            let exclude = config[field].exclude
            if (include && exclude) {
                throw sprintf('map.config.%s.filterObjects.%s.include and exclude cannot exist together', collectionName, field)
            }
            if (include && !Array.isArray(include)) {
                throw sprintf('map.config.%s.filterObjects.%s.include is not an array', collectionName, field)
            }
            if (exclude && !Array.isArray(exclude)) {
                throw sprintf('map.config.%s.filterObjects.%s.exclude is not an array', collectionName, field)
            }
            push = push &&
                ((include && include.includes(o[field])) ||
                    (exclude && !exclude.includes(o[field])))
        }
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
        throw sprintf('map.data.%s is missing', collectionName)
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
/**
 * @param config array of excel files and sheets to form the data map
 * config: [
 *   {
 *     path: the path of the xlsx file
 *     sheets: [
 *       {
 *         sheetName: the sheet to read from
 *         dataName: the name of the collection in the output, omit to have the name of the sheet
 *         rangeFrom: if set, override the starting range of the sheet. e.g. 'D4' will start reading from the D4 cell
 *         rangeTo: if set, override the ending range of the sheet. e.g. 'E18' will stop reading after the E18 cell
 *       }
 *     ]
 *   }
 * ]
 * returns a map with the arrays
 */
const xlsx2map = function (config) {
    if (!Array.isArray(config)) {
        throw 'xlsx2map.config is not an array'
    }
    let collections = {}
    config.forEach(c => {
        if (!c.path) {
            throw 'xlsx2map.config.path is missing'
        }
        if (!Array.isArray(c.sheets)) {
            throw 'xlsx2map.config.sheets is missing or not an array'
        }
        let xlsx = XLSX.readFile(c.path)
        c.sheets.forEach(s => {
            if (!s.sheetName) {
                throw 'xlsx2map.config.sheets.sheetName is missing'
            }
            let sheet = xlsx.Sheets[s.sheetName]
            // replace range. e.g. for rangeFrom=D4, range A1:E15 would change to D4:E15
            if (s.rangeFrom) {
                sheet['!ref'] = sheet['!ref'].replace(/.*:/, s.rangeFrom + ':')
            }
            if (s.rangeTo) {
                sheet['!ref'] = sheet['!ref'].replace(/:.*/, ":" + s.rangeTo)
            }
            collections[s.dataName || s.sheetName] = XLSX.utils.sheet_to_json(sheet)
        })
    })
    return collections
}

/**
 *
 * @param data
 * {
 *   out1: [{f1: 'out1-o1-f1'}, {f1: 'out1-o1-f2'}],
 *   out2: [{f1: 'out2-o1-f1'}, {f1: 'out2-o1-f2'}]
 * }
 * @param config
 * [
 *   {
 *     dataName: 'out1',
 *     path: './out.xlsx',
 *     sheetName: 'Sheet1' // omit to use the dataName as default
 *   }
 * ]
 *
 */
const map2xlsx = function (data, config) {
    if (!Array.isArray(config)) {
        throw 'map2xlsx.config is not an array'
    }
    const workbookMap = {}
    config.forEach(c => {
        if (!c.dataName) {
            throw 'map2xlsx.config.dataName is missing'
        }
        if (!c.path) {
            throw 'map2xlsx.config.path is missing'
        }
        if (!data[c.dataName]) {
            throw sprintf('map2xlsx.data.%s is missing', c.dataName)
        }
        // get it from the map or create a new one
        let workbook = workbookMap[c.path] || XLSX.utils.book_new()
        workbookMap[c.path] = workbook

        let worksheet = XLSX.utils.json_to_sheet(data[c.dataName])
        XLSX.utils.book_append_sheet(workbook, worksheet, c.sheetName || c.dataName)
    })
    for (let path in workbookMap) {
        let workbook = workbookMap[path]
        XLSX.writeFile(workbook, path)
    }
}

exports.map = map
exports.xlsx2map = xlsx2map
exports.map2xlsx = map2xlsx
