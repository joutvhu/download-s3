import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import {getInputs, S3Inputs} from './io-helper';
import {ListObjectsV2Output, StartAfter} from 'aws-sdk/clients/s3';

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

      for (const content of objects.Contents ?? []) {
        if (content?.Key != null) {
          startAfter = content.Key;


        }
      }
    } while (startAfter != null && objects?.MaxKeys != null && objects?.KeyCount === objects?.MaxKeys);
  } catch (err: any) {
    core.debug(`Error status: ${err.status}`);
    core.setFailed(err.message);
  }
})();
