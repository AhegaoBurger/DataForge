#!/bin/bash
# Clean test runner for TerraTrain smart contracts

echo "🧹 Cleaning up old validator..."
pkill -f solana-test-validator
sleep 2

echo "🚀 Starting fresh validator..."
solana-test-validator --reset > /tmp/solana-validator.log 2>&1 &
VALIDATOR_PID=$!
echo "Validator started with PID: $VALIDATOR_PID"

echo "⏳ Waiting for validator to be ready..."
sleep 8

echo "💰 Airdropping SOL to test wallet..."
solana airdrop 10 --url localhost

echo "🧪 Running tests..."
anchor test --skip-local-validator

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed (exit code: $TEST_RESULT)"
fi

echo ""
echo "💡 To stop validator: pkill -f solana-test-validator"

exit $TEST_RESULT
