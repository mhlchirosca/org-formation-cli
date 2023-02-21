import { Command } from "commander";
import { BaseCliCommand, ICommandArgs } from ".";

const commandName = 'migrate-resource <tasks-file>';
const commandDescription = 'migrates a resource between two different stacks';

export class MigrateResourceTask extends BaseCliCommand<IMigrateResourceCommandArgs> {

    constructor(command?: Command) {
        super(command, commandName, commandDescription, 'tasksFile');
    }

    public addOptions(command: Command): void {
        super.addOptions(command);
    }

    public performCommand(command: IMigrateResourceCommandArgs): Promise<void> {
        throw new Error("Method not implemented.");
    }

}

export interface IMigrateResourceCommandArgs extends ICommandArgs {
}
