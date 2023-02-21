import { Command } from 'commander';
import { BaseCliCommand, ICommandArgs } from '.';

const commandName = 'migrate-resource <tasks-file>';
const commandDescription = 'migrates a resource between two different stacks';

export class MigrateResourceTask extends BaseCliCommand<IMigrateResourceCommandArgs> {

    constructor(command?: Command) {
        super(command, commandName, commandDescription, 'tasksFile');
    }

    public addOptions(command: Command): void {
        super.addOptions(command);
    }

    /**
     * See link: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/refactor-stacks.html#refactor-stacks-cli
     * @param command
     */
    public performCommand(command: IMigrateResourceCommandArgs): Promise<void> {


        // * Migrate to a different stack *
        // 1. given --sourceStack use the --match to find the stack
        // 2. given the resource ID filter it from the sourceStack
        // 3. check and set retention policy of the resource
        // 4. run perform-task on the soruceStack but filter/remove the specified resource.
        // 5. continue the regular "import existing resource" flow

        // * Import existing resource *
        // 1.1 Check that resource exists (Query the resource by type and ID)
        // 1.2 (optional) check that retention is enabled
        // 2.1 aws.clouformation.create-change-set() (bullet-point-5)
        // 2.2 (optional) validate the migration changes with aws.clouformation.describe-change-set() (bullet-point-6)
        // 3. aws.clouformation.execute-change-set() (bullet-point-7)


        throw new Error('Method not implemented.');
    }

}

export type IMigrateResourceCommandArgs = ICommandArgs;
