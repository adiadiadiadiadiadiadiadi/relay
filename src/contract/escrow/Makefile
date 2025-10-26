include .env
.PHONY: build deploy

build:
	soroban contract build

deploy:
	soroban contract deploy --wasm target/wasm32-unknown-unknown/release/escrow.wasm --source deployer --network testnet --id $(ESCROW_CONTRACT_ID)

test:
	cargo test --lib

