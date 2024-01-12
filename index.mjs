import * as R from 'ramda'
import { replaceInFileSync } from 'replace-in-file'

const files = []

const doit = [
    {
        currentName: 'fa123.md',
        newName: 'solaranlage.md',
    },
]
////////////////////////////////////////////////////////////////////////////////
// cleanup
////////////////////////////////////////////////////////////////////////////////
console.log(`
Make sure:
* all files within 'neu/' don't have links with <hash> in it, they don't get resolved. Instead all links should already be in the Obsidian format.
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

const getContent = (fName) => ['line1', 'line2']
const getFirstHeading = R.pipe(R.filter(R.startsWith('#')), emptyToUndefined)
const removeFileExtensionMd = R.pipe(R.splitAt(-3), R.head)
const replace = R.pipe(
    replaceInFileSync,
    R.filter(R.propEq('hasChanged', true)),
    R.map(
        ({ file: fName, numMatches, numReplacements }) =>
            `        ${fName} with ${numMatches}/${numReplacements} changes`
    ),
    R.forEach(logUnary)
)

////////////////////////////////////////////////////////////////////////////////
// process
////////////////////////////////////////////////////////////////////////////////

// all files: create new file name `newName` by sanetizing heading
console.log(`compute new file names`)
files.forEach((inputFile) => {
    console.log(`    ${inputFile.name}`)
    const content = getContent(inputFile.name)
    const nextFile = {
        currentName: inputFile.name,
        hash: removeFileExtensionMd(inputFile.name),
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

    const newName = firstHeading.toLowerCase() // TODO and other shit
    console.log(`        => ${newName}`)
    fileMap[nextFile.currentName] = {
        ...nextFile,
        newName,
        newNameWithExtension: `${newName}.md`,
    }
})

// replace hierarchy and links
const fileNames = R.keys(fileMap)
console.log(`compute new file names`)
R.forEach((currentName) => {
    const file = fileMap(currentName)
    console.log(`    ${file.newName} (${file.currentName})`)

    try {
        replace({
            files: fileNames,
            // eslint-disable-next-line no-useless-escape
            from: new RegExp(`^\s*\S\s<${file.hash}?cf>`, 'g'),
            to: `down:: [[${file.newName}]]`,
        })
        replace({
            files: fileNames,
            from: [new RegExp(`<${file.hash}>`, 'g'), new RegExp(`<${file.hash}?cf>`, 'g')],
            to: [`[[${file.newName}]]`, `(down:: [[${file.newName}]])`],
        })
    } catch (ex) {
        console.log(`        rif error: `, ex)
    }
}, R.keys(fileMap))

// TODO do I need to do something with tags?

// TODO is it worth to replace links in `neu` automatically or is it easier to do it manually

//

//

// output problems
console.log(`Problems (${problems.length}):`)
problems.forEach(logUnary)
