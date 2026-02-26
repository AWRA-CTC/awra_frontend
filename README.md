# AWRA Frontend

AWRA is a crypto lending platform frontend.

AWRA is a credit-based lending platform built on the Creditcoin chain. This app provides the user interface for supplying assets, borrowing against collateral, repaying loans, withdrawing supplied assets, and minting configured testnet tokens.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Wagmi + Viem
- TanStack Query

## Pages

- `/` - Lending dashboard
- `/testnet-tokens` - Testnet token mint page

## Environment Variables

Create a `.env` file (or copy from `.env.example`) and set:

- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_CTC_TESTNET_RPC_URL`
- `NEXT_PUBLIC_LENDING_POOL_ADDRESS`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_SUPPORTED_TOKENS`
- `NEXT_PUBLIC_MINTABLE_TOKENS`

`NEXT_PUBLIC_SUPPORTED_TOKENS` and `NEXT_PUBLIC_MINTABLE_TOKENS` should be JSON arrays of tokens with:

- `symbol`
- `name`
- `address`
- `decimals`

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint
