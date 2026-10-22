/**
 * Copies the package.json version into jsr.json, which changesets does not
 * know about. With --check, fails if the versions differ instead.
 */
const pkg = await Bun.file("package.json").json();
const jsrFile = Bun.file("jsr.json");
const jsr = await jsrFile.json();

if (jsr.version === pkg.version) process.exit(0);

if (process.argv.includes("--check")) {
  console.error(`jsr.json version ${jsr.version} does not match package.json version ${pkg.version}`);
  process.exit(1);
}

jsr.version = pkg.version;
await Bun.write(jsrFile, `${JSON.stringify(jsr, null, 2)}\n`);
console.log(`Updated jsr.json to ${pkg.version}`);
