/* global cd, glob, fs, path */
import * as R from 'ramda'
import replaceInFile from 'replace-in-file'
const { replaceInFileSync } = replaceInFile
import 'zx/globals'
import isValidFilename from 'valid-filename'

//cd(`/Users/hoschi/repos/zettelkasten/`)
cd(`./test`)

//const files = R.take(5, await glob('*.md'))
const files = await glob('*.md')

////////////////////////////////////////////////////////////////////////////////
// cleanup
////////////////////////////////////////////////////////////////////////////////
console.log(`
Make sure:
* all files within 'neu/' don't have links with <hash> in it, they don't get resolved. Instead all links should already be in the Obsidian format. Search for angle bracket links with \`rg '<[a-zA-Z]+'\`
* install and configure YAML plugin to put the "date created" into "date" to match the current files https://platers.github.io/obsidian-linter/settings/yaml-rules/#yaml-timestamp
`)

////////////////////////////////////////////////////////////////////////////////
// init
////////////////////////////////////////////////////////////////////////////////
let problems = []
const fileMap = {}

////////////////////////////////////////////////////////////////////////////////
// helper
////////////////////////////////////////////////////////////////////////////////

const logUnary = R.unary(console.log)
const isNotNil = R.complement(R.isNil)
const emptyToUndefined = R.ifElse(R.isEmpty, R.always(undefined), R.identity)

const getContent = (fName) => fs.readFileSync(fName, 'utf8').toString().split('\n')
const getFirstHeading = R.pipe(R.filter(R.startsWith('#')), R.head, emptyToUndefined)
const removeFileExtensionMd = R.pipe(R.splitAt(-3), R.head)
const replace = R.pipe(
    R.assoc('countMatches', true),
    replaceInFileSync,
    R.filter(R.propEq(true, 'hasChanged')),
    R.map(
        ({ file: fName, numMatches, numReplacements }) =>
            `        ${fName} with ${numMatches}/${numReplacements} changes`
    ),
    R.forEach(logUnary)
)

////////////////////////////////////////////////////////////////////////////////
// process
////////////////////////////////////////////////////////////////////////////////

console.log(`compute new file names`)
files.forEach((fName) => {
    console.log(`    ${fName}`)
    const content = getContent(fName)
    const nextFile = {
        currentName: fName,
        hash: removeFileExtensionMd(fName),
    }
    const firstHeading = getFirstHeading(content)

    if (!firstHeading) {
        const problem = 'no first heading found!'
        console.log(`        ${problem}`)
        problems.push({
            ...nextFile,
            problem,
        })
        return undefined
    }

    const newName = R.pipe(R.tail, R.trim, R.toLower, R.replace(/(:|\\|\/)/g, '-'))(firstHeading)
    const newNameWithExtension= `${newName}.md`
    console.log(`        => ${newName}`)
    if (!isValidFilename(newName)) {
        const problem = `no valid file name: "${newName}"`
        console.log(`        ${problem}`)
        problems.push({
            ...nextFile,
            problem,
        })
        return undefined
    }

    if (fileMap[newName]) {
        const problem = `file already in map`
        console.log(`        ${problem}`)
        problems.push({
            ...nextFile,
            problem,
        })
        return undefined
    }

    if (fs.existsSync(path.join(`/Users/hoschi/Dropbox/obsidian-test/test/`, newNameWithExtension))) {
        const problem = `file already exists in Obsidian`
        console.log(`        ${problem}`)
        problems.push({
            ...nextFile,
            problem,
        })
        return undefined
    }

    fileMap[nextFile.currentName] = {
        ...nextFile,
        newName,
        newNameWithExtension,
    }
})

const fileNames = R.keys(fileMap)
console.log(`replace hierachy and links`)
R.forEach((currentName) => {
    const file = fileMap[currentName]
    console.log(`    ${file.newName} (${file.currentName})`)

    try {
        replace({
            files: fileNames,
            // eslint-disable-next-line no-useless-escape
            from: new RegExp(`\n(\\s*)\\S\\s<${file.hash}\\?cf>`, 'g'),
            to: `\n$1* down:: [[${file.newName}]]`,
        })
        replace({
            files: fileNames,
            from: [new RegExp(`<${file.hash}>`, 'g'), new RegExp(`<${file.hash}\\?cf>`, 'g')],
            to: [`[[${file.newName}]]`, `(down:: [[${file.newName}]])`],
        })
    } catch (ex) {
        console.log(`        rif error: `, ex)
    }
}, R.keys(fileMap))

//

//

// output problems
console.log(`Problems (${problems.length}):`)
problems.forEach(logUnary)
