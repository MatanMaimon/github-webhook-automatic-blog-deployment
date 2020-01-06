import 'dotenv/config';
import crypto from 'crypto';
import { exec } from 'child_process';
import express from 'express';
import bodyParser from 'body-parser';


const app = express();


const GITHUB_TO_DIR = {
  'MatanMaimon/ResToRent': [
    `/var/www/ResToRent`,
  ],
};


app.use(bodyParser.json());

app.post('/', (req, res) => {

  const stringifyBody = JSON.stringify(req.body);

  // build the signature based on `SECRET` and body data
  const signature = `sha1=${crypto
    .createHmac('sha1', process.env.SECRET)
    .update(stringifyBody)
    .digest('hex')}`;


  const isAllowed = req.headers['x-hub-signature'] === signature;
  const isMaster = req.body?.ref === 'refs/heads/master';
  const directory = GITHUB_TO_DIR[req.body?.repository?.full_name];
      
  if (isAllowed && isMaster && directory && directory.length) {
    try {
      
      // the webhook.sh dir
      const webHookPath = __dirname;

      // execute for each `directory` item
      directory.forEach(entry => exec(`cd ${entry} && bash ${webHookPath}/../webhook.sh`));
      console.log('success');
    } catch (error) {
      console.log(error);
    }
  }
  res.send(200);
});
      
app.listen(8073, () => console.log(`autoDeploy webhook is running!`));
