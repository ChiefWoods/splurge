# Splurge

On-chain e-commerce platform for PRJ3223 Capstone Project 2 and [Turbin3 Builders Cohort](https://turbin3.com/).

Note: Next.js app is still work in progress

[Program on Solana Explorer](https://explorer.solana.com/address/4Vgt9GWkVtW5Pf8MNfGQYEVYRiAyen4QWnCXH5jeXnft?cluster=devnet)

[Source Repository](https://github.com/ChiefWoods/splurge)

## Built With

### Languages

- [![Rust](https://img.shields.io/badge/Rust-f75008?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
- [![TypeScript](https://img.shields.io/badge/TypeScript-ffffff?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
- [![React](https://img.shields.io/badge/React-23272f?style=for-the-badge&logo=react)](https://react.dev/)

### Libraries

- [@coral-xyz/anchor](https://www.anchor-lang.com/)
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
- [@solana/spl-token](https://solana-labs.github.io/solana-program-library/token/js/)
- [litesvm](https://github.com/LiteSVM/litesvm/tree/master/crates/node-litesvm)
- [anchor-litesvm](https://github.com/LiteSVM/anchor-litesvm/)
- [@solana/wallet-adapter-react](https://github.com/anza-xyz/wallet-adapter)
- [@solana-developers/helpers](https://github.com/solana-developers/helpers)
- [@irys/web-upload](https://irys.xyz/)
- [next](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [zod](https://zod.dev/)
- [swr](https://swr.vercel.app/)

### Crates

- [anchor-lang](https://docs.rs/anchor-lang/latest/anchor_lang/)
- [anchor-spl](https://docs.rs/anchor-spl/latest/anchor_spl/)
- [num-derive](https://docs.rs/num-derive/latest/num_derive/)
- [num-traits](https://docs.rs/num-traits/latest/num_traits/)
- [pyth-solana-receiver-sdk](https://docs.rs/pyth-solana-receiver-sdk/latest/pyth_solana_receiver_sdk/)
- [spl-math](https://docs.rs/spl-math/latest/spl_math/)

### Test Runner

- [![Bun](https://img.shields.io/badge/Bun-000?style=for-the-badge&logo=bun)](https://bun.sh/)

## Getting Started

### Prerequisites

1. Update your Solana CLI, avm and Bun toolkit to the latest version

```bash
agave-install init 2.1.0
avm use 0.31.1
bun upgrade
```

### Setup

1. Clone repository

```bash
git clone https://github.com/ChiefWoods/splurge.git
```

2. Configure to use localnet

```bash
solana config set -ul
```

3. In another terminal, start a local validator

```bash
solana-test-validator
```

4. Create and fund keypair

```bash
solana-keygen new -o splurge-wallet.json
solana airdrop 10 -k splurge-wallet.json
```

5. In root and `/app`, install dependencies

```bash
bun i
```

6. In `/app`, configure `.env` files

```bash
cp .env.example .env.development; cp .env.example .env.production
```

#### Program

1. Resync your program id

```bash
anchor keys sync
```

2. Build program

```bash
anchor build
```

3. Run tests

```bash
bun test
```

5. Deploy program

```bash
anchor deploy
```

6. Optionally initialize IDL

```bash
anchor idl init -f target/idl/splurge.json <PROGRAM_ID>
```

#### App

In `/app`, start development server.

```bash
bun run dev
```

## Issues

View the [open issues](https://github.com/ChiefWoods/splurge/issues) for a full list of proposed features and known bugs.

## Acknowledgements

### Resources

- [Shields.io](https://shields.io/)

### API

- [Helius](https://www.helius.dev/)

## Contact

[chii.yuen@hotmail.com](mailto:chii.yuen@hotmail.com)
