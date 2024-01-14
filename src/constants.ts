export enum Inputs {
  AwsAccessKeyId = 'aws_access_key_id',
  AwsSecretAccessKey = 'aws_secret_access_key',
  AwsRegion = ' aws_region',
  AwsBucket = 'aws_bucket',
  Source = 'source',
  Target = 'target',
  Acl = 'acl',
  Expires = 'expires',
  Delete = 'delete',
  IgnoreError = 'ignore_error'
}

export enum Outputs {
  Succeeded = 'succeeded',
  Failed = 'failed'
}
