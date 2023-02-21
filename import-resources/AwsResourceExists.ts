import { CloudWatchLogs } from "aws-sdk";

export interface IAwsResourceExists {
    exists(type: string, id: string): Promise<boolean>
}

export class AwsResourceExists implements IAwsResourceExists {
    readonly SUPPORTED_RESOURCES = [
        "AWS::Logs::LogGroup"
    ]

    constructor(readonly region: string) {
    }

    async exists(type: string, id: string): Promise<boolean> {
        switch (type) {
            case "AWS::Logs::LogGroup":
                return this.cloudwatchlogs(type, id);
            default:
                throw new Error(`Resource type ${type} isn't supported yet`);
        }
    }

    private async cloudwatchlogs(type: string, id: string): Promise<boolean> {
        const logs = new CloudWatchLogs({ region: this.region })
        const subType = type.split("::")[2]!
        switch (subType) {
            case "LogGroup":
                return (await logs.describeLogGroups({
                    logGroupNamePattern: id
                }).promise()).logGroups!.length > 0
            default:
                throw new Error(`Resource type ${type} isn't supported yet`);
        }
    }
}