import {
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    type Action,
    ModelClass,
    composeContext,
    generateMessageResponse,
    getEmbeddingZeroVector,
} from "@elizaos/core";
import { getCoinPriceTemplate } from "../templates/getCoinPriceTemplate";

async function getCoinPrice(coin: string, currency: string = 'usd') {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${coin}&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'accept': 'application/json',
            }
        });

        const data = await response.json();

        if (!data || data.length === 0) {
            return `Couldn't find the price for the coin ${coin} in ${currency}`;
        }

        const price = data[0].current_price;
        return price;

    } catch (error) {
        console.error('Error fetching price:', error);
        return null;
    }
}

export const fetchCryptoPriceAction: Action = {
    name: "fetchCryptoPriceAction",
    similes: [
        "GET_CRYPTO_PRICE",
        "FETCH_ASSET_PRICE",
        "QUERY_CRYPTO_PRICE",
        "CHECK_CRYPTO_VALUE",
        "RETRIEVE_CRYPTO_PRICE",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        return (
            !!(
                runtime.getSetting("COINGECKO_API_KEY") ??
                process.env.COINGECKO_API_KEY
            )
        );
    },
    description:
        "Respond but perform no additional action. This is the default if the agent is speaking and not doing anything additional.",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: any,
        _callback: HandlerCallback
    ): Promise<boolean> => {
         // Initialize/update state
         if (!_state) {
            _state = (await _runtime.composeState(_message)) as State;
        }
        _state = await _runtime.updateRecentMessageState(_state);

        const coinContext = composeContext({
            state: _state,
            template: getCoinPriceTemplate,
        })

        const content = await generateMessageResponse({
            runtime: _runtime,
            context: coinContext,
            modelClass: ModelClass.SMALL,
        })

        const hasCoinData = content?.coinId && content?.currency && !content?.error;

        if (!hasCoinData) {
            _callback({text: "Couldn't find the price"});
            return false;
        }

        const coineprice = await getCoinPrice(String(content.coinId), String(content.currency));

        const responseText = `The current price of ${content.coinId} is ${coineprice} in ${content.currency}`;

        const newMemory: Memory = {
            userId: _message.agentId,
            agentId: _message.agentId,
            roomId: _message.roomId,
            content: {
                text: responseText,
                action: "fetchCryptoPriceAction",
            },
            createdAt: new Date().getTime(),
            embedding: getEmbeddingZeroVector(),
        };

        await _runtime.messageManager.createMemory(newMemory);

        _callback({
            text: responseText,
            content: coineprice,
            memory: newMemory.content,
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "How much does BTC cost?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of BTC. One moment... \n It's Thursday, January 9th, 2025 at 10:36 AM UTC. The current price of Bitcoin is $50000 in USD.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "How much does Solana cost in USD?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of Solana in USD. One moment... \n It's Thursday, January 9th, 2025 at 10:36 AM UTC. The current price of Solana is $50000 in USD.",
                },
            },

        ],
        [
            {
                user: "{{user1}}",
                content: { text: "price ethereum" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me get the price of Ethereum for you. Give me a minute... \n It's Wednesday, January 8th, 2025 at 5:24 PM UTC. The price of Ethereum is $2000",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "fetch bitcoin price" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Getting the price of Bitcoin now. One moment please...\n It's Sunday, January 5th, 2025 at 12:00 PM UTC. The price of Bitcoin is $50000",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "check the value of litecoin" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Getting the price of Litecoin now. One moment please... \n According to real-time data, the price of Litecoin is $200 pulled form coingecko",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "retrieve the price of ripple" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me get the price of Ripple for you. Give me a minute... \n The price of Ripple is $1 as of the current time using the coingecko api",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "get the price of dogecoin" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of Dogecoin. One moment... \n The price of Dogecoin is $0.5, at this time of 10.30am on 9th of January 2025",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "whats the price of solana" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of Solana. One moment... \n The price of Solana is $100, at this time of 11.38am on 5th of January 2025",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
