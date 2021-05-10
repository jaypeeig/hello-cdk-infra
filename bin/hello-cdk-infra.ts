#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HelloCdkInfraStack } from '../lib/hello-cdk-infra-stack';

const app = new cdk.App();
const region : string = app.node.tryGetContext('region') || 'ap-northeast-2';
const config = {
  github: {
      owner: 'jaypeeig',
      repository: 'hello-cdk',
  },
  env: {
      region: region
  }
}

new HelloCdkInfraStack(app, 'HelloCdkInfraStack', config);
app.synth();