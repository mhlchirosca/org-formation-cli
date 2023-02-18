#!/usr/bin/env bash

PROFILE=$1

aws cloudformation create-change-set \
    --stack-name cfn-import-target-stack \
    --change-set-name moveLogGroup \
    --change-set-type IMPORT \
    --resources-to-import file://2-resources-to-import.json \
    --template-body file://2-cfn-import-target-stack-imported.yml \
    --profile $PROFILE

sleep 3

aws cloudformation execute-change-set \
    --change-set-name moveLogGroup \
    --stack-name cfn-import-target-stack \
    --profile $PROFILE
