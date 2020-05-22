import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';
import { App } from '@aws-cdk/core';


export class AwsBlogStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'awsevan.com'
    const hostedZoneId = 'Z07985312LBBV0N39UCHT'
    const certArn = 'arn:aws:acm:us-west-2:027027607183:certificate/d49c9284-4a1a-477b-a151-c7ae43a87d49'

  
    const getHelloLambda = new lambda.Function(this, 'GetHelloFunction', {
     code: new lambda.AssetCode('src'),
     handler: 'get-hello.handler',
    runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        DOMAIN_NAME: 'api.' + domainName,
      }
    })

    const api = new apigateway.RestApi(this, 'HelloApi', {
      restApiName: 'Hello Service',
    })
    const helloApi = api.root.addResource('hello')
    const helloResource = helloApi.addResource('{id}');
    const getHelloIntegration = new apigateway.LambdaIntegration(getHelloLambda)
    helloResource.addMethod('GET', getHelloIntegration)
    addCorsOptions(helloResource);

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HelloAPIZone', {
      hostedZoneId: hostedZoneId,
      zoneName: domainName
    })

    const cert = acm.Certificate.fromCertificateArn(this, 'HelloAPISSLCertificate', certArn)

    api.addDomainName(domainName, {
      domainName: 'api.' + domainName,
      certificate: cert,
    })

    new route53.ARecord(this, 'HelloAPIRecord', {
      zone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api))
    })

  }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },  
    }]
  })
}

const app = new App()

new AwsBlogStack(app, 'dev', { 
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
}});

app.synth()