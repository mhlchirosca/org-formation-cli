#!/usr/bin/env bash

PROFILE=$1

aws cloudformation delete-stack \
    --stack-name cfn-import-source-stack \
    --profile $PROFILE

aws cloudformation delete-stack \
    --stack-name cfn-import-target-stack \
    --profile $PROFILE

