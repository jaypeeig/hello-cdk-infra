import { 
  Stack, 
  StackProps,
  RemovalPolicy,
  CfnOutput,
  SecretValue,
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_ssm as ssm,
  aws_codepipeline_actions as codepipeline_actions, 
  aws_s3 as s3 
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface PipelineProps extends StackProps {
  github: {
    owner: string
    repository: string
  }
}
export class HelloCdkInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: PipelineProps) {
    super(scope, id, props);

    const bucketWebsite = new s3.Bucket(this, 'websiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [
        {
           allowedOrigins: ['*'],
           allowedMethods: [s3.HttpMethods.GET],
        }
      ]
    });

    const outputSources = new codepipeline.Artifact();
    const outputBuilds = new codepipeline.Artifact();

    const githubToken = ssm.StringParameter.fromStringParameterAttributes(this, 'AccessToken', {
      parameterName: '/Demo/Github/AccessToken'
    }).stringValue;

    const buildProject = new codebuild.PipelineProject(this, 'Build Nuxt SPA', {
      projectName: `HelloCDK-Build`,
      buildSpec: codebuild.BuildSpec.fromSourceFilename('./codebuild/buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
    });

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'HelloCDK',
      restartExecutionOnUpdate: true
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'Merged',
          owner: props?.github.owner || 'owner',
          repo: props?.github.repository || 'hello-cdk',
          oauthToken: SecretValue.plainText(githubToken),
          branch: 'develop',
          output: outputSources,
          trigger: codepipeline_actions.GitHubTrigger.WEBHOOK
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: outputSources,
          outputs: [outputBuilds]
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.S3DeployAction({
          actionName: 'Website',
          input: outputBuilds,
          bucket: bucketWebsite
        })
      ]
    });

    new CfnOutput(this, 'WebsiteURL', {
      value: bucketWebsite.bucketWebsiteUrl,
      description: 'Website URL',
    });
  }
}
