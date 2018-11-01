import { join } from 'path';

function getPkg(cwd) {
  let pkg = {};
  try {
    pkg = require(join(cwd, 'package.json'));
  } catch (_) {} // eslint-disable-line
  return pkg;
}

function getToolInfo() {
  const pkg = require('../package.json');
  return {
    name: pkg.name,
    version: pkg.version,
  };
}

function getArtifactInfo({ hash, stats }) {
  const state = stats[0];
  const json = state.toJson();
  let totalSize = 0;
  const manifest = json.assets.map(({ name, size }) => {
    totalSize += size;
    return { name, size };
  });
  return {
    hash,
    startAt: state.startTime,
    endedAt: state.endTime,
    size: totalSize,
    manifest,
  };
}

export default function report(buildArgs, wepbackStates) {
  const reportParams = {
    pkg: getPkg(buildArgs.cwd),
    tool: getToolInfo(),
    buildConfig: {},
    artifact: getArtifactInfo(wepbackStates),
  };
  console.log(JSON.stringify(reportParams, null, 2));
}
