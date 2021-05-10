import * as cdk from 'aws-cdk-lib';
import * as HelloCdkInfra from '../lib/hello-cdk-infra-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new HelloCdkInfra.HelloCdkInfraStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
