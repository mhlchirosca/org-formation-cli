import { SingleSignOnCredentials } from '@mhlabs/aws-sdk-sso';
import AWS from 'aws-sdk';
import { AwsResourceExists } from './AwsResourceExists';
import { CloudformationResourceMover } from './CloudFormationResourceMover';

const TARGET_TEMPLATE = "2-cfn-import-target-stack-imported.yml";
const TARGET_STACK = "cfn-import-target-stack";
const SOURCE_STACK = "cfn-import-source-stack";


move(process.argv[2], process.argv[3] ?? "eu-west-1")

async function move(profile: string, region: string): Promise<void> {
    process.env.AWS_SDK_LOAD_CONFIG = "1";
    AWS.config.credentials = new SingleSignOnCredentials({ profile })
    console.log("moving with profile " + profile)

    const existsChecker = new AwsResourceExists(region);
    const importer = new CloudformationResourceMover(region, existsChecker, TARGET_STACK)
    importer.readTemplate(TARGET_TEMPLATE);
    await importer.getTemplateSummary();
    await importer.createUpdateChangeSet();
    await importer.findResourcesToImport();
    const importChangeSet = importer.createImportChangeSet();

    console.log(JSON.stringify(importChangeSet, null, 2))
    await importer.import();

}

