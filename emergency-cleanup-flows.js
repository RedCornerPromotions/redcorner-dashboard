#!/usr/bin/env node

/**
 * EMERGENCY: MediaConnect Flow Cleanup Script
 *
 * Run this immediately to check for and delete all MediaConnect flows
 * that are still running and billing.
 *
 * Usage: node emergency-cleanup-flows.js
 */

require('dotenv').config();
const { MediaConnectClient, ListFlowsCommand, DeleteFlowCommand } = require("@aws-sdk/client-mediaconnect");

const client = new MediaConnectClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function main() {
    console.log('🔍 Checking for active MediaConnect flows...\n');

    try {
        // List all flows
        const listCommand = new ListFlowsCommand({});
        const listResponse = await client.send(listCommand);

        const flows = listResponse.Flows || [];

        if (flows.length === 0) {
            console.log('✅ No flows found. You are not being billed for MediaConnect flows.\n');
            return;
        }

        console.log(`⚠️  FOUND ${flows.length} ACTIVE FLOW(S):\n`);

        flows.forEach((flow, index) => {
            console.log(`   ${index + 1}. ${flow.Name}`);
            console.log(`      ARN: ${flow.FlowArn}`);
            console.log(`      Status: ${flow.Status}`);
            console.log(`      💰 BILLING: ~$0.045/hour while running\n`);
        });

        // Calculate potential costs
        const hourlyCost = flows.length * 0.045;
        const dailyCost = hourlyCost * 24;
        const weeklyCost = dailyCost * 7;

        console.log(`💸 CURRENT BILLING RATE:`);
        console.log(`   Per Hour:   $${hourlyCost.toFixed(2)}`);
        console.log(`   Per Day:    $${dailyCost.toFixed(2)}`);
        console.log(`   Per Week:   $${weeklyCost.toFixed(2)}\n`);

        // Ask for confirmation
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question(`Delete all ${flows.length} flow(s) to STOP BILLING? (yes/no): `, async (answer) => {
            if (answer.toLowerCase() === 'yes') {
                console.log('\n🗑️  Deleting flows...\n');

                let deleted = 0;
                let errors = 0;

                for (const flow of flows) {
                    try {
                        console.log(`   Deleting: ${flow.Name}...`);
                        await client.send(new DeleteFlowCommand({
                            FlowArn: flow.FlowArn
                        }));
                        console.log(`   ✅ Deleted: ${flow.Name}`);
                        deleted++;
                    } catch (error) {
                        console.error(`   ❌ Error deleting ${flow.Name}: ${error.message}`);
                        errors++;
                    }
                }

                console.log(`\n📊 SUMMARY:`);
                console.log(`   Deleted: ${deleted}`);
                console.log(`   Errors: ${errors}`);

                if (deleted > 0) {
                    console.log(`\n✅ SUCCESS! Billing for MediaConnect flows has STOPPED.`);
                    console.log(`   Savings: ~$${(hourlyCost).toFixed(2)}/hour\n`);
                }
            } else {
                console.log('\n⚠️  Cleanup cancelled. Flows are still running and billing.\n');
            }

            readline.close();
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
