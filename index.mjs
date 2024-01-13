/* global cd, glob, fs, path, argv */
import * as R from 'ramda'
import replaceInFile from 'replace-in-file'
const { replaceInFileSync } = replaceInFile
import 'zx/globals'
import isValidFilename from 'valid-filename'

const OBSIDIAN_VAULT = '/Users/hoschi/Dropbox/obsidian-test/test/'

const neuronVault = path.resolve(argv._[0])
cd(neuronVault)

//const files = R.take(5, await glob('*.md'))
const files = await glob('*.md')

// todo
// - hab ich down richtig gemacht mit ?cf?
////////////////////////////////////////////////////////////////////////////////
// cleanup
////////////////////////////////////////////////////////////////////////////////
console.log(`
Make sure:
* all files within 'neu/' don't have links with <hash> in it, they don't get resolved. Instead all links should already be in the Obsidian format. Search for angle bracket links with \`rg '<[a-zA-Z]+'\`
* install and configure YAML plugin to put the "date created" into "date" to match the current files https://platers.github.io/obsidian-linter/settings/yaml-rules/#yaml-timestamp
* search for \`rg '<z:zettels'\` and replace it with tag queries
* switch back from special git branches to master and push
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
    const newNameWithExtension = `${newName}.md`
    console.log(`        => ${newName}`)
    const check = (pred) => (lastValue) => {
        if (!lastValue) {
            return lastValue
        }
        const problem = pred()
        if (problem) {
            console.log(`        ${problem}`)
            problems.push({
                ...nextFile,
                problem,
                newName,
                newNameWithExtension,
            })
            return undefined
        } else {
            return problem
        }
    }

    R.pipe(
        check(() => !isValidFilename(newName) && `no valid file name: "${newName}"`),
        check(() => fileMap[newName] && `file already in map`),
        check(
            () =>
                fs.existsSync(path.join(OBSIDIAN_VAULT, newNameWithExtension)) &&
                `file already exists in Obsidian`
        ),
        //check(() => ),
        check(() => {
            fileMap[nextFile.currentName] = {
                ...nextFile,
                newName,
                newNameWithExtension,
            }
            return true
        })
    )(true)
})

if (problems.length > 0) {
    console.log('********************ABORTED!********************')
    problems.forEach(logUnary)
    process.exit(1)
}

const fileNames = R.keys(fileMap)
console.log(`replace hierachy and links`)
R.forEach((currentName) => {
    const file = fileMap[currentName]
    console.log(`    ${file.newName} (${file.currentName})`)

    try {
        replace({
            files: fileNames,
            // eslint-disable-next-line no-useless-escape
            from: new RegExp(`\n(\\s*)\\S\\s<${file.hash}>`, 'g'),
            to: `\n$1* down:: [[${file.newName}]]`,
        })
        replace({
            files: fileNames,
            from: [new RegExp(`<${file.hash}>`, 'g'), new RegExp(`<${file.hash}\\?cf>`, 'g')],
            to: [`(down:: [[${file.newName}]])`, `[[${file.newName}]]`],
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
