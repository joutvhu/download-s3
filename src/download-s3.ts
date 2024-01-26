import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import {getInputs, S3Inputs} from './io-helper';
import {Body, ListObjectsV2Output, ObjectList, StartAfter} from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import {Readable} from 'stream';
import path from 'path';

function checkKey(key?: string, prefix?: string): boolean {
  if (key != null) {
    if (prefix == null || prefix.length === 0)
      return true;
    if (prefix.endsWith('/'))
      return true;
    if (prefix === key)
      return true;
    if (key.startsWith(prefix + '/'))
      return true;
  }
  return false;
}

function createFolder(file: string) {
  const paths = file.split('/');
  const p: string[] = [];
  for (let i = 0, len = paths.length - 1; i < len; i++) {
    p.push(paths[i]);
    const v = p.join('/');
    if (v.length > 0 && !fs.existsSync(v)) {
      core.debug(`Creating directory ${v}`);
      fs.mkdirSync(v);
    }
  }
}

function saveFile(file: string, body?: Body) {
  core.debug(`Downloading file ${file}`);
  createFolder(file);
  if (typeof body === 'string' || body instanceof Uint8Array || body instanceof Buffer) {
    fs.writeFileSync(file, body);
    core.info(`Downloaded file ${file}`);
  } else if (body instanceof Blob) {
    fs.createWriteStream(file).write(body);
    core.info(`Downloaded file ${file}`);
  } else if (body instanceof Readable) {
    fs.createWriteStream(file).write(body);
    core.info(`Downloaded file ${file}`);
  }
}

(async function run() {
  try {
    const inputs: S3Inputs = getInputs();

    aws.config.update({
      credentials: {
        accessKeyId: inputs.awsAccessKeyId,
        secretAccessKey: inputs.awsSecretAccessKey,
      },
      region: inputs.awsRegion
    });
    const s3 = new aws.S3({signatureVersion: 'v4'});

    let startAfter: StartAfter | undefined = undefined;
    let objects: ListObjectsV2Output | undefined;
    do {
      objects = await s3.listObjectsV2({
        Bucket: inputs.awsBucket,
        Prefix: inputs.source,
        StartAfter: startAfter
      }).promise();
      const contents: ObjectList = objects.Contents ?? [];

      for (const content of contents) {
        if (checkKey(content?.Key, inputs.source)) {
          if (content.Key!.endsWith('/')) {
            core.warning(`Can't download file "${content.Key}"`);
          } else {
            const object = await s3.getObject({
              Bucket: inputs.awsBucket,
              Key: content.Key!
            }).promise();

            const file = path.join(
              inputs.target.endsWith('/') ? inputs.target : inputs.target + '/',
              content.Key!.substring(inputs.source.length));

            saveFile(file, object.Body);
          }
        }
      }

      if (objects.MaxKeys != null &&
        objects.MaxKeys === objects.KeyCount &&
        objects.KeyCount === contents.length &&
        contents.length > 0) {
        startAfter = objects.Contents?.at(-1)?.Key;
      }
    } while (startAfter != null);

    core.info(`Downloaded files from ${inputs.source} to ${inputs.target}.`);
  } catch (err: any) {
    core.debug(`Error status: ${err.status}`);
    core.setFailed(err.message);
  }
})();
