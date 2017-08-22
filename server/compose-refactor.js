const fs = require('fs');
const contentDir = './content';

function loadJsonFile(path) {
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch (e) {
    return new Error(e);
  }
}

async function loadJurisdictionTopic(jurisdiction, topicName) {
  const topic = {};
  const file1 = `${contentDir}/jurisdictions/${jurisdiction}/${topicName}/description.json`;
  const file2 = `${contentDir}/jurisdictions/${jurisdiction}/${topicName}/resources_local.json`;
  if (!fs.existsSync(file1)) {
    topic.description = '';
    // const file2 = `${contentDir}/jurisdictions/${jurisdiction}/${topicName}/resources_local.json`;
    if (!fs.existsSync(file2)) {
      topic.local = { resources: [] };
      callback(null, topic);
    } else {
      loadJsonFile(file2, (err2, local) => {
        if (err2) throw new Error(err2);
        else {
          topic.local = local;
          callback(null, topic);
        }
      });
    }
  } else {
    try {
      const loadedDesc = await loadJsonFile(file1);
      topic.description = loadedDesc.description.join('\n');
      const resources = fs.existsSync(file2) ? await loadJsonFile(file2) : [];


    } catch (err) {
      return new Error(err);
    }

    loadJsonFile(file1, (err1, content) => {
      if (err1) throw new Error(err1);
      else {
        topic.description = content.description.join('\n');
        // const file2 = `${contentDir}/jurisdictions/${jurisdiction}/${topicName}/resources_local.json`;
        if (!fs.existsSync(file2)) {
          topic.local = { resources: [] };
          callback(null, topic);
        } else {
          loadJsonFile(file2, (err2, local) => {
            if (err2) throw new Error(err2);
            else {
              topic.local = local;
              callback(null, topic);
            }
          });
        }
      }
    });
  }
}

async function loadCommonTopic(topicName) {
  try {
    const description = await loadJsonFile(`${contentDir}/topics/${topicName}/description.json`);
    const common = await loadJsonFile(`${contentDir}/topics/${topicName}/resources_common.json`);
    const local = await loadJsonFile(`${contentDir}/topics/${topicName}/resources_local.json`);

    return {
      description,
      common,
      local,
    };
  } catch (err) {
    return new Error(err);
  }
}

async function loadTopic(jurisdiction, topicName, config) {
  try {
    const topic = {
      config,
      common: {},
      jurisdiction: {},
    };

    topic.common = await loadCommonTopic(topic);

    return loadJurisdictionTopic(jurisdiction, topicName, topic);
  } catch (err) {
    return new Error(err);
  }
}

function loadConfig(path) {
  // If the requested config file does not exist, return an empty object.
  if (!fs.existsSync(path)) {
    return {};
  }

  try {
    const { pairs } = JSON.parse(fs.readFileSync(path));
    const config = {};

    pairs.forEach((item) => {
      config[item.name] = item.value;
    });

    return config;
  } catch (err) {
    throw new Error(err);
  }
}

function loadConfigurations(jurisdiction, topic) {
  return Object.assign(
    {},
    loadConfig(`${contentDir}/config.json`),
    loadConfig(`${contentDir}/topics/${topic}/config.json`),
    loadConfig(`${contentDir}/jurisdictions/${jurisdiction}/config.json`),
    loadConfig(`${contentDir}/jurisdictions/${jurisdiction}/${topic}/config.json`),
  );
}

function compose(req, res) {
  const { jurisdiction, topic } = req.params;

  const config = loadConfigurations(jurisdiction, topic);
  const topicVal = loadTopic(jurisdiction, topic, config);

  res.json(topicVal);
}

module.exports = compose;
