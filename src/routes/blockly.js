const path = require('path');
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { body, validationResult } = require('express-validator');
const fs = require('fs'); 
const configData = require('../../.taq/config.json');

router.get('/', (req, res) => {
  res.json({ success: true })
});

const getRootDir = () => {
  const rootDir = path.dirname(require.main.filename);
  return path.dirname(rootDir);
}

const getUserDir = (taqId) => {
  return `${getRootDir()}/storage/${taqId}`;
}

const isExists = async (filePath) => {
  return fs.promises.access(filePath, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false)
}

router.post(
  '/', 
  body('name').isString(),
  body('code').isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const taqId = uuidv4();//'4d443421-46da-492f-b8f6-31fc8d7b09bb';//req.cookies.taqId;
      console.log('taqId', taqId);
      if (!taqId) {
        return res.status(400).json({ message: 'Invalid taqId'});
      }

      const {name, code} = req.body;
      console.log('name-code', name, code);

      const userDir = getUserDir(taqId);
      const fileDir = `${userDir}/contracts`;
      const result = await fs.promises.mkdir(fileDir, { recursive: true });
      console.log('mkdir-result', result);

      const filePath = `${fileDir}/${name}.py`;
      console.log('filePath', filePath);

      const buff = Buffer.from(code, 'base64');
      const codestr = buff.toString('utf-8');

      await fs.promises.writeFile(filePath, codestr);

      res.json({ success: true })
    } catch (ex) {
      console.error(ex);
      return res.status(400).json({ message: 'system error' });
    }
})

router.post(
  '/compile', 
  body('name').isString().notEmpty(),
  body('code').isString().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      //const taqId = req.cookies.taqId; //uuidv4();
      const taqId = req.body.taqId || uuidv4();
      console.log('taqId', taqId);
      if (!taqId) {
        return res.status(400).json({ success: false, message: 'Invalid taqId'});
      }

      const {name, code} = req.body;
      console.log('name-code', name, code);
      
      const userDir = getUserDir(taqId);
      const fileDir = `${userDir}/contracts`;
      const result = await fs.promises.mkdir(fileDir, { recursive: true });
      console.log('mkdir-result', result);

      let filePath = `${fileDir}/${name}.py`;
      console.log('filePath', filePath);

      const buff = Buffer.from(code, 'base64');
      const codestr = buff.toString('utf-8');

      await fs.promises.writeFile(filePath, codestr);

      if (!await isExists(filePath)) {
        return res.status(400).json({ message: 'File does not exists'});
      }

      const configPath = `${userDir}/.taq/config.json`;
      if (!await isExists(configPath)) {
        if (!await initTaq(taqId)) {
          return res.status(400).json({ message: 'Failed to initialize taq'});
        }
      }

      const command = `taq compile --configDir ./storage/${taqId}/.taq ${name}.py`
      console.log('command', command)
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return res.json({ success: false, message: error.message })
        }

        if (stderr && stderr.trim() > 0) {
          console.error(`stderr: ${stderr}`);
          return res.json({ success: false, message: stderr })
        }

        console.log(`stdout:\n${stdout}`);

        filePath = `${userDir}/artifacts/${name}/step_000_cont_0_contract.json`
        if (!await isExists(filePath)) {
          return res.status(400).json({ message: 'Contract file does not exists'});
        }
        const contract = await fs.promises.readFile(filePath, 'utf8');

        filePath = `${userDir}/artifacts/${name}/step_000_cont_0_storage.json`
        if (!await isExists(filePath)) {
          return res.status(400).json({ message: 'Storage file does not exists'});
        }
        const storage = await fs.promises.readFile(filePath, 'utf8');

        return res.json({
          success: true,
          data: {
            taqId,
            output: stdout,
            contract,
            storage,
          }
        })
      });

    } catch (ex) {
      console.error(ex);
      return res.status(400).json({ message: 'system error' });
    }
});

const initTaq = async (taqId) => {
  try {
    console.log('initTaq', taqId);
    const userDir = getUserDir(taqId);
    await fs.promises.mkdir(`${userDir}/.taq`, { recursive: true });
    await fs.promises.mkdir(`${userDir}/contracts`, { recursive: true });
    await fs.promises.mkdir(`${userDir}/tests`, {recursive: true });
    await fs.promises.mkdir(`${userDir}/artifacts`, {recursive: true });

    const rootDir = getRootDir();
    await fs.promises.copyFile(`${rootDir}/.taq/state.json`, `${userDir}/.taq/state.json`, fs.constants.COPYFILE_FICLONE);

    const taqconf = {...configData};
    taqconf.contractsDir = `./storage/${taqId}/contracts`;
    taqconf.testsDir = `./storage/${taqId}/tests`;
    taqconf.artifactsDir = `./storage/${taqId}/artifacts`;
    await fs.promises.writeFile(`${userDir}/.taq/config.json`, JSON.stringify(taqconf, null, 2));
    
    return true;
  } catch (ex) {
    console.error(ex);
    return false;
  }
}

router.post(
  '/deploy', 
  body('name').isString(),
  body('taqId').isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {name, taqId} = req.body;
      console.log('contract name', name);
      
      const userDir = getUserDir(taqId);
      const fileDir = `${userDir}/artifacts/${name}`;

      const filePath = `${fileDir}/step_000_cont_0_contract.tz`;
      if (!await isExists(filePath)) {
        return res.json({ success: false, message: 'File does not exists' })
      }

      const command = `~/smartpy-cli/SmartPy.sh originate-contract --code ${fileDir}/step_000_cont_0_contract.tz --storage ${fileDir}/step_000_cont_0_storage.tz --rpc https://hangzhounet.smartpy.io`
      console.log('command', command)
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return res.json({ success: false, message: error.message })
        }

        if (stderr && stderr.trim() > 0) {
          console.error(`stderr: ${stderr}`);
          return res.json({ success: false, message: stderr })
        }

        console.log(`stdout:\n${stdout}`);
        return res.json({ success: true, data: stdout })
      });

    } catch (ex) {
      console.error(ex);
      return res.status(400).json({ message: 'system error' });
    }
});

module.exports = router;
