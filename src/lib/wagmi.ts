import { createConfig, http } from "wagmi";
import { creditCoin3Testnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { env, hasWalletConnectProjectId } from "@/config/env";

const connectors = hasWalletConnectProjectId
  ? [
      injected(),
      walletConnect({
        projectId: env.walletConnectProjectId,
        showQrModal: true,
      }),
    ]
  : [injected()];

export const wagmiConfig = createConfig({
  chains: [creditCoin3Testnet],
  connectors,
  transports: {
    [creditCoin3Testnet.id]: http(env.testnetRpcUrl),
  },
  ssr: true,
});
