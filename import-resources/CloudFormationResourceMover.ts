import { CloudFormation, ResourceGroupsTaggingAPI } from "aws-sdk";
import { GetTemplateSummaryOutput, DescribeChangeSetOutput } from "aws-sdk/clients/cloudformation";
import { readFileSync } from "fs";
import { IAwsResourceExists } from "./AwsResourceExists";
import { yamlParse } from 'aws-organization-formation-client/lib/yaml-cfn';

type CloudFormationTemplate = {
    Resources: Record<string, TemplateResource>
}

type TemplateResource = {
    Type: string;
    Properties: Record<string, any>;
}

type ImportChangeSet = {
    ResourceType: string;
    LogicalResourceId: string;
    ResourceIdentifier: { [k: string]: string }
}

export class CloudformationResourceMover {
    readonly cfn: CloudFormation;
    readonly tags: ResourceGroupsTaggingAPI;
    existsChecker: IAwsResourceExists;
    templateString?: string;
    template?: CloudFormationTemplate;
    templateSummary?: GetTemplateSummaryOutput;
    updateChangeSetName?: string;
    updateChangeSetDetails?: DescribeChangeSetOutput;
    resourcesToImport: string[] = [];

    constructor(region: string, existsChecker: IAwsResourceExists, readonly stackName: string) {
        this.cfn = new CloudFormation({ region });
        this.tags = new ResourceGroupsTaggingAPI({ region })
        this.existsChecker = existsChecker
    }

    readTemplate(fileName: string) {
        this.templateString = readFileSync(fileName).toString("utf-8");
        this.template = yamlParse(this.templateString) as CloudFormationTemplate;
    }

    async getTemplateSummary(): Promise<void> {
        this.templateSummary = await this.cfn.getTemplateSummary({
            TemplateBody: this.templateString,
        }).promise();
    }

    async createUpdateChangeSet(): Promise<void> {
        this.updateChangeSetName = `update${Math.random().toString(16).slice(2, 10)}`;
        await this.cfn.createChangeSet({
            StackName: this.stackName,
            ChangeSetName: this.updateChangeSetName,
            ChangeSetType: "UPDATE",
            TemplateBody: this.templateString,
        }).promise();
        // implement a faster waiter later. this one waits 30 seconds
        await this.cfn.waitFor("changeSetCreateComplete", {
            ChangeSetName: this.updateChangeSetName,
            StackName: this.stackName,
        }).promise();

        this.updateChangeSetDetails = await this.cfn.describeChangeSet({
            ChangeSetName: this.updateChangeSetName,
            StackName: this.stackName,
        }).promise();
    }

    async findResourcesToImport(): Promise<void> {
        const resourcesToAdd = this.updateChangeSetDetails?.Changes?.filter(c => c.ResourceChange?.Action === "Add")!;
        for (let resourceToAdd of resourcesToAdd) {
            const resourceIdentifier = this.getIdentifierForLogicalId(resourceToAdd.ResourceChange?.LogicalResourceId!)
            const fromTemplate = this.template?.Resources[resourceToAdd.ResourceChange?.LogicalResourceId!]!
            const physicalId: string = fromTemplate.Properties[resourceIdentifier];
            if (await this.existsChecker.exists(fromTemplate.Type, physicalId)) {
                this.resourcesToImport.push(resourceToAdd.ResourceChange?.LogicalResourceId!)
            }
        }
    }

    getIdentifierForLogicalId(logicalResourceId: string): string {
        const resourceIdentifiers = this.templateSummary!.ResourceIdentifierSummaries?.find(
            s => s.LogicalResourceIds?.includes(logicalResourceId)
        )?.ResourceIdentifiers!
        if (resourceIdentifiers?.length > 1) {
            throw new Error(`Unexpected. Multiple resource identifiers ${resourceIdentifiers} for resource ${logicalResourceId}`);
        }
        return resourceIdentifiers[0];
    }

    createImportChangeSet(): ImportChangeSet[] {
        const importChangeSet: ImportChangeSet[] = [];
        for (let logicalId of this.resourcesToImport) {
            const resourceIdentifier = this.getIdentifierForLogicalId(logicalId)
            const resource: TemplateResource = this.template!.Resources[logicalId]
            importChangeSet.push({
                ResourceType: resource.Type,
                LogicalResourceId: logicalId,
                ResourceIdentifier: {
                    [resourceIdentifier]: resource.Properties[resourceIdentifier]
                }
            })
        }
        return importChangeSet;
    }

    async import(): Promise<void> {
        const importChangeSetName = `import${Math.random().toString(16).slice(2, 10)}`;
        await this.cfn.createChangeSet({
            StackName: this.stackName,
            ChangeSetName: importChangeSetName,
            ChangeSetType: "IMPORT",
            ResourcesToImport: this.createImportChangeSet(),
            TemplateBody: this.templateString,
        }).promise();
        await this.cfn.waitFor("changeSetCreateComplete", {
            ChangeSetName: importChangeSetName,
            StackName: this.stackName,
        }).promise();

        await this.cfn.executeChangeSet({
            ChangeSetName: importChangeSetName,
            StackName: this.stackName,
        }).promise();
    }
}


