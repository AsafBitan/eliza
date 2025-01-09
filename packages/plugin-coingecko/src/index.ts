import { Plugin } from "@elizaos/core";
import { fetchCryptoPriceAction } from "./actions/fetchCryptoPriceAction.js";


export * as actions from "./actions/index.js";
export * as providers from "./providers/index.js";

export const coinGeckoPlugin: Plugin = {
    name: "coinGecko",
    description: "Fetches the latest cryptocurrency prices from CoinGecko.",
    actions: [fetchCryptoPriceAction],

};
