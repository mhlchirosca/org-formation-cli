#!/usr/bin/env bash

PROFILE=$1

aws cloudformation create-stack \
    --stack-name cfn-import-source-stack \
    --template-body file://1-cfn-import-source-stack-original.yml \
    --profile $PROFILE

aws cloudformation create-stack \
    --stack-name cfn-import-target-stack \
    --template-body file://1-cfn-import-target-stack-original.yml \
    --profile $PROFILE

sleep 3

aws cloudformation update-stack \
    --stack-name cfn-import-source-stack \
    --template-body file://1-cfn-import-source-stack-deleted.yml \
    --profile $PROFILE